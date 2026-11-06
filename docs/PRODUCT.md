# LOCO — product specification

**Status:** product intent and behavior contract, not a statement that all features are shipped. Baseline repository: `main` at `9861c821` (2026-11-06). Update after code changes.

## 1. Purpose

LOCO helps a learner remember, understand and retrieve material using spatial routes (the Method of Loci), personalized associations, deliberate retrieval and spaced review. It joins a **learning system** and a **spatial authoring interface**, rather than treating a mnemonic illustration or AI chat response as the final product.

The fundamental learning sequence is:

> Source/idea → verified knowledge items → place and ordered loci → user-approved mnemonic associations → study → blind recall → feedback → item-level spaced review → evaluation.

Both entry paths must be supported: **content first** (upload/paste notes, prepare knowledge, select environment) and **environment first** (open scene, create loci, add knowledge inside scene). They converge on the same stored entities and recall history.

## 2. Intended audience and value

- **Primary exploration audience:** students and young adults studying factual, sequential or structured material. Earlier research considered an approximate 14–25 target; this is a product hypothesis, not proven market fit. Build appropriate safeguards if minors are allowed.
- **Secondary uses:** speeches, language vocabulary, lists, presentations, professional examinations and personal learning.
- **Value:** structure encoding; maintain associations; practise recall rather than merely reread; retrieve at appropriate intervals; make the process less intimidating with an approachable and distinctive experience.

LOCO must not promise photographic memory, universal cognitive enhancement, guaranteed exam outcomes, or a fixed percentage improvement.

## 3. Product surfaces

| Surface | Responsibility | Reality at baseline |
| --- | --- | --- |
| Public website | Explain LOCO, features, demo, plans, FAQ and entry point | Next.js marketing pages exist; marketing claims are not implementation evidence |
| Private desktop web app | Manage sources, projects, palaces, editing, study, progress and account | Next.js `/app` is a placeholder; local prototype has limited functions |
| Mobile web app | Create, interact within environments, study and review with the same records | Responsive production experience is not integrated |
| Immersive/VR mode | Optional spatial exploration and interaction on compatible devices | Vision/reference material only; not shipped |
| Backend | Account, data, revision, training and review contracts | Separate local Node/SQLite `/api` + `/v1`; not deployed with Next.js |

## 4. Core domain terminology

- **Project:** a learner's subject or goal (e.g. a history exam, anatomy chapter); may contain multiple sources, targets and palaces.
- **Source:** user-authored text, uploaded document or other provenance; preserve citations/chunk references.
- **Knowledge item:** a human-verifiable statement, question/answer or concept; distinct from its mnemonic cue.
- **Learning target:** a retrievable direction/task about one item (e.g. prompt → answer, reverse, explanation), with independent review history.
- **Palace:** an identifiable spatial scene or route with one or more scene versions.
- **Locus:** a stable, distinct and ordered point in a palace; its anchor belongs to a specific scene version.
- **Association:** a personal visual/verbal cue linking a learning target to a locus, optionally with a generated or uploaded asset; may have revisions.
- **Recall attempt:** one effort before viewing the answer, with timing, outcome and assistance level.
- **Review schedule:** next due time and scheduler state for a learning target, derived from its attempts.
- **Training exercise:** practice of an identifiable skill, separate from an exam-ranked challenge.
- **Challenge:** a versioned ruleset and deterministic, server-scored attempt; friends/leaderboards obey privacy settings.

Do not collapse locus, factual content and association into a single mutable text field; keep provenance and versioning.

## 5. Information architecture (target)

**Public:** Home, About/How it works, Demo, Plans, FAQ, Sign in.

**Authenticated:** Dashboard; My projects/Palaces/Recap; Create/continue; In-scene spatial authoring; Study & Due reviews; Techniques & training; Memory profile; Friends/Arena when enabled; Account/preferences/export.

The dashboard should prioritize **resume where you left off**, **due reviews**, **create a palace**, and **lessons**. Avoid misleading progress percentages derived from activity alone.

## 6. Canonical journeys

### A. Start and import

1. Create a project with title and optional goal/deadline.
2. Paste text or author question/answer entries; introduce file import when the secure upload/parsing pipeline is ready.
3. Preserve raw source and location information (page/chunk/section).
4. Parse/suggest atomic knowledge items as **proposals**. AI output is not assumed true.
5. Review, edit and explicitly confirm each item before promoting it to an active target.
6. Save partial progress as a draft at every meaningful stage.

A knowledge item can have multiple targets if recognition, recall, reverse direction and explanation need different schedules.

### B. Choose and learn a palace

1. Choose an available scene or route; distinguish a simple built-in scene, a licensed mapping view and a user-provided scanned scene.
2. Enter/explore the environment and learn its landmarks before encoding material.
3. Fix a traversable direction and a manageable ordered set of distinct loci.
4. Associate loci with the correct scene version and stable coordinates/anchors.
5. A user can rearrange locus order without silently deleting linked knowledge or history.

**Approved interaction:** the castle/scene is already open. The user selects a spatial point by gaze/touch/pointer, confirms **Add locus** (or optional voice command), and enters both the knowledge item and mnemonic association using overlays/controls **inside the scene**. Do not require leaving the environment to fill a separate form. The owner originally demonstrated this in `DEF MOBILE.mov`; the raw video is an archive, not a runtime dependency.

### C. Encode and edit

