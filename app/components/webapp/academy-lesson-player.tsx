"use client";

import React, { useState } from "react";
import {
  AcademyLessonProgress,
  AttemptEvidence,
  EnrichedAcademyLesson,
  LessonStepSpec,
  XP_REWARDS,
  encodeItalianWordToMajorDigits,
  recordAcademyV2Attempt,
} from "./loco-academy-curriculum";
import {
  evaluateBuilderThenBlindRecallAttempt,
  evaluateCardsAndNamesDualAttempt,
  evaluateLociRouteAttempt,
  evaluateLongNumberChunksAttempt,
  evaluateMetricsAndTrialsAttempt,
  evaluateMissingLinkAttempt,
  evaluateMultiCaseClassificationAttempt,
  evaluateNumericTransferAttempt,
  evaluateOrderedWordsAttempt,
  evaluatePairsBlindRecallAttempt,
  evaluatePaoSceneCodecAttempt,
  evaluatePhoneticDecodeWordsAttempt,
  evaluatePhoneticWordForNumbersAttempt,
  evaluatePhoneticYearBlocksAttempt,
  evaluateSourceFactCheckAttempt,
  evaluateStructuredPlusRubricAttempt,
  evaluateUnorderedWordsAttempt,
  normalizeAnswerToken,
} from "./loco-academy-engine-v2";

interface AcademyLessonPlayerProps {
  lesson: EnrichedAcademyLesson;
  progress: AcademyLessonProgress;
  nextLessonInCourse: EnrichedAcademyLesson | null;
  onUpdateProgress: (
    updater: (prev: AcademyLessonProgress) => AcademyLessonProgress
  ) => void;
  onRecordMistake: (
    step: LessonStepSpec,
    expectedAnswer: string,
    explanation: string
  ) => void;
  onRecordDirectionalMajorAttempt: (
    direction: "forward" | "reverse",
    isCorrect: boolean
  ) => void;
  onCompleteLessonXp: (
    lessonId: string,
    isPerfectFirstTry: boolean
  ) => { xpEarnedNow: number; bonusXpEarned: number };
  onCreateOnboardingRoute: (
    customAssociations: { locusLabel: string; itemWord: string; actionCue: string }[]
  ) => void;
  onCloseToCoursePath: () => void;
  onStartNextLesson: (nextLessonId: string) => void;
}

