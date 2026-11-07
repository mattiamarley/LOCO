import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACADEMY_BADGES,
  ACADEMY_COURSES,
  ACADEMY_LESSONS_BY_ID,
  ENRICHED_ACADEMY_LESSONS,
  LEGACY_LESSON_MAP,
  LOCO_LEVELS,
  MAJOR_IT_V1_TABLE,
  MAJOR_IT_V1_VERSION,
  TIER_NAMING,
  XP_REWARDS,
  awardIdempotentXp,
  computeAdaptiveAcademyRecommendations,
  computeUnlockedBadgeIds,
  createDefaultAcademyProgressMap,
  createDefaultGamificationState,
  createInitialLessonProgress,
  encodeItalianWordToMajorDigits,
  evaluateLessonCheckpointAnswer,
  migrateLegacyCourseProgress,
  reconcileAcademyProgressVersion,
  recordAcademyCheckpointAttempt,
  recordAcademyV2Attempt,
  resolveLocoLevel,
  resolvePathNodeVisualState,
} from "../../components/webapp/loco-academy-curriculum.ts";
import {
  ACADEMY_V2_MISSIONS,
  ACADEMY_V2_SCHEMA_VERSION,
  evaluateBuilderThenBlindRecallAttempt,
  evaluateLociRouteAttempt,
  evaluateMultiCaseClassificationAttempt,
  evaluateOrderedWordsAttempt,
  evaluatePairsBlindRecallAttempt,
  evaluatePhoneticDecodeWordsAttempt,
  evaluatePhoneticWordForNumbersAttempt,
  evaluateStructuredPlusRubricAttempt,
} from "../../components/webapp/loco-academy-engine-v2.ts";
import { MAJOR_SYSTEM_TABLE, INITIAL_COURSES } from "../../components/webapp/loco-webapp-data.ts";

test("LOCO Academy Catalog: exact 12 courses, 56 lessons, unique IDs, and 32/20/4 tier split", () => {
  assert.equal(ACADEMY_COURSES.length, 12, "Must have exactly 12 courses (course-0..course-11)");
  assert.equal(ENRICHED_ACADEMY_LESSONS.length, 56, "Must have exactly 56 micro-lessons");

  const ids = ENRICHED_ACADEMY_LESSONS.map((l) => l.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, 56, "All 56 lesson IDs must be unique");

  const tierCounts = ENRICHED_ACADEMY_LESSONS.reduce(
    (acc, l) => {
      acc[l.planTier] = (acc[l.planTier] || 0) + 1;
      return acc;
    },
    { free: 0, plus: 0, pro: 0 }
  );
  assert.deepEqual(
    tierCounts,
    { free: 32, plus: 20, pro: 4 },
    "Must have 32 free (LOCOMPRO DOPO), 20 plus (POCO LOCO), and 4 pro (PRO LOCO) lessons"
  );

  assert.equal(TIER_NAMING.free.editorialName, "LOCOMPRO DOPO");
  assert.equal(TIER_NAMING.plus.editorialName, "POCO LOCO");
  assert.equal(TIER_NAMING.pro.editorialName, "PRO LOCO");

  const onboardingLessons = ENRICHED_ACADEMY_LESSONS.filter((l) => l.requiredInOnboarding);
  assert.deepEqual(
    onboardingLessons.map((l) => l.id),
    ["S01", "S02", "S03", "S04", "S05", "S06"],
    "Only S01–S06 are mandatory in initial onboarding, and all must be free"
  );
  for (const l of onboardingLessons) {
    assert.equal(l.planTier, "free");
  }
});

