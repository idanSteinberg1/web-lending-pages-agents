---
name: micro-interactions
description: Adds purposeful micro-interactions (fly-to-cart, cart drop, badge bump, mini-cart morph, button feedback, card hover, scroll reveal, sticky CTA) when building or reviewing landing pages, stores or apps.
---

# Micro-interactions

Motion has one job: **confirm an action, show where something went, or guide the eye to the next step.** Anything that does none of these is cut.

Everything needed is in this file. Copy the snippets into the project; don't rewrite them from scratch.

## 1. Pattern catalog

| Pattern | Use when | Section |
|---|---|---|
| Fly-to-cart | Any "Add to cart" with a visible cart button | 4, 5 |
| Badge bump | Cart / notification count changes | 4, 5 |
| Cart drop | Add to cart when the cart icon is far from the button or in a mobile header (ball falls into the icon and becomes the count) | 9 |
| Mini-cart morph | Floating cart button that opens a cart summary | 6 |
| Button feedback | Every primary action (press + success state) | 7 |
| Card hover | Product / feature cards, pointer devices only | 7 |
| Scroll reveal | Section entrances on marketing pages | 4, 7 |
| Sticky CTA | Long landing page, after the hero CTA scrolls out | 4, 7 |

### Choosing by build profile
- **Single-product landing page** (e.g. insoles): button feedback, card hover, subtle scroll reveal, sticky CTA. Add fly-to-cart + badge only if there is a cart.
- **Store / catalog**: all commerce patterns + button feedback + card hover. Scroll reveal only on hero/feature sections, never on product grids.
- **Dashboard profile**: button feedback and state transitions only. No scroll reveal, no flights.

## 2. Rules

1. **Animate only `transform` and `opacity`.** Never width/height/top/left/margin/box-shadow. Exceptions: layout morphs done by Motion's `layoutId`/`layout` or by View Transitions.
2. **Durations come from tokens** (section 3). Never hard-code a duration or easing.
3. **State never waits for animation.** Update cart/state first; the animation is a visual echo. Nothing blocks input.
4. **Reduced motion**: under `prefers-reduced-motion: reduce` flights and reveals are skipped, feedback is instant. The tokens and `micro.js` already handle this; don't bypass them.
5. **Content is visible without JS.** Hidden initial states apply only under `html.js`. Put `<script>document.documentElement.classList.add('js')</script>` in `<head>`.
6. **One hero moment per viewport.** Don't stack reveal + parallax + bounce on the same element.
7. **Accessibility**: add-to-cart calls `announce()` (aria-live). The mini-cart moves focus into the panel on open, closes on Esc / outside click, and returns focus to the cart button.
8. **RTL (Hebrew sites)**: position floating elements with logical properties (`inset-inline-end`, never `right`). Horizontal slide-ins multiply by `var(--dir)`. Fly-to-cart measures real positions, so it works in both directions.
9. **Hover effects** only inside `@media (hover: hover) and (pointer: fine)`.

## 3. Motion tokens (`motion-tokens.css`)

Merge into the project's design tokens.

```css
:root {
  --dur-instant: 100ms;  /* press, toggle */
  --dur-fast: 180ms;     /* hover, feedback */
  --dur-base: 280ms;     /* panels, UI transitions */
  --dur-slow: 450ms;     /* section entrances */
  --dur-flight: 650ms;   /* fly-to-cart */

  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);       /* entrances */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);    /* moving between two places */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* small bounces */

  --reveal-distance: 16px;
  --stagger: 70ms;
  --dir: 1;
}
[dir="rtl"] { --dir: -1; }

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-instant: 1ms; --dur-fast: 1ms; --dur-base: 1ms;
    --dur-slow: 1ms; --dur-flight: 1ms;
    --reveal-distance: 0px; --stagger: 0ms;
  }
}
```

## 4. `micro.js` (vanilla, no dependencies)

