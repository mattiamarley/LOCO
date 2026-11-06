# LOCO application workspace

This is the main web workspace for LOCO. It contains the **Next.js marketing website**, UI components, an interactive **local 2D/3D prototype**, and a **Node/SQLite backend** with proposed PostgreSQL contracts.

For product context and non-negotiable learning behavior, begin at [`../AGENTS.md`](../AGENTS.md), [`../docs/PRODUCT.md`](../docs/PRODUCT.md) and [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

## Runtime status

- Next.js routes: Home, About, Piani, FAQ, Demo, and `/app` (placeholder).
- Local prototype: interactive 2D/3D reference (`laboratory.html` for 2D/lessons/cards and `workspace.html` for 3D room/castle/SQLite API); not the final integrated application.
- Local backend: `server/dev.mjs` with legacy `/api/*`, newer `/v1/*`, SQLite store and tests.
- PostgreSQL SQL under `server/db/` is a **proposed schema**, not an applied live instance.
- Primary marketing deployment: Vercel, Root Directory `app`.

## Setup

Prerequisite: Node >=22.13.0 for frontend. Use a Node version compatible with `node:sqlite` and native TypeScript for backend (historically verified on Node 25.2.1).

```bash
# Run from this folder
npm ci
npm run dev
```

Typical frontend development: `http://localhost:3000` (actual port is logged by Next.js).

### Separate local backend

```bash
# From this folder
npm run dev:local
# http://127.0.0.1:8781
```

The server currently serves static prototype files and local API routes. Starting Next.js **does not** automatically integrate the backend with `/app`.

### Standalone prototype

```bash
# From repository root
python3 -m http.server 8780 --bind 127.0.0.1 --directory app/prototype
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` / `npm run dev:next` | Prepare marketing fonts and start Next.js |
| `npm run build:vercel` / `npm run build` | Prepare fonts and build Next.js |
| `npm start` | Start Next.js production server (`next start`) |
| `npm run check:marketing` | Check expected marketing paths, `assets/fonts/` sources and Vercel scripts |
| `npm run test:local` | Node tests for server (`server/tests/*.test.mjs`) and prototype (`prototype/tests/*.test.mjs`) |
| `npm run lint` | ESLint project check |
| `npm run dev:local` | Start local Node/SQLite backend (`http://127.0.0.1:8781`) |

## Vercel deploy

- Root Directory: `app`.
- Framework preset: Next.js.
- Build: `npm run build:vercel` (recorded in `vercel.json`).
- Do not presume local SQLite persistence will work on Vercel without a deliberate hosted backend migration.
- Provide secret keys only via secured environment variables; do not commit `.env` files.

## Brand fonts

`npm run build:vercel` and `npm run dev` call `scripts/prepare-marketing-assets.mjs`, which copies the canonical tracked brand fonts (`assets/fonts/baloo-variable.ttf` and `assets/fonts/inter-tight-variable.ttf`) into gitignored `public/marketing/fonts/`. `scripts/check-marketing.mjs` verifies the canonical font files in `assets/fonts/`, marketing routes/assets, and the presence of `server/` and `prototype/`. Retain the OFL license files (`Baloo2-OFL.txt`, `InterTight-OFL.txt`) in `assets/fonts/`.

## Existing backend contracts

See `server/README.md`, `server/api/openapi.yaml`, `server/docs/`, and `server/tests/` for v2 details. Preserve identity/ownership, data revisions, confirmation gating, blind recall, scheduler versions, privacy, adaptive metrics and server-authoritative Arena scoring.

## Project documentation

- [`../docs/PRODUCT.md`](../docs/PRODUCT.md)
- [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`../docs/LEARNING.md`](../docs/LEARNING.md)
- [`../docs/ASSETS.md`](../docs/ASSETS.md)
- [`../docs/DECISIONS.md`](../docs/DECISIONS.md)
- [`../docs/ROADMAP.md`](../docs/ROADMAP.md)

`docs/DESIGN.md` is intentionally deferred; the owner will provide selected Figma assets later.