test("LOCO Academy Prerequisites: valid references and acyclic DAG across all 56 lessons", () => {
  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    assert.ok(lesson.reading.length > 40, `Lesson ${lesson.id} must have editorial reading text`);
    assert.ok(lesson.workedExample.length > 15, `Lesson ${lesson.id} must have workedExample`);
    assert.ok(lesson.exercise.prompt.length > 15, `Lesson ${lesson.id} must have exercise prompt`);
    assert.ok(lesson.checkpoint.question.length > 10, `Lesson ${lesson.id} must have checkpoint question`);
    assert.ok(lesson.checkpoint.expectedAnswer.length >= 1, `Lesson ${lesson.id} must have expectedAnswer`);

    for (const prereqId of lesson.prerequisites) {
      assert.ok(
        ACADEMY_LESSONS_BY_ID[prereqId],
        `Prerequisite ${prereqId} of lesson ${lesson.id} must exist in catalog`
      );
      assert.notEqual(prereqId, lesson.id, `Lesson ${lesson.id} cannot depend on itself`);
    }
  }

  // Verify no cycles in prerequisites graph
  const visiting = new Set();
  const visited = new Set();

  function dfs(lessonId) {
    if (visited.has(lessonId)) return;
    assert.ok(!visiting.has(lessonId), `Cycle detected involving lesson ${lessonId}`);
    visiting.add(lessonId);
    const lesson = ACADEMY_LESSONS_BY_ID[lessonId];
    for (const p of lesson.prerequisites) {
      dfs(p);
    }
    visiting.delete(lessonId);
    visited.add(lessonId);
  }

  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    dfs(lesson.id);
  }
});

test("Major System `major-it-v1` phonetic convention: fixes legacy SC discrepancy and evaluates phonemes", () => {
  assert.equal(MAJOR_IT_V1_VERSION, "major-it-v1");
  assert.equal(MAJOR_IT_V1_TABLE.length, 10);

  // Verify SC is on 0 (/s/, /z/, /ʃ/) and NOT on 6 (/tʃ/, /dʒ/)
  const row0 = MAJOR_IT_V1_TABLE.find((r) => r.digit === 0);
  const row6 = MAJOR_IT_V1_TABLE.find((r) => r.digit === 6);
  assert.ok(row0.sounds.includes("SC dolce"), "Digit 0 must include SC dolce (scena)");
  assert.ok(!row6.sounds.includes("SC"), "Digit 6 must NOT include SC");

  // Also check legacy MAJOR_SYSTEM_TABLE in loco-webapp-data.ts is aligned with major-it-v1
  const webRow0 = MAJOR_SYSTEM_TABLE.find((r) => r.digit === "0");
  const webRow6 = MAJOR_SYSTEM_TABLE.find((r) => r.digit === "6");
  assert.ok(webRow0.sounds.includes("SC dolce"), "Webapp MAJOR_SYSTEM_TABLE digit 0 must include SC dolce");
  assert.ok(!webRow6.sounds.includes("SC"), "Webapp MAJOR_SYSTEM_TABLE digit 6 must not include SC");

  // Phonetic evaluation of canonical curriculum words (N01–N05)
  assert.equal(encodeItalianWordToMajorDigits("scena"), "02", "scena: /ʃ/=0, /n/=2 -> 02");
  assert.equal(encodeItalianWordToMajorDigits("sci"), "0", "sci: /ʃ/=0 -> 0");
  assert.equal(encodeItalianWordToMajorDigits("toro"), "14", "toro: /t/=1, /r/=4 -> 14");
  assert.equal(encodeItalianWordToMajorDigits("mano"), "32", "mano: /m/=3, /n/=2 -> 32");
  assert.equal(encodeItalianWordToMajorDigits("luna"), "52", "luna: /l/=5, /n/=2 -> 52");
  assert.equal(encodeItalianWordToMajorDigits("pane"), "92", "pane: /p/=9, /n/=2 -> 92");
  assert.equal(encodeItalianWordToMajorDigits("ciao"), "6", "ciao: /tʃ/=6, vowels ignored -> 6");
  assert.equal(encodeItalianWordToMajorDigits("micio"), "36", "micio: /m/=3, /tʃ/=6 -> 36");
  assert.equal(encodeItalianWordToMajorDigits("mago"), "37", "mago: /m/=3, /g/ dura=7 -> 37");
  assert.equal(encodeItalianWordToMajorDigits("casa"), "70", "casa: /k/ dura=7, /s/=0 -> 70");
  assert.equal(encodeItalianWordToMajorDigits("gnomo"), "23", "gnomo: /ɲ/=2, /m/=3 -> 23");
  assert.equal(encodeItalianWordToMajorDigits("foglia"), "85", "foglia: /f/=8, /ʎ/=5 -> 85");
  assert.equal(encodeItalianWordToMajorDigits("tuffo"), "18", "tuffo: /t/=1, geminate /ff/=8 -> 18");
  assert.equal(encodeItalianWordToMajorDigits("riva"), "48", "riva: /r/=4, /v/=8 -> 48");
});

