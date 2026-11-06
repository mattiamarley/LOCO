# LOCO — architecture and integration boundaries

**Baseline:** GitHub `mattiamarley/LOCO`, `main` at `9861c821` (2026-11-06). This is an architectural map from inspected source/docs, not an independent production penetration test or proof every API endpoint is fully implemented. Revalidate against current code before changing infrastructure.

## 1. Architecture in one view

```text
                    Public website (Next.js 16 / React 19)
                           app/app + components
                                  |
                     marketing pages + /app placeholder
                                  |
                [integration to be built and deployed]
                                  v
                LOCO authenticated application/API layer
                                  |
          +-----------------------+-------------------------+
          |                                                 |
  Existing local Node/SQLite                          Future hosted services
  app/server/dev.mjs + store.mjs                      deploy/auth/DB/storage
  /api/* and /v1/*                                    provider undecided
          |
  Separate local prototype
  app/prototype/* (HTML, JS, 3D, authored lessons)
```

Do not present the existing Next.js deployment as a hosted instance of the Node/SQLite service. The two local surfaces have separate startup commands and deployment boundaries.

## 2. Repository map

| Location | Current role | Safeguard during cleanup |
| --- | --- | --- |
| `app/app/` | Next.js App Router: `/`, `/about`, `/piani`, `/faq`, `/demo`, `/app` | `/app` currently placeholder; do not call it implemented private app |
| `app/components/marketing/` | Marketing shell and interactive elements | Preserve imports/assets |
| `app/components/ui/` | UI primitives from the starter | Tree-shake/audit before pruning |
| `app/lib/` | Shared frontend utilities | Inspect imports |
| `app/assets/fonts/` | Canonical tracked brand fonts (`baloo-variable.ttf`, `inter-tight-variable.ttf`) and OFL licenses | Used by `prepare-marketing-assets.mjs` and `dev.mjs` |
| `app/public/marketing/` | Actual public-site images and logos | Production-critical |
| `app/public/assets/figma-curated/` | Planned owner-curated app asset destination | Owner will populate it |
| `app/prototype/` | Interactive local 2D/3D prototype (`index.html`, `laboratory.html`, `workspace.html`, `castle.mjs`, `room3d.mjs`, `model.mjs`) | Server serves files from this directory; bulk Figma dumps were retired in Phase 0 |
| `app/server/dev.mjs` | Node HTTP application and endpoint routing | Serves prototype, `/assets/fonts/*`, and dual API versions (`/api/*` + `/v1/*`) |
| `app/server/store.mjs` | SQLite persistence/business logic | Large, significant implementation; not a disposable generated file |
| `app/server/schema.sql` | SQLite schema | Not interchangeable with PostgreSQL proposal |
| `app/server/db/001..007*.sql` | PostgreSQL 15+ schema/migration **proposal** incl. optional RLS | Treat as architecture contract until deployed |
| `app/server/src/*.ts` | Typed models, SRS, scoring, metrics, adaptation | Preserve algorithms and tests |
| `app/server/api/openapi.yaml` | `/v1` OpenAPI 3.1 contract | Verify against route handlers when changing APIs |
| `app/server/tests/*.test.mjs` | Server API and computation tests | Core release gates |
| `app/prototype/tests/*.test.mjs` | Local prototype tests | Keep while corresponding prototype behavior remains |

## 3. Frontend and deployment

Current inspected `app/package.json` uses Next.js **16.3.4**, React **19.2.6**, TypeScript **5.9.3**, Tailwind CSS **4.2.1** and other UI libraries. These are baseline versions; inspect package/lockfile for later changes.

- `cd app && npm ci`: install pinned dependencies.
- `npm run dev`: copies brand fonts then starts Next.js dev.
- `npm run build:vercel`: copies fonts then runs Next.js build.
- `npm run check:marketing`: checks specified marketing routes/assets/build settings, `app/assets/fonts/`, `app/server/`, and `app/prototype/`.
- `npm run test:local`: exercises `server/tests/*.test.mjs` and `prototype/tests/*.test.mjs`.
- `npm run lint`: ESLint with specified build-directory exclusions.
- `npm run dev:local`: local Node/SQLite backend.

