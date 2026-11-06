# LOCO — delivery status and development roadmap

**Reference snapshot:** `mattiamarley/LOCO`, `main` at `9861c821` (2026-11-06). This status is based on inspected source files and project documentation; the authors of this documentation did **not** run a complete local test/build or production acceptance test. Treat statuses as **repository evidence**, not as shipped-product certification. Reclassify after verification and update this file with real PR/commit references.

## 1. Status vocabulary

- **Implemented in source:** corresponding code and/or local tests are present; may still require verification, integration, deploy or security work.
- **Prototyped:** works or is represented in a separate prototype but not the target production experience.
- **Specified:** models, APIs or design decisions exist but runtime parity or integration is incomplete.
- **Not integrated:** backend or component exists separately but no end-to-end user journey through Next.js.
- **Planned:** requirement, not code or deploy claim.

## 2. Capability matrix

| Area | Baseline status | Evidence / major missing integration |
| --- | --- | --- |
| Public Home, About, Piani, FAQ, Demo | **Implemented in source** | Next.js routes in `app/app`; must smoke-test and verify marketing claims |
| Marketing branding and static assets | **Implemented in source** | `app/public/marketing`, brand fonts canonically tracked in `app/assets/fonts/` |
| Next.js authenticated workspace `/app` | **Not integrated** | `app/app/app/page.tsx` is placeholder |
| Basic local browser prototype | **Prototyped** | `app/prototype/` contains authoring, memory practice, lessons and 3D/portal surfaces |
| Local users and sessions | **Implemented in source** | Node/SQLite `app/server`; not hosted auth |
| Local `/api/*` routes | **Implemented in source** | Legacy app/route/test code; important compatibility layer |
| `/v1` profile, friends and privacy | **Implemented in source** | API handlers and v2 tests; production security still required |
| `/v1` projects, knowledge proposals/revisions | **Implemented in source / specified** | Code + API contract; need client, real document pipeline and hosted storage |
| `/v1` palaces, anchors and placements | **Implemented in source / specified** | Versioned spatial contracts; final in-scene UX incomplete |
| `/v1` due reviews and attempts | **Implemented in source** | `app/server`, `srs.ts`, tests; not connected to public `/app` |
| FSRS-7 + simple-v1 scheduler | **Implemented in source** | `app/server/src/srs.ts`; run tests and validate scheduling behavior |
| Learning metrics (18 families) | **Implemented in source** | `memoryMetrics.ts`, v2 tests; display and evidence UX pending |
| Adaptive recommendations | **Implemented in source** | `adaptiveRecommendations.ts`; real intervention evaluation pending |
| Arena/challenges/leaderboards | **Implemented in source** | `challengeScoring.ts`, `/v1` tests; UI and production fraud controls pending |
| PostgreSQL schema and optional RLS | **Specified** | `app/server/db/001..007*.sql`; no verified running hosted DB |
| Owner-curated Figma visuals | **Planned handoff** | Owner to provide; no final `DESIGN.md` in this phase |
| AI document extraction/generation | **Planned integration** | Preserve proposed/confirmed knowledge safety behavior; no production provider assumed |
| Google Maps/Street View and personal scans | **Planned** | Check licenses, privacy, quotas and technical feasibility |
| Voice authoring and immersive VR | **Planned** | UX intent exists; no shipped production flow |
| Payments/subscriptions | **Planned** | Marketing page exists; don't assume billing infrastructure |
| Cross-device synced authenticated data | **Not integrated** | Requires hosted auth, DB and frontend/API integration |

## 3. Phase 0 — stabilize and reduce repository size

**Goal:** keep the exact current app functions, remove obsolete research/export bulk, and supply agents with a compact, correct source of truth.

- [x] Audit actual latest worktree/branch/remote, history/LFS, dependency graph and binary sizes.
- [x] Keep recoverable backups of raw sources *outside* the repository.
- [x] Install/update `README.md`, `app/README.md`, `AGENTS.md`, `CLAUDE.md`, and `docs/*.md` from curated package, adapting to newer code.
- [x] Migrate brand font source/license from `app/prototype/assets` to `app/assets/fonts` and update copy/check/build paths.
- [x] Remove obsolete `references/`, `PROJECT START FOLDER/`, `base research/`, `research/`, `vercel-preview/`, and root extraction scripts **only** after capturing enduring decisions.
- [x] Remove unreferenced prototype Figma bulk dumps (`app/prototype/assets/figma/`, `figma-views.mjs`, `figma-layout.css`) and unnecessary Vinext/D1 starter tooling; keep live local server/interactive prototype dependencies.
- [x] Introduce reserved `app/public/assets/figma-curated/` without inventing visuals.
- [x] Run quality gates, document any blockers, commit on cleanup branch and push safely.
- [x] Report size saved in tracked checkout separately from Git history/LFS.

