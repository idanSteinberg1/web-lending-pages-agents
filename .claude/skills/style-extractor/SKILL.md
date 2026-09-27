---
name: style-extractor
description: Turns inspiration (screenshots, Dribbble shots, reference sites) into a reusable design profile with tokens. Use when the user shares a design reference and wants its style, not a copy.
---

# Style extractor

Goal: take the **language** of a reference (color, type, spacing, shape, motion, composition), not its layout, logo or content.

## 1. Get the reference
- Screenshot / image from the user: best source.
- Public URL: `node scripts/shoot.mjs <url> references/<name> 390,1440`.
- Dribbble, Behance, Instagram, Pinterest are JS-rendered or block automation: ask the user for screenshots (several frames for a video).

Store everything in `references/<name>/`.

## 2. Describe before measuring
3 mood adjectives + one sentence on what makes it recognizable ("oversized product floating over giant outlined type").

## 3. Extract tokens
**Color**: `python scripts/palette.py <image> 10`, then assign roles by eye (an accent can be 2% of pixels): `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-contrast`, `--color-border`. Check pairs with `python scripts/contrast.py <fg> <bg>`: body text ≥ 4.5:1, large text/UI ≥ 3:1. Adjust the token, not the mood.

**Typography**: classify (geometric / grotesk / humanist / serif / display / mono), weight contrast, case, tracking, heading:body ratio. Pick Google Fonts matches; **Hebrew sites need Hebrew-capable fonts**:
| Feel | Hebrew-capable picks |
|---|---|
| Clean geometric | Rubik, Heebo, Assistant |
| Friendly / rounded | Varela Round, Rubik |
| Bold display | Secular One, Suez One, Karantina |
| Editorial serif | Frank Ruhl Libre, David Libre |
| Neutral workhorse | Noto Sans Hebrew, IBM Plex Sans Hebrew |
Write a fluid scale with `clamp()`.

**Shape, depth, spacing**: base unit (4/8), section padding, radii (pill vs square), borders, shadow style, image treatment.

**Composition moves**: the 3-5 moves that define the look ("product breaks out of its card", "giant number behind heading", "asymmetric 7/5 grid"). These matter more than pixels.

**Motion** (if any): entrance style, hover, signature interaction.

## 4. Output
- `design-profiles/<name>.md`: mood, signature sentence, reference path, composition moves, Do / Don't (don't copy layout section-by-section; don't use their logo, name, photos or copy).
- `design-profiles/<name>.tokens.css`: `:root { ... }` with colors, fonts, type scale, spacing, radii, shadows.

## 5. Translate to the product
Keep the energy, swap the subject: map each composition move to the client's product (floating sneaker → insole tilted 30° showing the arch / exploded layers).

## 6. Verify
Build a one-page specimen (swatches, type scale, button, card, hero block), screenshot it next to the reference: same family, not a copy. Looks copied → change layout. Doesn't feel related → revisit color and type first.