**Vercel:** Root Directory `app`, framework `nextjs`, `app/vercel.json` build command `npm run build:vercel`. Environment variables are not specified here because no production secret/value should be invented or hardcoded. Validate any future server runtime support separately.

**Starter cleanup (completed in Phase 0):** Unused `vinext` / Cloudflare Worker / D1 starter scaffolding (`app/db`, `app/drizzle`, `app/worker`, `app/examples`, `app/scripts/connector-preview`, `app/scripts/vite`) was audited and removed after confirming zero active imports, and `npm start` was aligned to `next start`.

**Font pipeline (migrated in Phase 0):** `app/scripts/prepare-marketing-assets.mjs` copies `baloo-variable.ttf` and `inter-tight-variable.ttf` from `app/assets/fonts/` (alongside OFL license files `Baloo2-OFL.txt` and `InterTight-OFL.txt`) into gitignored `app/public/marketing/fonts/` during `dev` and `build`.

## 4. Local backend and API generations

The HTTP server in `app/server/dev.mjs` is started via `node app/server/dev.mjs` from repo root; documented URL is `http://127.0.0.1:8781`. The source serves the prototype directory and routes requests to `Store` methods in `app/server/store.mjs`.

- **`/api/*` (legacy):** registration/login, session, profile, routes, loci, review state and backups. Keep compatibility while the prototype still uses it.
- **`/v1/*` (Blueprint v2):** profile/preferences, user discovery, friends/blocks, projects, sources/knowledge, palaces/loci/placements, reviews and study, training/metrics/adaptation, challenges, invites and leaderboard concepts. `/v1/health` is unauthenticated; other operations require a server session.

The code contains many handler branches and store methods; the OpenAPI description is a **design contract**, and endpoint-by-endpoint parity must be verified by an API coverage audit. Avoid declaring all documented `/v1` calls production-ready.

### Security and contract invariants

- The local cookie is named `loco_session`; server-side user identity must determine ownership, not request body fields.
- Mutations to `/v1/*` require `X-Loco-Request: 1` and an Origin check when supplied. Review cookie/session flags, HTTPS deployment, CSRF and CORS before moving to production.
- Private records belonging to others should return indistinguishable `404 NOT_FOUND` rather than reveal existence.
- Standard error payload: `{ "error": { "code": "...", "message": "...", "requestId": "..." } }`.
- Review attempts, ranked challenge attempts and exports use idempotency keys where required.
- An AI-proposed knowledge item requires explicit confirmation; keep immutable knowledge revisions and conflict handling.
- Fetching due reviews must never include the answer/answer-revealing cue before the attempt.
- Challenge score is computed on the server from a versioned, authenticated run, not trusted from the client.

These safeguards have code and tests in the current local backend; their suitability for a hosted multi-tenant product still needs dedicated testing.

## 5. Domain data and persistence

Keep the following entities conceptually separate even if storage representations change:

```text
User / Session / Preferences / Privacy / Friends
  └─ Project
      ├─ Source → Document chunks → Evidence
      ├─ Knowledge items → immutable revisions → Learning targets
      │      └─ Mnemonic associations → revisions → media variants
      └─ Palace → scene versions → ordered loci → anchors → placements

Learning target → Review schedule / Review attempt history
Training session → Trials → Directional item statistics
Memory profile ← versioned metrics and confidence
Adaptive intervention ← evidence → post-intervention evaluation
Challenge → immutable versions → runs → server scores → leaderboard
```

**Current live local store:** SQLite schema in `app/server/schema.sql` and tables managed by `Store`. Data on the local machine is not a production hosted database, nor synchronized to Next.js by default.

**Proposed deployment schema:** PostgreSQL 15+ SQL files `app/server/db/001_schema.sql` through `007_performance_adaptivity.sql`. The backend README reports **54 proposed tables** (37 original and 17 v2 additions) with optional RLS. Their presence in the repository is **not** evidence migrations were applied to a running Postgres instance. Migration strategy, provider, RLS and shared transactions still need production integration decisions.

**Media:** proposed private object storage for uploaded PDF, images, videos and GLB, referenced by `media_assets` / `media_variants`, SHA-256 and private `storage_key`. Assets generated for the public marketing website are a different, public asset class. Do not move user source media under `public/`.