**Exit gate:** marketing build and local tests do not regress; all kept code/assets resolve; README and docs describe the actual repo; no history rewrite performed without explicit approval.

## 4. Phase 1 — integrate the first complete learning loop

**Goal:** connect the real web client to a deployable persistence layer with one full, accountable journey.

- [ ] Decide on hosted backend runtime and database after comparing migration costs, security and operational constraints.
- [ ] Implement production-grade auth/session, per-user ownership, secret management, rate limits, logging and migrations.
- [ ] Build client data layer with safe retries and schema validation; keep `/api` compatibility if still needed.
- [ ] Replace Next.js `/app` placeholder with authenticated dashboard, projects and drafts.
- [ ] Open a supported scene and create/edit stable loci **in scene** using pointer/touch/gaze with contextual controls.
- [ ] Attach knowledge targets and personal associations to loci; allow text fallback and save/resume.
- [ ] Implement study, blind recall, feedback, due queue and persistent item history in the integrated UI.
- [ ] Add mobile acceptance tests for full core flow; support keyboard/screen reader alternatives where spatial interaction is unsuitable.
- [ ] Add user data export, delete/account controls and backup/restore plan.

**Exit gate:** an authenticated user can create a draft, open a palace, add locus in-scene, save a fact/association, recall with answer hidden, review later, and reload from another authorized device without losing data or crossing user boundaries.

## 5. Phase 2 — teaching, accuracy and progress

- [ ] Implement lessons and guided exercises based on `docs/LEARNING.md` with pretest, feedback and later retention checks.
- [ ] Distinguish technique skill directions (especially numerical Major encoding/decoding).
- [ ] Use existing versioned review/scheduler rules as client behavior source.
- [ ] Introduce memory profile UI showing time window, sample count and uncertainty.
- [ ] Make adaptive suggestions actionable, transparent and measurable; report inconclusive outcomes honestly.
- [ ] Validate source factuality and item revision semantics.
- [ ] Pilot with measurable educational outcomes and participant feedback; avoid unsupported learning claims.

**Exit gate:** user progress reflects unaided, delayed, source-correct recall rather than activity or visuals.

## 6. Phase 3 — optional media, collaboration and monetization

- [ ] Integrate AI-assisted ingestion and personal mnemonic generation behind explicit approvals, usage meters, safety and user controls.
- [ ] Add asynchronous private media jobs and appropriate optimized 2D/3D placement; don't block manual learning if generation fails.
- [ ] Assess Maps/Street View API terms and costs; no scraping or unauthorized persistence of panorama content.
- [ ] Explore permitted user-owned video/photo scene reconstruction and, later, immersive device support; benchmark quality and unit economics.
- [ ] Integrate friends/Arena with immutable challenges, anti-abuse controls and privacy-respecting leaderboard settings.
- [ ] Introduce billing only after product quotas, consumer rights, prices, taxes, costs and consent flows are defined and tested.
- [ ] Operate against real performance, safety, cost and retention targets.

## 7. Near-term prioritized work for next engineering agent

1. **Safely clean/restructure** the repo (Phase 0), preserving backend and live site.
2. **Verify** current local tests and Vercel build, fix dangling paths and font coupling.
3. **Map** `/v1` contract endpoints to actual implementation, tests and intended frontend interactions.
4. **Choose** a production backend strategy, not via implicit refactor during cleanup.
5. **Build** the first integrated Next.js `/app` journey with in-scene locus authoring and truthful blind recall.

## 8. Reporting format for future PRs

For each milestone, report: capability, code paths, user-facing journey, schema/API changes, test evidence, accessibility/responsive checks, security/privacy checks, runtime/deployment evidence, and unresolved risks. Update the corresponding matrix row from **planned** to **implemented** only when justified by actual tests and working UX.
