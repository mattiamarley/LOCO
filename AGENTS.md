# LOCO — instructions for coding agents

These instructions apply to the repository root and descendants. Treat the checked-out code as current; this document describes a **reference snapshot** of `main` at commit `9861c821` on 2026-11-06 and may be superseded by later commits.

## Mission

Develop LOCO into a responsive, reliable learning app built around **verified knowledge → stable spatial loci → personal mnemonic associations → unaided retrieval → feedback → spaced repetition**. Keep the experience meaningful even without paid AI or mapping APIs. Do not optimize primarily for flashy visuals or generated image counts.

## Required context, in order

1. `docs/PRODUCT.md` — goals, domains, journeys, acceptance criteria.
2. `docs/ARCHITECTURE.md` — what actually runs, contracts, persistence, security and deployment.
3. `docs/ROADMAP.md` — status by maturity, and high-priority integration gaps.
4. `docs/DECISIONS.md` — approved UX and architecture boundaries.
5. `docs/ASSETS.md` when touching media; `docs/LEARNING.md` when touching teaching, recall, metrics, mnemonics or SRS.

There is intentionally **no `docs/DESIGN.md` yet**. Do not invent one or automatically infer an entire design system from historical exports. Figma is a reference, curated assets are supplied by the owner, and current functional design should not be reconstructed from obsolete sample frames.

## Source-of-truth hierarchy

- **Working code + tests:** what is implemented and actually verified.
- **`app/server/api/openapi.yaml` + server models:** intended API contract; verify implementation and tests before assuming parity.
- **Product/learning docs:** desired outcomes and non-negotiable learning behavior, not claims of implementation.
- **Final Figma reference and owner-curated assets:** UI intent; some historical frames are superseded.
- **README/roadmap:** integration status; update whenever it changes.

If these disagree, explain the discrepancy and fix the smallest relevant surface; never silently label a planned feature as shipped.

## Core UX invariants

- The environment is **opened first**. Users explore it and add a locus at a selected point **inside the environment**, using gaze/touch/pointer and a contextual confirmation. Voice is optional, not mandatory.
- The knowledge item and mnemonic association must be editable **in-scene** using text or voice. Do not replace this with a mandatory out-of-scene list/form editor.
- Users can begin with a study source **or** begin with an environment; both must lead to the same item/route model.
- Keep a stable locus identity, ordering and coordinate/scene version; reordering must not corrupt associations/history.
- Distinguish **source fact / correct answer**, **spatial anchor**, **personal imaginative cue**, and **generated media**.
- A generated/AI-suggested knowledge item requires explicit human confirmation before it becomes an active learning target.
- During blind recall, the answer and answer-revealing association remain hidden until a genuine attempt. Track assistance and answer exposure distinctly.
- Preserve item-level review events and versioned scheduler behavior; do not infer retention from screen views, streaks or total study time.
- A mobile user must eventually accomplish the core cycle without requiring a separate desktop-only step. VR is optional/future.
- Support autosave/drafts and recovery where implemented; do not discard data after failed AI/media operations.

## What currently exists (as inspected)

- `app/`: Next.js 16/React 19 marketing site with public routes and a **placeholder** `/app` route. Vercel root is `app`.
- `app/assets/fonts/`: canonical tracked brand fonts (`baloo-variable.ttf`, `inter-tight-variable.ttf`) and OFL license files (`Baloo2-OFL.txt`, `InterTight-OFL.txt`).
- `app/prototype/`: interactive HTML/JS 2D/3D reference prototype (`index.html`, `laboratory.html`, `workspace.html`, `castle.mjs`, `room3d.mjs`, `model.mjs`), served by the local backend. Bulk Figma static dumps (`figma-views.mjs`, `assets/figma/`) were retired in Phase 0.
- `app/server/`: local Node/SQLite implementation (`/api/*` legacy + `/v1/*` Blueprint v2), with tests, metrics/SRS/adaptive/challenge modules, SQL proposals and OpenAPI description.
- `app/public/marketing/`: artwork used by current public pages. Keep it.
- `app/scripts/prepare-marketing-assets.mjs`: copies brand fonts from `app/assets/fonts/` into `app/public/marketing/fonts/`.
- `app/scripts/check-marketing.mjs`: verifies marketing routes/assets, `app/assets/fonts/`, `app/server/`, and `app/prototype/`.

**Do not assume** `/app` authenticates users, `/v1` is running on Vercel, PostgreSQL migrations are applied, Maps/AI billing is configured, or personal 3D scanning/VR is delivered.

## Backend and privacy guardrails

- Scope user-owned data from the **server-verified session**, never request-provided `owner_id`. Unreadable private objects must not leak existence to another account.
- Preserve CSRF/Origin checks on writes, structured errors, explicit ownership, privacy/discoverability settings, block behavior and GDPR export contracts.
- Keep immutable revisions and idempotency where specified, especially review attempts and challenge runs.
- Keep `GET /v1/reviews/due` from exposing the answer. If `viewedAnswerBeforeAttempt` is true, a recall is not credited as unassisted; with hints, cap the effective grade as specified in server tests.
- Maintain deterministic, server-side scoring for ranked challenges and no double-ranked run per version.
- Metrics need sample sizes, windows, version and confidence; render insufficient evidence as insufficient, not pseudo-precision.
- Media sources may be private personal material: use access-controlled storage and never copy uploads to public asset folders.
- Never create or publish test fixtures containing real secrets or real identifiable user records.

## Implementation workflow

1. Inspect `git status`, relevant source, tests, imports and routes.
2. Explain the intended change briefly and choose the smallest safe implementation.
3. Modify code and related tests together, preserving API compatibility or explicitly documenting migration.
4. Run relevant test suites, type checks/lint and the production build if frontend/deployment is affected.
5. Check actual routes, image paths, fonts, responsive behavior and accessible controls when UI changes.
6. Update the affected docs/README and roadmap status only for work that really landed.
7. Report what changed, tests passed/failed, and known blockers; never claim verification without running it.

## Repo hygiene and cleanup

- Preserve `app/server/**`, server tests/specifications, marketing pages/assets, `app/assets/fonts/`, actual build config and package lock by default.
- Historical `research/`, `references/`, `base research/`, `PROJECT START FOLDER/`, root extraction scripts, `app/prototype/assets/figma/` bulk dumps, and unused Vinext/Cloudflare D1 starter files were removed in Phase 0 after external archival and distillation into `docs/`. Do not reintroduce bulk exports into Git.
- Owner-curated production assets belong under `app/public/assets/figma-curated/` or a later explicit path.
- Keep font/license files in `app/assets/fonts/` necessary to compile. Do not download substitute fonts without verified rights.
- Do not commit `node_modules`, `.next`, database files, build output, environment files, raw media or backups.
- **Never** rewrite Git history, remove hosted LFS objects, force-push, or discard local uncommitted work without explicit authorization.

## Validation commands

From `app/`:

```bash
npm ci
npm run check:marketing
npm run test:local
npm run lint
npm run build:vercel
```

Local backend was verified with Node 25.2.1; frontend engine specifies Node >=22.13.0. `npm start` runs `next start`.

## Completion standard

A task is done only when behavior has been implemented, dependency paths are valid, tests appropriate to the change have been run, production build is checked where affected, docs reflect reality, and unresolved limitations are stated.
