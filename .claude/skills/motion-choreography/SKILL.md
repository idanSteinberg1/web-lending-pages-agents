---
name: motion-choreography
description: Studio-grade page choreography with GSAP (ScrollTrigger, SplitText) and Lenis — hero intros, text reveals, pinned scroll stories, horizontal galleries, stacked cards, counters, image reveals, parallax, magnetic buttons, page transitions. Use when a site needs to feel premium and cinematic, or when the direction's signature moment is scroll- or motion-based.
---

# Motion choreography

`micro-interactions` handles feedback on actions. This skill handles **the page as a film**: how it opens, how sections enter, and one cinematic scroll moment.

## 0. Principles
1. **One signature, many whispers.** One big moment per page (the direction's signature). Everything else is small, fast and consistent.
2. **Motion explains.** Every animation reveals hierarchy, shows a process, or connects two states. If it only decorates, cut it.
3. **Choreograph, don't sprinkle.** Elements enter in reading order: headline → sub → CTA → media, 60-120ms apart, same easing family.
4. **Mobile is not a smaller desktop.** Pinned and horizontal sequences get a simpler mobile version (stacked, with light reveals).
5. **Reduced motion = static and complete.** Everything is visible and readable with no animation at all.
6. **Budget.** Motion JS ≤ 60KB gzipped (GSAP core + ScrollTrigger + SplitText + Lenis fits). 60fps while scrolling; site-critic measures it.

## 1. Setup
```bash
npm i gsap lenis
```
GSAP and all its plugins (ScrollTrigger, SplitText…) are free for commercial use since v3.13. For `/quick-site` use the jsDelivr builds: `https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js`, `.../ScrollTrigger.min.js`, `.../SplitText.min.js`, and `https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js` (globals `gsap`, `ScrollTrigger`, `SplitText`, `Lenis`).

```js
// motion/setup.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'power3.out', duration: 0.8 });

export const RTL = document.documentElement.dir === 'rtl';
export const DIR = RTL ? -1 : 1;           // multiply horizontal distances by DIR

export function initMotion(build) {
  const mm = gsap.matchMedia();
  mm.add(
    {
      motion: '(prefers-reduced-motion: no-preference)',
      desktop: '(min-width: 900px)',
      fine: '(hover: hover) and (pointer: fine)',
    },
    (ctx) => {
      const { motion } = ctx.conditions;
      if (!motion) return;                    // reduced motion: page is already complete
      const lenis = new Lenis({ autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (t) => lenis.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      build(ctx.conditions);
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
      return () => { gsap.ticker.remove(tick); lenis.destroy(); };
    },
  );
  return mm;                                   // call mm.revert() on page leave
}
```

Astro with `ClientRouter` page transitions:
```js
let mm;
document.addEventListener('astro:page-load', () => { mm = initMotion(buildPage); });
document.addEventListener('astro:before-swap', () => mm?.revert());
```

Hidden initial states must be set by JS (`gsap.from`/`gsap.set`), never in CSS, so the page is complete without JS.

## 2. Pattern library
All functions are called inside `build(conditions)`, so they never run under reduced motion.

### Hero intro (on load)
```js
export function heroIntro(root = document.querySelector('[data-hero]')) {
  if (!root) return;
  const title = root.querySelector('[data-hero-title]');
  const tl = gsap.timeline({ delay: 0.15 });
  SplitText.create(title, {
    type: 'lines,words',
    mask: 'lines',            // each line clips its words → clean "rising from below" reveal
    autoSplit: true,          // re-splits on resize / font load
    onSplit(self) {
      return tl.from(self.words, { yPercent: 110, duration: 0.9, stagger: 0.04, ease: 'expo.out' }, 0);
    },
  });
  tl.from(root.querySelectorAll('[data-hero-fade]'), { y: 16, opacity: 0, stagger: 0.08 }, 0.35)
    .from(root.querySelector('[data-hero-media]'), {
      clipPath: 'inset(12% 12% 12% 12% round 24px)', scale: 1.08, duration: 1.2, ease: 'expo.out',
    }, 0.2);
  return tl;
}
```
**Hebrew**: split `words`/`lines` only, never `chars` (breaks niqqud and letter shaping).

### Scroll text reveal (a statement paragraph lights up word by word)
```js
export function scrubText(el) {
  SplitText.create(el, {
    type: 'words',
    autoSplit: true,
    onSplit: (self) => gsap.from(self.words, {
      opacity: 0.15, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
    }),
  });
}
```

### Section entrances (the "whispers")
```js
export function reveals(selector = '[data-reveal]') {
  ScrollTrigger.batch(selector, {
    start: 'top 85%',
    once: true,
    onEnter: (els) => gsap.from(els, { y: 32, opacity: 0, stagger: 0.08, duration: 0.7 }),
  });
}
```

### Pinned scroll story (sticky visual, steps change it)
Markup: `<section data-story><div data-story-visual>…<img data-state="0">…</div><div data-story-steps><article>…</article>×N</div></section>`
```js
export function pinnedStory(section, { desktop }) {
  const visual = section.querySelector('[data-story-visual]');
  const states = [...visual.querySelectorAll('[data-state]')];
  const steps = [...section.querySelectorAll('[data-story-steps] > *')];
  gsap.set(states.slice(1), { autoAlpha: 0 });
  if (desktop) {
    ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom', pin: visual, pinSpacing: false,
    });
  }
  steps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step, start: 'top 60%', end: 'bottom 60%',
      onToggle: ({ isActive }) => {
        if (!isActive) return;
        gsap.to(states, { autoAlpha: (j) => (j === i ? 1 : 0), duration: 0.5, overwrite: true });
        steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
      },
    });
  });
}
```
Great for "how it works" and exploded product views. On mobile the visual isn't pinned; each step shows its state inline.

### Horizontal gallery (vertical scroll moves a track sideways), RTL-safe
```js
export function horizontalGallery(section, { desktop }) {
  if (!desktop) return;                       // mobile: native horizontal swipe with scroll-snap
  const track = section.querySelector('[data-track]');
  const distance = () => track.scrollWidth - section.clientWidth;
  gsap.to(track, {
    x: () => -distance() * DIR,               // LTR moves left, RTL moves right
    ease: 'none',
    scrollTrigger: {
      trigger: section, start: 'top top', end: () => `+=${distance()}`,
      pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
    },
  });
}
```
Mobile CSS: `[data-track]{display:flex;overflow-x:auto;scroll-snap-type:x mandatory} [data-track]>*{scroll-snap-align:start}`.

### Stacked cards (each card slides over the previous one, which shrinks back)
```css
.stack-card { position: sticky; inset-block-start: calc(10vh + var(--i) * 16px); }
```
```js
export function stackedCards(cards) {
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.92, opacity: 0.6, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 15%', scrub: true },
    });
  });
}
```

### Counters (real numbers only)
```js
export function counters(selector = '[data-count]') {
  const fmt = new Intl.NumberFormat(document.documentElement.lang || 'he-IL');
  document.querySelectorAll(selector).forEach((el) => {
    const end = Number(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => { el.textContent = fmt.format(Math.round(obj.v)); },
    });
  });
}
```
The final number is in the HTML already (`<span data-count="12400">12,400</span>`), so no-JS and reduced motion show it.

### Image reveal (mask wipes open in reading direction)
```js
export function imageReveals(selector = '[data-img-reveal]') {
  const from = RTL ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
  document.querySelectorAll(selector).forEach((el) => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } })
      .from(el, { clipPath: from, duration: 1.1, ease: 'expo.inOut' })
      .from(el.querySelector('img'), { scale: 1.25, duration: 1.4, ease: 'expo.out' }, 0);
  });
}
```

### Parallax layers
```js
export function parallax(selector = '[data-speed]') {
  document.querySelectorAll(selector).forEach((el) => {
    gsap.to(el, {
      yPercent: -20 * Number(el.dataset.speed), ease: 'none',
      scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
```
Keep `data-speed` between -1 and 1; only on decorative layers, never on text people read.

### Magnetic buttons (pointer devices only)
```js
export function magnetic(selector = '[data-magnetic]', { fine }) {
  if (!fine) return;
  document.querySelectorAll(selector).forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.3);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}
```

### Page transitions
Astro: `<ClientRouter />` in the layout + shared `transition:name` on the element that persists (product image card → product page hero). Customize timing with `::view-transition-*` using the motion tokens. Re-init motion on `astro:page-load` (see setup).

## 3. Putting it together
```js
initMotion((c) => {
  heroIntro();
  reveals();
  document.querySelectorAll('[data-scrub-text]').forEach(scrubText);
  document.querySelectorAll('[data-story]').forEach((s) => pinnedStory(s, c));
  document.querySelectorAll('[data-gallery]').forEach((s) => horizontalGallery(s, c));
  stackedCards([...document.querySelectorAll('.stack-card')]);
  counters();
  imageReveals();
  parallax();
  magnetic('[data-magnetic]', c);
});
```
Only call the patterns the direction uses. A typical premium landing page: hero intro + reveals + ONE of (pinned story | horizontal gallery | stacked cards | WebGL moment) + counters + magnetic CTA.

## 4. Rules that keep it smooth
- Animate `transform`, `opacity`, `clip-path` only. Never `top/left/width/height/filter: blur()` on scroll.
- `scrub: true` or a small number (≤ 1). Avoid long-lag scrubs that feel floaty.
- No more than 2 pinned sections per page. Never pin on mobile.
- `will-change: transform` only on the element that is actively animating, never globally.
- `ScrollTrigger.refresh()` after fonts and hero images load (setup already handles fonts).
- Test with `node scripts/record-motion.mjs` (fps, jank, long tasks) before handing off.
