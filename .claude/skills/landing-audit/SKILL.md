---
name: landing-audit
description: Audits a live or local landing page for conversion, mobile, accessibility, performance, SEO and RTL, then returns a scored report with the top fixes. Use when asked to review, audit or improve a page or client site.
---

# Landing audit

A report a client can read: score per area, evidence, and the **top fixes ranked by impact ÷ effort**. Measure first, opinion second.

## 1. Automated evidence
Once: `npm i -D playwright @axe-core/playwright`.
```bash
node scripts/audit.mjs <url> audit-<name>
```
Produces desktop/mobile fold + full screenshots and `report.json` (LCP, CLS, load time, total KB, heavy images, title/meta/OG/canonical, lang/dir, h1s, horizontal scroll, images without alt, CTA above fold, small tap targets, tracking tags, axe violations).

If network allows, also Lighthouse mobile:
```bash
npx lighthouse <url> --only-categories=performance,accessibility,seo --form-factor=mobile --output=json --output-path=audit-<name>/lh.json --quiet --chrome-flags="--headless"
```

## 2. Look at the screenshots
- **5-second test**: what, for whom, why better, what next?
- **CTA**: one clear primary action, visible, action+result wording.
- **Trust**: real proof near the decision point; guarantee; business details.
- **Friction**: popups on load, long forms, surprise costs, dead ends.
- **Hierarchy**: one focal point per screen; body ≥ 16px on mobile.
- **RTL**: `dir="rtl"`, directional icons mirrored, bidi strings intact, nothing hugging the wrong side.

## 3. Score (0-10 each, one-line reason + evidence)
| Area | What counts |
|---|---|
| Clarity & message | 5-second test, headline = outcome |
| CTA & flow | above-fold CTA, wording, sticky CTA on long pages |
| Trust | real proof, guarantee, contact/business details |
| Mobile | no horizontal scroll, tap targets ≥ 40px, readable text |
| Performance | LCP < 2.5s, CLS < 0.1, no images > 300KB |
| Accessibility | axe critical/serious weigh most, alt text, contrast |
| SEO basics | one h1, title ≤ 60, meta description, OG image, lang, canonical |
| RTL & localization | direction, bidi, copy quality |
| Tracking | analytics / pixels present if the page runs ads |

## 4. Report (`audit-<name>/REPORT.md`, in the site's language)
1. Summary: overall score + 2-sentence verdict.
2. Top 5 fixes: impact (high/med/low), effort (S/M/L), exact change, where. Quick wins first.
3. Scores table with evidence.
4. Details per area, referencing screenshot files.
5. What's already good (short; tells the client what not to break).

## Rules
- Every claim points at evidence (number, screenshot, axe rule id).
- Fine areas get one line.
- Live client sites are read-only: never submit forms, pay, or change anything.
- Re-run after fixes into a new folder and show before/after.