test("Legacy 9-lesson migration (`c1-l1`..`c3-l3`): maps to reading (`lesson_read`), never `mastered`", () => {
  const legacyIds = INITIAL_COURSES.flatMap((c) => c.lessons.map((l) => l.id));
  assert.equal(legacyIds.length, 9, "Must have 9 legacy lesson IDs");

  for (const id of legacyIds) {
    assert.ok(LEGACY_LESSON_MAP[id], `Legacy ID ${id} must have a migration mapping`);
  }

  const migrated = migrateLegacyCourseProgress(legacyIds, createDefaultAcademyProgressMap());

  // Check c1-l1 -> S01 + L01, c1-l3 -> S04 + L04 + L06, c3-l3 -> N03 + N04
  for (const targetId of ["S01", "L01", "S03", "L02", "S04", "L04", "L06", "K01", "K02", "K03", "N01", "N02", "N03", "N04"]) {
    const rec = migrated[targetId];
    assert.equal(
      rec.status,
      "reading",
      `Migrated lesson ${targetId} must have status 'reading', never 'mastered_after_delay'`
    );
    assert.equal(rec.masteredAfterDelayAt, null);
    assert.equal(rec.provisionallyPassedAt, null);
    assert.ok(rec.legacyMigratedFrom.length >= 1);
  }
});

test("Hidden-answer checkpoint, hint logging, and mastery state transitions", () => {
  const s01 = ACADEMY_LESSONS_BY_ID["S01"];
  const initial = createInitialLessonProgress(s01);

  // 1. Viewing answer before attempt must NEVER credit autonomous pass
  const spoiledAttempt = recordAcademyCheckpointAttempt(initial, s01, {
    userAnswer: "no",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: true,
    nowIso: "2026-11-07T10:00:00.000Z",
  });
  assert.equal(spoiledAttempt.evaluation.autonomousSuccess, false);
  assert.notEqual(spoiledAttempt.updated.status, "provisionally_passed");
  assert.notEqual(spoiledAttempt.updated.status, "mastered_after_delay");
  assert.equal(spoiledAttempt.updated.viewedAnswerBeforeAttempt, true);

  // 2. Correct answer with hint used is logged and capped (not autonomous pass)
  const fresh = createInitialLessonProgress(s01);
  const hintedAttempt = recordAcademyCheckpointAttempt(fresh, s01, {
    userAnswer: "no",
    hintsUsedInAttempt: 1,
    viewedAnswerBeforeAttempt: false,
    nowIso: "2026-11-07T10:05:00.000Z",
  });
  assert.equal(hintedAttempt.evaluation.isCorrect, true);
  assert.equal(hintedAttempt.evaluation.autonomousSuccess, false);
  assert.equal(hintedAttempt.updated.checkpointHintsUsed, 1);
  assert.notEqual(hintedAttempt.updated.status, "provisionally_passed");

  // 3. First unassisted attempt without viewing answer -> `provisionally_passed` (not immediately mastered)
  const unassistedFirst = recordAcademyCheckpointAttempt(fresh, s01, {
    userAnswer: "no",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: false,
    nowIso: "2026-11-07T10:10:00.000Z",
  });
  assert.equal(unassistedFirst.evaluation.autonomousSuccess, true);
  assert.equal(unassistedFirst.updated.status, "provisionally_passed");
  assert.ok(unassistedFirst.updated.provisionallyPassedAt);
  assert.equal(unassistedFirst.updated.masteredAfterDelayAt, null);

  // 4. Subsequent delayed unassisted verification -> `mastered_after_delay`
  const delayedSecond = recordAcademyCheckpointAttempt(unassistedFirst.updated, s01, {
    userAnswer: "no",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: false,
    isDelayedFollowUp: true,
    nowIso: "2026-11-08T10:15:00.000Z",
  });
  assert.equal(delayedSecond.evaluation.autonomousSuccess, true);
  assert.equal(delayedSecond.updated.status, "mastered_after_delay");
  assert.ok(delayedSecond.updated.masteredAfterDelayAt);

  // 5. Content version bump demotes `mastered_after_delay` to `needs_review` while keeping history
  const reconciled = reconcileAcademyProgressVersion(delayedSecond.updated, {
    contentVersion: "1.1",
  });
  assert.equal(reconciled.status, "needs_review");
  assert.equal(reconciled.contentVersion, "1.1");
  assert.equal(reconciled.checkpointAttempts, 2);
});

