# LOCO — Brand & UX/UI Guidelines (`BRAND-UX-GUIDELINES.md`)

This document is the **authoritative visual and UX specification** for LOCO's web application (`/app`) and the **LOCO Academy**. Every coding agent and contributor must read and follow this document before modifying any UI component, layout, or styling.

---

## 1. Original Marketing Visual Identity

LOCO's visual identity originates from the deployed marketing website and owner-curated illustrations (`app/public/marketing/` and `app/public/assets/figma-curated/`).

Core personality:
- **Airy, white-led, editorial, and playful** — never a dark-mode gaming dashboard.
- Driven by **expressive black display typography (`Baloo 2`)**, **clean body copy (`Inter Tight`)**, **distinctive flat 2D vector illustrations**, and **focused purple interactive accents** on a **white canvas**.

---

## 2. Exact Brand Color Roles and Proportions

| Color | Hex | CSS Variable / Token | Role & Target Proportion |
| --- | --- | --- | --- |
| **White** | `#FFFFFF` | `--background` | **Main application canvas (~70–80% of viewport)**. Cards, course descriptions, learning path background, and lesson player canvas sit on white. |
| **Black** | `#181818` | `--loco-black` | **Primary text, headings, outlines, and structural borders**. High contrast and crisp readability. |
| **Purple** | `#613BE0` | `--loco-purple` | **Primary interactive actions, active states, current learning node, and selected controls**. Used selectively so CTAs stand out immediately. |
| **Lavender** | `#D2C4F5` / `#D0C4F6` | `--loco-lavender` | **Secondary surfaces, original left sidebar (`#D0C4F6`), completed node fills, and organic illustration backdrops**. |
| **Yellow** | `#FFD014` | `--loco-yellow` | **Character details, unit checkpoints, completion accents, and selective highlights**. |

### Secondary / Contextual Tokens
- **Cream (`#FFF3E2`):** subtle hover or warm note surface only when needed.
- **Lime (`#D8FF45`):** minor marketing token; **must not** be used as a dominant Academy surface or navigation color.
- **Orange:** appears inside illustrations (e.g., character beaks) and **must not** be used as a primary UI chrome color.

---

## 3. Allowed and Discouraged Color Usage

### Allowed
- White (`#FFFFFF`) as the default background for `Corsi`, Course Detail (Learning Path), and the Lesson Player.
- Lavender (`#D0C4F6` / `#D2C4F5`) for the 77px left navigation sidebar, organic illustration containers, and subtle secondary pills/completed states.
- Purple (`#613BE0`) for primary pill buttons (`Inizia`, `Continua`, `Verifica`), the active course node, and focus rings.
- Yellow (`#FFD014`) for checkpoint milestones, progress ring strokes, and small reward badges.

### Explicitly Forbidden Visual Patterns
- **Never** use `#2513A4`, `#2E1BC4`, or `#E9FF60` as dominant surfaces, panels, or backgrounds.
- **Never** create dark-blue or dark-purple full-bleed screens or giant dark course containers.
- **Never** use lime-colored navigation systems, neon glows, glassmorphism, heavy multi-layered drop shadows, or generic gaming dashboards.

---

## 4. Typography

 Brand fonts are bundled locally from `app/assets/fonts/` (`baloo-variable.ttf` and `inter-tight-variable.ttf`):

- **Headlines & Display (`.loco-display` / `Baloo 2`):**
  - Confident, bold (`700–800`), tight tracking (`-0.045em`), black (`#181818`).
  - Page title (`I nostri corsi`): `36px–44px` leading-none.
  - Course / Section titles: `22px–28px` leading-tight.
- **Body, Labels & Controls (`Inter Tight`):**
  - Clean, readable (`14px–16px` for body, `12px–14px` for secondary metadata).
  - Minimal use of all-caps. Avoid bolding every line of text.

---

## 5. Illustration Style