```js
// micro.js
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const token = (name, fallback) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || fallback;

/** Fly a copy of `sourceImg` in an arc into `cartEl`. Resolves on landing. */
export function flyToCart(sourceImg, cartEl) {
  if (reduced() || !sourceImg || !cartEl) return Promise.resolve();
  const s = sourceImg.getBoundingClientRect();
  const c = cartEl.getBoundingClientRect();
  const duration = token('--dur-flight', 650);

  // Outer element moves on X (linear), inner on Y (up then down): a real arc.
  const outer = document.createElement('div');
  Object.assign(outer.style, {
    position: 'fixed', left: `${s.left}px`, top: `${s.top}px`,
    width: `${s.width}px`, height: `${s.height}px`,
    zIndex: 9999, pointerEvents: 'none', willChange: 'transform',
  });
  outer.setAttribute('aria-hidden', 'true');
  const inner = sourceImg.cloneNode(true);
  inner.removeAttribute('id');
  inner.removeAttribute('loading');
  Object.assign(inner.style, {
    width: '100%', height: '100%', objectFit: 'contain', margin: 0,
    transformOrigin: 'center', willChange: 'transform, opacity',
  });
  outer.appendChild(inner);
  document.body.appendChild(outer);

  const dx = c.left + c.width / 2 - (s.left + s.width / 2);
  const dy = c.top + c.height / 2 - (s.top + s.height / 2);
  const peak = Math.min(0, dy) - Math.min(140, 40 + Math.abs(dx) * 0.25);
  const endScale = Math.max(0.08, Math.min(0.25, c.width / s.width));

  outer.animate(
    [{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }],
    { duration, easing: 'linear', fill: 'forwards' },
  );
  const y = inner.animate(
    [
      { transform: 'translateY(0) scale(1)', opacity: 1, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' },
      { transform: `translateY(${peak}px) scale(0.6)`, opacity: 1, offset: 0.4, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
      { transform: `translateY(${dy}px) scale(${endScale})`, opacity: 0.6 },
    ],
    { duration, fill: 'forwards' },
  );
  return y.finished.catch(() => {}).finally(() => outer.remove());
}

/** Set the badge count and give the cart a small bounce. */
export function bumpCart(cartEl, count) {
  const badge = cartEl.querySelector('[data-cart-count]');
  if (badge) {
    badge.textContent = count;
    badge.hidden = count === 0;
  }
  if (reduced()) return;
  cartEl.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }],
    { duration: 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  );
  badge?.animate(
    [{ transform: 'scale(0.6)' }, { transform: 'scale(1)' }],
    { duration: 260, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
  );
}

/** Screen-reader announcement through a shared polite live region. */
export function announce(message) {
  let region = document.getElementById('sr-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'sr-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.style.cssText =
      'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;';
    document.body.appendChild(region);
  }
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}

/** Button success state: swaps label briefly. <button data-success-label="נוסף ✓"> */
export function buttonSuccess(btn, ms = 1200) {
  const label = btn.dataset.successLabel;
  if (!label) return;
  if (!btn.dataset.label) btn.dataset.label = btn.textContent;
  btn.textContent = label;
  btn.dataset.state = 'success';
  clearTimeout(btn._successTimer);
  btn._successTimer = setTimeout(() => {
    btn.textContent = btn.dataset.label;
    delete btn.dataset.state;
  }, ms);
}

/** Reveal [data-reveal] elements when they enter the viewport. Stagger with style="--i:1". */
export function revealOnScroll(selector = '[data-reveal]') {
  const els = document.querySelectorAll(selector);
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  els.forEach((el) => io.observe(el));
}

/** Show `bar` once `heroCta` has scrolled above the viewport. */
export function stickyCta(heroCta, bar) {
  if (!heroCta || !bar) return;
  const set = (shown) => {
    bar.classList.toggle('is-shown', shown);
    bar.inert = !shown;
  };
  set(false);
  new IntersectionObserver(([e]) => {
    set(!e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe(heroCta);
}
```

## 5. Add-to-cart flow

Markup contract:

