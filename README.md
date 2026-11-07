# LOCO

**LOCO is a spatial learning and memory platform.** It helps people transform study material into verified knowledge units, associate them with memorable places and personalized cues, practise retrieval without seeing the answer, and review at increasing intervals. Spatial environments, mnemonic techniques, and optional AI assistance support learning; generating an image is not itself evidence of learning.

> **Development status — snapshot of `main` at `9861c821` (6 November 2026).** This repository has a Next.js marketing website, a separate functional browser prototype, and a Node/SQLite local backend with legacy `/api/*` and newer `/v1/*` endpoints and automated tests. The public Next.js `/app` page is currently a placeholder. Neither the production-ready integrated web app nor hosted backend, accounts, generative features, payments, Maps integration, personal 3D scanning, or VR should be represented as live capabilities. Recheck the repository after any subsequent changes.

## What LOCO is building

1. **Prepare knowledge:** add text, questions and answers, or—once supported—import sources; verify extracted facts before studying.
2. **Create a memory palace:** select a real or virtual environment and establish stable, ordered loci.
3. **Encode in context:** associate each knowledge item with a locus and a vivid, personally meaningful cue. Creation/editing happens **inside the opened environment**; voice is optional.
4. **Study and retrieve:** attempt recall before revealing answers; record the result and assistance used.
5. **Revisit:** schedule item-level spaced repetition and inspect meaningful, sample-aware progress.
6. **Extend:** lessons, skill practice, adaptive recommendations, friends and challenges, as these become integrated and verified.

The same user-owned data should eventually work across desktop and mobile. Immersive/VR interactions are a design ambition, not a shipped feature.

## Repository map

| Path | Purpose |
| --- | --- |
| `app/app/` | Next.js App Router: public marketing pages and the interactive `/app` WebApp (`Home`, `Recappete`, `Mappete`, `Corsi`, `Profilo`, `Login`, in-scene 3D/Street-View editor, Blind Recall FSRS-7, and 18 Memory Metrics) |
| `app/components/`, `app/lib/`, `app/hooks/` | UI components (including `app/components/webapp/`), hooks, and shared frontend modules |
| `app/assets/fonts/` | Canonical tracked source for licensed brand fonts (`baloo-variable.ttf`, `inter-tight-variable.ttf`) and OFL licenses |
| `app/public/marketing/` | Current production marketing illustrations and imagery; **do not remove** |
| `app/public/assets/figma-curated/` | Owner-curated WebP/SVG assets (`972 KB` total) powering the `/app` WebApp |
| `app/prototype/` | Interactive local 2D/3D spatial prototype (`laboratory.html`, `workspace.html`, `castle.mjs`, `room3d.mjs`, `model.mjs`) |
| `app/server/` | Local Node/SQLite server, `/api` compatibility layer, `/v1` API, model contracts, tests and proposed PostgreSQL schema |
| `docs/` | Product, architecture, learning, assets, decisions and roadmap; intentionally no `DESIGN.md` yet |
| `AGENTS.md` | Primary operating instructions for coding agents |
| `CLAUDE.md` | Thin pointer to common agent instructions |

## Requirements and local setup

- Git and Node.js **>=22.13.0** for the Next.js website; npm as the package manager.
- For the local server and its tests, use a Node release with usable `node:sqlite` and native TypeScript stripping; the code was documented as verified on **Node 25.2.1**. This is not a general promise of compatibility with every 22.x runtime.
- No third-party API keys are needed for the static prototype or its existing local flows.

```bash
# From the LOCO repository root
cd app
npm ci
npm run dev             # Next.js website, generally http://localhost:3000
```

Run in separate terminals when needed:

```bash
# From repository root — legacy static prototype
python3 -m http.server 8780 --bind 127.0.0.1 --directory app/prototype

# From repository root — local Node/SQLite backend + prototype entry
node app/server/dev.mjs   # generally http://127.0.0.1:8781
```

The local backend is **not** automatically the backend of the production Next.js deployment.

### Quality checks

```bash
cd app
npm run check:marketing
npm run test:local
npm run lint
npm run build:vercel
```

`npm start` runs `next start` for a built Next.js production server.

## Deployment

The existing Vercel project expects **Root Directory `app`**, framework **Next.js**, and the current `app/vercel.json` build command `npm run build:vercel`. During `dev` and `build`, `app/scripts/prepare-marketing-assets.mjs` copies the two original brand fonts from `app/assets/fonts/` into `app/public/marketing/fonts/`. The domain/URL can change; do not treat a deployed marketing site as proof of a deployed private application.

Store secrets only in the deployment environment, never in tracked source, examples containing real credentials, or exported design documents.

## Working with AI coding agents

Start with [AGENTS.md](AGENTS.md). Product outcomes: [docs/PRODUCT.md](docs/PRODUCT.md); actual system boundaries: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); learning rules: [docs/LEARNING.md](docs/LEARNING.md); asset handling: [docs/ASSETS.md](docs/ASSETS.md); established decisions: [docs/DECISIONS.md](docs/DECISIONS.md); next steps: [docs/ROADMAP.md](docs/ROADMAP.md).

**Design source:** [LOCO — loco nuovo in Figma](https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887). The owner's definitive *Portale / Area riservata* is the **bottom-right group**, not all exported frames. The owner will supply a hand-curated set of visual assets separately.

## Intellectual property and safety

The repository does not, by its presence alone, grant any new license to LOCO branding or third-party creative work. Retain existing font license texts and check third-party content rights. Avoid tracking personally identifying data, source uploads, user-captured media, local databases, credentials, or unnecessary historical design exports. Do not make unverified promises about memory performance.