LOCO illustrations share a single, unmistakable hand-drawn vector language:
- Flat 2D artwork with **white human and animal characters**, **heavy black outlines**, **yellow clothing/objects**, **lavender organic background blobs**, occasional purple fields, and small orange details (beaks).
- Simplified, elongated proportions with minimal facial features and surreal, playful compositions.
- **Zero photorealism, zero 3D clay/plastic effects, zero gradients.**
- **Never** substitute emojis for UI icons or introduce generic Duolingo mascots.
- **Illustration frequency:** use illustrations purposefully in **course cards**, **unit header/milestones**, **explanatory/demonstration lesson steps**, and the **lesson completion screen** — do not place a mascot on every single question or overload the path.

---

## 6. Original LOCO Global Navigation

The global application navigation is fixed to the **five original LOCO destinations** inside the narrow left lavender sidebar:

### Desktop Sidebar (`~77px` width, `#D0C4F6` background)
1. **Top:** Stacked two-line `LO / CO` brand mark (`logo-loco.svg`).
2. **Main Navigation (5 destinations in exact order):**
   - `Home` (`icon-nav-home.svg`)
   - `Recappete` (`icon-nav-recap.svg` / `icon-nav-recap-active.svg`)
   - `Crea / Mappete` (`icon-nav-create.svg`) — **special protruding button**: white circular cutout with a large `#613BE0` purple circle and white `+` symbol protruding slightly toward the white content canvas.
   - `Corsi` (`icon-nav-courses.svg` / `icon-nav-courses-active.svg`)
   - `Profilo` (`icon-nav-profile.svg`)
3. **Bottom:** Notification bell (`icon-nav-bell.svg`).

### Mobile Navigation (`< 768px`)
- Adapts the same 5 destinations in the exact same order into a clean bottom navigation bar with safe-area padding so it **never** covers lesson player buttons or primary CTAs.
- Never add a second global sidebar or competing top tab bars.

---

## 7. Original Course Card Design ("I nostri corsi")

The entry screen of `Corsi` reconstructs the approved original LOCO desktop layout:
- **Header (top-left on white canvas):**
  - Heading: **`I nostri corsi`** (`Baloo 2`, black `#181818`).
  - Subtitle: `"Segui le lezioni per comprendere al meglio le tecniche mnemoniche"` (`Inter Tight`, black/80).
- **Card Anatomy (on white background, no heavy colored box around text):**
  1. **Illustration** at the top (lavender organic backdrop with character artwork, e.g. `course-1-loci.webp`, `course-2-linked.webp`, `course-3-phonetic.webp`).
  2. **Course label:** `Corso 1`, `Corso 2`, etc. (or discreet progression indicator).
  3. **Course title:** bold black `Baloo 2` heading (`Tecnica dei Loci`, `Linked Method`, `Conversione Fonetica`, etc.).
  4. **Description:** concise 1–2 line summary in black/80.
  5. **Primary CTA:** compact rounded purple pill button (`#613BE0` background, white text): **`Inizia`** (or **`Continua`** if started, **`Completato`** if finished). If a course belongs to `POCO LOCO` or `PRO LOCO`, show a discreet pill label rather than a noisy promotional banner.

---

## 8. Horizontal Course Carousel Rules (12 Courses)

- The Academy has **12 courses** (`Corso 0`..`Corso 11`, with the 3 foundational courses `Tecnica dei Loci`, `Linked Method`, `Conversione Fonetica` and the onboarding/advanced courses seamlessly browsable).
- **Desktop (`>= 1024px`):** displays **3 course cards at a time** matching the original 3-column proportion, with smooth horizontal `scroll-snap`, clear **Previous / Next circular arrow buttons**, keyboard arrow support, and a discreet pagination indicator.
- **Tablet (`768px–1023px`):** displays 2 cards per view with horizontal scroll-snap.
- **Mobile (`< 768px`):** displays **1 main card at a time** with horizontal touch swiping, subtle peek of the next card, and accessible prev/next controls.
- **Separation of concerns:** the horizontal carousel navigates **between courses**. Selecting a course transitions to that course's dedicated **Vertical Learning Path**.

