<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SgSL-Bridge Engineering & Verification Invariants

## 1. Computer Vision & Landmark Tracking (`WebcamTracker.tsx`)
- **Multi-Point Tracking Invariant:** Never measure motion by the wrist joint (`Landmark 0`) alone. In-place wrist rotations (e.g. SgSL `EATa` spoon rotation) keep the wrist anchored while fingertips sweep an arc. Always track multi-point trajectory using both wrist (`Landmark 0`) and index fingertip (`Landmark 8`), computing motion as `Math.max(wristMovement, tipMovement)`.
- **Dialect Parity (SgSL vs. ASL):** When UI offers dialect toggles (`viewMode`), the verification engine MUST receive the active mode (`mode`) and branch its acceptance rules accordingly. Never evaluate only one dialect's rules when the user is viewing another.
- **Dialect Rules:**
  - `COFFEE`: SgSL strictly requires closed fists kopi grinder (rejects open C-hand). ASL strictly requires single-handed open C-hand cup drinking gesture (rejects closed fist/grinder with explicit guidance).
  - `EAT`: SgSL requires A-hand spoon rotation near mouth (`tipPath` rotational sensitivity). ASL requires Flat-O lip tap.
  - `PLEASE`: Shared chest circle; preserve polite deference in SgSL.
- **Grace-Zone Accumulator:** Never apply harsh frame penalties (`-5/frame`) during motion turnaround points. When `score >= 65%`, maintain progress (`+0.6`). Only decay when completely off-target (`score < 40%`), decaying gently (`-2.5/frame`) so natural webcam noise does not reset user progress.

## 2. Media & Multi-Sign Phrases (`scenarios.ts`, `ExpressiveStep.tsx`)
- **Multi-Sign Sequences:** When a phrase contains multiple glosses (e.g. `PLEASE AGAIN SLOW?`), wire all component signs into `signParts` with dedicated GIFs (`please.gif`, `again.gif`, `slow.gif`) and sequence navigation buttons. Never render only the first sign.
- **Dialect Asset Verification:** When providing SgSL and ASL visual comparisons, verify file checksums and visual distinction (`eat-sgsl.gif` vs. `eat-asl.gif`). Never map both dialect tabs to the same binary asset unless the manual sign is linguistically identical.
