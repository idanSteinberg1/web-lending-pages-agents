// Automated landing-page audit: screenshots, Web Vitals, SEO basics, RTL hints,
// tap targets, heavy images, tracking tags and axe accessibility violations.
// Usage: node scripts/audit.mjs <url> [outDir=audit]
// Requires: npm i -D playwright @axe-core/playwright
import { chromium, devices } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

const [url, out = 'audit'] = process.argv.slice(2);
if (!url) {
  console.error('Usage: node scripts/audit.mjs <url> [outDir]');
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = { url, date: new Date().toISOString() };

for (const [name, ctxOpts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { ...devices['iPhone 13'] }],
]) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__cls = 0;
    window.__lcp = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; }))
      .observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); if (e) window.__lcp = e.startTime; })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${out}/${name}-fold.png` });
  await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true });

  const facts = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vw = window.innerWidth;
    const clickable = [...document.querySelectorAll('a, button, [role=button], input[type=submit]')];
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
    };
    return {
      lcpMs: Math.round(window.__lcp),
      cls: +window.__cls.toFixed(3),
      title: document.title,
      titleLength: document.title.length,
      metaDesc: q('meta[name=description]')?.content ?? null,
      ogImage: q('meta[property="og:image"]')?.content ?? null,
      canonical: q('link[rel=canonical]')?.href ?? null,
      lang: document.documentElement.lang || null,
      dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
      h1s: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 120)),
      horizontalScroll: document.documentElement.scrollWidth > vw,
      imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      bigImgs: performance.getEntriesByType('resource')
        .filter((r) => (r.initiatorType === 'img' || /\.(png|jpe?g|webp|avif|gif)(\?|$)/i.test(r.name)) && r.transferSize > 300_000)
        .map((r) => ({ url: r.name, kb: Math.round(r.transferSize / 1024) })),
      totalTransferKb: Math.round(performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      ctaAboveFold: clickable.some((el) => {
        const r = el.getBoundingClientRect();
        return visible(el) && r.top < window.innerHeight && r.bottom > 0 && r.width >= 80;
      }),
      smallTapTargets: clickable.filter((el) => {
        if (!visible(el)) return false;
        const r = el.getBoundingClientRect();
        return r.width < 40 || r.height < 40;
      }).length,
      tracking: {
        gtag: !!document.querySelector('script[src*="googletagmanager"]'),
        metaPixel: typeof window.fbq === 'function',
        tiktok: typeof window.ttq === 'object',
      },
    };
  });

  let a11y = [];
  try {
    const axe = await new AxeBuilder({ page }).analyze();
    a11y = axe.violations.map((v) => ({ id: v.id, impact: v.impact, count: v.nodes.length, help: v.help }));
  } catch (e) {
    a11y = [{ error: String(e) }];
  }
  report[name] = { loadMs, ...facts, a11y };
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
