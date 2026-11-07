# LOCO — retained product and engineering decisions

**Why this file exists:** the repository cleanup will remove historical extraction scripts, screenshots and raw research. This document preserves decisions important enough that new agents should not have to rediscover them from old assets.

## Confirmed product decisions

| ID | Decision | Consequence |
| --- | --- | --- |
| D01 | LOCO's outcome is memory learning, not image generation | Preserve verified knowledge, blind recall and item-level review as first-class functions |
| D02 | Desktop and mobile access the same owned study entities | Do not build isolated, incompatible content/editing models |
| D03 | A learner may begin with material **or** with a spatial environment | Support both paths to the same project/target/palace model |
| D04 | The scene is opened **before** selecting a locus; the learner adds and edits loci from **inside** it | Contextual controls and in-scene text/voice entry; no mandatory external form |
| D05 | Locus selection uses pointer/touch/gaze plus an explicit Add locus confirmation | Speech is an optional alternative, not a prerequisite |
| D06 | Correct knowledge, locus and personal imaginative association are separate | AI suggestions and images must not alter factual source answers |
| D07 | The Figma source of truth is `loco-nuovo`; definitive portal in **bottom-right group** of `Portale / Area riservata` | Other exported groups are experiments, not a blanket approved screen set |
| D08 | Loading states were identified in the upper-left of that Figma page | Use only when verified against owner-curated design |
| D09 | Owner selects future reusable Figma visuals manually | Keep a reserved curated folder; do not run massive exports or scrape Figma by default |
| D10 | Blind recall means answer not shown until a valid attempt | Never credit reveal/hinted trials as full unaided success |
| D11 | Unsupported AI/media/maps must not block manual learning | Keep hand-authored fallback flows and persistent drafts |
| D12 | Site marketing and authenticated learning platform are distinct surfaces | Do not label the Next.js `/app` placeholder as complete |
| D13 | The marketing site's actual visual identity is authoritative for LOCO branding | White-led canvas (`#FFFFFF`), black text (`#181818`), purple actions (`#613BE0`), lavender secondary surfaces (`#D2C4F5` / `#D0C4F6`), yellow accents (`#FFD014`); no `#2513A4`/`#2E1BC4` dark-blue/purple screens |
| D14 | The original left sidebar and five primary destinations must be retained | Keep the ~77px lavender sidebar (`Home`, `Recappete`, protruding `Crea/Mappete`, `Corsi`, `Profilo`) and bottom notification bell |
| D15 | The original "I nostri corsi" screen is the Academy catalog entry point | Preserve the clean white-canvas layout, `I nostri corsi` heading, and 3-column illustrated course card structure |
| D16 | Course navigation expands horizontally beyond the original three courses | All 12 courses are browsable via a horizontal scroll-snap carousel (3 cards on desktop, 1 on mobile) |
| D17 | The Duolingo-like vertical learning path belongs inside an individual course | Selecting a course opens its dedicated vertical node sequence rather than dumping all 56 lessons on one page |
| D18 | Lessons use a focused interactive player | Single-activity view with top progress bar, centered question/exercise, and bottom primary CTA |
| D19 | Gamification and analytics must not overwhelm the learning journey | Keep XP, levels, streaks, and badges functional in the engine, but avoid dashboard clutter on `I nostri corsi`; detailed stats live in `Profilo` |
| D20 | New screens must reuse original LOCO visual language | Use `Baloo 2`, `Inter Tight`, and approved flat 2D LOCO artwork (`docs/BRAND-UX-GUIDELINES.md`) |
| D21 | Figma is unavailable to the coding agent; provided specifications and approved assets are authoritative | Follow `docs/BRAND-UX-GUIDELINES.md` and existing curated/marketing assets without blocking on Figma access |

## Current engineering realities to preserve

- `app/` is a Next.js marketing website deployed through Vercel, Root Directory `app`.
- Local backend `app/server/` uses Node/SQLite with legacy `/api/*` and newer `/v1/*` and includes meaningful tests.
- `app/server/db/001..007*.sql` is a proposed PostgreSQL 15+ schema, not proof of a deployed database.
- Training and review metrics must be versioned and evidence-aware; SRS supports `simple-v1` and `fsrs-7` in the inspected backend.
- Privacy, ownership, immutable attempts/revisions and deterministic ranked challenge scoring must survive refactoring.
- `app/server/dev.mjs` serves the interactive prototype from `app/prototype/` and canonical fonts from `app/assets/fonts/`.
- The website build reads the two original brand fonts from `app/assets/fonts/` (`prepare-marketing-assets.mjs` and `check-marketing.mjs`).
- User-selected future assets will arrive later. Preserve `app/public/marketing/` as long as the public pages use it.

## Explicitly *not* established

- Production authentication provider, database host or object-storage provider.
- Billing/subscription terms, feature quotas, commercial plan entitlements or final unit costs.
- Live model provider, API key setup, generative-image service or AI inference in production.
- Street View/VR/scan implementation, license for extracting panoramas or realistic 3D capture cost.
- A complete, validated design system document (deliberately deferred).
- Scientifically validated LOCO-specific learning improvements or claims of universal memory enhancement.
- Production parity of every OpenAPI `/v1` endpoint without integration tests and deployment checks.

## Source of decisions

The baseline repo's original `research/FUNCTIONAL-SPEC.md`, `research/MEMORY-FOUNDATIONS.md`, `research/figma/FINAL-DESIGN-AUDIT.md`, `research/media/MEDIA-STUDY.md`, and owner confirmations have been distilled here and in `PRODUCT.md`/`LEARNING.md`. This summary does not reproduce the raw media or all the historical experiment details. Keep an external archive of removed original source materials if provenance is needed later.