```html
<article data-product data-variant-id="123" data-name="מדרס ספורט">
  <div class="card-media"><img src="..." alt="מדרס ספורט"></div>
  <button class="btn" data-add-to-cart data-success-label="נוסף ✓">הוספה לסל</button>
</article>

<button class="cart-fab" data-cart-button aria-label="עגלת קניות">
  <svg aria-hidden="true">...</svg>
  <span class="cart-badge" data-cart-count hidden>0</span>
</button>
```

Wiring. State first, flight second, badge on landing with the count *at landing time*, so rapid clicks stay correct:

```js
import { flyToCart, bumpCart, announce, buttonSuccess } from './micro.js';

const cart = { items: new Map(), get count() { let n = 0; this.items.forEach((q) => (n += q)); return n; } };
const cartBtn = document.querySelector('[data-cart-button]');

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  const card = btn.closest('[data-product]');
  const id = card.dataset.variantId;

  cart.items.set(id, (cart.items.get(id) ?? 0) + 1);   // 1. state
  buttonSuccess(btn);                                  // 2. instant feedback
  announce(`${card.dataset.name} נוסף לסל`);
  flyToCart(card.querySelector('img'), cartBtn)        // 3. visual echo
    .then(() => bumpCart(cartBtn, cart.count));
});
```

### Shopify (Cart AJAX API)
Optimistic: start the flight immediately, reconcile the badge with the server's count, revert on error.

```js
const root = window.Shopify?.routes?.root ?? '/';

async function addToShopifyCart(variantId, qty = 1) {
  const res = await fetch(`${root}cart/add.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ items: [{ id: Number(variantId), quantity: qty }] }),
  });
  if (!res.ok) throw new Error((await res.json()).description ?? 'Add to cart failed');
  const cartRes = await fetch(`${root}cart.js`);
  return (await cartRes.json()).item_count;
}

// In the click handler, instead of the local Map:
const flight = flyToCart(card.querySelector('img'), cartBtn);
try {
  const count = await addToShopifyCart(card.dataset.variantId);
  await flight;
  bumpCart(cartBtn, count);
  announce(`${card.dataset.name} נוסף לסל`);
} catch (err) {
  announce(err.message);                  // e.g. out of stock
  btn.dataset.state = 'error';
}
```
Also dispatch the theme's own cart-refresh event if it has one (e.g. `document.dispatchEvent(new CustomEvent('cart:refresh'))`), so the theme's drawer stays in sync.

## 6. Mini-cart morph

The floating round cart button morphs into a cart panel in place. Anchor it with `position: fixed; inset-block-end: 24px; inset-inline-end: 24px;`.

### React + Motion (`npm i motion`)

```jsx
import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';

const spring = { type: 'spring', stiffness: 420, damping: 36 };

