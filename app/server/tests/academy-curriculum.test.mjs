import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACADEMY_BADGES,
  ACADEMY_COURSES,
  ACADEMY_LESSONS_BY_ID,
  ACADEMY_V5_MISSIONS,
  ACADEMY_V5_SCHEMA_VERSION,
  ENRICHED_ACADEMY_LESSONS,
  FLAGSHIP_FIXTURES_V5,
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
  evaluateChainRepairA03,
  evaluateCustomLociP03,
  evaluateFaceNameE01,
  evaluateFloorplanRouteP02,
  evaluateItalianMajorPhonemeN03,
  evaluateLessonCheckpointAnswer,
  evaluateMemoryExperimentF01,
  evaluateMnemonicBudgetS03,
  evaluateOrderedCardsC03,
  migrateLegacyCourseProgress,
  reconcileAcademyProgressVersion,
  recordAcademyCheckpointAttempt,
  recordAcademyV2Attempt,
  resolveLocoLevel,
  resolvePathNodeVisualState,
} from "../../components/webapp/loco-academy-curriculum.ts";
import {
  evaluateBuilderThenBlindRecallAttempt,
  evaluateLociRouteAttempt,
  evaluateMultiCaseClassificationAttempt,
  evaluateOrderedWordsAttempt,
  evaluatePairsBlindRecallAttempt,
  evaluatePhoneticDecodeWordsAttempt,
  evaluatePhoneticWordForNumbersAttempt,
  evaluateStructuredPlusRubricAttempt,
} from "../../components/webapp/loco-academy-engine-v5.ts";
import { MAJOR_SYSTEM_TABLE, INITIAL_COURSES } from "../../components/webapp/loco-webapp-data.ts";

test("LOCO Academy 5.0 Catalog: exact 8 courses, 48 lessons, unique IDs, and 37/11 tier split", () => {
  assert.equal(ACADEMY_COURSES.length, 8, "Must have exactly 8 courses/paths in V5");
  assert.equal(ENRICHED_ACADEMY_LESSONS.length, 48, "Must have exactly 48 micro-lessons");

  const ids = ENRICHED_ACADEMY_LESSONS.map((l) => l.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, 48, "All 48 lesson IDs must be unique");

  const tierCounts = ENRICHED_ACADEMY_LESSONS.reduce(
    (acc, l) => {
      acc[l.planTier] = (acc[l.planTier] || 0) + 1;
      return acc;
    },
    { free: 0, plus: 0, pro: 0 }
  );
  assert.deepEqual(
    tierCounts,
    { free: 37, plus: 11, pro: 0 },
    "Must have 37 free (LOCOMPRO DOPO) and 11 plus (POCO LOCO) lessons"
  );

  assert.equal(TIER_NAMING.free.editorialName, "LOCOMPRO DOPO");
  assert.equal(TIER_NAMING.plus.editorialName, "POCO LOCO");
  assert.equal(TIER_NAMING.pro.editorialName, "PRO LOCO");

  const onboardingLessons = ENRICHED_ACADEMY_LESSONS.filter((l) => l.requiredInOnboarding);
  assert.deepEqual(
    onboardingLessons.map((l) => l.id),
    ["F01", "F02", "F03", "F04", "F05"],
    "Only Fondamenta (F01–F05) are mandatory in initial onboarding, and all must be free"
  );
  for (const l of onboardingLessons) {
    assert.equal(l.planTier, "free");
  }
});

test("LOCO Academy 5.0 Prerequisites: valid references and acyclic DAG across all 48 lessons", () => {
  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    assert.ok(lesson.reading.length > 25, `Lesson ${lesson.id} must have editorial reading text`);
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

  // Phonetic evaluation of canonical curriculum words
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
  assert.equal(encodeItalianWordToMajorDigits("coro"), "74", "coro: /k/=7, /r/=4 -> 74");
  assert.equal(encodeItalianWordToMajorDigits("cera"), "64", "cera: /tʃ/=6, /r/=4 -> 64");
});