---

## 9. Duolingo-like Learning Path Rules (Course Detail Screen)

Opening a course transitions from the catalog carousel to a **dedicated single-course screen**:
- **Never** dump all 56 lessons of all 12 courses onto a single wall.
- **Header:**
  - Clean `← Torna ai corsi` back button.
  - Course number, title, and a compact progress indicator (e.g., `2/6 lezioni` and a small streak/XP pill).
- **Vertical Path Layout:**
  - Centered, narrow (`max-w-[520px]`), winding vertical sequence on a **white (`#FFFFFF`) background**.
  - Staggered circular nodes (`68px–76px`) connected by short vertical/curved connector lines.
  - **Node visual states:**
    - **Current / Next lesson:** `#613BE0` purple circle with subtle ring and clear floating prompt (`Inizia` / `Continua`), immediately visible without hunting.
    - **Completed:** `#D2C4F5` lavender circle with crisp check icon (`✓`) or `#FFD014` accent.
    - **Available:** white circle with `#613BE0` border, clickable.
    - **Locked:** neutral light-gray (`#F3F2F7`) circle with muted lock icon; prerequisite shown only when clicked/requested.
    - **Unit Checkpoint:** distinct `#FFD014` yellow milestone node at the end of the course sequence.
- **Node Interaction:**
  - Do **not** render long paragraphs under every node on the path.
  - Clicking a node opens a compact contextual popover card showing: **Lesson title**, **estimated duration** (`~3 min`), and the primary **`Inizia`** / **`Continua`** button.

---

## 10. Focused Lesson Player Rules

Starting a lesson opens a **dedicated, distraction-free learning view** on a white canvas (not a cramped dashboard modal):
- **Top Bar:**
  - Close / Back button (`✕` or `←`) that preserves `currentStepIndex` progress.
  - Thin horizontal progress bar (`#D2C4F5` track, `#613BE0` fill).
  - Minimal step counter (`2 / 7`).
- **Center Stage (`max-w-[640px]` centered):**
  - Displays **one** focused activity at a time: Hook, short Explanation (`40–90 words` with optional *"Approfondisci"* toggle), visual Demonstration, or one of the **12 interactive exercise types** (`multiple_choice`, `matching_pairs`, `sequence_ordering`, `memory_flash`, `fill_in_blank`, `free_recall`, `image_association`, `loci_placement`, `mnemonic_builder`, `error_correction`, `number_encoding`, `reverse_decoding`).
  - Answer choices use clean white cards with `#181818`/15 border, `#613BE0` active border + `#D2C4F5`/25 tint when selected.
- **Bottom Bar & Immediate Feedback:**
  - Single clear primary CTA (`Continua`, `Verifica`, `Riprova`).
  - On answer submission, a concise bottom sheet/banner shows whether the answer is correct, a 1–2 sentence explanation, and the `Continua` button.
- **Lesson Completion Screen:**
  - Clean white view featuring an original LOCO illustration, `"Grande! Hai completato la lezione."`, `"+10 XP"` pill, compact accuracy/mastery result, and `[Prossima lezione]` / `[Torna al percorso]`.

---

## 11. UX Hierarchy Principles & Secondary Features

- **Primary flow:** `I nostri corsi` (horizontal carousel) → `Selected Course` (vertical learning path) → `Lesson Player` → `Completion` → `Return to Course Path`.
- **Secondary tools (`Palestra Fonetica & Carte`, `Arena Sfide`, `Ripassa errori`):**
  - Accessible from `Corsi` via quiet secondary links/pills below or beside the header — never as 4 giant competing top tabs or a second catalog.