test("Fallback transparency for unimplemented AI/Street View/3D scan and adaptive routing sample guardrails", () => {
  // Lessons in Course 9 (W01-W04) and Course 11 (A01-A04) must declare fallback notices
  for (const id of ["W01", "W02", "W03", "W04", "A01", "A02", "A03", "A04"]) {
    const lesson = ACADEMY_LESSONS_BY_ID[id];
    assert.equal(lesson.requiresSimulatedFallbackNotice, true);
    assert.ok(lesson.fallbackNoticeText && lesson.fallbackNoticeText.length > 20);
  }

  // Adaptive routing with tiny sample (< 3 trials) must report insufficient sample
  const lowSampleRecs = computeAdaptiveAcademyRecommendations({
    totalTrialsCount: 1,
    viewedAnswerBeforeAttemptCount: 0,
    locusOrderSwapCount: 0,
    locusRecognizedButAnswerMissingCount: 0,
    majorSoftHardConfusionCount: 0,
    immediatePassDelayedFailCount: 0,
    hintAssistedTrialsCount: 0,
  });
  assert.equal(lowSampleRecs.length, 1);
  assert.equal(lowSampleRecs[0].isSufficientSample, false);

  // Adaptive routing with observed 6/7 confusion and locus swaps recommends N02->N04 and L02->L03->L07
  const richRecs = computeAdaptiveAcademyRecommendations({
    totalTrialsCount: 10,
    viewedAnswerBeforeAttemptCount: 1,
    locusOrderSwapCount: 2,
    locusRecognizedButAnswerMissingCount: 2,
    majorSoftHardConfusionCount: 2,
    immediatePassDelayedFailCount: 1,
    hintAssistedTrialsCount: 4,
  });
  const recIds = richRecs.flatMap((r) => r.recommendedLessonIds);
  assert.ok(recIds.includes("N02") && recIds.includes("N04"));
  assert.ok(recIds.includes("L02") && recIds.includes("L03") && recIds.includes("L07"));

  // Check checkpoint evaluator on N02 ("6") and N04 ("no, 37")
  const evalN02 = evaluateLessonCheckpointAnswer(ACADEMY_LESSONS_BY_ID["N02"], "6");
  assert.equal(evalN02.isCorrect, true);
  const evalN04 = evaluateLessonCheckpointAnswer(ACADEMY_LESSONS_BY_ID["N04"], "no, 37");
  assert.equal(evalN04.isCorrect, true);
});

test("LOCO Academy 2.0 Engine: 8 canonical stages per lesson, unique game IDs, and curated assets", () => {
  const canonicalStages = [
    "hook",
    "explanation",
    "expert_walkthrough",
    "demonstration",
    "guided_practice",
    "independent_challenge",
    "diagnostic_feedback",
    "reflection_and_next",
  ];

  assert.equal(ENRICHED_ACADEMY_LESSONS.length, 56);

  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    assert.equal(
      lesson.contentVersion,
      ACADEMY_V2_SCHEMA_VERSION,
      `Lesson ${lesson.id} must be on version ${ACADEMY_V2_SCHEMA_VERSION}`
    );
    assert.equal(
      lesson.steps.length,
      8,
      `Lesson ${lesson.id} must have exactly 8 canonical steps`
    );

    const stepTypes = lesson.steps.map((s) => s.type);
    assert.deepEqual(
      stepTypes,
      canonicalStages,
      `Lesson ${lesson.id} steps must match the 8 canonical stages in order`
    );

    assert.ok(lesson.v2Mission, `Lesson ${lesson.id} must have v2Mission`);
    assert.equal(
      lesson.v2Mission.gameId,
      `${lesson.id}-lab-v2`,
      `Lesson ${lesson.id} must have unique gameId ${lesson.id}-lab-v2`
    );

    for (const step of lesson.steps) {
      assert.ok(step.stepId, `Step in ${lesson.id} must have stepId`);
      assert.ok(step.title, `Step in ${lesson.id} must have title`);
      assert.ok(
        step.illustrationAsset.startsWith("/assets/figma-curated/"),
        `Step in ${lesson.id} must reference a curated LOCO asset`
      );
    }
  }

  // Verify all widget archetypes are represented across the 56 missions
  const seenArchetypes = new Set(
    ENRICHED_ACADEMY_LESSONS.map((l) => l.v2Mission.widgetKind)
  );
  const expectedArchetypes = [
    "ordered_flash_recall",
    "unordered_flash_recall",
    "loci_route_and_blind_order",
    "builder_then_blind_recall",
    "pairs_blind_recall",
    "missing_link_diagnosis",
    "phonetic_word_for_numbers",
    "phonetic_decode_words",
    "phonetic_year_blocks",
    "pao_scene_codec",
    "long_number_chunks",
    "multi_case_classification",
    "numeric_transfer_lab",
    "metrics_and_trials_lab",
    "cards_and_names_dual_lab",
    "source_fact_check_lab",
    "structured_plus_rubric",
  ];
  for (const arch of expectedArchetypes) {
    assert.ok(
      seenArchetypes.has(arch),
      `Academy 2.0 must include widget archetype '${arch}'`
    );
  }
});