test("Legacy 9-lesson migration (`c1-l1`..`c3-l3`): maps to reading (`lesson_read`), never `mastered`", () => {
  const legacyIds = INITIAL_COURSES.flatMap((c) => c.lessons.map((l) => l.id));
  assert.equal(legacyIds.length, 9, "Must have 9 legacy lesson IDs");

  for (const id of legacyIds) {
    assert.ok(LEGACY_LESSON_MAP[id], `Legacy ID ${id} must have a migration mapping`);
  }

  const migrated = migrateLegacyCourseProgress(legacyIds, createDefaultAcademyProgressMap());

  for (const targetId of ["F01", "P01", "P02", "P03", "P04", "P05", "A01", "A02", "A03", "A06", "N01", "N02", "N03", "N04"]) {
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
  const f01 = ACADEMY_LESSONS_BY_ID["F01"];
  const initial = createInitialLessonProgress(f01);

  // 1. Viewing answer before attempt must NEVER credit autonomous pass
  const spoiledAttempt = recordAcademyCheckpointAttempt(initial, f01, {
    userAnswer: "pettine, zattera, tulipano, tamburo, calamita",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: true,
    nowIso: "2026-11-08T10:00:00.000Z",
  });
  assert.equal(spoiledAttempt.evaluation.autonomousSuccess, false);
  assert.notEqual(spoiledAttempt.updated.status, "provisionally_passed");
  assert.notEqual(spoiledAttempt.updated.status, "mastered_after_delay");
  assert.equal(spoiledAttempt.updated.viewedAnswerBeforeAttempt, true);

  // 2. Correct answer with hint used is logged and capped (not autonomous pass)
  const fresh = createInitialLessonProgress(f01);
  const hintedAttempt = recordAcademyCheckpointAttempt(fresh, f01, {
    userAnswer: "pettine, zattera, tulipano, tamburo, calamita",
    hintsUsedInAttempt: 1,
    viewedAnswerBeforeAttempt: false,
    nowIso: "2026-11-08T10:05:00.000Z",
  });
  assert.equal(hintedAttempt.evaluation.isCorrect, true);
  assert.equal(hintedAttempt.evaluation.autonomousSuccess, false);
  assert.equal(hintedAttempt.updated.checkpointHintsUsed, 1);
  assert.notEqual(hintedAttempt.updated.status, "provisionally_passed");

  // 3. First unassisted attempt without viewing answer -> `provisionally_passed`
  const unassistedFirst = recordAcademyCheckpointAttempt(fresh, f01, {
    userAnswer: "pettine, zattera, tulipano, tamburo, calamita",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: false,
    nowIso: "2026-11-08T10:10:00.000Z",
  });
  assert.equal(unassistedFirst.evaluation.autonomousSuccess, true);
  assert.equal(unassistedFirst.updated.status, "provisionally_passed");
  assert.ok(unassistedFirst.updated.provisionallyPassedAt);
  assert.equal(unassistedFirst.updated.masteredAfterDelayAt, null);

  // 4. Subsequent delayed unassisted verification -> `mastered_after_delay`
  const delayedSecond = recordAcademyCheckpointAttempt(unassistedFirst.updated, f01, {
    userAnswer: "pettine, zattera, tulipano, tamburo, calamita",
    hintsUsedInAttempt: 0,
    viewedAnswerBeforeAttempt: false,
    isDelayedFollowUp: true,
    nowIso: "2026-11-09T10:15:00.000Z",
  });
  assert.equal(delayedSecond.evaluation.autonomousSuccess, true);
  assert.equal(delayedSecond.updated.status, "mastered_after_delay");
  assert.ok(delayedSecond.updated.masteredAfterDelayAt);

  // 5. Content version bump demotes `mastered_after_delay` to `needs_review` while keeping history
  const reconciled = reconcileAcademyProgressVersion(delayedSecond.updated, {
    contentVersion: "5.1.0",
  });
  assert.equal(reconciled.status, "needs_review");
  assert.equal(reconciled.contentVersion, "5.1.0");
  assert.equal(reconciled.checkpointAttempts, 2);
});

test("LOCO Academy 5.0 Engine: 6 canonical steps per lesson, unique game IDs, and curated assets", () => {
  const canonicalStages = [
    "hook",
    "guided_practice",
    "explanation",
    "demonstration",
    "independent_challenge",
    "diagnostic_feedback",
  ];

  assert.equal(ENRICHED_ACADEMY_LESSONS.length, 48);

  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    assert.equal(
      lesson.contentVersion,
      ACADEMY_V5_SCHEMA_VERSION,
      `Lesson ${lesson.id} must be on version ${ACADEMY_V5_SCHEMA_VERSION}`
    );
    assert.equal(
      lesson.steps.length,
      6,
      `Lesson ${lesson.id} must have exactly 6 canonical steps`
    );

    assert.ok(lesson.v2Mission, `Lesson ${lesson.id} must have v2Mission`);
    assert.equal(
      lesson.v2Mission.gameId,
      `${lesson.id}-lab-v5`,
      `Lesson ${lesson.id} must have unique gameId ${lesson.id}-lab-v5`
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
});

test("Flagship Evaluator F01 (Memory Experiment — Free Recall): exact token check, quantity vs order", () => {
  // Successful autonomous recall (5/5 words)
  const fullPass = evaluateMemoryExperimentF01({
    submittedWords: ["pettine", "zattera", "tulipano", "tamburo", "calamita"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(fullPass.correct, true);
  assert.equal(fullPass.autonomousMasteryEligible, true);
  assert.equal(fullPass.recalledCount, 5);
  assert.equal(fullPass.orderCorrectCount, 5);

  // Partial order, 4/5 words -> passes threshold
  const partialOrder = evaluateMemoryExperimentF01({
    submittedWords: ["calamita", "tulipano", "zattera", "tamburo"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(partialOrder.correct, true);
  assert.equal(partialOrder.recalledCount, 4);

  // Consulted answer before attempt -> autonomous mastery denied
  const spoiled = evaluateMemoryExperimentF01({
    submittedWords: ["pettine", "zattera", "tulipano", "tamburo", "calamita"],
    submittedBeforeReveal: false,
    hintsUsed: 0,
  });
  assert.equal(spoiled.autonomousMasteryEligible, false);

  // Insufficient recall (only 2 words) -> fails
  const lowRecall = evaluateMemoryExperimentF01({
    submittedWords: ["pettine", "zattera"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(lowRecall.correct, false);
});

test("Flagship Evaluator A03 (Chain Repair — Dove si spezza il film?): weak edge, active verb, and recall", () => {
  // Edge 2 (cactus -> campana), active verb, exact 4 words
  const success = evaluateChainRepairA03({
    selectedWeakEdgeIndex: 2,
    repairActionText: "il cactus lancia le spine contro la campana facendola suonare",
    recalledWords: ["gelato", "treno", "cactus", "campana"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Wrong edge (edge 0: gelato -> treno) -> fails
  const wrongEdge = evaluateChainRepairA03({
    selectedWeakEdgeIndex: 0,
    repairActionText: "il cactus lancia le spine",
    recalledWords: ["gelato", "treno", "cactus", "campana"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(wrongEdge.correct, false);
});

test("Flagship Evaluator P02 (Floorplan Route — Dalla porta, gira sempre uguale): clockwise wall progression", () => {
  const success = evaluateFloorplanRouteP02({
    orderedLociIds: ["porta", "lampada", "libreria", "finestra", "scrivania", "divano"],
    blindRecalledNames: ["porta", "lampada", "libreria", "finestra", "scrivania", "divano"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Diagonal skip / scrambled order -> fails
  const scrambled = evaluateFloorplanRouteP02({
    orderedLociIds: ["porta", "divano", "finestra", "lampada", "libreria", "scrivania"],
    blindRecalledNames: ["porta", "lampada", "libreria", "finestra", "scrivania", "divano"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(scrambled.correct, false);
});

test("Flagship Evaluator P03 (Custom Loci — Otto punti, una stanza): 8-point route & random access probes 3, 7, 1", () => {
  const success = evaluateCustomLociP03({
    savedRouteLoci: ["ingresso", "tappeto", "scarpiera", "attaccapanni", "specchio", "comodino", "finestra", "divano"],
    recalledLociInOrder: ["ingresso", "tappeto", "scarpiera", "attaccapanni", "specchio", "comodino", "finestra", "divano"],
    probeAnswers: [
      { probePosition: 3, answerLocus: "scarpiera" },
      { probePosition: 7, answerLocus: "finestra" },
      { probePosition: 1, answerLocus: "ingresso" },
    ],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Wrong random-access probe (says "divano" at probe 3) -> fails
  const wrongProbe = evaluateCustomLociP03({
    savedRouteLoci: ["ingresso", "tappeto", "scarpiera", "attaccapanni", "specchio", "comodino", "finestra", "divano"],
    recalledLociInOrder: ["ingresso", "tappeto", "scarpiera", "attaccapanni", "specchio", "comodino", "finestra", "divano"],
    probeAnswers: [
      { probePosition: 3, answerLocus: "divano" },
      { probePosition: 7, answerLocus: "finestra" },
      { probePosition: 1, answerLocus: "ingresso" },
    ],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(wrongProbe.correct, false);
});

test("Flagship Evaluator N03 (Italian Major Phoneme): C dura=74 vs C dolce=64", () => {
  const success = evaluateItalianMajorPhonemeN03({
    codeCoro: "74",
    codeCera: "64",
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Confusing letter with sound (treating both as 7) -> fails
  const letterConfused = evaluateItalianMajorPhonemeN03({
    codeCoro: "74",
    codeCera: "74",
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(letterConfused.correct, false);
});

test("Flagship Evaluator S03 (Mnemonic Budget): awards practice credit for spending on arbitrary items", () => {
  const success = evaluateMnemonicBudgetS03({
    allocatedItemIds: ["g2", "g4", "g6"], // Vela-7, R-14, 2037
    justificationText: "Dedico i gettoni ai codici arbitrari non deducibili con la logica.",
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.verifiedBy, "learner_self_check");
  assert.equal(
    success.autonomousMasteryEligible,
    false,
    "Mnemonic budget self-check awards practice credit, not automatic mastery"
  );

  // Spending all tokens on deducible causal facts (g1, g3, g5) -> fails efficiency check
  const badBudget = evaluateMnemonicBudgetS03({
    allocatedItemIds: ["g1", "g3", "g5"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(badBudget.correct, false);
});

test("Flagship Evaluator E01 (Face & Name): normalized name recall", () => {
  const success = evaluateFaceNameE01({
    recalledName: " Giorgia ",
    selectedCue: "orecchino triangolare",
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Wrong name -> fails
  const wrongName = evaluateFaceNameE01({
    recalledName: "Giulia",
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(wrongName.correct, false);
});

test("Flagship Evaluator C03 (Ordered Cards): exact card and exact position (1 to 5)", () => {
  const success = evaluateOrderedCardsC03({
    submittedCards: ["A♠", "7♥", "Q♦", "3♣", "10♠"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(success.correct, true);
  assert.equal(success.autonomousMasteryEligible, true);

  // Inverted cards (swapping Q♦ and 7♥) -> fails exact position
  const inverted = evaluateOrderedCardsC03({
    submittedCards: ["A♠", "Q♦", "7♥", "3♣", "10♠"],
    submittedBeforeReveal: true,
    hintsUsed: 0,
  });
  assert.equal(inverted.correct, false);
});

test("Gamification & Idempotent XP: no XP farming on refresh, 5 LOCO levels, 6 badges, and node visual states", () => {
  const initialGam = createDefaultGamificationState("2026-11-08");
  assert.equal(initialGam.totalXp, 0);
  assert.equal(LOCO_LEVELS.length, 5);
  assert.equal(ACADEMY_BADGES.length, 6);

  // 1. Awarding XP for lesson F01 completion (+10 XP)
  const firstAward = awardIdempotentXp(
    initialGam,
    "xp-lesson-complete-F01",
    XP_REWARDS.LESSON_COMPLETED,
    "2026-11-08"
  );
  assert.equal(firstAward.awardedNow, 10);
  assert.equal(firstAward.updated.totalXp, 10);
  assert.equal(firstAward.updated.todayXp, 10);
  assert.equal(firstAward.updated.streakDays, 1);

  // 2. Refresh / duplicate call with the same eventId must award 0 XP (anti-farming)
  const duplicateAward = awardIdempotentXp(
    firstAward.updated,
    "xp-lesson-complete-F01",
    XP_REWARDS.LESSON_COMPLETED,
    "2026-11-08"
  );
  assert.equal(duplicateAward.awardedNow, 0, "Duplicate eventId must never farm XP");
  assert.equal(duplicateAward.updated.totalXp, 10);

  // 3. Awarding unit checkpoint (+20 XP) reaches Daily Goal (30/20 XP)
  const checkpointAward = awardIdempotentXp(
    duplicateAward.updated,
    "xp-unit-checkpoint-course-fondamenta",
    XP_REWARDS.CHECKPOINT_PASSED,
    "2026-11-08"
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
  const f01Node = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["F01"], progMap, "free");
  assert.equal(f01Node.state, "available");

  // Step progress -> in_progress
  progMap["F01"].currentStepIndex = 3;
  const f01InProgress = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["F01"], progMap, "free");
  assert.equal(f01InProgress.state, "in_progress");

  // Provisionally passed -> completed
  progMap["F01"].status = "provisionally_passed";
  const f01Completed = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["F01"], progMap, "free");
  assert.equal(f01Completed.state, "completed");

  // Plus lesson on free tier -> premium preview state
  const c01Premium = resolvePathNodeVisualState(ACADEMY_LESSONS_BY_ID["C01"], progMap, "free");
  assert.equal(c01Premium.state, "premium");

  // Badge unlock check ("badge-first-memory" unlocked when F01 is passed)
  const badges = computeUnlockedBadgeIds(progMap, checkpointAward.updated, 12);
  assert.ok(badges.includes("badge-first-memory"));
  assert.ok(badges.includes("badge-10-loci"));
});
