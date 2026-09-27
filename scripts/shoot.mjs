// Screenshots a URL or local .html file at several widths (fold + full page),
// plus a reduced-motion run at mobile width.
// Usage: node scripts/shoot.mjs <url|file.html> <outDir> [widths=360,390,768,1440]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [target, outDir = 'shots', widthsArg = '360,390,768,1440'] = process.argv.slice(2);
if (!target) {
  console.error('Usage: node scripts/shoot.mjs <url|file.html> <outDir> [widths]');
  process.exit(1);
}
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const widths = widthsArg.split(',').map(Number);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const shoot = async (width, suffix = '', opts = {}) => {
  const height = width < 500 ? 844 : width < 1000 ? 1024 : 900;
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: width < 500 ? 2 : 1,
    isMobile: width < 500,
    hasTouch: width < 1000,
    ...opts,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  // Let entrance animations settle, then trigger scroll-based content.
  await page.waitForTimeout(800);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight / 2) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/${width}${suffix}-fold.png` });
  await page.screenshot({ path: `${outDir}/${width}${suffix}-full.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await ctx.close();
  return { width, suffix, overflow };
};

const results = [];
for (const w of widths) results.push(await shoot(w));
results.push(await shoot(390, '-reduced', { reducedMotion: 'reduce' }));
await browser.close();

for (const r of results) {
  console.log(`${r.width}${r.suffix}: ${r.overflow ? 'HORIZONTAL OVERFLOW' : 'ok'}`);
}
console.log(`Saved to ${outDir}/`);
