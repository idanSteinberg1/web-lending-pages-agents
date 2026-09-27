---
name: ui-components
description: Accessible, RTL-safe reference implementations of required interactive components (mobile hamburger menu, FAQ accordion, tabs). Use whenever a site or landing page needs navigation, FAQ or tabbed content.
---

# UI components (required set)

Every site must have a working mobile menu, and every FAQ / tabbed block must use these patterns. They are vanilla, dependency-free, keyboard-accessible and correct in RTL. Copy them; style them with the project's tokens.

## 1. Mobile hamburger menu

```html
<header class="site-header">
  <a href="/" class="logo">…</a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"
          data-label-open="פתיחת תפריט" data-label-close="סגירת תפריט" aria-label="פתיחת תפריט">
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path class="l1" d="M4 7h16"/><path class="l2" d="M4 12h16"/><path class="l3" d="M4 17h16"/>
    </svg>
  </button>
  <nav id="site-nav" class="site-nav" data-open="false" aria-label="ראשי">
    <ul>
      <li><a href="#how">איך זה עובד</a></li>
      <li><a href="#faq">שאלות נפוצות</a></li>
      <li><a class="btn" href="#order">להזמנה</a></li>
    </ul>
  </nav>
</header>
```

```js
export function initNav(root = document) {
  const btn = root.querySelector('.nav-toggle');
  const nav = btn && document.getElementById(btn.getAttribute('aria-controls'));
  if (!btn || !nav) return;
  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? btn.dataset.labelClose : btn.dataset.labelOpen);
    nav.dataset.open = String(open);
    document.documentElement.classList.toggle('nav-locked', open);
    if (open) nav.querySelector('a, button')?.focus();
  };
  btn.addEventListener('click', () => set(!isOpen()));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) { set(false); btn.focus(); }
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) set(false); });
}
```

```css
.site-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.nav-toggle { display: inline-grid; place-items: center; inline-size: 44px; block-size: 44px; }
.nav-toggle svg path { transition: transform var(--dur-base) var(--ease-out), opacity var(--dur-fast); transform-origin: center; }
.nav-toggle[aria-expanded="true"] .l1 { transform: translateY(5px) rotate(45deg); }
.nav-toggle[aria-expanded="true"] .l2 { opacity: 0; }
.nav-toggle[aria-expanded="true"] .l3 { transform: translateY(-5px) rotate(-45deg); }
html.nav-locked { overflow: hidden; }

@media (max-width: 767px) {
  .site-nav {
    position: fixed; inset: 0; inset-block-start: var(--header-h, 64px); z-index: 70;
    background: var(--color-bg); padding: 2rem 1.5rem;
    transform: translateX(calc(100% * var(--dir)));   /* off-screen on the inline-end side, RTL-safe */
    visibility: hidden;
    transition: transform var(--dur-base) var(--ease-out), visibility 0s linear var(--dur-base);
  }
  .site-nav[data-open="true"] {
    transform: none; visibility: visible;
    transition: transform var(--dur-base) var(--ease-out);
  }
  .site-nav ul { display: grid; gap: 1.25rem; font-size: 1.5rem; }
}
@media (min-width: 768px) {
  .nav-toggle { display: none; }
  .site-nav ul { display: flex; align-items: center; gap: 2rem; }
}
```
Requires `--dir` from the motion tokens (`[dir="rtl"] { --dir: -1; }`). Without JS the menu stays hidden on mobile, so also give the header a visible primary CTA outside the nav.

## 2. FAQ accordion: native `<details>`

No JS needed; works without JS; the `name` attribute makes it exclusive (one open at a time).

```html
<section id="faq" class="faq" aria-labelledby="faq-title">
  <h2 id="faq-title">שאלות נפוצות</h2>
  <details name="faq">
    <summary>האם המדרס מתאים לכל נעל?</summary>
    <div class="faq-a"><p>…</p></div>
  </details>
  <!-- more -->
</section>
```

```css
:root { interpolate-size: allow-keywords; }             /* lets height animate to auto where supported */
.faq summary {
  list-style: none; cursor: pointer; display: flex; justify-content: space-between; align-items: center;
  gap: 1rem; min-block-size: 44px; padding-block: 1rem; font-weight: 600;
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: "+"; font-size: 1.5em; line-height: 1; transition: transform var(--dur-fast) var(--ease-out); }
.faq details[open] summary::after { transform: rotate(45deg); }
.faq details::details-content {
  block-size: 0; overflow: clip;
  transition: block-size var(--dur-base) var(--ease-out), content-visibility var(--dur-base) allow-discrete;
}
.faq details[open]::details-content { block-size: auto; }
.faq summary:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; }
```
Height animation is the one allowed exception to "transform/opacity only"; browsers without `::details-content` just open instantly.

Add FAQ structured data for SEO with the same Q&A text:
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
  {"@type":"Question","name":"האם המדרס מתאים לכל נעל?","acceptedAnswer":{"@type":"Answer","text":"…"}}
]}
</script>
```

## 3. Tabs (WAI-ARIA pattern, RTL-aware arrows)

```html
<div class="tabs" data-tabs>
  <div role="tablist" aria-label="סוגי מדרסים">
    <button role="tab" id="tab-sport" aria-controls="panel-sport" aria-selected="true">ספורט</button>
    <button role="tab" id="tab-daily" aria-controls="panel-daily" aria-selected="false" tabindex="-1">יומיומי</button>
  </div>
  <div role="tabpanel" id="panel-sport" aria-labelledby="tab-sport" tabindex="0">…</div>
  <div role="tabpanel" id="panel-daily" aria-labelledby="tab-daily" tabindex="0" hidden>…</div>
</div>
```

```js
export function initTabs(root) {
  const list = root.querySelector('[role=tablist]');
  const tabs = [...list.querySelectorAll('[role=tab]')];
  const rtl = getComputedStyle(root).direction === 'rtl';
  const select = (tab, focus = true) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  list.addEventListener('click', (e) => {
    const t = e.target.closest('[role=tab]');
    if (t) select(t);
  });
  list.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    let n = null;
    if (e.key === next) n = (i + 1) % tabs.length;
    else if (e.key === prev) n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = tabs.length - 1;
    if (n !== null) { e.preventDefault(); select(tabs[n]); }
  });
  select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') ?? tabs[0], false);
}
document.querySelectorAll('[data-tabs]').forEach(initTabs);
```

```css
[role=tablist] { display: flex; gap: .5rem; overflow-x: auto; scrollbar-width: none; }
[role=tab] { min-block-size: 44px; padding-inline: 1rem; border-radius: 999px; transition: background-color var(--dur-fast), color var(--dur-fast); }
[role=tab][aria-selected="true"] { background: var(--color-text); color: var(--color-bg); }
[role=tabpanel]:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 4px; }
```

## QA checks (site-critic)
- [ ] 390px: hamburger opens, links work, Esc closes and focus returns to the button, page doesn't scroll behind it.
- [ ] Menu slides from the correct side in RTL.
- [ ] FAQ opens with Enter/Space; only one open at a time; FAQ JSON-LD matches visible text.
- [ ] Tabs: arrows move in the visual direction (RTL-aware), Home/End work, only the active panel is visible.
- [ ] All targets ≥ 44px.
