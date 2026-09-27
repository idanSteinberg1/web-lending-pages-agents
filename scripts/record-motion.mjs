// Records a scroll-through video of a page and measures motion quality:
// fps, janky frames, long tasks, CLS during scroll, and JS weight.
// Also builds contact sheets (a grid of frames) that a reviewer can look at as images.
//
// Usage: node scripts/record-motion.mjs <url|file.html> <outDir> [seconds=10]
// Needs: playwright. Optional: ffmpeg on PATH (for contact sheets).
// HEADED=1 runs a visible browser on your real GPU. Headless without a GPU renders WebGL in
// software, so its fps numbers are pessimistic; the report flags this as softwareGL.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [target, outDir = 'motion', secondsArg = '10'] = process.argv.slice(2);
if (!target) {
  console.error('Usage: node scripts/record-motion.mjs <url|file.html> <outDir> [seconds]');
  process.exit(1);
}
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const seconds = Number(secondsArg);
fs.mkdirSync(outDir, { recursive: true });
const hasFfmpeg = spawnSync('ffmpeg', ['-version']).status === 0;

const browser = await chromium.launch({ headless: !process.env.HEADED });
const report = { url, date: new Date().toISOString(), runs: {} };

for (const [name, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({
    viewport: vp,
    isMobile: name === 'mobile',
    hasTouch: name === 'mobile',
    recordVideo: { dir: outDir, size: vp.width > 1000 ? { width: 1280, height: 800 } : { width: 390, height: 844 } },
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__m = { frames: [], longTasks: [], cls: 0, recording: false };
    new PerformanceObserver((l) => l.getEntries().forEach((e) => {
      if (window.__m.recording) window.__m.longTasks.push(Math.round(e.duration));
    })).observe({ type: 'longtask', buffered: false });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => {
      if (window.__m.recording && !e.hadRecentInput) window.__m.cls += e.value;
    })).observe({ type: 'layout-shift', buffered: false });
    let last = 0;
    const tick = (t) => {
      if (window.__m.recording && last) window.__m.frames.push(t - last);
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // let the intro play (captured in the video)

  const height = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = Math.max(20, Math.round(seconds * 10));
  const dy = Math.max(1, Math.ceil(height / steps));
  await page.evaluate(() => { window.__m.recording = true; });
  await page.mouse.move(vp.width / 2, vp.height / 2);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy);          // real wheel events: works with Lenis / ScrollTrigger
    await page.waitForTimeout((seconds * 1000) / steps);
  }
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    window.__m.recording = false;
    const f = window.__m.frames;
    const avg = f.reduce((s, x) => s + x, 0) / Math.max(1, f.length);
    const scripts = performance.getEntriesByType('resource').filter((r) => r.initiatorType === 'script');
    return {
      frames: f.length,
      avgFps: +(1000 / avg).toFixed(1),
      jankPct: +((100 * f.filter((x) => x > 34).length) / Math.max(1, f.length)).toFixed(1),
      worstFrameMs: Math.round(Math.max(0, ...f)),
      longTasks: window.__m.longTasks.length,
      longTaskMsTotal: window.__m.longTasks.reduce((s, x) => s + x, 0),
      clsDuringScroll: +window.__m.cls.toFixed(3),
      scrolledToBottom: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 4,
      jsKb: Math.round(scripts.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0) / 1024),
      canvases: document.querySelectorAll('canvas').length,
      softwareGL: (() => {
        const gl = document.createElement('canvas').getContext('webgl');
        const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
        const r = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
        return /swiftshader|llvmpipe|software/i.test(r);
      })(),
    };
  });
  const video = await page.video().path();
  await ctx.close();
  const videoPath = path.join(outDir, `${name}.webm`);
  fs.renameSync(video, videoPath);

  let sheet = null;
  if (hasFfmpeg) {
    sheet = path.join(outDir, `${name}-sheet.png`);
    const cols = name === 'desktop' ? 4 : 6;
    spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoPath,
      '-vf', `fps=2,scale=${name === 'desktop' ? 480 : 200}:-1,tile=${cols}x6:padding=6:color=white`,
      '-frames:v', '1', sheet]);
    if (!fs.existsSync(sheet)) sheet = null;
  }
  report.runs[name] = { ...m, video: videoPath, sheet };
}
await browser.close();

const gates = {
  desktopFps: (report.runs.desktop.avgFps >= 55),
  mobileFps: (report.runs.mobile.avgFps >= 45),
  jank: Object.values(report.runs).every((r) => r.jankPct <= 5),
  longTasks: Object.values(report.runs).every((r) => r.longTaskMsTotal <= 200),
  cls: Object.values(report.runs).every((r) => r.clsDuringScroll < 0.05),
};
report.gates = gates;
report.pass = Object.values(gates).every(Boolean);
fs.writeFileSync(path.join(outDir, 'motion-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!hasFfmpeg) console.log('ffmpeg not found: videos saved, contact sheets skipped.');
if (Object.values(report.runs).some((r) => r.softwareGL)) {
  console.log('Note: WebGL ran in software (no GPU). fps gates are pessimistic; re-run with HEADED=1 on a real machine before failing on fps.');
}
