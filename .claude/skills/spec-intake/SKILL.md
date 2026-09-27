---
name: spec-intake
description: Turns any client spec (doc, PDF, WhatsApp text, call notes, existing site) into a structured brief.json and a questions.md of gaps, without inventing anything. Use at the start of every website or landing-page project.
---

# Spec intake

A great site starts from a complete brief. Clients rarely send one. This skill extracts what's there, marks what's missing, and never fills gaps with guesses.

## 1. Read everything in `spec/`
- `.pdf` → pdf tools; `.docx` → docx tools; images/screenshots → look at them; audio → ask for a transcript.
- A WhatsApp/email thread: the latest message wins when messages conflict; note the conflict.
- An existing site URL: fetch the main pages (WebFetch) for current content, offer, tone and what to keep.

## 2. Fill `brief.json` (schema: `templates/brief.schema.json`)
- Every field you fill gets an entry in `sources` pointing to where it came from (`"offer.pricing": "spec/whatsapp.txt, 14/9 message"`).
- Unknown → leave empty and add a question. Don't guess prices, guarantees, numbers, proof.
- `siteType` and `stack`: choose by CLAUDE.md stack defaults and write the reason.
- `locale`: Hebrew content or Israeli audience → `he` / `rtl` unless told otherwise.
- `awareness`: infer from traffic source if given (ads about a pain → pain-aware; brand search → product-aware); otherwise ask.

## 3. Write `questions.md`
```md
# Questions for <client>

## Blocking (can't design well without these)
1. What is the one action you want visitors to take? (call / WhatsApp / form / purchase)
...

## Important (we'll assume if not answered)
1. ... — our assumption: ...

## Nice to have
...
```
Group by blocking / important / nice-to-have. Write questions in the client's language, answerable in one line, with examples. Max ~10 blocking questions.

Always check these are answered or asked:
- primary action · target audience · offer & price · what makes them different · real proof (reviews, numbers, logos) · existing brand assets (logo, colors, fonts, photos) · pages needed · who edits content later · integrations (analytics, pixel, CRM, WhatsApp, payments) · domain & hosting · deadline · sites they like and why · sites/styles they hate.

## 4. Summary for the orchestrator
Five lines: who the client is, what the site must achieve, site type + stack, the 3 biggest unknowns, and whether we can proceed with assumptions.
