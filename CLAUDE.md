# Site factory

Rules for every run of `/quick-site` and `/new-site` in this repo.

## What we build
Complete websites from a client spec (marketing sites, landing pages, small stores, web apps), designed to look like a top studio made them, not like a template.

## Two modes
- `/quick-site` — one self-contained HTML + Tailwind file in minutes, for pitches and previews (Artifact-friendly). Not for production.
- `/new-site` — the full pipeline below, for production sites.

## Pipeline (run by `/new-site`)
1. intake → `brief.json` + `questions.md` (skill: spec-intake) — **checkpoint**
2. strategy → `strategy.md` (agent: site-strategist, skills: conversion-sections, treatment-landing for clinic treatments)
3. art direction → 3 directions in `directions/` (agent: site-art-director, skills: art-direction, style-extractor) — **checkpoint**
4. design system → `design/tokens.css`, base components
5. content → `content/*.md` (agent: site-copywriter)
6. build → `site/` (agent: site-builder, skills: ui-components, micro-interactions, motion-choreography, webgl-moments)
7. QA loop → `qa/round-N/` (agent: site-critic, skill: landing-audit) until gates pass, max 4 rounds
8. preview deploy + `REPORT.md` — **checkpoint before production**

State lives in `projects/<slug>/state.json` (`{ "stage": "...", "direction": "...", "qaRound": 0 }`) so a run can resume.

## Project layout
```
projects/<slug>/
  spec/            original client material, untouched
  brief.json       structured brief (templates/brief.schema.json)
  questions.md     open questions for the client
  strategy.md      sitemap + sections per page
  directions/      a/, b/, c/, index.html (comparison board)
  design/          tokens.css, direction.md (the chosen one)
  content/         copy per page
  site/            the code
  qa/round-N/      screenshots, critique.md, audit report
  REPORT.md        client-facing summary
```

## Stack defaults
- Landing / marketing site → **Astro + Tailwind + Motion**, static output.
- App with auth or heavy state → **Next.js (App Router)**.
- Client edits content → add a headless CMS (Sanity or Payload); say so in the brief.
- Store → Shopify theme work, not a custom build, unless the brief says otherwise.
- Deploy previews on Vercel or Netlify.

## Taste rules (anti-generic)
Never ship these defaults unless the direction explicitly calls for them:
- purple/blue gradient hero, glassmorphism cards on a gradient
- centered hero + three identical feature cards + logo row + testimonial carousel
- Inter/Roboto everywhere with no type contrast
- stock "people pointing at laptop" imagery, generic 3D blobs
- every section fading up the same way

Every site must have:
- a type system with real personality (display face + text face, strong size contrast)
- a layout system that is not the same 12-col centered stack on every section (asymmetry, overlap, bleed, bento, sticky, editorial columns)
- **one outcome moment** (the signature): the visitor sees or tries their own result, e.g. picks their business and the mockup becomes their site. See art-direction §0
- section variety: no two adjacent sections with the same structure
- real content hierarchy: one focal point per screen

## Quality gates (QA loop stops when all pass)
- Lighthouse mobile: performance ≥ 90, accessibility ≥ 95, SEO ≥ 95
- axe: 0 critical / serious violations
- CLS < 0.1, LCP < 2.5s (mobile)
- site-critic design score ≥ 8/10 and "fidelity to direction" ≥ 8/10
- no horizontal scroll at 360px; RTL correct for Hebrew
- motion (`scripts/record-motion.mjs`): ≥ 55fps desktop / ≥ 45fps mobile, ≤ 5% janky frames, ≤ 200ms long tasks during scroll, CLS during scroll < 0.05 (measured on a real GPU)
- JS budget: motion ≤ 60KB gz; WebGL code and models lazy-loaded after LCP; model ≤ 2MB
- mobile menu, FAQ accordion and tabs pass the `ui-components` QA checks (keyboard + RTL)
- `npm run build` passes with no warnings about missing images/links

## External skill: ui-ux-pro-max (account skill, if installed)
Use it as a **rules and QA source**, not a style source:
- Yes: UX and accessibility guidelines (`--domain ux`), forms, touch targets, responsive rules, GSAP presets (`--domain gsap`), stack guidance (`--stack astro|nextjs|html-tailwind`), and its pre-delivery checklist.
- No: its `--design-system` colors, fonts and style picks never override the chosen direction, `art-direction`, `style-extractor` or the taste rules above. Its fonts are often Latin-only; Hebrew sites need Hebrew-capable fonts.
- Treat its search results as recommendations; if a search returns nothing relevant, say so instead of guessing.

## Language & locale
Hebrew client → `<html lang="he" dir="rtl">`, Hebrew-capable fonts, logical CSS properties only, gender-neutral copy (no slash forms). Keep code, file names and comments in English.

## Honesty rules
Never invent reviews, client logos, statistics, awards or certifications. Use clearly marked placeholders (`[TODO: ...]`) and list them in REPORT.md.
