---
name: art-direction
description: Creates distinct, non-generic visual directions for a website (axes of difference, direction card format, signature-moment catalog with modern techniques). Use when choosing or defining the look of a new site or landing page.
---

# Art direction

A direction is a **point of view**, not a color palette. Three directions for one client must feel like three different studios pitched.

## 0. The outcome rule (most important)
A page that follows every rule can still look like every other page. What makes it memorable is that **the visitor sees their own outcome, not a description of the service.**

Before choosing axes, answer in one line: *"What will the visitor see, try or feel that shows them the result they'll get?"* That answer is the direction's signature moment, and it usually lives in the hero.

Test: after 10 seconds on the page, could a visitor describe it to a friend by one specific thing ("you pick your business and it shows you your site")? If the only description is "clean and modern", the direction fails.

### Outcome hero patterns by business type
| Business | The visitor sees their outcome by… |
|---|---|
| Web / design studio | picking their business type → the device mockup becomes *their* site (name, colors, CTA) |
| Insoles / orthopedics | choosing activity or pain point → the insole view highlights the matching support zone and recommends a model |
| Clinic / therapist | choosing what hurts → a short "what the first visit looks like" timeline for that case |
| Lawyer / accountant | choosing their situation → the 3 next steps and what to prepare |
| Restaurant / café | choosing time of day → menu, photo and mood change (breakfast / lunch / evening) |
| Fitness studio | choosing a goal → the weekly schedule filters to the right classes |
| Real estate / renovation | before/after slider on a real project, or a room that changes style on click |
| SaaS / app | a live, working mini-demo with sample data, not a screenshot |
| Course / coach | a 3-question quiz → "your starting point" card |
| E-commerce product | configurator: color / size / use-case updates the product visual and price |

Rules for outcome heroes:
- Works instantly with no input: it auto-plays or starts on the most common case, and stops auto-playing once the visitor interacts.
- The interaction is 1 click, never a form.
- It is real content (real names, real copy, real prices) or clearly labeled examples.
- Reduced motion: no auto-play, the controls still work.
- It never replaces the headline and the primary CTA; it sits next to or under them.

### Section variety rule
No two adjacent sections share the same structure. Mix at least 4 of these across a page: bento grid · marquee band · horizontal rail · sticky/pinned story · split sticky-heading layout · full-bleed color block · conversational (chat-style) form · oversized type block · live mini-demo tile. Three identical cards in a row is allowed at most once per page.

## 1. The five axes
Each direction picks a clear position on each axis. Any two directions must differ on at least three.

| Axis | Range |
|---|---|
| Typography | neutral grotesk ↔ expressive display ↔ editorial serif ↔ mono/technical |
| Color strategy | monochrome + 1 accent ↔ bold full-color blocks ↔ dark & luminous ↔ warm natural |
| Layout system | strict grid ↔ asymmetric/editorial ↔ bento ↔ full-bleed storytelling |
| Imagery | product cutouts ↔ photography ↔ illustration ↔ type-as-image ↔ 3D |
| Motion | calm & precise ↔ playful & springy ↔ cinematic scroll ↔ almost none |

A useful default trio: **(A) safe-premium** that the client will surely like, **(B) bold** that pushes the category, **(C) unexpected** that borrows from another industry.

## 2. Direction card (`directions/<x>/direction.md`)
```md
# B — "<evocative name>"
Mood: 3 words
Outcome moment: what the visitor sees/tries that shows their own result (section 0)
Idea: one sentence (what the visitor should feel and why that fits the brand)
Borrowed from: references + what exactly we take from each
Axes: type=…, color=…, layout=…, imagery=…, motion=…
Type: display <font> / text <font>, scale ratio, case & tracking
Color: roles with hex + contrast ratios
Layout moves: 3-5 concrete moves (e.g. "headline overlaps product image by 20%")
Signature moment: what happens, where, and the technique
Imagery brief: what photos/renders are needed from the client or to produce
Best for: one line — why pick this one
Risks: one line — what could go wrong
```
Plus `tokens.css`.

## 3. Signature moments (pick one per site)
Modern techniques, all with a reduced-motion fallback:

- **Scroll-driven reveal / progress** with pure CSS (no JS):
  ```css
  @supports (animation-timeline: view()) {
    .reveal { animation: rise linear both; animation-timeline: view(); animation-range: entry 0% cover 30%; }
    @keyframes rise { from { opacity: 0; transform: translateY(40px) scale(.98); } }
  }
  ```
- **Sticky storytelling**: a sticky product visual whose state changes as text steps scroll past (IntersectionObserver or `view-timeline`).
- **Kinetic / oversized type**: headline that scales or shifts weight on scroll (variable font `font-variation-settings`), or text masked over video/image (`background-clip: text`).
- **Page transitions**: View Transitions (Astro `ClientRouter`), shared element morph from card to detail page (`view-transition-name`).
- **3D product**: `<model-viewer>` for a GLB with auto-rotate and AR, or Three.js / Spline for a custom scene. Only when the product benefits from rotation.
- **Exploded view**: product layers separate on scroll, great for technical products (insoles, gadgets).
- **Cursor spotlight / magnetic buttons** (pointer devices only).
- **Bento grid with live tiles**: each tile has a micro-animation of the feature it describes.
- **Texture**: SVG noise grain overlay (`feTurbulence`) for warmth in flat designs.
- **Marquee of proof**: infinite scrolling real logos/quotes (pause on hover, `prefers-reduced-motion` static).
- **Fly-to-cart / mini-cart morph** for stores (see micro-interactions skill).

Implementations: scroll/GSAP patterns in the `motion-choreography` skill; 3D and shader backgrounds in `webgl-moments`.

Rules: one signature moment, placed where it supports the story (usually hero or mechanism section). Everything else stays quiet so it stands out. It must work on mobile or have a designed mobile alternative.

## 4. Anti-generic check (reject a direction if 2+ are true, or if the first one is true)
- There is no outcome moment: nothing shows the visitor their own result.
- It could belong to any company in any industry.
- The hero is centered text + button over a gradient.
- Sections are all the same width, same padding, same fade-up.
- Type has no contrast (one family, weights 400/600 only).
- The palette is the Tailwind default blue/indigo/slate.
- Nothing in it is specific to this client's product or story.

## 5. Proving a direction
Build a real hero + one section with the real copy and the signature moment working, then screenshot desktop and mobile. A direction that exists only as a description is not a direction.
