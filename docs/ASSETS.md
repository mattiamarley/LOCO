# LOCO — asset management and Figma handoff

**Intent:** a small, curated, app-ready set of visuals. The owner will select and provide the definitive Figma assets; there is **no `DESIGN.md` for this phase**. Do not run another bulk Figma export automatically.

## 1. Classification and destinations

| Asset class | Destination | Rule |
| --- | --- | --- |
| Marketing images currently used in deployed pages | `app/public/marketing/` | Preserve filenames/paths until code is updated; current `.webp` and logo assets are needed |
| Curated app Figma illustrations/icons | `app/public/assets/figma-curated/` | Populate **only** with owner-approved choices; prefer optimized SVG/WebP/PNG |
| Source font files / licenses | `app/assets/fonts/` | Canonical tracked source for build process and local prototype, including OFL license documents |
| Private user source files and generated mnemonic media | Future access-controlled object storage, **not** under `public/` | Signed access, ownership, deletion, quotas, hashes |
| Temporary generated media, PDF renders, raw Figma pages, OCR, thumbnails | External archive or ignored scratch folder | No routine commits; can be regenerated/archived |
| Third-party/experimental 3D or scripts | Existing prototype until usage audited | Don't delete library/vendor/scene without checking runtime imports |

## 2. Owner Figma selection workflow

The owner will curate app assets for the working design. The official reference is:

https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887

In **`Portale / Area riservata`**, the definitive web app is the **bottom-right group**; **loading screens are in the upper-left**. Other groups may be older experiments. The owner will select the needed exports and provide a folder.

**Until that handoff:** retain current production marketing visuals, do not swap a generic icon library for the character art, do not regenerate old exports, do not infer missing images, and keep the empty reserved directory with `.gitkeep`.

Once files arrive, the implementing agent should:

1. Inventory filenames, formats, dimensions, approximate size and duplicates.
2. Verify origin/rights, whether it is a full composition or a reusable isolated asset, and where it appears in the final Figma flow.
3. Normalize filenames (`kebab-case` semantic names, not raw node IDs if practical).
4. Optimize without changing intended framing, transparency, silhouette or palette.
5. Add metadata to an asset manifest **only if it is materially helpful** (e.g. label, use case, source Figma node, dimensions, license).
6. Map each asset to actual consuming components/routes.
7. Delete superseded copies only after successful visual check and build.

## 3. Suggested conventions

Use names expressing function, not export sequence:

```text
app/public/assets/figma-curated/
  illustration-create-palace.webp
  illustration-empty-reviews.webp
  icon-locus-selected.svg
  icon-locus-idle.svg
  mascot-goose-waving.webp
  ...
```

These filenames are **examples**, not files that currently exist or should be invented. Store final static public URLs as absolute-from-public paths (e.g. `/assets/figma-curated/icon-locus-idle.svg`). Prefer clear `alt` text for meaningful images and empty `alt` for decoration.

- **SVG** for icons/flat vector artwork when safe and reasonable; sanitize third-party SVG content.
- **WebP/AVIF** for raster illustrations and photography when export quality remains acceptable.
- **PNG** for raster images requiring lossless pixel detail/transparency.
- **GLB** only for actual interactive 3D assets with appropriate rights and performance budgets.
- Use lazy loading for below-the-fold raster media, responsive sizing and meaningful fallbacks.
- Avoid embedding large base64 images directly into source modules or JSON.
- No unnecessary duplicate identical blobs. Hardlinks are a local storage optimization, not an asset-handling strategy for deployment.

## 4. Font pipeline (`app/assets/fonts/`)

The canonical tracked brand fonts and licenses live in `app/assets/fonts/`:

- `app/assets/fonts/baloo-variable.ttf`
- `app/assets/fonts/inter-tight-variable.ttf`
- `app/assets/fonts/Baloo2-OFL.txt`
- `app/assets/fonts/InterTight-OFL.txt`

`app/scripts/prepare-marketing-assets.mjs` copies the two `.ttf` files into gitignored `app/public/marketing/fonts/` at `dev` and `build` time, and `app/scripts/check-marketing.mjs` validates their presence in `app/assets/fonts/`. In addition, `app/server/dev.mjs` serves `/assets/fonts/*` directly from `app/assets/fonts/` for the local prototype.

**Preserve `app/assets/fonts/`** when refactoring the frontend or retiring the legacy prototype. Do not share font binaries outside the project's legitimately licensed deployment context.

## 5. Content and security

The repo is publicly viewable at the baseline. Never commit user documents, geolocation trajectories tied to real people, screenshots containing personal details, access tokens, raw uploads or private generated assets. Preserve attribution/license requirements. Avoid automatically downloading/caching Google Street View imagery or reconstructing a private mesh from it without applicable rights.

## 6. Definition of done for asset cleanup

- The public website renders without missing assets or fonts.
- The local prototype (if retained) renders and its media paths still resolve.
- No code refers to a removed export or generated folder.
- The curated folder is intentionally empty or contains only owner-approved assets.
- Large raw PDF/image/video archives live **outside** Git and are recoverable.
- Test/build output and source fonts are correctly handled by `.gitignore` and deployment scripts.

## 7. Curated WebApp & LOCO Academy Assets (`app/public/assets/figma-curated/`)

In addition to the core WebApp Figma screens/icons (`brand-logo-yellow.svg`, `icon-nav-*.svg`, `illustration-home-desk.svg`, `illustration-plan-poco-loco.svg`, `avatar-*.webp`, `route-thumb-*.webp`, `map-politecnico-*.webp`, `marker-locus-cloud.svg`), `app/public/assets/figma-curated/` includes 27 semantic vector illustrations (`academy-*.svg`) curated from the owner's `BASE ASSET` handoff for the interactive LOCO Academy Learning Path and Multi-Step Lesson Player:

- **Scenes (`academy-scene-*.svg`):** `academy-scene-relax-night.svg`, `academy-scene-study-desk.svg`, `academy-scene-explorer.svg`, `academy-scene-runner.svg`, `academy-scene-library.svg`, `academy-scene-zen-room.svg`
- **Character Mascots (`academy-mascot-*.svg`):** `academy-mascot-lion.svg`, `academy-mascot-elephant.svg`, `academy-mascot-cat.svg`, `academy-mascot-goose.svg`, `academy-mascot-headphones.svg`, `academy-mascot-tablet.svg`, `academy-mascot-zen-book.svg`, `academy-mascot-runner.svg`, `academy-mascot-photographer.svg`, `academy-mascot-dog.svg`
- **Mascot Heads / Badges (`academy-head-*.svg`):** `academy-head-lion.svg`, `academy-head-elephant.svg`, `academy-head-cat.svg`, `academy-head-goose.svg`, `academy-head-headphones.svg`, `academy-head-dog.svg`
- **Room Objects / Interactive Loci (`academy-item-*.svg`):** `academy-item-lamp.svg`, `academy-item-clock.svg`, `academy-item-stool.svg`, `academy-item-fishbowl.svg`, `academy-item-bookshelf.svg`, `academy-item-lightbulb.svg`