test("Academy 2.0 Honest Scoring & Evaluators: S01–S06 end-to-end, builder != recall, rubric honesty", () => {
  // 1. S01: Ordered words recall on Set B ("faro", "miele", "aquila", "tamburo", "sciarpa", "razzo")
  const s01Spec = ACADEMY_V2_MISSIONS["S01"].orderedFlashSpec;
  const s01Perfect = evaluateOrderedWordsAttempt({
    lessonId: "S01",
    expectedWords: s01Spec.targetWords,
    submittedWords: ["faro", "miele", "aquila", "tamburo", "sciarpa", "razzo"],
    minOrderedPassCount: s01Spec.minOrderedPassCount,
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s01Perfect.correct, true);
  assert.equal(s01Perfect.autonomousMasteryEligible, true);
  assert.equal(s01Perfect.verifiedBy, "deterministic");

  // Revealing answer before attempt -> autonomous mastery ineligible
  const s01Revealed = evaluateOrderedWordsAttempt({
    lessonId: "S01",
    expectedWords: s01Spec.targetWords,
    submittedWords: ["faro", "miele", "aquila", "tamburo", "sciarpa", "razzo"],
    minOrderedPassCount: s01Spec.minOrderedPassCount,
    submittedBeforeReveal: false,
    hintsUsed: 0,
  });
  assert.equal(s01Revealed.autonomousMasteryEligible, false);

  // Inversion detection: swapping pairs so exact matches drop below threshold
  const s01Inverted = evaluateOrderedWordsAttempt({
    lessonId: "S01",
    expectedWords: s01Spec.targetWords,
    submittedWords: ["miele", "faro", "tamburo", "aquila", "razzo", "sciarpa"],
    minOrderedPassCount: s01Spec.minOrderedPassCount,
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s01Inverted.correct, false);
  assert.equal(s01Inverted.errorCategory, "order_omission_inversion");

  // 2. S03: Loci Route selection and blind order verification
  const s03Spec = ACADEMY_V2_MISSIONS["S03"].lociRouteSpec;
  const s03Attempt = evaluateLociRouteAttempt({
    lessonId: "S03",
    selectedLocusIdsInOrder: [
      "ingresso",
      "specchio",
      "lavandino",
      "tappeto",
      "terrazzo",
    ],
    blindReconstructedOrderIds: [
      "ingresso",
      "specchio",
      "lavandino",
      "tappeto",
      "terrazzo",
    ],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s03Attempt.correct, true);
  assert.equal(s03Attempt.autonomousMasteryEligible, true);

  // S03 rejecting duplicate / ambiguous candidate ("sedia-a")
  const s03BadLocus = evaluateLociRouteAttempt({
    lessonId: "S03",
    selectedLocusIdsInOrder: [
      "ingresso",
      "specchio",
      "sedia-a",
      "tappeto",
      "terrazzo",
    ],
    blindReconstructedOrderIds: [
      "ingresso",
      "specchio",
      "sedia-a",
      "tappeto",
      "terrazzo",
    ],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s03BadLocus.correct, false);

  // 3. S04: Builder != Recall! Building scenes alone without blind recall must FAIL
  const s04AttemptBuilderOnly = evaluateBuilderThenBlindRecallAttempt({
    lessonId: "S04",
    builtScenesByCue: {
      frigorifero: { actionVerb: "fischia rumorosamente", sensoryDetail: "suono acuto" },
      tappeto: { actionVerb: "ruota e gira", sensoryDetail: "ago magnetico" },
      finestra: { actionVerb: "si chiude con cerniera", sensoryDetail: "denti metallici" },
    },
    recalledTargetByCue: {
      frigorifero: "", // not recalled
      tappeto: "",
      finestra: "",
    },
    rubricCheckedIndices: [0, 1, 2, 3],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(
    s04AttemptBuilderOnly.correct,
    false,
    "Completing builder without blind recall must NEVER pass"
  );

  const s04FullSuccess = evaluateBuilderThenBlindRecallAttempt({
    lessonId: "S04",
    builtScenesByCue: {
      frigorifero: { actionVerb: "fischia rumorosamente", sensoryDetail: "suono acuto" },
      tappeto: { actionVerb: "ruota e gira", sensoryDetail: "ago magnetico" },
      finestra: { actionVerb: "si chiude con cerniera", sensoryDetail: "denti metallici" },
    },
    recalledTargetByCue: {
      frigorifero: "fischietto",
      tappeto: "bussola",
      finestra: "cerniera",
    },
    rubricCheckedIndices: [0, 1, 2, 3],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s04FullSuccess.correct, true);
  assert.equal(s04FullSuccess.autonomousMasteryEligible, true);

  // 4. S05: Pairs Blind Recall
  const s05Spec = ACADEMY_V2_MISSIONS["S05"].pairsRecallSpec;
  const s05Success = evaluatePairsBlindRecallAttempt({
    lessonId: "S05",
    expectedPairs: s05Spec.studyPairs.map((p) => ({
      cue: p.cue,
      target: p.target,
    })),
    submittedByCue: {
      insegna: "balena",
      finestra: "bussola",
      pianoforte: "zucca",
      fontana: "satellite",
    },
    minCorrectCount: s05Spec.minCorrectCount,
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s05Success.correct, true);
  assert.equal(s05Success.autonomousMasteryEligible, true);

  // 5. S06: Structured plus rubric (spacing & delayed testing verification)
  const s06Success = evaluateStructuredPlusRubricAttempt({
    lessonId: "S06",
    structuredAnswers: {
      "s06-ic-1": "prov",
      "s06-ic-2": "assist",
    },
    openResponseText:
      "Oggi radice e marea sono provisionally_passed perché corrette senza aiuti. Prisma ed estuario sono assisted perché hanno richiesto un indizio. Domani si verifica prima la tenuta degli item assisted.",
    rubricCheckedIndices: [0, 1, 2, 3],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(s06Success.scoreRatio, 1);
  assert.equal(s06Success.verifiedBy, "learner_self_check");
  assert.equal(
    s06Success.autonomousMasteryEligible,
    false,
    "S06 rubric self-check awards practice credit, not automatic mastery"
  );

  // Multi-case classification evaluator test (T04 error taxonomy)
  const t04Success = evaluateMultiCaseClassificationAttempt({
    lessonId: "T04",
    selectedCategoryByCaseId: {
      c1: "omissione",
      c2: "inversione",
      c3: "interferenza",
      c4: "misconception",
    },
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(t04Success.correct, true);
  assert.equal(t04Success.autonomousMasteryEligible, true);

  // 6. Open rubric tasks (`nonEmpty = correct` is strictly forbidden)
  const rubricAttempt = evaluateStructuredPlusRubricAttempt({
    lessonId: "S02",
    structuredAnswers: {
      "s02-ic-1": "fact",
      "s02-ic-2": "causal",
    },
    openResponseText:
      "Per verificare se conosco la definizione formulo una domanda di richiamo attivo senza guardare il foglio. In questo modo elimino l'illusione di competenza.",
    rubricCheckedIndices: [0, 1, 2, 3],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(rubricAttempt.verifiedBy, "learner_self_check");
  assert.equal(
    rubricAttempt.autonomousMasteryEligible,
    false,
    "Open rubric tasks must grant practice credit, never automatic mastery"
  );
  assert.equal(rubricAttempt.scoreRatio, 1);

  // Reject verbatim copying or non-substantive text
  const rubricCopied = evaluateStructuredPlusRubricAttempt({
    lessonId: "S02",
    structuredAnswers: {
      "s02-ic-1": "fact",
      "s02-ic-2": "causal",
    },
    openResponseText: "test", // too short
    rubricCheckedIndices: [],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(rubricCopied.correct, false);
});

test("Major System `major-it-v1` verified lexicon additions (zucchero, teca, rupe, tubo, etc.)", () => {
  assert.equal(encodeItalianWordToMajorDigits("zucchero"), "074");
  assert.equal(encodeItalianWordToMajorDigits("teca"), "17");
  assert.equal(encodeItalianWordToMajorDigits("rupe"), "49");
  assert.equal(encodeItalianWordToMajorDigits("tubo"), "19");
  assert.equal(encodeItalianWordToMajorDigits("raso"), "40");
  assert.equal(encodeItalianWordToMajorDigits("tiro"), "14");
  assert.equal(encodeItalianWordToMajorDigits("fumo"), "83");
  assert.equal(encodeItalianWordToMajorDigits("tana"), "12");
  assert.equal(encodeItalianWordToMajorDigits("nero"), "24");
  assert.equal(encodeItalianWordToMajorDigits("lupo"), "59");
  assert.equal(encodeItalianWordToMajorDigits("gemma"), "63");
  assert.equal(encodeItalianWordToMajorDigits("faccia"), "86");
  assert.equal(encodeItalianWordToMajorDigits("botte"), "91");
  assert.equal(encodeItalianWordToMajorDigits("fiaba"), "89");
  assert.equal(encodeItalianWordToMajorDigits("cippo"), "69");
});

test("Gamification & Idempotent XP: no XP farming on refresh, 5 LOCO levels, 6 badges, and node visual states", () => {
  const initialGam = createDefaultGamificationState();
  assert.equal(initialGam.totalXp, 0);
  assert.equal(LOCO_LEVELS.length, 5);
  assert.equal(ACADEMY_BADGES.length, 6);

  // 1. Awarding XP for lesson S01 completion (+10 XP)
  const firstAward = awardIdempotentXp(
    initialGam,
    "xp-lesson-complete-S01",
    XP_REWARDS.LESSON_COMPLETED,
    "2026-11-07"
  );
  assert.equal(firstAward.awardedNow, 10);
  assert.equal(firstAward.updated.totalXp, 10);
  assert.equal(firstAward.updated.todayXp, 10);
  assert.equal(firstAward.updated.streakDays, 1);

  // 2. Refresh / duplicate call with the same eventId must award 0 XP (anti-farming)
  const duplicateAward = awardIdempotentXp(
    firstAward.updated,
    "xp-lesson-complete-S01",
    XP_REWARDS.LESSON_COMPLETED,
    "2026-11-07"
  );
  assert.equal(duplicateAward.awardedNow, 0, "Duplicate eventId must never farm XP");
  assert.equal(duplicateAward.updated.totalXp, 10);

  // 3. Awarding unit checkpoint (+20 XP) reaches Daily Goal (30/20 XP)
  const checkpointAward = awardIdempotentXp(
    duplicateAward.updated,
    "xp-unit-checkpoint-course-0",
    XP_REWARDS.CHECKPOINT_PASSED,
    "2026-11-07"
  );
  assert.equal(checkpointAward.awardedNow, 20);
  assert.equal(checkpointAward.updated.totalXp, 30);

  // 4. Level resolution
  assert.equal(resolveLocoLevel(30).current.title, "Esploratore");
  assert.equal(resolveLocoLevel(75).current.title, "Costruttore");
  assert.equal(resolveLocoLevel(200).current.title, "Architetto");
  assert.equal(resolveLocoLevel(380).current.title, "Mnemonista");
  assert.equal(resolveLocoLevel(650).current.title, "Maestro dei Loci");

  // 5. Path node visual states (available, in_progress, completed, premium)
  const progMap = createDefaultAcademyProgressMap();
  const s01Node = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["S01"], progMap, "free");
  assert.equal(s01Node.state, "available");

  // Step progress -> in_progress
  progMap["S01"].currentStepIndex = 3;
  const s01InProgress = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["S01"], progMap, "free");
  assert.equal(s01InProgress.state, "in_progress");

  // Provisionally passed -> completed
  progMap["S01"].status = "provisionally_passed";
  const s01Completed = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["S01"], progMap, "free");
  assert.equal(s01Completed.state, "completed");

  // Plus/Pro lesson on free tier -> premium preview state
  const p01Premium = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["P01"], progMap, "free");
  assert.equal(p01Premium.state, "premium");

  // Badge unlock check ("badge-first-memory" unlocked when S01 is passed)
  const badges = computeUnlockedBadgeIds(progMap, checkpointAward.updated, 12);
  assert.ok(badges.includes("badge-first-memory"));
  assert.ok(badges.includes("badge-10-loci"));
});