export function FloatingCart({ items, count, total, onQty, onCheckout }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const panelRef = useRef(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) panelRef.current?.querySelector('[data-autofocus]')?.focus();
    else if (wasOpen.current) btnRef.current?.focus();
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onDown = (e) => !panelRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <div className="cart-anchor">
        {open ? (
          <motion.div
            layoutId="cart" ref={panelRef} className="mini-cart"
            role="dialog" aria-label="עגלת קניות" style={{ borderRadius: 20 }}
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12 } }}>
              <header>
                <h2>העגלה שלך <span className="pill">{count}</span></h2>
                <button data-autofocus aria-label="סגירה" onClick={() => setOpen(false)}>×</button>
              </header>
              <ul>
                {items.map((it) => (
                  <li key={it.id}>
                    <img src={it.image} alt="" />
                    <div><p>{it.name}</p><p>{it.price}</p></div>
                    <div className="qty">
                      <button aria-label="הפחתה" onClick={() => onQty(it.id, -1)}>−</button>
                      <span>{it.qty}</span>
                      <button aria-label="הוספה" onClick={() => onQty(it.id, 1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
              <footer>
                <p><span>סה״כ</span><strong>{total}</strong></p>
                <button className="btn" onClick={onCheckout}>לתשלום</button>
              </footer>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            layoutId="cart" ref={btnRef} className="cart-fab" data-cart-button
            aria-label={`עגלת קניות, ${count} פריטים`} aria-haspopup="dialog"
            style={{ borderRadius: 999 }} onClick={() => setOpen(true)}
          >
            <CartIcon aria-hidden />
            {count > 0 && <span className="cart-badge" data-cart-count>{count}</span>}
          </motion.button>
        )}
      </div>
    </MotionConfig>
  );
}
```
Set `borderRadius` through `style` (not CSS) so Motion corrects it during the layout animation.

### Vanilla: View Transitions API

```js
const shell = document.querySelector('.cart-shell');   // one element, two states
function setCartOpen(open) {
  const apply = () => { shell.dataset.open = String(open); };
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return apply();
  document.startViewTransition(apply);
}
```
```css
.cart-shell { view-transition-name: cart; }
::view-transition-group(cart) {
  animation-duration: var(--dur-base);
  animation-timing-function: var(--ease-in-out);
}
::view-transition-old(cart), ::view-transition-new(cart) { height: 100%; }
```
Browsers without View Transitions just switch instantly; that's acceptable. Focus / Esc / outside-click handling is the same as in the React version.

## 7. CSS patterns

```css
/* Button press + success */
.btn {
  transition: transform var(--dur-instant) var(--ease-out),
              background-color var(--dur-fast) var(--ease-out);
}
.btn:active { transform: scale(0.97); }
.btn[data-state="success"] { background: var(--color-success, #1f8a4c); }

/* Card hover: lift + image zoom, shadow faded via opacity (no box-shadow animation) */
.card { position: relative; }
.card::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.12);
  opacity: 0; pointer-events: none;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.card-media { overflow: hidden; border-radius: inherit; }
.card-media img { transition: transform var(--dur-slow) var(--ease-out); }
@media (hover: hover) and (pointer: fine) {
  .card { transition: transform var(--dur-fast) var(--ease-out); }
  .card:hover { transform: translateY(-4px); }
  .card:hover::after { opacity: 1; }
  .card:hover .card-media img { transform: scale(1.04); }
}

/* Scroll reveal (only when JS is running) */
html.js [data-reveal] {
  opacity: 0;
  transform: translateY(var(--reveal-distance));
  transition: opacity var(--dur-slow) var(--ease-out),
              transform var(--dur-slow) var(--ease-out);
  transition-delay: calc(var(--i, 0) * var(--stagger));
}
html.js [data-reveal].is-visible { opacity: 1; transform: none; }

/* Sticky CTA bar */
.sticky-cta {
  position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 50;
  transform: translateY(100%);
  transition: transform var(--dur-base) var(--ease-out);
}
.sticky-cta.is-shown { transform: none; }

/* Floating cart (RTL-safe) */
.cart-fab, .cart-anchor {
  position: fixed; inset-block-end: 24px; inset-inline-end: 24px; z-index: 60;
}
.cart-badge {
  position: absolute; inset-block-start: -4px; inset-inline-end: -4px;
  min-width: 20px; height: 20px; border-radius: 999px;
  display: grid; place-items: center; font-size: 12px;
}
```

## 8. QA checklist (for the critic subagent, via Playwright)

- [ ] "Add to cart" produces flight → landing → badge bump; the count is correct after 3 rapid clicks.
- [ ] Re-run with `page.emulateMedia({ reducedMotion: 'reduce' })`: no flight, no reveal, everything works and is visible.
- [ ] With JS disabled (`javaScriptEnabled: false`), all sections are visible.
- [ ] No layout shift during any animation (neighbouring elements don't move between screenshots).
- [ ] Mini-cart: opens by keyboard, Esc closes, focus returns to the cart button.
- [ ] RTL: floating cart sits on the inline-end side (left in Hebrew); slide-ins come from the correct side.
- [ ] No duration or easing outside the token scale; no animated width/height/top/left/box-shadow.

## 9. Cart drop (ball falls into the cart icon)

A compact alternative to fly-to-cart that lives entirely inside the cart icon: a ring appears above the cart, falls into the basket, fills, lands with a small squash, and the count rises inside it, becoming the badge. Later adds make the ball hop and the number roll. Works even when the cart is far from (or off-screen from) the add button, so it's the default for **mobile headers** and sticky carts. Use fly-to-cart when product and cart are both on screen and you want to show *which* product moved; use cart drop otherwise. Never both on the same click.

### Markup
```html
<button class="cart-drop" type="button" data-cart-drop aria-label="עגלת קניות, 0 פריטים">
  <svg viewBox="0 0 48 48" aria-hidden="true">
    <defs><clipPath id="cd-clip"><circle cx="25.5" cy="22.5" r="8"/></clipPath></defs>
    <g class="cd-cart" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 11h7l5 21h21l3.5-16 4.5-2.5"/>
      <circle cx="19.5" cy="39" r="2.6"/><circle cx="31.5" cy="39" r="2.6"/>
    </g>
    <g class="cd-ball" opacity="0">
      <circle class="cd-dot" cx="25.5" cy="22.5" r="8" stroke="currentColor" stroke-width="2.4"/>
      <g class="cd-num-clip" clip-path="url(#cd-clip)"><text class="cd-num" x="25.5" y="26.6" text-anchor="middle">0</text></g>
    </g>
  </svg>
</button>
```

### CSS
```css
.cart-drop { inline-size: 48px; block-size: 48px; padding: 4px; border: 0; background: none; color: var(--color-text, #111); cursor: pointer; display: inline-grid; place-items: center; }
.cart-drop svg { inline-size: 100%; block-size: 100%; overflow: visible; }
.cart-drop .cd-cart, .cart-drop .cd-ball, .cart-drop .cd-dot, .cart-drop .cd-num { transform-box: fill-box; transform-origin: center; }
.cart-drop .cd-dot { fill: currentColor; }
.cart-drop .cd-num { fill: var(--color-bg, #fff); font: 800 11px/1 var(--font-display, system-ui, sans-serif); }
.cart-drop:focus-visible { outline: 2px solid var(--color-accent, currentColor); outline-offset: 2px; border-radius: 12px; }
```
The SVG is RTL-safe as drawn (a cart icon is not mirrored in Hebrew UIs). Colors follow `currentColor`, so the icon matches the header text color in both themes.

### JS
```js
// cart-drop.js
let uid = 0;
export function cartDrop(button, { count = 0, label = (n) => `עגלת קניות, ${n} פריטים` } = {}) {
  const svg = button.querySelector('svg');
  const ball = svg.querySelector('.cd-ball');
  const dot = svg.querySelector('.cd-dot');
  const num = svg.querySelector('.cd-num');
  const cart = svg.querySelector('.cd-cart');
  const clipId = `cd-clip-${++uid}`;                // unique clipPath per instance
  svg.querySelector('clipPath').id = clipId;
  svg.querySelector('.cd-num-clip').setAttribute('clip-path', `url(#${clipId})`);   // clip on a wrapper so it stays put while the number moves
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ink = () => getComputedStyle(button).color;
  let shown = 0, run = 0;
  const done = (a) => a.finished.then(() => true, () => false);   // false if interrupted

  const render = (n) => {
    num.textContent = n > 99 ? '99+' : String(n);
    num.style.fontSize = n > 9 ? '8px' : '';
    ball.setAttribute('opacity', n > 0 ? '1' : '0');
    button.setAttribute('aria-label', label(n));
  };
  // Cancel everything: the element's base state (no animation) is always the correct resting state.
  const stop = () => { run++; [ball, dot, num, cart].forEach((el) => el.getAnimations().forEach((a) => a.cancel())); };

  const dropIn = async (n) => {
    const my = run;
    render(n);
    ball.setAttribute('opacity', '1');
    const c = ink();
    // ring stays hollow while it appears and falls, fills as it lands
    dot.animate([{ fill: 'transparent' }, { fill: 'transparent', offset: .72 }, { fill: c }], { duration: 560, fill: 'forwards' });
    // 1. ring appears above the cart
    const appear = ball.animate(
      [{ transform: 'translateY(-24px) scale(.5)', opacity: 0 }, { transform: 'translateY(-24px) scale(1)', opacity: 1 }],
      { duration: 160, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
    num.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 900, fill: 'forwards' });
    if (!(await done(appear)) || my !== run) return;
    // 2. falls with gravity
    const fall = ball.animate(
      [{ transform: 'translateY(-24px)' }, { transform: 'translateY(0)' }],
      { duration: 320, easing: 'cubic-bezier(.55,0,1,.45)', fill: 'forwards' });
    if (!(await done(fall)) || my !== run) return;
    appear.cancel(); fall.cancel();
    // 3. lands: squash + cart dip
    ball.animate(
      [{ transform: 'scale(1.14,.82)' }, { transform: 'scale(.96,1.05)' }, { transform: 'none' }],
      { duration: 280, easing: 'ease-out', fill: 'forwards' });
    cart.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(1.6px)' }, { transform: 'translateY(0)' }],
      { duration: 260, easing: 'ease-out' });
    // 4. number rises inside the ball
    num.getAnimations().forEach((a) => a.cancel());
    await done(num.animate(
      [{ transform: 'translateY(9px)', opacity: 0 }, { transform: 'translateY(6px)', opacity: 1, offset: .2 }, { transform: 'translateY(0)', opacity: 1 }],
      { duration: 320, delay: 150, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
  };

  const roll = async (n, up) => {
    const my = run;
    ball.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-6px)' }, { transform: 'translateY(0)' }],
      { duration: 360, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    const d = up ? 1 : -1;
    const out = num.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-9 * d}px)` }],
      { duration: 140, easing: 'ease-in', fill: 'forwards' });
    const ok = await done(out);
    render(n);
    if (!ok || my !== run) return;
    out.cancel();
    await done(num.animate([{ transform: `translateY(${9 * d}px)` }, { transform: 'translateY(0)' }],
      { duration: 220, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }));
  };

  const dropOut = async () => {
    const my = run;
    const out = ball.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.4)', opacity: 0 }],
      { duration: 200, easing: 'ease-in', fill: 'forwards' });
    await done(out);
    if (my !== run) return;
    render(0);
    out.cancel();
  };

  const set = async (n) => {
    n = Math.max(0, n | 0);
    stop();
    const prev = shown; shown = n;
    if (reduced() || n === prev || !button.isConnected) return render(n);
    if (prev === 0 && n > 0) return dropIn(n);
    if (n === 0) return dropOut();
    return roll(n, n > prev);
  };

  render(count); shown = count;
  return { set, add: (k = 1) => set(shown + k), get count() { return shown; } };
}
```

### Wiring
```js
import { cartDrop } from './cart-drop.js';
import { announce, buttonSuccess } from './micro.js';

const cartIcon = cartDrop(document.querySelector('[data-cart-drop]'), { count: 0 });
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add-to-cart]');
  if (!btn) return;
  const count = cart.add(btn.dataset.variantId);   // 1. real state first (local or Shopify, see section 5)
  buttonSuccess(btn);                              // 2. instant feedback on the button
  announce(`${btn.dataset.name} נוסף לסל`);
  cartIcon.set(count);                             // 3. the drop / roll
});
```
Always pass the **real** count from state or the server (e.g. Shopify `item_count`), never increment blindly, so rapid clicks and failed requests stay correct.

### QA
- [ ] First add: ring appears, falls, fills, squashes, number rises: about 0.9s total.
- [ ] Second add: hop + number rolls up; removing items rolls down; reaching 0 shrinks the ball away.
- [ ] 5 fast clicks end on the correct number with no stuck half-states.
- [ ] Reduced motion: the number just updates.
- [ ] Screen reader: the button's label includes the count, and the add is announced once.
