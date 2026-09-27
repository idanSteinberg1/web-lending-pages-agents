---
description: Fast single-file HTML + Tailwind mockup of a landing page or site (minutes, not hours) — for client pitches and quick previews
argument-hint: <short brief, spec file, or client name + what they sell>
---

Quick mode of the site factory: one complete, polished HTML file, not a full build. Follow the CLAUDE.md taste and honesty rules; skip the checkpoints and the multi-agent pipeline.

Input: $ARGUMENTS

## 1. Mini-brief (2 minutes)
Extract: client, what they sell, audience, primary action, language/direction, any real proof or assets. If a blocking fact is missing (primary action or what they sell), ask once. Otherwise assume, and list the assumptions at the top of your reply.

## 2. One direction
Using the `art-direction` skill, choose **one** direction and state it in 5 lines: name, mood (3 words), axes, **outcome moment** (§0: what the visitor sees/tries that shows their own result), and the section structures you'll use (section variety rule). It must pass the anti-generic check. If your first idea is a static hero with a device mockup and three service cards, it fails; think again before building.

## 3. Copy
Write the page copy with the `conversion-sections` skill (order by awareness, Hebrew rules). Real copy only; `[TODO: ...]` for missing proof.

## 4. Build: `quick/<slug>.html`
One self-contained file:
```html
<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>…</title>
  <meta name="description" content="…">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=…&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <style type="text/tailwindcss">
    @theme { /* direction tokens: --color-*, --font-*, radii */ }
  </style>
  <style>/* motion tokens + ui-components CSS + signature moment CSS */</style>
  <script>document.documentElement.classList.add('js')</script>
</head>
```
Rules:
- Complete page: header with **mobile hamburger menu**, all sections, **FAQ accordion**, footer. Tabs where the content has parallel options. Use the `ui-components` skill code exactly.
- Icons: inline SVG (Lucide-style paths). No icon fonts.
- Motion: tokens + a choreographed hero intro + the signature moment from the direction, using `motion-choreography` (GSAP/Lenis from jsDelivr) or `webgl-moments` (the shader gradient needs no library). No AOS, no identical fade-up on every section.
- Images: client assets if given. Otherwise art-directed placeholders (a styled block with a caption describing the needed shot, e.g. "צילום: מדרס בזווית 30°, רקע בז'"), or specific Unsplash photo URLs (`https://images.unsplash.com/photo-…?w=1600&q=80&auto=format`) marked `[TODO: replace with client photo]`. Never random image endpoints.
- No partial code, no "your code here".
- Tailwind browser CDN is fine for a mockup. Say so in the reply: production goes through `/new-site`.

## 5. Check and polish (one pass)
If Playwright is available: `node scripts/shoot.mjs quick/<slug>.html quick/<slug>-shots 390,1440`, look at the screenshots, and fix the 3 worst issues (hierarchy, spacing, overflow, anything generic). Check: no horizontal scroll at 390, hamburger works, FAQ opens, contrast OK.

## 6. Deliver
- In Claude Code: give the file path and the screenshots.
- In claude.ai: publish the file as an Artifact so it can be previewed and iterated live.
Reply with: assumptions, the direction (5 lines), TODOs, and "to turn this into a production site: `/new-site` with this file as reference direction A".