- **Gamification:**
  - Keep XP, levels, streaks, badges, and mistake queue functional in the engine, but **do not** render a massive analytics/gamification header on `I nostri corsi`. Detailed metrics and badges belong in `Profilo` or a discreet drawer.
  - **No user-facing fake plan selector:** never display a "Simula piano Free/Plus/Pro" control in the normal UI.

---

## 12. Responsive Behavior

Must work cleanly across:
- **Mobile (`390 × 844`):** 1-card horizontal swipe carousel, centered vertical path, full-height distraction-free lesson player with pinned bottom CTA above safe-area navigation, zero horizontal page overflow.
- **Tablet (`768 × 1024`):** 77px left lavender sidebar, 2-card course carousel, centered vertical path.
- **Desktop (`1440 × 900`):** 77px left lavender sidebar, 3-card course carousel matching the original approved screen, generous whitespace.

---

## 13. Visual QA Checklist

Before completing any UI task on the WebApp or Academy, verify in a real browser:
1. Main `I nostri corsi` screen shows white canvas, left lavender sidebar, black `Baloo 2` heading, and 3 illustrated course cards on desktop.
2. Horizontal carousel scrolls smoothly across all 12 courses via arrows and swipe.
3. Mobile view (`390×844`) shows 1 course card at a time and usable navigation.
4. Clicking a course opens its dedicated vertical Duolingo-like learning path on a white background.
5. Current lesson node (`#613BE0`) is immediately obvious and opens a clean contextual start card.
6. Lesson player shows only top progress bar, centered question/exercise, and bottom CTA.
7. Submitting an answer shows clear inline feedback (correct and error states).
8. Completing a lesson shows the LOCO completion screen with `+10 XP` and updates course progress on return.

---

## 14. Approved Asset Paths

- **Original Course Illustrations:**
  - `/assets/figma-curated/course-1-loci.webp`
  - `/assets/figma-curated/course-2-linked.webp`
  - `/assets/figma-curated/course-3-phonetic.webp`
  - `/assets/figma-curated/lesson-1-approccio.webp`
  - `/assets/figma-curated/lesson-2-introduzione.webp`
  - `/assets/figma-curated/lesson-3-utilizzo.webp`
- **Marketing & Brand Artwork:**
  - `/marketing/hero-home.webp`, `/marketing/hero-about.webp`, `/marketing/hero-piani.webp`, `/marketing/hero-faq.webp`
  - `/marketing/method-loci.webp`, `/marketing/method-link.webp`, `/marketing/method-phonetic.webp`
  - `/marketing/feature-route.webp`, `/marketing/feature-magic.webp`, `/marketing/feature-tools.webp`, `/marketing/feature-human.webp`
  - `/marketing/card-locomprodopo.webp`, `/marketing/card-pocoloco.webp`, `/marketing/card-proloco.webp`, `/marketing/zoo.webp`, `/marketing/piani-goose.webp`
- **Curated Navigation & Character Vectors:**
  - `/assets/figma-curated/logo-loco.svg`, `icon-nav-home.svg`, `icon-nav-recap.svg`, `icon-nav-recap-active.svg`, `icon-nav-create.svg`, `icon-nav-courses.svg`, `icon-nav-courses-active.svg`, `icon-nav-profile.svg`, `icon-nav-bell.svg`
  - `/assets/figma-curated/academy-scene-*.svg`, `academy-mascot-*.svg`, `academy-item-*.svg`

---

## 15. Common Anti-Patterns to Avoid

1. **Dark-purple / dark-blue takeover:** filling screens or course cards with `#2513A4` or `#2E1BC4`.
2. **Dashboard overload:** showing 6 stat boxes, filter bars, plan switchers, and giant progress tables above the courses.
3. **Wall of 56 lessons:** rendering all 12 units on a single endless page instead of 1 course per learning path.
4. **Competing navigation bars:** stacking global tabs, sub-tabs, filter pills, and modal tabs together.
5. **Emoji icon substitutes:** replacing SVG icons or LOCO artwork with generic emojis.