**Spatial consistency:** `palace_scene_versions` versions the spatial coordinate frame. `locus_anchors` and `locus_placements` are bound to the scene version; reject incompatible updates (e.g. `409 CONFLICT`) rather than silently transforming coordinates. The editor must preserve locus IDs and associations when views or traversal order change.

## 6. Review and learning computation

- Scheduling modules: `app/server/src/srs.ts` with `simple-v1` and `fsrs-7` algorithms/versions; verify exact settings and parameters in code/tests, not in a guessed formula.
- Recall validation: viewing the answer before trying forces the effective grade to `again` (forgotten); a hinted attempt has a capped maximum grade (documented as `hard` / partial). Log the raw and effective outcome distinctly.
- Metrics: `app/server/src/memoryMetrics.ts` computes 18 named metric families (see `docs/LEARNING.md` and `app/server/docs/PERFORMANCE_V2.md`). Reports include validity counts, window, metric/formula version and confidence; insufficient samples yield null estimate where appropriate.
- Adaptation: `app/server/src/adaptiveRecommendations.ts` emits reason/evidence-driven interventions and checks comparability for post-intervention outcomes.
- Arena: `app/server/src/challengeScoring.ts` handles deterministic scores, nonces/deadlines, ties and versioned ranked attempts.

## 7. Build migration/deletion dependency map

Before deleting any legacy directory, search imports/static paths **and** dynamic filename construction, e.g.:

```bash
rg -n 'prototype|research/|references/|figma/|vendor/three|marketing/fonts|scripts/' app README.md docs || true
find app -maxdepth 3 -type f | sort
```

Current active dependencies after Phase 0 cleanup:

1. Local server (`app/server/dev.mjs`) uses `../prototype/` as its static root and serves `/assets/fonts/*` from `../assets/fonts/`.
2. Marketing font preparation script (`app/scripts/prepare-marketing-assets.mjs`) reads `app/assets/fonts/`.
3. Marketing check script (`app/scripts/check-marketing.mjs`) verifies marketing routes/assets, `app/assets/fonts/`, `app/server/`, and `app/prototype/`.
4. Interactive prototype (`app/prototype/workspace.mjs`, `app.mjs`, `castle.mjs`, `room3d.mjs`) references only the 8 curated local UI/illustration files in `app/prototype/assets/` and `app/prototype/vendor/three/three.module.js`.
5. Prototype tests (`app/prototype/tests/*.test.mjs`) verify `model.mjs` and portable HTML/JS entrypoints.
6. Raw Figma dump files (`figma-views.mjs`, `figma-layout.css`, `app/prototype/assets/figma/*`) and root one-off scripts (`scripts/`) have been retired.

Deleting extracted research images that have no runtime imports is generally safe *after* preserving important product decisions. Deleting the entire prototype/asset folder without migrating these dependencies is unsafe.

## 8. Hosting architecture: decisions pending

Before public accounts or paid subscriptions, resolve explicitly:

- Authentication provider and deployable server runtime; session/cookie model.
- Database choice, migrations, backup/restore, encryption and RLS/ownership tests.
- API base URL and client data layer, transactions and retries.
- Private upload pipeline, validation, quotas, media processing and access URLs.
- External Maps licenses, geocoding usage accounting and offline fallback; no panorama scraping.
- Optional AI services, provider keys, queueing, cancellation, moderation, abuse controls, cost caps and observability.
- Whether to retain the Node local service as an adapter or migrate its contracts to Next.js APIs / another deployable backend.
- Privacy and age rules, export/deletion, error monitoring, security review and production incident workflow.

No irreversible framework/provider migration should be bundled into a repository cleanup merely to remove files.

## 9. Verification checklist

- **Static frontend:** `npm run check:marketing`, `npm run lint`, `npm run build:vercel` and smoke test of `/`, `/about`, `/piani`, `/faq`, `/demo`, `/app`.
- **Backend:** `npm run test:local`; direct test for `/v1/health`, ownership isolation, confirmation gating, blind recall, idempotency, scene version conflict, score tampering and privacy.
- **Integration:** actually create a project in a browser, save/reopen a scene, assign a locus in-scene, recall and review; do not call the feature integrated until this is possible.
- **Repo hygiene:** no broken imports/assets, no secrets or personal media, no untracked backup accidentally staged, and no history rewrite without approval.
