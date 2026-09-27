---
description: Build a complete website from a client spec, studio-style (brief → strategy → 3 art directions → build → QA loop → preview)
argument-hint: <path to spec file or folder | projects/<slug> to resume>
---

You are the orchestrator of the site factory. Follow the "Site factory" section of CLAUDE.md exactly.

Input: $ARGUMENTS

## 0. Set up or resume
- If the argument is `projects/<slug>` with a `state.json`, read it and resume from `stage`.
- Otherwise create `projects/<slug>/` (slug from the client/business name, kebab-case), copy the spec material into `spec/` untouched, and write `state.json` with `"stage": "intake"`.
- Create a task list with the 8 pipeline stages and keep it updated.

## 1. Intake
Use the **spec-intake** skill to write `brief.json` and `questions.md`.
**Checkpoint:** show the user a 5-line summary of the brief and the blocking questions. Stop and wait. If they say "continue with assumptions", record each assumption in `brief.json.assumptions`.

## 2. Strategy
Delegate to the **site-strategist** subagent: "Write strategy.md for projects/<slug>". Review the result: every page has a goal, every section has a job, every objection from the brief is answered somewhere.

## 3. Art direction
Delegate to the **site-art-director** subagent: "Create 3 directions for projects/<slug>".
It returns `directions/index.html` (comparison board) and screenshots.
**Checkpoint:** show the user the three direction cards (name, mood, signature moment) and the board screenshots. Stop and wait for a choice (or a mix: "A's type with C's colors"). Write the chosen one to `design/direction.md` and `design/tokens.css`.

## 4 + 5. Design system and content (in parallel)
- Delegate to **site-builder**: "Scaffold the site and base components for projects/<slug> from design/".
- At the same time delegate to **site-copywriter**: "Write content for projects/<slug> from brief.json and strategy.md".

## 6. Build
Delegate to **site-builder**: "Build all pages for projects/<slug> from strategy.md, content/ and design/". It must finish with `npm run build` passing.

## 7. QA loop
Repeat up to 4 rounds (`qaRound` in state.json):
1. Delegate to **site-critic**: "Review round N for projects/<slug>".
2. If all gates in CLAUDE.md pass → stop the loop.
3. Otherwise delegate to **site-builder**: "Apply qa/round-N/critique.md fixes, highest priority first".
If round 4 still fails, stop and report which gates fail and why.

## 8. Deliver
- Deploy a preview (`npx vercel deploy` or `npx netlify deploy`, whichever the repo is set up for; if neither is configured, give the user the one-line setup and skip).
- Write `REPORT.md`: what was built, the chosen direction, final scores, open `[TODO]` placeholders, and the client questions still open.
**Checkpoint:** never deploy to production without explicit approval.

Update `state.json` after every stage.
