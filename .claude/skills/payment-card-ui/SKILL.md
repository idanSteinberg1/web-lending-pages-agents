---
name: payment-card-ui
description: Decorative floating 3D credit card for checkout / payment sections — floats, tilts toward the pointer and catches light, with no numbers or card data on it. Use when a payment step or pricing/checkout section should feel premium and trustworthy.
---

# Floating payment card

A clean card that floats above the payment form: gentle hover-float, soft shadow that breathes with it, tilt toward the pointer and a moving light reflection. **It shows no digits, no name, no expiry.** It's pure visual reassurance, so it never touches card data and works next to any payment provider (Stripe, Cardcom, Tranzila, Grow, PayPlus…).

## Markup
```html
<div class="float-card-scene" aria-hidden="true">
  <div class="float-card">
    <svg class="fc-chip" viewBox="0 0 46 34"><rect x="1" y="1" width="44" height="32" rx="6" fill="#E8C877" stroke="#B99545"/><path d="M1 12h14M1 22h14M31 12h14M31 22h14M15 1v32M31 1v32" stroke="#B99545" stroke-width="1.4" fill="none"/></svg>
    <svg class="fc-wave" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8.5 7.5a6 6 0 0 1 0 9M12 5a9.5 9.5 0 0 1 0 14M15.5 2.5a13 13 0 0 1 0 19"/></svg>
    <span class="fc-brand">Your Brand</span>
  </div>
  <div class="float-card-shadow"></div>
</div>
```
Replace `fc-brand` with the site's logo or name (or remove it). Nothing else goes on the card.

## CSS
```css
.float-card-scene { position: relative; inline-size: min(100%, 360px); aspect-ratio: 1.586; perspective: 1200px; margin-inline: auto; }
.float-card {
  position: absolute; inset: 0; border-radius: 20px; overflow: hidden; color: #fff;
  background:
    radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,.18), transparent 55%),
    linear-gradient(135deg, var(--card-from, #1B2350), var(--card-to, #6246EA));
  box-shadow: 0 30px 60px -28px rgba(14,20,51,.65), inset 0 0 0 1px rgba(255,255,255,.12);
  transform: rotateX(var(--rx, 8deg)) rotateY(var(--ry, -14deg));
  transition: transform .6s cubic-bezier(.22,1,.36,1);
}
.float-card::after {                 /* light reflection that follows the tilt */
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.25) calc(45% + var(--shine, 0%)), transparent 62%);
}
.fc-chip  { position: absolute; inset-block-start: 30%; inset-inline-end: 9%; inline-size: 15%; }
.fc-wave  { position: absolute; inset-block-start: 31%; inset-inline-end: 27%; inline-size: 8%; opacity: .8; transform: scaleX(var(--dir, 1)); }
.fc-brand { position: absolute; inset-block-end: 10%; inset-inline-start: 9%; font-weight: 800; font-size: 1.1rem; letter-spacing: .02em; opacity: .95; }
.float-card-shadow {
  position: absolute; inset-inline: 14%; inset-block-end: -30px; block-size: 20px; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(14,20,51,.45), transparent); opacity: .6;
}
.float-card-scene.is-tilting .float-card { transition: transform .12s linear; }

@media (prefers-reduced-motion: no-preference) {
  .float-card-scene { animation: fc-float 6s ease-in-out infinite; }
  .float-card-shadow { animation: fc-shadow 6s ease-in-out infinite; }
}
@keyframes fc-float  { 50% { transform: translateY(-12px); } }
@keyframes fc-shadow { 50% { transform: scaleX(.85); opacity: .4; } }
```
Colors: set `--card-from` / `--card-to` from the site's tokens. In RTL pages set `--dir: -1` so the contactless waves face the right way.

## JS (optional tilt, pointer devices only)
```js
export function floatCard(scene) {
  if (!scene || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const card = scene.querySelector('.float-card');
  // Track the pointer over a wider area (the whole payment section) for a livelier feel.
  const area = scene.closest('section') ?? scene;
  area.addEventListener('pointermove', (e) => {
    const r = scene.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width));
    const y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height));
    scene.classList.add('is-tilting');
    card.style.setProperty('--ry', `${x * 16}deg`);
    card.style.setProperty('--rx', `${-y * 12}deg`);
    card.style.setProperty('--shine', `${x * 40}%`);
  });
  area.addEventListener('pointerleave', () => {
    scene.classList.remove('is-tilting');
    ['--rx', '--ry', '--shine'].forEach((p) => card.style.removeProperty(p));
  });
}
floatCard(document.querySelector('.float-card-scene'));
```

## Placement
- Next to (desktop) or above (mobile, `inline-size: min(100%, 300px)`) the payment form or the "secure payment" block.
- Pair it with the real trust info: accepted cards, secure-payment note, refund terms, total to pay.
- One floating card per page; it's the quiet hero of the checkout, not a signature moment competing with the page's main one.

## Rules
- Decorative only: `aria-hidden="true"`, no text a buyer needs to read.
- Never show or mirror card digits, names or dates on it, and never read the payment fields to animate it.
- Reduced motion: no float, no tilt (the static angled card stays).
- Touch devices: float only, no tilt.

## QA
- [ ] Floats smoothly; shadow shrinks as the card rises.
- [ ] Tilts toward the pointer on desktop, returns on leave; no tilt on touch.
- [ ] Reduced motion: static.
- [ ] No digits or personal data anywhere on the card.
