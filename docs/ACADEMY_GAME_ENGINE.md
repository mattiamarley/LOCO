# LOCO Academy 2.0 — Game Engine, Honest Scoring & 56-Lesson Matrix

This document specifies the runtime architecture, `AttemptEvidence` contract, honest scoring rules, and 56-lesson verification matrix implemented in [`loco-academy-engine-v2.ts`](file:///Users/mattiamarley/Loco/app/components/webapp/loco-academy-engine-v2.ts), [`loco-academy-curriculum.ts`](file:///Users/mattiamarley/Loco/app/components/webapp/loco-academy-curriculum.ts), and [`academy-lesson-player.tsx`](file:///Users/mattiamarley/Loco/app/components/webapp/academy-lesson-player.tsx).

---

## 1. Honest Scoring Invariants (`05_GAME_ENGINE_SPEC.md`)

1. **`blindBeforeReveal: true`:** Target answers, phonetic keys, and model references are hidden during `independent_challenge` until the learner submits a genuine attempt.
2. **Revealing Answer Before Attempt (`submittedBeforeReveal: false`):** If the learner clicks `"Rivela soluzione (solo studio)"` before submitting, `autonomousMasteryEligible` is forced to `false` and the lesson status cannot advance to `provisionally_passed` or `mastered_after_delay`.
3. **Progressive Hints (`hintsUsed > 0`):** Using one or more hints records an **assisted** attempt (`status: "practice_done"`, never `provisionally_passed` or `mastered_after_delay`).
4. **Construction $\neq$ Memory (`builder_then_blind_recall` & `loci_route_and_blind_order`):**
   - Selecting loci (`S03`, `L02`, `L07`, `P01`, `P03`, `W03`) or filling a scene builder (`S04`, `L04`, `K02`, `X02`, `W04`) is only Phase 1 (construction).
   - Phase 2 hides all labels/scenes and requires blind order reconstruction or blind target recall. Completing Phase 1 without passing Phase 2 never grants recall mastery.
5. **No `nonEmpty = correct` for Open Semantic Production (`structured_plus_rubric`):**
   - Open-ended written tasks (`S02`, `L01`, `K03`, `T01`, `T03`, `T06`, `X01`, `X04`, `P02`, `R01`, `R02`, `W01`, `W02`, `M04`, `A02`) require passing deterministic structured checks, writing substantive non-copied text, and completing an explicit 4-point rubric self-check.
   - They record `verifiedBy: "learner_self_check"`, `correct: null`, and `autonomousMasteryEligible: false`, advancing status to `practice_done` (`skill_practiced`) rather than automatic `provisionally_passed`.
6. **Versioned Progress Migration (`1.0.0` → `2.0.0`):**
   - `reconcileAcademyProgressVersion()` preserves user history and demotes `1.0.0` `provisionally_passed` / `mastered_after_delay` records to `needs_review` until verified under `contentVersion: "2.0.0"`.

---

## 2. `AttemptEvidence` Contract

Every Stage 6 submission appends an immutable `AttemptEvidence` record to `AcademyLessonProgress.attemptHistory`:

```ts
export interface AttemptEvidence {
  lessonId: string;
  lessonVersion: string; // "2.0.0"
  gameId: string; // "<lessonId>-lab-v2"
  datasetVersion: string; // "2.0.0-a"
  stageType: "guided_practice" | "independent_challenge";
  presentedStimulusId: string;
  submittedAnswer: unknown;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  correct: boolean | null; // null when verifiedBy === "learner_self_check"
  verifiedBy: "deterministic" | "learner_self_check" | "qualified_review";
  autonomousMasteryEligible: boolean;
  scoreRatio: number;
  summaryHeadline: string;
  diagnosticFeedback: string;
  errorCategory: ErrorDiagnosisCategory | null;
  repairAction: string | null;
  createdAt: string;
}
```

---

## 3. Complete 56-Lesson Implementation & Grading Matrix

Each of the 56 lessons has its own dedicated `gameId` (`<lessonId>-lab-v2`), distinct Set A (`guided_practice`) and Set B (`independent_challenge`) stimuli, and explicit grading reliability classification:

- **`deterministic_verified` (25 lessons):** Automatically and deterministically graded (`verifiedBy: "deterministic"`). Eligible for `provisionally_passed` and `mastered_after_delay` when solved without hints before reveal.
- **`hybrid_recall_and_rubric` (14 lessons):** Authoring fixture includes open construction/rubric elements, and the engine enforces a deterministic blind recall or spatial order verification phase (`verifiedBy: "deterministic"`).
- **`rubric_guided_self_check` (17 lessons):** Open semantic/strategic production combined with deterministic structured checks and explicit 4-criterion rubric self-assessment (`verifiedBy: "learner_self_check"` → `practice_done`, never automatic mastery for non-empty text).

| Lesson ID | Course | Tier | Game ID | Widget Archetype | Grading Classification |
|---|---|---|---|---|---|
| `S01` | `course-0` | Free | `S01-lab-v2` | `ordered_flash_recall` | `deterministic_verified` |
| `S02` | `course-0` | Free | `S02-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `S03` | `course-0` | Free | `S03-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `S04` | `course-0` | Free | `S04-lab-v2` | `builder_then_blind_recall` | `hybrid_recall_and_rubric` |
| `S05` | `course-0` | Free | `S05-lab-v2` | `pairs_blind_recall` | `deterministic_verified` |
| `S06` | `course-0` | Free | `S06-lab-v2` | `multi_case_classification` | `deterministic_verified` |
| `L01` | `course-1` | Free | `L01-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `L02` | `course-1` | Free | `L02-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `L03` | `course-1` | Free | `L03-lab-v2` | `ordered_flash_recall` | `deterministic_verified` |
| `L04` | `course-1` | Free | `L04-lab-v2` | `builder_then_blind_recall` | `hybrid_recall_and_rubric` |
| `L05` | `course-1` | Free | `L05-lab-v2` | `pairs_blind_recall` | `deterministic_verified` |
| `L06` | `course-1` | Free | `L06-lab-v2` | `ordered_flash_recall` | `deterministic_verified` |
| `L07` | `course-1` | Free | `L07-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `K01` | `course-2` | Free | `K01-lab-v2` | `ordered_flash_recall` | `deterministic_verified` |
| `K02` | `course-2` | Free | `K02-lab-v2` | `builder_then_blind_recall` | `hybrid_recall_and_rubric` |
| `K03` | `course-2` | Free | `K03-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `K04` | `course-2` | Free | `K04-lab-v2` | `missing_link_diagnosis` | `deterministic_verified` |
| `N01` | `course-3` | Free | `N01-lab-v2` | `phonetic_word_for_numbers` | `deterministic_verified` |
| `N02` | `course-3` | Free | `N02-lab-v2` | `phonetic_decode_words` | `deterministic_verified` |
| `N03` | `course-3` | Free | `N03-lab-v2` | `phonetic_year_blocks` | `deterministic_verified` |
| `N04` | `course-3` | Free | `N04-lab-v2` | `phonetic_decode_words` | `deterministic_verified` |
| `N05` | `course-3` | Free | `N05-lab-v2` | `pairs_blind_recall` | `deterministic_verified` |
| `T01` | `course-4` | Free | `T01-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `T02` | `course-4` | Free | `T02-lab-v2` | `unordered_flash_recall` | `hybrid_recall_and_rubric` |
| `T03` | `course-4` | Free | `T03-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `T04` | `course-4` | Free | `T04-lab-v2` | `multi_case_classification` | `deterministic_verified` |
| `T05` | `course-4` | Free | `T05-lab-v2` | `multi_case_classification` | `deterministic_verified` |
| `T06` | `course-4` | Free | `T06-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `X01` | `course-5` | Free | `X01-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `X02` | `course-5` | Free | `X02-lab-v2` | `builder_then_blind_recall` | `hybrid_recall_and_rubric` |
| `X03` | `course-5` | Free | `X03-lab-v2` | `unordered_flash_recall` | `deterministic_verified` |
| `X04` | `course-5` | Free | `X04-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `P01` | `course-6` | Plus | `P01-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `P02` | `course-6` | Plus | `P02-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `P03` | `course-6` | Plus | `P03-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `P04` | `course-6` | Plus | `P04-lab-v2` | `multi_case_classification` | `deterministic_verified` |
| `Q01` | `course-7` | Plus | `Q01-lab-v2` | `phonetic_word_for_numbers` | `deterministic_verified` |
| `Q02` | `course-7` | Plus | `Q02-lab-v2` | `pairs_blind_recall` | `hybrid_recall_and_rubric` |
| `Q03` | `course-7` | Plus | `Q03-lab-v2` | `pao_scene_codec` | `deterministic_verified` |
| `Q04` | `course-7` | Plus | `Q04-lab-v2` | `phonetic_decode_words` | `deterministic_verified` |
| `R01` | `course-8` | Plus | `R01-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `R02` | `course-8` | Plus | `R02-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `R03` | `course-8` | Plus | `R03-lab-v2` | `multi_case_classification` | `deterministic_verified` |
| `R04` | `course-8` | Plus | `R04-lab-v2` | `numeric_transfer_lab` | `deterministic_verified` |
| `W01` | `course-9` | Plus | `W01-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `W02` | `course-9` | Plus | `W02-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `W03` | `course-9` | Plus | `W03-lab-v2` | `loci_route_and_blind_order` | `hybrid_recall_and_rubric` |
| `W04` | `course-9` | Plus | `W04-lab-v2` | `builder_then_blind_recall` | `hybrid_recall_and_rubric` |
| `M01` | `course-10` | Plus | `M01-lab-v2` | `metrics_and_trials_lab` | `deterministic_verified` |
| `M02` | `course-10` | Plus | `M02-lab-v2` | `long_number_chunks` | `deterministic_verified` |
| `M03` | `course-10` | Plus | `M03-lab-v2` | `cards_and_names_dual_lab` | `deterministic_verified` |
| `M04` | `course-10` | Plus | `M04-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `A01` | `course-11` | Pro | `A01-lab-v2` | `source_fact_check_lab` | `deterministic_verified` |
| `A02` | `course-11` | Pro | `A02-lab-v2` | `structured_plus_rubric` | `rubric_guided_self_check` |
| `A03` | `course-11` | Pro | `A03-lab-v2` | `pairs_blind_recall` | `hybrid_recall_and_rubric` |
| `A04` | `course-11` | Pro | `A04-lab-v2` | `multi_case_classification` | `deterministic_verified` |