For a single locus show and preserve: (1) correct knowledge/answer, (2) locus, (3) imaginative personal association, (4) optional image/audio/object/3D placement. Clearly distinguish facts from generated imaginative content.

- AI may suggest 2–3 concise association candidates; user can edit or reject.
- The scene/image is generated only as an optional expression of the approved association.
- User corrections to a source answer trigger explicit revision/reconciliation; they must not silently inherit historical recall success.
- Failed AI/media work must not corrupt a user's saved text or spatial anchors.

### D. Study, blind recall and feedback

1. Preview the scene and loci in a known order, with contextual facts where appropriate during study.
2. On test, present only the prompt and non-revealing spatial cue; hide answer and any clue that makes it trivial.
3. Capture an answer or explicit self-assessment **before** reveal.
4. Distinguish independent success, partial/hinted success, and failure; show the source-backed answer afterward.
5. Store attempt, answer exposure, hint count, latency, item revision and scheduler version.
6. Queue a future review per target. A screen view or opened explanation is not a successful review.

Scheduler semantics in the existing local backend: `simple-v1` and `fsrs-7`; `viewedAnswerBeforeAttempt=true` forces a failing grade, and hinted trials cannot be credited beyond the documented cap. Consult `app/server/src/srs.ts` and tests for exact behavior.

### E. Reflect and train

- Progress: loci encoded, confirmed items, reviews due/completed, independent delayed accuracy, hint dependence and confusion between spatial points.
- Show observation windows, evidence/sample sizes and confidence; avoid an unqualified universal 'memory score'.
- Teach technique-specific tasks and track skill directions separately (e.g. numerical encoding vs decoding).
- Make personalized recommendations explainable: what evidence triggered it and whether it improved a comparable later outcome.
- Ranked challenges require immutable version rules, server verification and privacy-aware public rankings; practice attempts should remain separate.

## 7. Lessons and training

Use `docs/LEARNING.md` as the learning-content specification. Preferred instructional progression:

1. Orientation: memory vs familiarity; source fidelity; encoding/retrieval distinction.
2. The Method of Loci: spatial order, distinct loci and route rehearsal.
3. Making meaningful associations: concrete images, action, distinctiveness and personal relevance.
4. Active recall: response before reveal, error analysis and hints.
5. Spaced repetition: scheduling, due queues and habits.
6. Linking, chunking and stories; practical examples.
7. Phonetic/Major system for numbers (with verified Italian mapping); optional PAO advanced module.
8. Application to subject matter, interference/confusion, self-testing and transfer to real tasks.

Treat this as an intended curriculum, not as evidence that those exact lessons are implemented. The static prototype previously documented eight short lessons and cards; audit before claiming continuity.

## 8. AI and integrations: boundaries

| Function | Expected control | Current integration status at baseline |
| --- | --- | --- |
| AI extraction | Source-grounded proposals; explicit confirmation | Data contract/local API exists; production AI ingestion not verified |
| AI mnemonic suggestions | Optional, editable and user-owned | Planned, not a deployed live model |
| Image/media generation | On-demand, reusable, user approval; rights & cost control | Not a deployed production pipeline |
| Voice dictation | Opt-in, editable transcript | Product ambition; not assumed present |
| Semantic feedback | Explainable, contestable, source-grounded | Future integration; manual grading remains essential |
| Street View / maps | Official API + licenses/usage accounting | Not integrated in hosted app |
| User-space 3D reconstruction | Consented uploads, asynchronous job, private storage | Not demonstrated as production-ready |
| Immersive VR | Device-aware progressive enhancement | Not shipped |

Do **not** scrape Street View or persist third-party panoramas/meshes beyond the provider's rights. Keep location/media integrations optional to the manual learning cycle. Pilot operating-cost planning historically used a rough €100/month total budget, **not** a contractual spending cap or validated unit cost.

## 9. Privacy, safety and trust

- Protect private sources, derived facts, palace layouts, media and sessions from cross-account access.
- Settings control user discovery, friend requests, blocking and leaderboard visibility.
- Keep ranked scores on the server; detect duplicate runs and tampered submissions.
- Provide export and deletion workflows consistent with applicable requirements before full release.
- For younger users, assess age/consent/data policies before onboarding; no assumed legal compliance from a prototype.
- Distinguish educational explanations from medical advice or scientific certainty. Source-sensitive corrections remain user-reviewable.

## 10. Acceptance criteria for the first integrated product

A test user, on desktop and mobile, can: create a draft; enter or verify at least one knowledge target; open a scene; create ordered loci **within** it; assign/edit associations; save/reopen without losing coordinates; study; attempt answer-hidden recall; get explicit feedback; see due items; review them later; export data; and never access another user's private content. The flow works when AI and paid maps are unavailable.

This is an implementation acceptance test. Educational effectiveness is a **separate hypothesis** requiring controlled delayed-retention evaluation as outlined in `docs/LEARNING.md`.

## 11. Brand reference, not a substitute for design work

The authoritative Figma file is [LOCO — loco nuovo](https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887). The owner confirmed that the definitive web portal appears in the **bottom-right group** of `Portale / Area riservata`, while loading states are in the upper-left; other groups are explorations. The marketing site has current, useful assets in `app/public/marketing/`. The owner will organize hand-picked app visuals independently. **Do not regenerate the full Figma archive or infer new design tokens from the outdated exports.**