export function AcademyLessonPlayer({
  lesson,
  progress,
  nextLessonInCourse,
  onUpdateProgress,
  onRecordMistake,
  onRecordDirectionalMajorAttempt,
  onCompleteLessonXp,
  onCreateOnboardingRoute,
  onCloseToCoursePath,
  onStartNextLesson,
}: AcademyLessonPlayerProps) {
  const initialIndex =
    progress.currentStepIndex > 0 && progress.currentStepIndex < lesson.steps.length
      ? progress.currentStepIndex
      : 0;

  const [stepIndex, setStepIndex] = useState<number>(initialIndex);
  const [expandedReading, setExpandedReading] = useState(false);
  const [mistakesInSession, setMistakesInSession] = useState(0);
  const [hintsInSession, setHintsInSession] = useState(0);
  const [lastChallengeEvidence, setLastChallengeEvidence] =
    useState<AttemptEvidence | null>(
      progress.attemptHistory && progress.attemptHistory.length > 0
        ? progress.attemptHistory[progress.attemptHistory.length - 1]
        : null
    );

  // Step feedback banner
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    detail: string;
    repairAction?: string | null;
    verifiedByBadge?: string;
  } | null>(null);

  // Completion screen state
  const [completionSummary, setCompletionSummary] = useState<{
    xpEarned: number;
    bonusXp: number;
    mistakesCount: number;
    finalStatusLabel: string;
  } | null>(null);

  /* =========================================================================
     PER-STAGE INTERACTIVE STATES (Guided Practice Set A + Challenge Set B)
     ========================================================================= */
  // Stage 4: Demonstration comprehension option
  const [demoSelectedOptionId, setDemoSelectedOptionId] = useState<string | null>(
    null
  );

  // Stage 5: Guided Practice (Set A) states
  const [gpFlashHidden, setGpFlashHidden] = useState(false);
  const [gpOrderedWords, setGpOrderedWords] = useState<string[]>([]);
  const [gpSelectedLocusIds, setGpSelectedLocusIds] = useState<string[]>([]);
  const [gpBuilderValues, setGpBuilderValues] = useState<Record<string, string>>({});
  const [gpMajorInputs, setGpMajorInputs] = useState<Record<string, string>>({});
  const [gpStructuredChoices, setGpStructuredChoices] = useState<
    Record<string, string>
  >({});

  // Stage 6: Independent Challenge (Set B) common states
  const [icSubmittedBeforeReveal, setIcSubmittedBeforeReveal] = useState(true);
  const [icRevealedStudyReference, setIcRevealedStudyReference] = useState(false);
  const [icHintsRevealedCount, setIcHintsRevealedCount] = useState(0);

  // 1 & 2. Ordered / Unordered Flash Recall (`ordered_flash_recall`, `unordered_flash_recall`)
  const [icFlashHidden, setIcFlashHidden] = useState(false);
  const [icRecalledWords, setIcRecalledWords] = useState<string[]>([]);
  const [icWordDraft, setIcWordDraft] = useState("");

  // 3. Loci Route & Blind Order (`loci_route_and_blind_order`)
  const [icRoutePhase, setIcRoutePhase] = useState<"select" | "blind_recall">(
    "select"
  );
  const [icSelectedLociIds, setIcSelectedLociIds] = useState<string[]>([]);
  const [icBlindOrderIds, setIcBlindOrderIds] = useState<string[]>([]);
  const [icSpotCheckId, setIcSpotCheckId] = useState<string>("");

  // 4. Builder Then Blind Recall (`builder_then_blind_recall`)
  const [icBuilderPhase, setIcBuilderPhase] = useState<"build" | "blind_recall">(
    "build"
  );
  const [icBuiltScenes, setIcBuiltScenes] = useState<
    Record<string, { actionVerb: string; sensoryDetail: string }>
  >({});
  const [icRecalledByCue, setIcRecalledByCue] = useState<Record<string, string>>(
    {}
  );

  // 5. Pairs Blind Recall (`pairs_blind_recall`)
  const [icPairsHidden, setIcPairsHidden] = useState(false);
  const [icPairsInputByCue, setIcPairsInputByCue] = useState<
    Record<string, string>
  >({});

  // 6. Missing Link Diagnosis (`missing_link_diagnosis`)
  const [icChainHidden, setIcChainHidden] = useState(false);
  const [icOmittedWord, setIcOmittedWord] = useState("");
  const [icBrokenAfterWord, setIcBrokenAfterWord] = useState("");
  const [icRepairSentence, setIcRepairSentence] = useState("");
  const [icReconstructedChain, setIcReconstructedChain] = useState<string[]>([]);

  // 7, 8, 9, 10, 11. Phonetic / PAO / Long Numbers
  const [icWordByNumber, setIcWordByNumber] = useState<Record<string, string>>({});
  const [icPhoneticRecallPhase, setIcPhoneticRecallPhase] = useState(false);
  const [icRecalledNumbersSlot, setIcRecalledNumbersSlot] = useState<string[]>([]);
  const [icDigitsByWord, setIcDigitsByWord] = useState<Record<string, string>>({});
  const [icYearBlocks, setIcYearBlocks] = useState<
    Record<string, [string, string]>
  >({});
  const [icYearRecallPhase, setIcYearRecallPhase] = useState(false);
  const [icRecalledYears, setIcRecalledYears] = useState<string[]>(["", ""]);
  const [icPaoHidden, setIcPaoHidden] = useState(false);
  const [icPaoRecalledStrings, setIcPaoRecalledStrings] = useState<string[]>([
    "",
    "",
  ]);
  const [icLongDigitsHidden, setIcLongDigitsHidden] = useState(false);
  const [icLongChunksInput, setIcLongChunksInput] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);

  // 12. Multi-Case Classification (`multi_case_classification`)
  const [icCategoryByCase, setIcCategoryByCase] = useState<
    Record<string, string>
  >({});
  const [icFollowUpChoice, setIcFollowUpChoice] = useState<string>("");

  // 13. Numeric Transfer Lab (`numeric_transfer_lab`)
  const [icNumericVal, setIcNumericVal] = useState("");
  const [icNumericUnit, setIcNumericUnit] = useState("V");
  const [icNumericChecks, setIcNumericChecks] = useState<Record<string, string>>(
    {}
  );

  // 14. Metrics & Trials (`metrics_and_trials_lab`)
  const [icMetricsHidden, setIcMetricsHidden] = useState(false);
  const [icMetricsWords, setIcMetricsWords] = useState<string[]>([]);
  const [icMetricsDecisions, setIcMetricsDecisions] = useState<
    Record<string, string>
  >({});

  // 15. Cards & Names Dual Lab (`cards_and_names_dual_lab`)
  const [icCardsHidden, setIcCardsHidden] = useState(false);
  const [icRecalledCards, setIcRecalledCards] = useState<string[]>([]);
  const [icRoleByPerson, setIcRoleByPerson] = useState<Record<string, string>>({});
  const [icDetailByPerson, setIcDetailByPerson] = useState<
    Record<string, string>
  >({});

  // 16. Source Fact Check Lab (`source_fact_check_lab`)
  const [icCardDecisions, setIcCardDecisions] = useState<
    Record<string, "approve" | "reject">
  >({});
  const [icFactCorrectionChoice, setIcFactCorrectionChoice] = useState("");

  // 17. Structured Plus Rubric (`structured_plus_rubric`)
  const [icStructuredAnswers, setIcStructuredAnswers] = useState<
    Record<string, string>
  >({});
  const [icOpenResponseText, setIcOpenResponseText] = useState("");
  const [icRubricChecked, setIcRubricChecked] = useState<number[]>([]);

  const resetExerciseState = () => {
    setFeedback(null);
    setExpandedReading(false);
    setDemoSelectedOptionId(null);
    setGpFlashHidden(false);
    setGpOrderedWords([]);
    setGpSelectedLocusIds([]);
    setGpBuilderValues({});
    setGpMajorInputs({});
    setGpStructuredChoices({});
    setIcSubmittedBeforeReveal(true);
    setIcRevealedStudyReference(false);
    setIcHintsRevealedCount(0);
    setIcFlashHidden(false);
    setIcRecalledWords([]);
    setIcWordDraft("");
    setIcRoutePhase("select");
    setIcSelectedLociIds([]);
    setIcBlindOrderIds([]);
    setIcSpotCheckId("");
    setIcBuilderPhase("build");
    setIcBuiltScenes({});
    setIcRecalledByCue({});
    setIcPairsHidden(false);
    setIcPairsInputByCue({});
    setIcChainHidden(false);
    setIcOmittedWord("");
    setIcBrokenAfterWord("");
    setIcRepairSentence("");
    setIcReconstructedChain([]);
    setIcWordByNumber({});
    setIcPhoneticRecallPhase(false);
    setIcRecalledNumbersSlot([]);
    setIcDigitsByWord({});
    setIcYearBlocks({});
    setIcYearRecallPhase(false);
    setIcRecalledYears(["", ""]);
    setIcPaoHidden(false);
    setIcPaoRecalledStrings(["", ""]);
    setIcLongDigitsHidden(false);
    setIcLongChunksInput(["", "", "", ""]);
    setIcCategoryByCase({});
    setIcFollowUpChoice("");
    setIcNumericVal("");
    setIcNumericUnit("V");
    setIcNumericChecks({});
    setIcMetricsHidden(false);
    setIcMetricsWords([]);
    setIcMetricsDecisions({});
    setIcCardsHidden(false);
    setIcRecalledCards([]);
    setIcRoleByPerson({});
    setIcDetailByPerson({});
    setIcCardDecisions({});
    setIcFactCorrectionChoice("");
    setIcStructuredAnswers({});
    setIcOpenResponseText("");
    setIcRubricChecked([]);
  };

  const currentStep = lesson.steps[stepIndex];
  const mission = lesson.v2Mission;

  const isPureReadingStep =
    currentStep?.type === "hook" ||
    currentStep?.type === "explanation" ||
    currentStep?.type === "expert_walkthrough" ||
    currentStep?.type === "diagnostic_feedback" ||
    currentStep?.type === "reflection_and_next";

  const advanceToNextStep = () => {
    const nextIdx = stepIndex + 1;
    const nowIso = new Date().toISOString();

    if (nextIdx < lesson.steps.length) {
      onUpdateProgress((prev) => ({
        ...prev,
        currentStepIndex: nextIdx,
        completedStepIds: Array.from(
          new Set([...prev.completedStepIds, currentStep.stepId])
        ),
        readCompletedAt:
          currentStep.type === "explanation"
            ? prev.readCompletedAt ?? nowIso
            : prev.readCompletedAt,
      }));
      setStepIndex(nextIdx);
      resetExerciseState();
      return;
    }

    // Completed Stage 8 (`reflection_and_next`)
    onUpdateProgress((prev) => ({
      ...prev,
      currentStepIndex: 0,
      completedStepIds: lesson.steps.map((s) => s.stepId),
    }));

    const isPerfect =
      mistakesInSession === 0 &&
      hintsInSession === 0 &&
      Boolean(lastChallengeEvidence?.autonomousMasteryEligible);
    const { xpEarnedNow, bonusXpEarned } = onCompleteLessonXp(
      lesson.id,
      isPerfect
    );

    const statusBadge =
      lastChallengeEvidence?.verifiedBy === "learner_self_check"
        ? "Pratica completata con autovalutazione guidata (skill_practiced)"
        : lastChallengeEvidence?.autonomousMasteryEligible
          ? "Padronanza provvisoria superata senza aiuti (provisionally_passed)"
          : lastChallengeEvidence?.correct && (lastChallengeEvidence?.hintsUsed ?? 0) > 0
            ? "Richiamo assistito completato (assisted)"
            : "Lezione completata · Ripasso consigliato";

    setCompletionSummary({
      xpEarned: xpEarnedNow || XP_REWARDS.LESSON_COMPLETED,
      bonusXp: bonusXpEarned,
      mistakesCount: mistakesInSession,
      finalStatusLabel: statusBadge,
    });
  };

  /* =========================================================================
     STAGE 4, 5, 6 VERIFICATION HANDLER
     ========================================================================= */
  const handleVerifyStep = () => {
    if (!currentStep) return;

    if (isPureReadingStep) {
      advanceToNextStep();
      return;
    }

    // STAGE 4: DEMONSTRATION COMPREHENSION CHECK
    if (currentStep.type === "demonstration") {
      const chosen = mission.demonstrationOptions.find(
        (o) => o.id === demoSelectedOptionId
      );
      if (!chosen) return;
      if (chosen.isCorrect) {
        setFeedback({
          isCorrect: true,
          headline: "Dimostrazione compresa",
          detail: mission.demonstrationModelReveal,
        });
      } else {
        setMistakesInSession((m) => m + 1);
        setFeedback({
          isCorrect: false,
          headline: "Osserva il principio della dimostrazione",
          detail: mission.demonstrationModelReveal,
        });
      }
      return;
    }

    // STAGE 5: GUIDED PRACTICE (SET A)
    if (currentStep.type === "guided_practice") {
      const gp = mission.guidedPracticeTask;
      let isOk = false;
      let detail = "";

      if (gp.kind === "flash_mini" && gp.flashWords) {
        const exp = gp.flashWords.map(normalizeAnswerToken);
        const sub = gpOrderedWords.map(normalizeAnswerToken);
        isOk =
          gpFlashHidden &&
          exp.length === sub.length &&
          exp.every((w, i) => w === sub[i]);
        detail = isOk
          ? `Ottimo! Hai ricostruito il Set A (${gp.flashWords.join(" → ")}) a lista nascosta.`
          : `Nascondi la lista e seleziona le ${gp.flashWords.length} parole nell'ordine esatto: ${gp.flashWords.join(" → ")}.`;
      } else if (gp.kind === "major_mini" && gp.majorTargets) {
        isOk = gp.majorTargets.every((t) => {
          const val = (gpMajorInputs[t.numberOrWord] ?? "").trim();
          if (t.mode === "encode") {
            return encodeItalianWordToMajorDigits(val) === t.expected;
          }
          return val === t.expected;
        });
        detail = isOk
          ? "Conversione fonetica sul Set A verificata con `major-it-v1`!"
          : "Verifica che ogni parola o cifra rispetti la tabella fonetica `major-it-v1`.";
      } else if (gp.kind === "structured_checks" && gp.checks) {
        isOk = gp.checks.every(
          (c) => gpStructuredChoices[c.id] === c.correctOptionId
        );
        detail = gp.checks.map((c) => c.explanation).join(" ");
      }

      if (isOk) {
        onUpdateProgress((prev) => ({
          ...prev,
          practiceCompletedAt: prev.practiceCompletedAt ?? new Date().toISOString(),
        }));
        setFeedback({
          isCorrect: true,
          headline: "Pratica guidata (Set A) completata",
          detail:
            detail ||
            "Ora passiamo alla Prova Vera su materiale nuovo (Set B) senza aiuti!",
        });
      } else {
        setMistakesInSession((m) => m + 1);
        setFeedback({
          isCorrect: false,
          headline: "Completa la pratica guidata sul Set A",
          detail,
        });
      }
      return;
    }

    // STAGE 6: INDEPENDENT CHALLENGE (SET B — `newStimulus`)
    if (currentStep.type === "independent_challenge") {
      let evidence: AttemptEvidence;

      switch (mission.widgetKind) {
        case "ordered_flash_recall": {
          const spec = mission.orderedFlashSpec!;
          evidence = evaluateOrderedWordsAttempt({
            lessonId: lesson.id,
            expectedWords: spec.targetWords,
            submittedWords: icRecalledWords,
            minOrderedPassCount: spec.minOrderedPassCount,
            submittedBeforeReveal: icSubmittedBeforeReveal && icFlashHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "unordered_flash_recall": {
          const spec = mission.unorderedFlashSpec!;
          evidence = evaluateUnorderedWordsAttempt({
            lessonId: lesson.id,
            expectedWords: spec.targetWords,
            submittedWords: icRecalledWords,
            minRecallCount: spec.minRecallCount,
            submittedBeforeReveal: icSubmittedBeforeReveal && icFlashHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "loci_route_and_blind_order": {
          evidence = evaluateLociRouteAttempt({
            lessonId: lesson.id,
            selectedLocusIdsInOrder: icSelectedLociIds,
            blindReconstructedOrderIds: icBlindOrderIds,
            spotCheckSelectedId: icSpotCheckId || undefined,
            submittedBeforeReveal:
              icSubmittedBeforeReveal && icRoutePhase === "blind_recall",
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "builder_then_blind_recall": {
          evidence = evaluateBuilderThenBlindRecallAttempt({
            lessonId: lesson.id,
            builtScenesByCue: icBuiltScenes,
            recalledTargetByCue: icRecalledByCue,
            rubricCheckedIndices: icRubricChecked,
            submittedBeforeReveal:
              icSubmittedBeforeReveal && icBuilderPhase === "blind_recall",
            hintsUsed: icHintsRevealedCount,
          });
          if (evidence.correct && (lesson.id === "S04" || lesson.id === "L04")) {
            const spec = mission.builderRecallSpec;
            if (spec) {
              const assignments =
                spec.assignments ??
                (spec.itemsToBuild ?? []).map((it) => ({
                  locusOrAnchor: it.locusOrContext ?? "",
                  targetToRemember: it.targetWord ?? "",
                }));
              onCreateOnboardingRoute(
                assignments.map((a) => ({
                  locusLabel: a.locusOrAnchor,
                  itemWord: a.targetToRemember,
                  actionCue: `${a.targetToRemember} ${
                    icBuiltScenes[a.locusOrAnchor]?.actionVerb ?? "agisce su"
                  } ${a.locusOrAnchor} (${
                    icBuiltScenes[a.locusOrAnchor]?.sensoryDetail ?? ""
                  })`,
                }))
              );
            }
          }
          break;
        }
        case "pairs_blind_recall": {
          const spec = mission.pairsRecallSpec!;
          evidence = evaluatePairsBlindRecallAttempt({
            lessonId: lesson.id,
            expectedPairs: spec.studyPairs.map((p) => ({
              cue: p.cue,
              target: p.target,
            })),
            submittedByCue: icPairsInputByCue,
            minCorrectCount: spec.minCorrectCount,
            submittedBeforeReveal: icSubmittedBeforeReveal && icPairsHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "missing_link_diagnosis": {
          evidence = evaluateMissingLinkAttempt({
            lessonId: lesson.id,
            omittedWord: icOmittedWord,
            brokenAfterWord: icBrokenAfterWord,
            repairSentence: icRepairSentence,
            reconstructedChain: icReconstructedChain,
            submittedBeforeReveal: icSubmittedBeforeReveal && icChainHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "phonetic_word_for_numbers": {
          evidence = evaluatePhoneticWordForNumbersAttempt({
            lessonId: lesson.id,
            wordByNumber: icWordByNumber,
            recalledNumberBySlot:
              icRecalledNumbersSlot.length > 0
                ? icRecalledNumbersSlot
                : undefined,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          onRecordDirectionalMajorAttempt("forward", evidence.correct === true);
          break;
        }
        case "phonetic_decode_words": {
          evidence = evaluatePhoneticDecodeWordsAttempt({
            lessonId: lesson.id,
            digitsByWord: icDigitsByWord,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          onRecordDirectionalMajorAttempt("reverse", evidence.correct === true);
          break;
        }
        case "phonetic_year_blocks": {
          evidence = evaluatePhoneticYearBlocksAttempt({
            lessonId: lesson.id,
            blocksByCode: icYearBlocks,
            recalledCodes: icRecalledYears,
            submittedBeforeReveal: icSubmittedBeforeReveal && icYearRecallPhase,
            hintsUsed: icHintsRevealedCount,
          });
          onRecordDirectionalMajorAttempt("forward", evidence.correct === true);
          break;
        }
        case "pao_scene_codec": {
          evidence = evaluatePaoSceneCodecAttempt({
            lessonId: lesson.id,
            recalledSixDigitStrings: icPaoRecalledStrings,
            submittedBeforeReveal: icSubmittedBeforeReveal && icPaoHidden,
            hintsUsed: icHintsRevealedCount,
          });
          onRecordDirectionalMajorAttempt("reverse", evidence.correct === true);
          break;
        }
        case "long_number_chunks": {
          evidence = evaluateLongNumberChunksAttempt({
            lessonId: lesson.id,
            recalledChunksByLocus: icLongChunksInput,
            submittedBeforeReveal: icSubmittedBeforeReveal && icLongDigitsHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "multi_case_classification": {
          evidence = evaluateMultiCaseClassificationAttempt({
            lessonId: lesson.id,
            selectedCategoryByCaseId: icCategoryByCase,
            selectedFollowUpOptionId: icFollowUpChoice || undefined,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "numeric_transfer_lab": {
          evidence = evaluateNumericTransferAttempt({
            lessonId: lesson.id,
            numericValue: icNumericVal,
            selectedUnit: icNumericUnit,
            selectedFollowUpById: icNumericChecks,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "metrics_and_trials_lab": {
          evidence = evaluateMetricsAndTrialsAttempt({
            lessonId: lesson.id,
            recalledWords: icMetricsWords,
            selectedDecisionById: icMetricsDecisions,
            submittedBeforeReveal: icSubmittedBeforeReveal && icMetricsHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "cards_and_names_dual_lab": {
          evidence = evaluateCardsAndNamesDualAttempt({
            lessonId: lesson.id,
            recalledCardsInOrder: icRecalledCards,
            recalledRoleByPerson: icRoleByPerson,
            recalledDetailByPerson: icDetailByPerson,
            submittedBeforeReveal: icSubmittedBeforeReveal && icCardsHidden,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "source_fact_check_lab": {
          evidence = evaluateSourceFactCheckAttempt({
            lessonId: lesson.id,
            decisionByCardId: icCardDecisions,
            selectedCorrectionOptionId: icFactCorrectionChoice,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
        case "structured_plus_rubric":
        default: {
          evidence = evaluateStructuredPlusRubricAttempt({
            lessonId: lesson.id,
            structuredAnswers: icStructuredAnswers,
            openResponseText: icOpenResponseText,
            rubricCheckedIndices: icRubricChecked,
            submittedBeforeReveal: icSubmittedBeforeReveal,
            hintsUsed: icHintsRevealedCount,
          });
          break;
        }
      }

      const stepPassed =
        evidence.correct === true ||
        (evidence.verifiedBy === "learner_self_check" &&
          evidence.scoreRatio >= 1);

      setLastChallengeEvidence(evidence);
      onUpdateProgress((prev) => {
        const res = recordAcademyV2Attempt(prev, lesson, evidence, {
          isDelayedFollowUp: Boolean(prev.provisionallyPassedAt),
        });
        return res.updated;
      });

      const verifiedLabel =
        evidence.verifiedBy === "deterministic"
          ? evidence.autonomousMasteryEligible
            ? "Verifica deterministica · Padronanza autonoma"
            : evidence.hintsUsed > 0
              ? `Verifica deterministica · Assistito (${evidence.hintsUsed} hint)`
              : "Verifica deterministica"
          : "Autovalutazione guidata con rubrica · Pratica registrata (non mastery automatica)";

      if (stepPassed) {
        setFeedback({
          isCorrect: true,
          headline: evidence.summaryHeadline,
          detail: evidence.diagnosticFeedback,
          repairAction: evidence.repairAction,
          verifiedByBadge: verifiedLabel,
        });
      } else {
        setMistakesInSession((m) => m + 1);
        onRecordMistake(
          currentStep,
          lesson.masteryCriterion,
          evidence.diagnosticFeedback
        );
        setFeedback({
          isCorrect: false,
          headline: evidence.summaryHeadline,
          detail: evidence.diagnosticFeedback,
          repairAction: evidence.repairAction,
          verifiedByBadge: verifiedLabel,
        });
      }
    }
  };

  /* =========================================================================
     LESSON COMPLETION SCREEN (Clean White Canvas + Original LOCO Illustration)
     ========================================================================= */
  if (completionSummary) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center py-8 text-center">
        <img
          src="/assets/figma-curated/illustration-finish-runner.svg"
          alt=""
          className="h-44 w-auto object-contain"
        />

        <h1 className="loco-display mt-6 text-[36px] font-bold leading-tight text-[#181818] sm:text-[42px]">
          Grande! Hai completato la lezione.
        </h1>

        <p className="mt-2 max-w-[440px] text-[16px] font-semibold text-[#181818]/80">
          {lesson.id} · {lesson.title}
        </p>

        <p className="mt-2 max-w-[460px] rounded-[14px] bg-[#D2C4F5]/35 px-4 py-2 text-xs font-bold text-[#613BE0]">
          {completionSummary.finalStatusLabel}
        </p>

        {/* Compact XP & Accuracy Pills */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-[#FFD014] px-5 py-2 text-sm font-bold text-[#181818]">
            +{completionSummary.xpEarned + completionSummary.bonusXp} XP
          </span>
          <span className="rounded-full bg-[#D2C4F5]/60 px-5 py-2 text-sm font-semibold text-[#181818]">
            {completionSummary.mistakesCount === 0
              ? "Percorso netto al primo tentativo"
              : `${completionSummary.mistakesCount} ${
                  completionSummary.mistakesCount === 1
                    ? "errore salvato"
                    : "errori salvati"
                } per il ripasso`}
          </span>
        </div>

        {/* One Clear Primary Next Action */}
        <div className="mt-8 flex w-full max-w-[320px] flex-col gap-3">
          {nextLessonInCourse ? (
            <button
              type="button"
              onClick={() => onStartNextLesson(nextLessonInCourse.id)}
              className="w-full rounded-[15px] bg-[#613BE0] px-8 py-3.5 text-[16px] font-bold text-white transition hover:bg-[#4B2FC4]"
            >
              Prossima lezione ({nextLessonInCourse.id})
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCloseToCoursePath}
            className={`w-full rounded-[15px] px-8 py-3 text-[15px] font-bold transition ${
              nextLessonInCourse
                ? "border border-[#181818]/15 bg-white text-[#181818] hover:bg-[#D2C4F5]/25"
                : "bg-[#613BE0] text-white hover:bg-[#4B2FC4]"
            }`}
          >
            Torna al percorso del corso
          </button>
        </div>
      </div>
    );
  }

  if (!currentStep) return null;

  const progressPercent = Math.round(
    ((stepIndex + 1) / lesson.steps.length) * 100
  );

  /* =========================================================================
     DISTRACTION-FREE LESSON PLAYER (Top Bar + Centered Activity + Bottom CTA)
     ========================================================================= */
  return (
    <div className="mx-auto flex min-h-[74vh] max-w-[680px] flex-col justify-between pb-8">
      {/* TOP BAR: Back/Close + Thin Progress Bar + Minimal Step Indicator */}
      <div className="flex items-center gap-4 pb-6">
        <button
          type="button"
          onClick={() => {
            if (stepIndex > 0) {
              const prevIdx = stepIndex - 1;
              onUpdateProgress((prev) => ({
                ...prev,
                currentStepIndex: prevIdx,
              }));
              setStepIndex(prevIdx);
              resetExerciseState();
            } else {
              onCloseToCoursePath();
            }
          }}
          aria-label="Indietro"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#181818]/15 bg-white text-[#181818] transition hover:border-[#613BE0] hover:text-[#613BE0]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Thin Progress Bar */}
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#D2C4F5]/55">
          <div
            className="h-full rounded-full bg-[#613BE0] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <span className="shrink-0 text-xs font-semibold text-[#181818]/60">
          {stepIndex + 1} / {lesson.steps.length}
        </span>

        <button
          type="button"
          onClick={onCloseToCoursePath}
          aria-label="Chiudi lezione"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#181818]/50 transition hover:bg-[#181818]/5 hover:text-[#181818]"
        >
          ✕
        </button>
      </div>

      {/* CENTER STAGE */}
      <div className="my-auto py-3">
        {/* Stage Pill */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#D2C4F5]/45 px-3.5 py-1 text-[11px] font-bold tracking-wide text-[#613BE0] uppercase">
            {currentStep.stageLabel}
          </span>
          <span className="text-xs font-semibold text-[#181818]/55">
            {lesson.id} · v{lesson.contentVersion}
          </span>
        </div>

        {/* Illustrations on narrative stages (`hook`, `explanation`) */}
        {(currentStep.type === "hook" ||
          currentStep.type === "explanation") && (
          <div className="mb-5 flex justify-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-[28px] bg-[#D2C4F5]/35 p-4">
              <img
                src={currentStep.illustrationAsset}
                alt=""
                className="max-h-full w-auto object-contain"
              />
            </div>
          </div>
        )}

        <h1 className="loco-display text-[26px] font-bold leading-snug text-[#181818] sm:text-[31px]">
          {currentStep.title}
        </h1>

        <p className="mt-3 whitespace-pre-line text-[16px] leading-relaxed text-[#181818]/85">
          {currentStep.bodyText}
        </p>

        {/* Expandable Full Reading on Stage 2 (`explanation`) */}
        {currentStep.expandableFullText &&
          currentStep.expandableFullText.length >
            currentStep.bodyText.length && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpandedReading((v) => !v)}
                className="text-xs font-bold text-[#613BE0] hover:underline"
              >
                {expandedReading
                  ? "Riduci spiegazione completa ↑"
                  : "Leggi spiegazione completa ↓"}
              </button>
              {expandedReading && (
                <div className="mt-2.5 rounded-[18px] bg-[#D2C4F5]/25 p-4 text-sm leading-relaxed text-[#181818]">
                  {currentStep.expandableFullText}
                </div>
              )}
            </div>
          )}

        {/* Stage 2 Learning Objective */}
        {currentStep.type === "explanation" && (
          <div className="mt-4 rounded-[16px] border border-[#613BE0]/20 bg-[#D2C4F5]/20 px-4 py-3 text-xs leading-relaxed text-[#181818]">
            <strong className="text-[#613BE0]">Obiettivo operativo:</strong>{" "}
            {lesson.v2LearningObjective}
          </div>
        )}

        {/* Stage 3 Expert Walkthrough Common Mistakes */}
        {currentStep.type === "expert_walkthrough" &&
          lesson.v2CommonMistakes.length > 0 && (
            <div className="mt-5 rounded-[18px] border border-[#181818]/12 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#613BE0]">
                Trappole da evitare in questa competenza:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-[#181818]/85">
                {lesson.v2CommonMistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-[#613BE0]">•</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Stage 4 Demonstration Active Check */}
        {currentStep.type === "demonstration" && (
          <div className="mt-6 space-y-3 rounded-[20px] border border-[#181818]/12 bg-white p-5">
            {currentStep.scientificNote && (
              <div className="rounded-[12px] bg-[#D2C4F5]/30 px-3.5 py-2.5 text-xs text-[#181818]/80">
                {currentStep.scientificNote}
              </div>
            )}
            <p className="text-sm font-bold text-[#181818]">
              {mission.demonstrationQuestion}
            </p>
            <div className="space-y-2.5">
              {mission.demonstrationOptions.map((opt) => {
                const isSelected = demoSelectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDemoSelectedOptionId(opt.id)}
                    className={`w-full rounded-[16px] border-2 p-3.5 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-[#613BE0] bg-[#D2C4F5]/30 font-semibold text-[#181818]"
                        : "border-[#181818]/15 bg-white text-[#181818] hover:border-[#613BE0]/60"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===============================================================
            STAGE 5: GUIDED PRACTICE (SET A)
            =============================================================== */}
        {currentStep.type === "guided_practice" && (
          <div className="mt-6 rounded-[20px] border border-[#181818]/15 bg-white p-5">
            <p className="mb-4 text-xs font-bold uppercase tracking-wide text-[#613BE0]">
              {mission.guidedPracticePrompt}
            </p>

            {/* Set A: Flash Mini */}
            {mission.guidedPracticeTask.kind === "flash_mini" &&
              mission.guidedPracticeTask.flashWords && (
                <div className="space-y-4">
                  {!gpFlashHidden ? (
                    <div className="space-y-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2.5">
                        {mission.guidedPracticeTask.flashWords.map((w, i) => (
                          <span
                            key={w}
                            className="rounded-[14px] bg-[#D2C4F5]/45 px-4 py-2.5 text-sm font-bold text-[#181818]"
                          >
                            {i + 1}. {w}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setGpFlashHidden(true)}
                        className="rounded-[15px] bg-[#613BE0] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
                      >
                        Nascondi Set A e ricostruisci l&apos;ordine
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#181818]/75">
                        Tocca le parole del Set A nell&apos;ordine 1 →{" "}
                        {mission.guidedPracticeTask.flashWords.length}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[...mission.guidedPracticeTask.flashWords]
                          .sort((a, b) => a.localeCompare(b))
                          .map((w) => {
                            const used = gpOrderedWords.includes(w);
                            return (
                              <button
                                key={w}
                                type="button"
                                disabled={used}
                                onClick={() =>
                                  setGpOrderedWords((prev) => [...prev, w])
                                }
                                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition ${
                                  used
                                    ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                                    : "border-[#613BE0] bg-white text-[#181818] hover:bg-[#D2C4F5]/30"
                                }`}
                              >
                                {w}
                              </button>
                            );
                          })}
                      </div>
                      <div className="flex items-center justify-between rounded-[14px] bg-[#D2C4F5]/25 px-3.5 py-2.5 text-xs">
                        <span className="font-bold text-[#181818]">
                          Ordine scelto: {gpOrderedWords.join(" → ") || "—"}
                        </span>
                        {gpOrderedWords.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setGpOrderedWords([])}
                            className="font-bold text-[#613BE0] hover:underline"
                          >
                            Azzera
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* Set A: Major Mini */}
            {mission.guidedPracticeTask.kind === "major_mini" &&
              mission.guidedPracticeTask.majorTargets && (
                <div className="space-y-3">
                  {mission.guidedPracticeTask.majorTargets.map((t) => (
                    <div
                      key={t.numberOrWord}
                      className="flex flex-col gap-2 rounded-[14px] border border-[#181818]/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-xs font-bold text-[#181818]">
                        {t.mode === "encode"
                          ? `Numero «${t.numberOrWord}» → Parola italiana:`
                          : `Parola «${t.numberOrWord}» → Cifre major-it-v1:`}
                      </span>
                      <input
                        type="text"
                        value={gpMajorInputs[t.numberOrWord] ?? ""}
                        onChange={(e) =>
                          setGpMajorInputs((prev) => ({
                            ...prev,
                            [t.numberOrWord]: e.target.value,
                          }))
                        }
                        placeholder={
                          t.mode === "encode"
                            ? "es. toro, mano, luna..."
                            : `es. ${t.expected}`
                        }
                        className="rounded-[12px] border border-[#181818]/20 bg-white px-3 py-1.5 text-xs text-[#181818] outline-none focus:border-[#613BE0]"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* Set A: Structured Checks */}
            {mission.guidedPracticeTask.kind === "structured_checks" &&
              mission.guidedPracticeTask.checks && (
                <div className="space-y-4">
                  {mission.guidedPracticeTask.checks.map((chk) => (
                    <div key={chk.id} className="space-y-2">
                      <p className="text-sm font-bold text-[#181818]">
                        {chk.prompt}
                      </p>
                      <div className="space-y-2">
                        {chk.options.map((opt) => {
                          const chosen = gpStructuredChoices[chk.id] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                setGpStructuredChoices((prev) => ({
                                  ...prev,
                                  [chk.id]: opt.id,
                                }))
                              }
                              className={`w-full rounded-[14px] border-2 p-3 text-left text-xs font-medium transition ${
                                chosen
                                  ? "border-[#613BE0] bg-[#D2C4F5]/35 font-semibold text-[#181818]"
                                  : "border-[#181818]/15 bg-white text-[#181818]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ===============================================================
            STAGE 6: INDEPENDENT CHALLENGE (SET B — `newStimulus`)
            =============================================================== */}
        {currentStep.type === "independent_challenge" && (
          <div className="mt-6 space-y-4 rounded-[22px] border-2 border-[#613BE0]/25 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#181818]/10 pb-3">
              <div>
                <span className="text-xs font-bold text-[#613BE0]">
                  MISSIONE: {mission.gameId} · Dataset {mission.datasetVersion}
                </span>
                <p className="mt-0.5 text-[13px] font-medium text-[#181818]/80">
                  {mission.independentPrompt}
                </p>
              </div>
            </div>

            {/* WIDGET 1 & 2: ORDERED / UNORDERED FLASH RECALL */}
            {(mission.widgetKind === "ordered_flash_recall" ||
              mission.widgetKind === "unordered_flash_recall") && (
              <div className="space-y-4">
                {(() => {
                  const targetWords =
                    mission.orderedFlashSpec?.targetWords ??
                    mission.unorderedFlashSpec?.targetWords ??
                    [];
                  const isOrdered =
                    mission.widgetKind === "ordered_flash_recall";
                  return !icFlashHidden ? (
                    <div className="space-y-4 rounded-[18px] bg-[#D2C4F5]/20 p-4 text-center">
                      <p className="text-xs font-bold text-[#181818]/75">
                        FASE 1 · Osserva e codifica il Set B inedito (
                        {targetWords.length} elementi):
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {targetWords.map((w, idx) => (
                          <span
                            key={w}
                            className="rounded-[12px] border border-[#613BE0]/25 bg-white px-3.5 py-2 text-sm font-bold text-[#181818]"
                          >
                            {isOrdered ? `${idx + 1}. ` : ""}
                            {w}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIcFlashHidden(true)}
                        className="rounded-[15px] bg-[#613BE0] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
                      >
                        Nascondi lista e passa al richiamo cieco
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#613BE0]">
                        FASE 2 · Lista nascosta! Ricostruisci{" "}
                        {isOrdered
                          ? `l'ordine esatto 1 → ${targetWords.length}`
                          : `almeno ${mission.unorderedFlashSpec?.minRecallCount} su ${targetWords.length} elementi`}
                        :
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[...targetWords]
                          .sort((a, b) => a.localeCompare(b))
                          .map((w) => {
                            const used = icRecalledWords.some(
                              (rw) =>
                                normalizeAnswerToken(rw) ===
                                normalizeAnswerToken(w)
                            );
                            return (
                              <button
                                key={w}
                                type="button"
                                disabled={used}
                                onClick={() =>
                                  setIcRecalledWords((prev) => [...prev, w])
                                }
                                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                                  used
                                    ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                                    : "border-[#613BE0] bg-white text-[#181818] hover:bg-[#D2C4F5]/30"
                                }`}
                              >
                                {w}
                              </button>
                            );
                          })}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={icWordDraft}
                          onChange={(e) => setIcWordDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && icWordDraft.trim()) {
                              e.preventDefault();
                              setIcRecalledWords((prev) => [
                                ...prev,
                                icWordDraft.trim(),
                              ]);
                              setIcWordDraft("");
                            }
                          }}
                          placeholder="Oppure digita una parola e premi Invio..."
                          className="flex-1 rounded-[12px] border border-[#181818]/20 px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                        />
                        {icRecalledWords.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIcRecalledWords([])}
                            className="text-xs font-bold text-[#613BE0] hover:underline"
                          >
                            Azzera ({icRecalledWords.length})
                          </button>
                        )}
                      </div>
                      <div className="min-h-[44px] rounded-[14px] bg-[#D2C4F5]/25 p-3 text-xs font-bold text-[#181818]">
                        {icRecalledWords.length > 0
                          ? icRecalledWords
                              .map((w, i) => `${i + 1}. ${w}`)
                              .join(" → ")
                          : "Nessun elemento ancora inserito"}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* WIDGET 3: LOCI ROUTE & BLIND ORDER */}
            {mission.widgetKind === "loci_route_and_blind_order" &&
              mission.lociRouteSpec && (() => {
                const candidates =
                  mission.lociRouteSpec.candidates ??
                  (mission.lociRouteSpec.candidateStops ?? []).map((s) => ({
                    id: s.id,
                    label: s.label,
                    isValid: !s.isAmbiguousDistractor,
                    zone: s.zone,
                  }));
                const reqCount =
                  mission.lociRouteSpec.requiredValidCount ??
                  mission.lociRouteSpec.expectedOrderedStopIds?.length ??
                  5;
                const spotCheckIndex = mission.lociRouteSpec.spotCheckIndex;

                return (
                  <div className="space-y-4">
                    {icRoutePhase === "select" ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#181818]/80">
                          FASE 1 (Costruzione) · Seleziona nell&apos;ordine di
                          percorrenza esattamente {reqCount} loci fissi e
                          distinti (scarta gli oggetti mobili o duplicati):
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {candidates.map((cand) => {
                            const idx = icSelectedLociIds.indexOf(cand.id);
                            const isSelected = idx !== -1;
                            return (
                              <button
                                key={cand.id}
                                type="button"
                                onClick={() =>
                                  setIcSelectedLociIds((prev) =>
                                    prev.includes(cand.id)
                                      ? prev.filter((id) => id !== cand.id)
                                      : [...prev, cand.id]
                                  )
                                }
                                className={`flex items-center justify-between rounded-[14px] border-2 p-3 text-left text-xs font-semibold transition ${
                                  isSelected
                                    ? "border-[#613BE0] bg-[#D2C4F5]/35 text-[#181818]"
                                    : "border-[#181818]/15 bg-white text-[#181818]"
                                }`}
                              >
                                <div>
                                  <div className="font-bold">{cand.label}</div>
                                  <div className="text-[11px] text-[#181818]/60">
                                    {cand.zone}
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="rounded-full bg-[#613BE0] px-2.5 py-0.5 text-[11px] font-bold text-white">
                                    #{idx + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {icSelectedLociIds.length === reqCount && (
                          <button
                            type="button"
                            onClick={() => setIcRoutePhase("blind_recall")}
                            className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white transition hover:bg-[#4B2FC4]"
                          >
                            Nascondi i numeri e passa alla verifica cieca dell&apos;ordine →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-xs font-bold text-[#613BE0]">
                          FASE 2 (Verifica cieca a etichette nascoste) · Tocca i
                          tuoi {reqCount} loci nell&apos;ordine esatto 1 → {reqCount}:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[...icSelectedLociIds]
                            .sort((a, b) => a.localeCompare(b))
                            .map((id) => {
                              const cand = candidates.find((c) => c.id === id);
                              const used = icBlindOrderIds.includes(id);
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  disabled={used}
                                  onClick={() =>
                                    setIcBlindOrderIds((prev) => [...prev, id])
                                  }
                                  className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                                    used
                                      ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                                      : "border-[#613BE0] bg-white text-[#181818]"
                                  }`}
                                >
                                  {cand?.label ?? id}
                                </button>
                              );
                            })}
                        </div>
                        <div className="flex items-center justify-between rounded-[12px] bg-[#D2C4F5]/25 px-3 py-2 text-xs">
                          <span className="font-bold text-[#181818]">
                            Sequenza ricostruita ({icBlindOrderIds.length}/{reqCount}):{" "}
                            {icBlindOrderIds
                              .map(
                                (id, i) =>
                                  `${i + 1}. ${
                                    candidates.find((c) => c.id === id)?.label ?? id
                                  }`
                              )
                              .join(" → ")}
                          </span>
                          {icBlindOrderIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIcBlindOrderIds([])}
                              className="font-bold text-[#613BE0] hover:underline"
                            >
                              Azzera
                            </button>
                          )}
                        </div>

                        {spotCheckIndex !== undefined && (
                          <div className="space-y-2 rounded-[14px] border border-[#181818]/15 p-3">
                            <p className="text-xs font-bold text-[#181818]">
                              Domanda fuori ordine: qual è esattamente il Locus #{spotCheckIndex}?
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {icSelectedLociIds.map((id) => {
                                const cand = candidates.find((c) => c.id === id);
                                return (
                                  <button
                                    key={`spot-${id}`}
                                    type="button"
                                    onClick={() => setIcSpotCheckId(id)}
                                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                      icSpotCheckId === id
                                        ? "border-[#613BE0] bg-[#613BE0] text-white"
                                        : "border-[#181818]/20 bg-white text-[#181818]"
                                    }`}
                                  >
                                    {cand?.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 4: BUILDER THEN BLIND RECALL */}
            {mission.widgetKind === "builder_then_blind_recall" &&
              mission.builderRecallSpec && (() => {
                const assignments =
                  mission.builderRecallSpec.assignments ??
                  (mission.builderRecallSpec.itemsToBuild ?? []).map((it) => ({
                    locusOrAnchor: it.locusOrContext,
                    targetToRemember: it.targetWord,
                    suggestedVerbs: ["tocca", "ruota", "preme"],
                    suggestedSensory: ["vibra forte", "superficie fredda", "odore pungente"],
                  }));

                return (
                  <div className="space-y-4">
                    {icBuilderPhase === "build" ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#181818]/80">
                          FASE 1 (Costruzione — non vale ancora come memoria) ·
                          Crea un&apos;azione fisica + un dettaglio sensoriale per
                          ciascun punto:
                        </p>
                        {assignments.map((item) => {
                          const currentScene = icBuiltScenes[
                            item.locusOrAnchor
                          ] ?? {
                            actionVerb: "",
                            sensoryDetail: "",
                          };
                          const verbs = item.suggestedVerbs ?? ["tocca", "ruota"];
                          const sensory = item.suggestedSensory ?? ["vibra forte", "freddo"];
                          return (
                            <div
                              key={item.locusOrAnchor}
                              className="space-y-2 rounded-[14px] border border-[#181818]/15 bg-[#D2C4F5]/15 p-3.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#181818]">
                                <span>
                                  Ancora: «{item.locusOrAnchor}» → Bersaglio da
                                  ricordare: «{item.targetToRemember}»
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setIcBuiltScenes((prev) => ({
                                      ...prev,
                                      [item.locusOrAnchor]: {
                                        actionVerb: verbs[0],
                                        sensoryDetail: sensory[0],
                                      },
                                    }))
                                  }
                                  className="text-[#613BE0] hover:underline"
                                >
                                  Compila rapido con i suggeriti
                                </button>
                              </div>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <input
                                  type="text"
                                  value={currentScene.actionVerb}
                                  onChange={(e) =>
                                    setIcBuiltScenes((prev) => ({
                                      ...prev,
                                      [item.locusOrAnchor]: {
                                        ...currentScene,
                                        actionVerb: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder={`Verbo d'azione (es. ${verbs.join(", ")})`}
                                  className="rounded-[10px] border border-[#181818]/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                                />
                                <input
                                  type="text"
                                  value={currentScene.sensoryDetail}
                                  onChange={(e) =>
                                    setIcBuiltScenes((prev) => ({
                                      ...prev,
                                      [item.locusOrAnchor]: {
                                        ...currentScene,
                                        sensoryDetail: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder={`Dettaglio sensoriale (es. ${sensory.join(", ")})`}
                                  className="rounded-[10px] border border-[#181818]/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                                />
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setIcBuilderPhase("blind_recall")}
                          className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white transition hover:bg-[#4B2FC4]"
                        >
                          Nascondi le scene e passa al Richiamo Cieco (Fase 2) →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#613BE0]">
                          FASE 2 (Richiamo Cieco a bersagli nascosti) · Ora vedi
                          solo l&apos;ancora spaziale: scrivi il bersaglio esatto!
                        </p>
                        {assignments.map((item) => (
                          <div
                            key={`recall-${item.locusOrAnchor}`}
                            className="flex flex-col gap-2 rounded-[14px] border border-[#181818]/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <span className="text-xs font-bold text-[#181818]">
                              Ancora «{item.locusOrAnchor}» → Qual era il
                              bersaglio?
                            </span>
                            <input
                              type="text"
                              value={icRecalledByCue[item.locusOrAnchor] ?? ""}
                              onChange={(e) =>
                                setIcRecalledByCue((prev) => ({
                                  ...prev,
                                  [item.locusOrAnchor]: e.target.value,
                                }))
                              }
                              placeholder="Scrivi il bersaglio a memoria..."
                              className="rounded-[10px] border border-[#181818]/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 5: PAIRS BLIND RECALL */}
            {mission.widgetKind === "pairs_blind_recall" &&
              mission.pairsRecallSpec && (
                <div className="space-y-4">
                  {!icPairsHidden ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#181818]/80">
                        FASE 1 · Osserva le ancore del Set B prima che le
                        risposte vengano nascoste:
                      </p>
                      <div className="space-y-2">
                        {mission.pairsRecallSpec.studyPairs.map((pair) => (
                          <div
                            key={pair.cue}
                            className="rounded-[14px] bg-[#D2C4F5]/25 p-3 text-xs"
                          >
                            <div className="font-bold text-[#181818]">
                              {pair.cue} →{" "}
                              <span className="text-[#613BE0]">
                                «{pair.target}»
                              </span>
                            </div>
                            <div className="mt-0.5 text-[#181818]/70">
                              {pair.contextHint}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIcPairsHidden(true)}
                        className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white transition hover:bg-[#4B2FC4]"
                      >
                        Nascondi risposte e avvia il Blind Recall →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-[#613BE0]">
                        FASE 2 · Risposte nascoste! Digita il bersaglio esatto
                        per ciascuna ancora:
                      </p>
                      {mission.pairsRecallSpec.studyPairs.map((pair) => (
                        <div
                          key={`blind-${pair.cue}`}
                          className="flex flex-col gap-2 rounded-[14px] border border-[#181818]/15 p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-xs font-bold text-[#181818]">
                            {pair.cue}
                          </span>
                          <input
                            type="text"
                            value={icPairsInputByCue[pair.cue] ?? ""}
                            onChange={(e) =>
                              setIcPairsInputByCue((prev) => ({
                                ...prev,
                                [pair.cue]: e.target.value,
                              }))
                            }
                            placeholder="Risposta a memoria..."
                            className="rounded-[10px] border border-[#181818]/20 bg-white px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* WIDGET 6: MISSING LINK DIAGNOSIS (K04) */}
            {mission.widgetKind === "missing_link_diagnosis" &&
              mission.missingLinkSpec && (
                <div className="space-y-4">
                  {!icChainHidden ? (
                    <div className="space-y-3 text-center">
                      <p className="text-xs font-bold text-[#181818]/80">
                        Catena originale memorizzata (7 voci):
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {mission.missingLinkSpec.memorizedChain.map((w, i) => (
                          <span
                            key={w}
                            className="rounded-full bg-[#D2C4F5]/45 px-3.5 py-1.5 text-xs font-bold text-[#181818]"
                          >
                            {i + 1}. {w}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIcChainHidden(true)}
                        className="rounded-[15px] bg-[#613BE0] px-6 py-2.5 text-xs font-bold text-white"
                      >
                        Nascondi catena originale e ripara il guasto →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-[14px] bg-[#FFD014]/25 p-3 text-xs font-semibold text-[#181818]">
                        Richiamo corrotto ottenuto:{" "}
                        {mission.missingLinkSpec.corruptedRecall.join(" → ")}
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <input
                          type="text"
                          value={icOmittedWord}
                          onChange={(e) => setIcOmittedWord(e.target.value)}
                          placeholder="1. Quale parola è stata omessa?"
                          className="rounded-[10px] border border-[#181818]/20 px-3 py-2 text-xs outline-none focus:border-[#613BE0]"
                        />
                        <input
                          type="text"
                          value={icBrokenAfterWord}
                          onChange={(e) => setIcBrokenAfterWord(e.target.value)}
                          placeholder="2. Subito dopo quale parola si è rotto il ponte?"
                          className="rounded-[10px] border border-[#181818]/20 px-3 py-2 text-xs outline-none focus:border-[#613BE0]"
                        />
                      </div>
                      <input
                        type="text"
                        value={icRepairSentence}
                        onChange={(e) => setIcRepairSentence(e.target.value)}
                        placeholder="3. Scrivi la nuova azione che salda i due elementi..."
                        className="w-full rounded-[10px] border border-[#181818]/20 px-3 py-2 text-xs outline-none focus:border-[#613BE0]"
                      />
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#181818]">
                          4. Ricostruisci l&apos;intera catena di 7 parole:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...mission.missingLinkSpec.memorizedChain]
                            .sort((a, b) => a.localeCompare(b))
                            .map((w) => {
                              const used = icReconstructedChain.includes(w);
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  disabled={used}
                                  onClick={() =>
                                    setIcReconstructedChain((prev) => [
                                      ...prev,
                                      w,
                                    ])
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                    used
                                      ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                                      : "border-[#613BE0] bg-white text-[#181818]"
                                  }`}
                                >
                                  {w}
                                </button>
                              );
                            })}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">
                            {icReconstructedChain.join(" → ") || "—"}
                          </span>
                          {icReconstructedChain.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIcReconstructedChain([])}
                              className="font-bold text-[#613BE0]"
                            >
                              Azzera
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* WIDGET 7: PHONETIC WORD FOR NUMBERS (N01, Q01) */}
            {mission.widgetKind === "phonetic_word_for_numbers" &&
              mission.phoneticNumbersSpec && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {mission.phoneticNumbersSpec.targetNumbers.map((num) => {
                      const val = icWordByNumber[num] ?? "";
                      const liveDigits = encodeItalianWordToMajorDigits(val);
                      return (
                        <div
                          key={num}
                          className="flex items-center justify-between gap-2 rounded-[12px] border border-[#181818]/15 p-2.5"
                        >
                          <span className="w-10 text-sm font-bold text-[#613BE0]">
                            {num}
                          </span>
                          <input
                            type="text"
                            value={val}
                            onChange={(e) =>
                              setIcWordByNumber((prev) => ({
                                ...prev,
                                [num]: e.target.value,
                              }))
                            }
                            placeholder="Parola major-it-v1..."
                            className="flex-1 rounded-[8px] border border-[#181818]/20 px-2.5 py-1 text-xs outline-none focus:border-[#613BE0]"
                          />
                          <span
                            className={`text-[11px] font-bold ${
                              liveDigits === num
                                ? "text-[#613BE0]"
                                : "text-[#181818]/45"
                            }`}
                          >
                            {liveDigits || "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* WIDGET 8: PHONETIC DECODE WORDS (N02, N04, Q04) */}
            {mission.widgetKind === "phonetic_decode_words" &&
              mission.phoneticDecodeSpec && (
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {mission.phoneticDecodeSpec.words.map((word) => (
                    <div
                      key={word}
                      className="flex items-center justify-between gap-2 rounded-[12px] border border-[#181818]/15 p-2.5"
                    >
                      <span className="text-xs font-bold text-[#181818]">
                        «{word}» →
                      </span>
                      <input
                        type="text"
                        value={icDigitsByWord[word] ?? ""}
                        onChange={(e) =>
                          setIcDigitsByWord((prev) => ({
                            ...prev,
                            [word]: e.target.value,
                          }))
                        }
                        placeholder="Cifre (es. 02, 70)..."
                        className="w-28 rounded-[8px] border border-[#181818]/20 px-2.5 py-1 text-xs font-bold outline-none focus:border-[#613BE0]"
                      />
                    </div>
                  ))}
                </div>
              )}

            {/* WIDGET 9: PHONETIC YEAR BLOCKS (N03) */}
            {mission.widgetKind === "phonetic_year_blocks" &&
              mission.phoneticBlocksSpec && (
                <div className="space-y-4">
                  {!icYearRecallPhase ? (
                    <div className="space-y-3">
                      {mission.phoneticBlocksSpec.fourDigitCodes.map((code) => {
                        const pair = icYearBlocks[code] ?? ["", ""];
                        const b1 = code.slice(0, 2);
                        const b2 = code.slice(2, 4);
                        return (
                          <div
                            key={code}
                            className="space-y-2 rounded-[14px] border border-[#181818]/15 p-3"
                          >
                            <p className="text-xs font-bold text-[#181818]">
                              Codice {code} → Blocco 1 ({b1}) + Blocco 2 ({b2}):
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={pair[0]}
                                onChange={(e) =>
                                  setIcYearBlocks((prev) => ({
                                    ...prev,
                                    [code]: [e.target.value, pair[1]],
                                  }))
                                }
                                placeholder={`Parola per ${b1} (es. ${mission.phoneticBlocksSpec?.exampleBlocksAfterSubmit[code]?.[0]})`}
                                className="rounded-[10px] border border-[#181818]/20 px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                              />
                              <input
                                type="text"
                                value={pair[1]}
                                onChange={(e) =>
                                  setIcYearBlocks((prev) => ({
                                    ...prev,
                                    [code]: [pair[0], e.target.value],
                                  }))
                                }
                                placeholder={`Parola per ${b2} (es. ${mission.phoneticBlocksSpec?.exampleBlocksAfterSubmit[code]?.[1]})`}
                                className="rounded-[10px] border border-[#181818]/20 px-3 py-1.5 text-xs outline-none focus:border-[#613BE0]"
                              />
                            </div>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setIcYearRecallPhase(true)}
                        className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white"
                      >
                        Nascondi i codici e decodificali dalle tue coppie di parole →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mission.phoneticBlocksSpec.fourDigitCodes.map(
                        (code, idx) => {
                          const pair = icYearBlocks[code] ?? ["—", "—"];
                          return (
                            <div
                              key={`yr-${code}`}
                              className="flex items-center justify-between gap-2 rounded-[14px] border border-[#181818]/15 p-3"
                            >
                              <span className="text-xs font-bold text-[#181818]">
                                Scena {idx + 1}: «{pair[0]}» agisce su «{pair[1]}» →
                              </span>
                              <input
                                type="text"
                                value={icRecalledYears[idx] ?? ""}
                                onChange={(e) => {
                                  const next = [...icRecalledYears];
                                  next[idx] = e.target.value;
                                  setIcRecalledYears(next);
                                }}
                                placeholder="4 cifre..."
                                className="w-28 rounded-[10px] border border-[#181818]/20 px-3 py-1.5 text-xs font-bold outline-none focus:border-[#613BE0]"
                              />
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* WIDGET 10: PAO SCENE CODEC (Q03) */}
            {mission.widgetKind === "pao_scene_codec" &&
              mission.paoSpec && (() => {
                const tableEntries =
                  mission.paoSpec.tableEntries ??
                  mission.paoSpec.targets ??
                  mission.paoSpec.codebook ??
                  [];
                const sixDigitTargets =
                  mission.paoSpec.sixDigitTargets ?? ["485270", "528514"];

                return (
                  <div className="space-y-4">
                    {!icPaoHidden ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {tableEntries.map((row) => (
                            <div
                              key={row.digits}
                              className="rounded-[12px] bg-[#D2C4F5]/25 px-3 py-2 text-xs"
                            >
                              <strong className="text-[#613BE0]">
                                {row.digits}
                              </strong>
                              : P={row.person} · A={row.action} · O={row.object}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs font-semibold text-[#181818]/80">
                          Scene PAO da fissare: 1) {sixDigitTargets[0] ?? "485270"}{" "}
                          (Riva + impasta + casa) · 2){" "}
                          {sixDigitTargets[1] ?? "528514"} (Luna + illumina con
                          bacchetta + toro).
                        </p>
                        <button
                          type="button"
                          onClick={() => setIcPaoHidden(true)}
                          className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white"
                        >
                          Nascondi tabella e decodifica le 2 scene PAO (6 cifre ciascuna) →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[#181818]">
                            Scena 1 (Riva [P] impasta [A] una casa [O]) → 6 cifre:
                          </label>
                          <input
                            type="text"
                            value={icPaoRecalledStrings[0] ?? ""}
                            onChange={(e) =>
                              setIcPaoRecalledStrings([
                                e.target.value,
                                icPaoRecalledStrings[1] ?? "",
                              ])
                            }
                            placeholder="6 cifre in ordine P-A-O..."
                            className="w-full rounded-[10px] border border-[#181818]/20 px-3 py-2 text-xs font-bold outline-none focus:border-[#613BE0]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-[#181818]">
                            Scena 2 (Luna [P] illumina con bacchetta [A] un toro [O]) → 6 cifre:
                          </label>
                          <input
                            type="text"
                            value={icPaoRecalledStrings[1] ?? ""}
                            onChange={(e) =>
                              setIcPaoRecalledStrings([
                                icPaoRecalledStrings[0] ?? "",
                                e.target.value,
                              ])
                            }
                            placeholder="6 cifre in ordine P-A-O..."
                            className="w-full rounded-[10px] border border-[#181818]/20 px-3 py-2 text-xs font-bold outline-none focus:border-[#613BE0]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 11: LONG NUMBER CHUNKS (M02) */}
            {mission.widgetKind === "long_number_chunks" &&
              mission.longNumberSpec && (() => {
                const chunks = mission.longNumberSpec.chunks ?? [];
                const lociLabels =
                  mission.longNumberSpec.lociLabels ?? ["Locus 1", "Locus 2", "Locus 3", "Locus 4"];
                const fullDigits =
                  mission.longNumberSpec.fullDigits ?? chunks.join("");

                return (
                  <div className="space-y-4">
                    {!icLongDigitsHidden ? (
                      <div className="space-y-3 text-center">
                        <p className="text-sm font-bold tracking-wider text-[#613BE0]">
                          {fullDigits}
                        </p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {chunks.map((chk, idx) => (
                            <div
                              key={chk}
                              className="rounded-[12px] bg-[#D2C4F5]/30 p-2.5 text-xs"
                            >
                              <div className="font-bold text-[#181818]">
                                {lociLabels[idx] ?? `Locus ${idx + 1}`}
                              </div>
                              <div className="mt-1 text-sm font-bold text-[#613BE0]">
                                {chk}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIcLongDigitsHidden(true)}
                          className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white"
                        >
                          Nascondi le 16 cifre e richiama i 4 loci →
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {lociLabels.map((lbl, idx) => (
                          <div
                            key={lbl}
                            className="flex items-center justify-between gap-2 rounded-[12px] border border-[#181818]/15 p-2.5"
                          >
                            <span className="text-xs font-bold text-[#181818]">
                              {lbl}:
                            </span>
                            <input
                              type="text"
                              value={icLongChunksInput[idx] ?? ""}
                              onChange={(e) => {
                                const next = [...icLongChunksInput];
                                next[idx] = e.target.value;
                                setIcLongChunksInput(next);
                              }}
                              placeholder="4 cifre..."
                              className="w-24 rounded-[8px] border border-[#181818]/20 px-2.5 py-1 text-xs font-bold outline-none focus:border-[#613BE0]"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 12: MULTI CASE CLASSIFICATION */}
            {mission.widgetKind === "multi_case_classification" &&
              mission.classificationSpec && (
                <div className="space-y-4">
                  {mission.classificationSpec.cases.map((c) => (
                    <div
                      key={c.id}
                      className="space-y-2 rounded-[14px] border border-[#181818]/15 p-3.5"
                    >
                      <p className="text-xs font-bold text-[#181818]">
                        {c.stimulus}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {mission.classificationSpec?.categories.map((cat) => {
                          const active = icCategoryByCase[c.id] === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() =>
                                setIcCategoryByCase((prev) => ({
                                  ...prev,
                                  [c.id]: cat.id,
                                }))
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                active
                                  ? "border-[#613BE0] bg-[#613BE0] text-white"
                                  : "border-[#181818]/20 bg-white text-[#181818] hover:border-[#613BE0]"
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {mission.classificationSpec.followUpQuestion && (
                    <div className="space-y-2 rounded-[14px] bg-[#D2C4F5]/20 p-3.5">
                      <p className="text-xs font-bold text-[#181818]">
                        {mission.classificationSpec.followUpQuestion.prompt}
                      </p>
                      <div className="space-y-1.5">
                        {mission.classificationSpec.followUpQuestion.options.map(
                          (opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setIcFollowUpChoice(opt.id)}
                              className={`w-full rounded-[12px] border p-2.5 text-left text-xs font-medium ${
                                icFollowUpChoice === opt.id
                                  ? "border-[#613BE0] bg-white font-bold text-[#613BE0]"
                                  : "border-[#181818]/15 bg-white text-[#181818]"
                              }`}
                            >
                              {opt.label}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* WIDGET 13: NUMERIC TRANSFER LAB (R04) */}
            {mission.widgetKind === "numeric_transfer_lab" &&
              mission.numericTransferSpec && (() => {
                const unitOptions = mission.numericTransferSpec.unitOptions ?? ["Ω", "V", "A", "W"];
                const followUpChecks = mission.numericTransferSpec.followUpChecks ?? [];

                return (
                  <div className="space-y-4">
                    <div className="rounded-[14px] bg-[#D2C4F5]/25 p-3.5 text-xs font-semibold text-[#181818]">
                      {mission.numericTransferSpec.problemText}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={icNumericVal}
                        onChange={(e) => setIcNumericVal(e.target.value)}
                        placeholder="Valore numerico (es. 24)..."
                        className="flex-1 rounded-[12px] border border-[#181818]/20 px-3.5 py-2 text-sm font-bold outline-none focus:border-[#613BE0]"
                      />
                      <div className="flex gap-1.5">
                        {unitOptions.map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setIcNumericUnit(u)}
                            className={`rounded-[10px] border px-3.5 py-2 text-xs font-bold ${
                              icNumericUnit === u
                                ? "border-[#613BE0] bg-[#613BE0] text-white"
                                : "border-[#181818]/20 bg-white text-[#181818]"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    {followUpChecks.map((chk) => (
                      <div key={chk.id} className="space-y-2">
                        <p className="text-xs font-bold text-[#181818]">
                          {chk.prompt}
                        </p>
                        {chk.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setIcNumericChecks((prev) => ({
                                ...prev,
                                [chk.id]: opt.id,
                              }))
                            }
                            className={`w-full rounded-[12px] border p-2.5 text-left text-xs ${
                              icNumericChecks[chk.id] === opt.id
                                ? "border-[#613BE0] bg-[#D2C4F5]/30 font-bold"
                                : "border-[#181818]/15 bg-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

            {/* WIDGET 14: METRICS & TRIALS LAB (M01) */}
            {mission.widgetKind === "metrics_and_trials_lab" &&
              mission.metricsTrialsSpec && (() => {
                const trialsLog = mission.metricsTrialsSpec.trialsLog ?? [];
                const activeRecallWords = mission.metricsTrialsSpec.activeRecallWords ?? [];
                const decisionChecks = mission.metricsTrialsSpec.decisionChecks ?? [];

                return (
                  <div className="space-y-4">
                    {trialsLog.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {trialsLog.map((t, idx) => (
                          <div
                            key={t.trial ?? idx}
                            className="rounded-[12px] bg-[#D2C4F5]/25 p-2.5 text-xs"
                          >
                            <div className="font-bold text-[#613BE0]">
                              Prova #{t.trial ?? idx + 1} ({t.seconds ?? t.speedSec ?? 0}s)
                            </div>
                            <div>Corrette: {t.correct ?? 0}</div>
                            <div>
                              Omissioni: {t.omissions ?? 0} · Inv.: {t.inversions ?? 0}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!icMetricsHidden ? (
                      <div className="space-y-3 rounded-[14px] border border-[#181818]/15 p-3 text-center">
                        <p className="text-xs font-bold">
                          Sequenza attiva da fissare ({activeRecallWords.length} voci):{" "}
                          {activeRecallWords.join(" → ")}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIcMetricsHidden(true)}
                          className="rounded-[12px] bg-[#613BE0] px-5 py-2 text-xs font-bold text-white"
                        >
                          Nascondi sequenza e rispondi →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[...activeRecallWords]
                            .sort((a, b) => a.localeCompare(b))
                            .map((w) => {
                              const used = icMetricsWords.includes(w);
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  disabled={used}
                                  onClick={() =>
                                    setIcMetricsWords((prev) => [...prev, w])
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                    used
                                      ? "opacity-30"
                                      : "border-[#613BE0] text-[#181818]"
                                  }`}
                                >
                                  {w}
                                </button>
                              );
                            })}
                        </div>
                        <div className="text-xs font-bold">
                          Ordine: {icMetricsWords.join(" → ") || "—"}
                        </div>
                      </div>
                    )}

                    {decisionChecks.map((chk) => (
                      <div key={chk.id} className="space-y-1.5">
                        <p className="text-xs font-bold text-[#181818]">
                          {chk.prompt}
                        </p>
                        {chk.options.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setIcMetricsDecisions((prev) => ({
                                ...prev,
                                [chk.id]: opt.id,
                              }))
                            }
                            className={`w-full rounded-[12px] border p-2.5 text-left text-xs ${
                              icMetricsDecisions[chk.id] === opt.id
                                ? "border-[#613BE0] bg-[#D2C4F5]/30 font-bold"
                                : "border-[#181818]/15 bg-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

            {/* WIDGET 15: CARDS & NAMES DUAL LAB (M03) */}
            {mission.widgetKind === "cards_and_names_dual_lab" &&
              mission.cardsAndNamesSpec && (() => {
                const orderedCards =
                  mission.cardsAndNamesSpec.orderedCards ??
                  mission.cardsAndNamesSpec.cards ??
                  [];
                const profiles = mission.cardsAndNamesSpec.profiles ?? [];

                return (
                  <div className="space-y-4">
                    {!icCardsHidden ? (
                      <div className="space-y-3">
                        <div className="rounded-[14px] bg-[#D2C4F5]/25 p-3 text-xs">
                          <div className="font-bold text-[#613BE0]">
                            1. Sequenza di {orderedCards.length} carte:
                          </div>
                          <div className="mt-1 font-bold text-[#181818]">
                            {orderedCards.join(" → ")}
                          </div>
                        </div>
                        {profiles.length > 0 && (
                          <div className="rounded-[14px] bg-[#D2C4F5]/25 p-3 text-xs">
                            <div className="font-bold text-[#613BE0]">
                              2. Tre profili (Nome — Ruolo — Dettaglio):
                            </div>
                            {profiles.map((p) => (
                              <div key={p.person} className="mt-1">
                                <strong>{p.person}</strong> — {p.role} —{" "}
                                <em>{p.detail}</em>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setIcCardsHidden(true)}
                          className="w-full rounded-[15px] bg-[#613BE0] py-2.5 text-xs font-bold text-white"
                        >
                          Nascondi carte e profili e avvia la prova →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-[#613BE0]">
                          1. Ricostruisci le {orderedCards.length} carte in ordine:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[...orderedCards]
                            .sort((a, b) => a.localeCompare(b))
                            .map((c) => {
                              const used = icRecalledCards.includes(c);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  disabled={used}
                                  onClick={() =>
                                    setIcRecalledCards((prev) => [...prev, c])
                                  }
                                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                    used
                                      ? "opacity-30"
                                      : "border-[#613BE0] bg-white"
                                  }`}
                                >
                                  {c}
                                </button>
                              );
                            })}
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{icRecalledCards.join(" → ") || "—"}</span>
                          {icRecalledCards.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIcRecalledCards([])}
                              className="text-[#613BE0]"
                            >
                              Azzera
                            </button>
                          )}
                        </div>

                        {profiles.length > 0 && (
                          <>
                            <p className="pt-2 text-xs font-bold text-[#613BE0]">
                              2. Completa ruolo e dettaglio per ciascuna persona:
                            </p>
                            {profiles.map((p) => (
                              <div
                                key={p.person}
                                className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:items-center"
                              >
                                <span className="text-xs font-bold">{p.person}:</span>
                                <input
                                  type="text"
                                  value={icRoleByPerson[p.person] ?? ""}
                                  onChange={(e) =>
                                    setIcRoleByPerson((prev) => ({
                                      ...prev,
                                      [p.person]: e.target.value,
                                    }))
                                  }
                                  placeholder="Ruolo..."
                                  className="rounded-[8px] border border-[#181818]/20 px-2.5 py-1.5 text-xs"
                                />
                                <input
                                  type="text"
                                  value={icDetailByPerson[p.person] ?? ""}
                                  onChange={(e) =>
                                    setIcDetailByPerson((prev) => ({
                                      ...prev,
                                      [p.person]: e.target.value,
                                    }))
                                  }
                                  placeholder="Dettaglio..."
                                  className="rounded-[8px] border border-[#181818]/20 px-2.5 py-1.5 text-xs"
                                />
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 16: SOURCE FACT CHECK LAB (A01) */}
            {mission.widgetKind === "source_fact_check_lab" &&
              mission.sourceFactCheckSpec && (() => {
                const candidateCards = mission.sourceFactCheckSpec.candidateCards ?? [];
                const correctionOptions = mission.sourceFactCheckSpec.correctionOptions ?? [];

                return (
                  <div className="space-y-4">
                    <div className="rounded-[14px] bg-[#D2C4F5]/30 p-3.5 text-xs leading-relaxed text-[#181818]">
                      <strong>Testo fonte verificato:</strong>{" "}
                      {mission.sourceFactCheckSpec.sourceExcerpt}
                    </div>
                    {candidateCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex flex-col justify-between gap-2 rounded-[14px] border border-[#181818]/15 p-3 sm:flex-row sm:items-center"
                      >
                        <span className="text-xs font-medium text-[#181818]">
                          {card.claim ?? card.prompt}
                        </span>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setIcCardDecisions((prev) => ({
                                ...prev,
                                [card.id]: "approve",
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              icCardDecisions[card.id] === "approve"
                                ? "border-[#613BE0] bg-[#613BE0] text-white"
                                : "border-[#181818]/20 bg-white"
                            }`}
                          >
                            Approva
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setIcCardDecisions((prev) => ({
                                ...prev,
                                [card.id]: "reject",
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${
                              icCardDecisions[card.id] === "reject"
                                ? "border-[#181818] bg-[#FFD014] text-[#181818]"
                                : "border-[#181818]/20 bg-white"
                            }`}
                          >
                            Rifiuta (errata)
                          </button>
                        </div>
                      </div>
                    ))}
                    {correctionOptions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-[#181818]">
                          {mission.sourceFactCheckSpec.correctionQuestion}
                        </p>
                        {correctionOptions.map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setIcFactCorrectionChoice(opt.id)}
                            className={`w-full rounded-[12px] border p-2.5 text-left text-xs ${
                              icFactCorrectionChoice === opt.id
                                ? "border-[#613BE0] bg-[#D2C4F5]/30 font-bold"
                                : "border-[#181818]/15 bg-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* WIDGET 17: STRUCTURED PLUS RUBRIC (31 Rubric-Guided Lessons) */}
            {mission.widgetKind === "structured_plus_rubric" &&
              mission.structuredPlusRubricSpec && (
                <div className="space-y-4">
                  <div className="rounded-[14px] bg-[#D2C4F5]/25 p-3.5 text-xs leading-relaxed text-[#181818]">
                    <div>
                      <strong>Stimolo nuovo (Set B):</strong>{" "}
                      {mission.structuredPlusRubricSpec.stimulusText}
                    </div>
                    <div className="mt-1 text-[#613BE0]">
                      <strong>Consegna:</strong>{" "}
                      {mission.structuredPlusRubricSpec.requestedOutput}
                    </div>
                  </div>

                  {/* Part 1: Deterministic Structured Checks */}
                  {mission.structuredPlusRubricSpec.structuredChecks.map(
                    (chk) => (
                      <div key={chk.id} className="space-y-2">
                        <p className="text-xs font-bold text-[#181818]">
                          {chk.prompt}
                        </p>
                        <div className="space-y-1.5">
                          {chk.options.map((opt) => {
                            const active =
                              icStructuredAnswers[chk.id] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setIcStructuredAnswers((prev) => ({
                                    ...prev,
                                    [chk.id]: opt.id,
                                  }))
                                }
                                className={`w-full rounded-[12px] border-2 p-2.5 text-left text-xs transition ${
                                  active
                                    ? "border-[#613BE0] bg-[#D2C4F5]/30 font-bold text-[#181818]"
                                    : "border-[#181818]/15 bg-white text-[#181818]"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}

                  {/* Part 2: Written Production */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#181818]">
                      {mission.structuredPlusRubricSpec.openPromptLabel}
                    </label>
                    <textarea
                      rows={3}
                      value={icOpenResponseText}
                      onChange={(e) => setIcOpenResponseText(e.target.value)}
                      placeholder={
                        mission.structuredPlusRubricSpec.openPromptPlaceholder
                      }
                      className="w-full rounded-[12px] border border-[#181818]/20 bg-white p-3 text-xs leading-relaxed text-[#181818] outline-none focus:border-[#613BE0]"
                    />
                  </div>

                  {/* Part 3: Explicit Rubric Self-Check */}
                  <div className="space-y-2 rounded-[14px] border border-[#181818]/15 bg-[#D2C4F5]/15 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#181818]">
                        Rubrica di autovalutazione onesta (spunta i criteri
                        soddisfatti):
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setIcRubricChecked(
                            mission.structuredPlusRubricSpec!.rubricCriteria.map(
                              (_, i) => i
                            )
                          )
                        }
                        className="text-[11px] font-bold text-[#613BE0] hover:underline"
                      >
                        Seleziona tutti
                      </button>
                    </div>
                    {mission.structuredPlusRubricSpec.rubricCriteria.map(
                      (crit, idx) => {
                        const checked = icRubricChecked.includes(idx);
                        return (
                          <label
                            key={idx}
                            className="flex cursor-pointer items-start gap-2 text-xs text-[#181818]/85"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setIcRubricChecked((prev) =>
                                  prev.includes(idx)
                                    ? prev.filter((i) => i !== idx)
                                    : [...prev, idx]
                                )
                              }
                              className="mt-0.5 accent-[#613BE0]"
                            />
                            <span>{crit}</span>
                          </label>
                        );
                      }
                    )}
                    <p className="text-[11px] text-[#181818]/60">
                      Nota onestà: le prove aperte autovalutate registrano{" "}
                      <code>verifiedBy = learner_self_check</code> (pratica
                      completata), senza attribuire padronanza automatica per il
                      solo testo non vuoto.
                    </p>
                  </div>
                </div>
              )}

            {/* PROGRESSIVE HINTS & HONEST BLIND-BEFORE-REVEAL CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#181818]/10 pt-3 text-xs">
              <button
                type="button"
                onClick={() => {
                  const nextCount = Math.min(
                    mission.progressiveHints.length,
                    icHintsRevealedCount + 1
                  );
                  setIcHintsRevealedCount(nextCount);
                  setHintsInSession((h) => h + 1);
                }}
                className="font-bold text-[#613BE0] hover:underline"
              >
                {icHintsRevealedCount === 0
                  ? `Mostra suggerimento graduato (0/${mission.progressiveHints.length})`
                  : `Suggerimenti aperti (${icHintsRevealedCount}/${mission.progressiveHints.length} · tentativo assistito)`}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIcSubmittedBeforeReveal(false);
                  setIcRevealedStudyReference(true);
                }}
                className="text-[11px] font-semibold text-[#181818]/55 hover:text-[#181818] hover:underline"
              >
                Rivela soluzione (solo studio, disattiva padronanza)
              </button>
            </div>

            {icHintsRevealedCount > 0 && (
              <div className="space-y-1 rounded-[12px] bg-[#D2C4F5]/30 p-3 text-xs text-[#181818]">
                {mission.progressiveHints
                  .slice(0, icHintsRevealedCount)
                  .map((h, i) => (
                    <div key={i}>
                      <strong>Indizio {i + 1}:</strong> {h}
                    </div>
                  ))}
              </div>
            )}

            {icRevealedStudyReference && (
              <div className="rounded-[12px] border border-[#FFD014] bg-[#FFD014]/20 p-3 text-xs text-[#181818]">
                <strong>Modalità studio (soluzione rivelata prima della consegna):</strong>{" "}
                {mission.structuredPlusRubricSpec?.modelReferenceAfterSubmit ??
                  mission.demonstrationModelReveal}
              </div>
            )}
          </div>
        )}

        {/* ===============================================================
            STAGE 7: DIAGNOSTIC FEEDBACK
            =============================================================== */}
        {currentStep.type === "diagnostic_feedback" && (
          <div className="mt-6 space-y-4">
            {lastChallengeEvidence ? (
              <div className="rounded-[20px] border-2 border-[#613BE0]/30 bg-[#D2C4F5]/25 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[#613BE0] px-3 py-0.5 text-[11px] font-bold text-white">
                    Esito Stage 6 · {lastChallengeEvidence.verifiedBy}
                  </span>
                  <span className="text-xs font-bold text-[#181818]/70">
                    Hint usati: {lastChallengeEvidence.hintsUsed} · Prima del
                    reveal:{" "}
                    {lastChallengeEvidence.submittedBeforeReveal ? "Sì" : "No"}
                  </span>
                </div>
                <p className="mt-3 text-base font-bold text-[#181818]">
                  {lastChallengeEvidence.summaryHeadline}
                </p>
                <p className="mt-1 text-sm text-[#181818]/85">
                  {lastChallengeEvidence.diagnosticFeedback}
                </p>
                {lastChallengeEvidence.repairAction && (
                  <p className="mt-2 rounded-[12px] bg-white p-3 text-xs font-semibold text-[#613BE0]">
                    Azione di riparazione: {lastChallengeEvidence.repairAction}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* ===============================================================
            STAGE 8: REFLECTION & NEXT
            =============================================================== */}
        {currentStep.type === "reflection_and_next" && (
          <div className="mt-6 rounded-[20px] border border-[#181818]/15 bg-[#D2C4F5]/20 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#613BE0]">
              Criterio di padronanza (Mastery Gate)
            </p>
            <p className="mt-1.5 text-sm font-semibold text-[#181818]">
              {lesson.masteryCriterion}
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM BAR: Concise Feedback + Single Primary CTA */}
      <div className="border-t border-[#181818]/10 pt-5">
        {feedback ? (
          <div
            className={`flex flex-col justify-between gap-4 rounded-[20px] p-4 sm:flex-row sm:items-center ${
              feedback.isCorrect
                ? "border border-[#613BE0]/30 bg-[#D2C4F5]/35"
                : "border border-[#FFD014] bg-[#FFD014]/25"
            }`}
          >
            <div>
              {feedback.verifiedByBadge && (
                <span className="mb-1 inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-[#613BE0]">
                  {feedback.verifiedByBadge}
                </span>
              )}
              <p className="loco-display text-lg font-bold text-[#181818]">
                {feedback.headline}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[#181818]/85">
                {feedback.detail}
              </p>
              {feedback.repairAction && (
                <p className="mt-1 text-xs font-bold text-[#613BE0]">
                  Riparazione: {feedback.repairAction}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!feedback.isCorrect && (
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="rounded-[15px] border border-[#181818]/20 bg-white px-5 py-2.5 text-sm font-bold text-[#181818]"
                >
                  Riprova
                </button>
              )}
              <button
                type="button"
                onClick={advanceToNextStep}
                className="rounded-[15px] bg-[#613BE0] px-8 py-2.5 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
              >
                Continua
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleVerifyStep}
              className="w-full rounded-[15px] bg-[#613BE0] px-10 py-3.5 text-[16px] font-bold text-white transition hover:bg-[#4B2FC4] sm:w-auto"
            >
              {isPureReadingStep
                ? stepIndex + 1 === lesson.steps.length
                  ? "Completa lezione"
                  : "Continua"
                : "Verifica"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
