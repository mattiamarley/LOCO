"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ACADEMY_BADGES,
  ACADEMY_COURSES,
  ACADEMY_LESSONS_BY_ID,
  AcademyCourse,
  AcademyGamificationState,
  AcademyLessonProgress,
  AcademyMistakeItem,
  AcademyProgressMap,
  AcademyTheme,
  AdaptiveAcademyRecommendation,
  ENRICHED_ACADEMY_LESSONS,
  EnrichedAcademyLesson,
  LOCO_ACADEMY_GAMIFICATION_KEY,
  LOCO_LEVELS,
  LessonStepSpec,
  LessonTier,
  MAJOR_IT_V1_TABLE,
  PathNodeVisualState,
  TIER_NAMING,
  XP_REWARDS,
  awardIdempotentXp,
  computeUnlockedBadgeIds,
  createDefaultGamificationState,
  encodeItalianWordToMajorDigits,
  recordAcademyCheckpointAttempt,
  resolveLocoLevel,
  resolvePathNodeVisualState,
} from "./loco-academy-curriculum";
import { WebAppRoute } from "./loco-webapp-data";

interface LocoAcademySectionProps {
  progressMap: AcademyProgressMap;
  onUpdateLessonProgress: (
    lessonId: string,
    updater: (prev: AcademyLessonProgress) => AcademyLessonProgress
  ) => void;
  activeLessonId: string | null;
  onSelectLesson: (lessonId: string | null) => void;
  routes: WebAppRoute[];
  dueReviewsCount: number;
  adaptiveRecommendations: AdaptiveAcademyRecommendation[];
  onOpenSceneForLesson: (lessonId: string) => void;
  onStartBlindRecallFromAcademy: () => void;
  onCreateOnboardingRouteFromAcademy: (
    customAssociations: { locusLabel: string; itemWord: string; actionCue: string }[]
  ) => void;
  focusedCourseNumber?: number | null;
}

type AcademySubScreen = "path" | "progress" | "mistakes" | "catalog";

const COMBO_PRAISES = [
  "Perfetto!",
  "Ottimo recupero!",
  "Tre di fila! 🔥",
  "Associazione geniale!",
  "Memoria inarrestabile!",
];

export function LocoAcademySection({
  progressMap,
  onUpdateLessonProgress,
  activeLessonId,
  onSelectLesson,
  routes,
  dueReviewsCount,
  adaptiveRecommendations,
  onOpenSceneForLesson,
  onStartBlindRecallFromAcademy,
  onCreateOnboardingRouteFromAcademy,
  focusedCourseNumber,
}: LocoAcademySectionProps) {
  // Gamification & Persistent Store
  const [gamification, setGamification] = useState<AcademyGamificationState>(() => {
    const fallback = createDefaultGamificationState();
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(LOCO_ACADEMY_GAMIFICATION_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<AcademyGamificationState>;
      return {
        ...fallback,
        ...parsed,
        awardedXpEventIds: Array.isArray(parsed.awardedXpEventIds)
          ? parsed.awardedXpEventIds
          : [],
        completedUnitCheckpoints: Array.isArray(parsed.completedUnitCheckpoints)
          ? parsed.completedUnitCheckpoints
          : [],
        mistakeQueue: Array.isArray(parsed.mistakeQueue) ? parsed.mistakeQueue : [],
        unlockedBadgeIds: Array.isArray(parsed.unlockedBadgeIds)
          ? parsed.unlockedBadgeIds
          : [],
      };
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LOCO_ACADEMY_GAMIFICATION_KEY,
        JSON.stringify(gamification)
      );
    } catch {
      // ignore quota errors
    }
  }, [gamification]);

  // Central configurable entitlement tier (Free default, switchable to preview Plus/Pro)
  const [simulatedPlanTier, setSimulatedPlanTier] = useState<LessonTier>("free");
  const [subScreen, setSubScreen] = useState<AcademySubScreen>("path");

  // Modals / Drawers for the 9 screens
  const [unitDetailCourseId, setUnitDetailCourseId] = useState<string | null>(null);
  const [premiumPreviewLesson, setPremiumPreviewLesson] =
    useState<EnrichedAcademyLesson | null>(null);
  const [activeCheckpointCourse, setActiveCheckpointCourse] =
    useState<AcademyCourse | null>(null);
  const [checkpointStepIdx, setCheckpointStepIdx] = useState(0);
  const [checkpointSelectedValue, setCheckpointSelectedValue] = useState<string | null>(
    null
  );
  const [checkpointMistakes, setCheckpointMistakes] = useState(0);
  const [checkpointFinished, setCheckpointFinished] = useState(false);

  // Catalog filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"all" | LessonTier>("all");
  const [selectedThemeFilter, setSelectedThemeFilter] = useState<"all" | AcademyTheme>(
    "all"
  );
  const [showMajorReferenceModal, setShowMajorReferenceModal] = useState(false);

  // Interactive Multi-Step Lesson Player State
  const [playerStepIndex, setPlayerStepIndex] = useState(0);
  const [expandedExplanation, setExpandedExplanation] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [lessonMistakesCount, setLessonMistakesCount] = useState(0);
  const [lessonHintsCount, setLessonHintsCount] = useState(0);
  const [lessonCompleteSummary, setLessonCompleteSummary] = useState<{
    xpEarnedNow: number;
    bonusXpEarned: number;
    totalSteps: number;
    mistakesCount: number;
  } | null>(null);

  // Step-level Answer Feedback banner state
  const [stepFeedback, setStepFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    detail: string;
  } | null>(null);

  // Reusable Exercise States (reset per step)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [selectedLeftPairId, setSelectedLeftPairId] = useState<string | null>(null);
  const [orderedSequence, setOrderedSequence] = useState<string[]>([]);
  const [flashHidden, setFlashHidden] = useState(false);
  const [flashRecallSelection, setFlashRecallSelection] = useState<string[]>([]);
  const [blankChoice, setBlankChoice] = useState<string>("");
  const [freeRecallInput, setFreeRecallInput] = useState("");
  const [freeRecallHintShown, setFreeRecallHintShown] = useState(false);
  const [placedLociCount, setPlacedLociCount] = useState(0);
  const [builderObj, setBuilderObj] = useState("");
  const [builderAct, setBuilderAct] = useState("");
  const [builderLoc, setBuilderLoc] = useState("");
  const [majorInputText, setMajorInputText] = useState("");

  // Mistake review session state
  const [mistakeReplyText, setMistakeReplyText] = useState("");
  const [mistakeFeedbackMsg, setMistakeFeedbackMsg] = useState<string | null>(null);

  const activeLesson: EnrichedAcademyLesson | null = activeLessonId
    ? ACADEMY_LESSONS_BY_ID[activeLessonId] ?? null
    : null;

  const activeProgress: AcademyLessonProgress | null =
    activeLesson && progressMap[activeLesson.id]
      ? progressMap[activeLesson.id]
      : null;

  const totalLociInRoutes = useMemo(
    () => routes.reduce((acc, r) => acc + r.loci.length, 0),
    [routes]
  );

  const unlockedBadgeIds = useMemo(
    () => computeUnlockedBadgeIds(progressMap, gamification, totalLociInRoutes),
    [progressMap, gamification, totalLociInRoutes]
  );

  const levelInfo = useMemo(
    () => resolveLocoLevel(gamification.totalXp),
    [gamification.totalXp]
  );

  const resetStepInteractionState = () => {
    setStepFeedback(null);
    setExpandedExplanation(false);
    setSelectedOptionId(null);
    setMatchedPairIds([]);
    setSelectedLeftPairId(null);
    setOrderedSequence([]);
    setFlashHidden(false);
    setFlashRecallSelection([]);
    setBlankChoice("");
    setFreeRecallInput("");
    setFreeRecallHintShown(false);
    setPlacedLociCount(0);
    setBuilderObj("");
    setBuilderAct("");
    setBuilderLoc("");
    setMajorInputText("");
  };

  // Launch or resume a lesson in the multi-step game player
  const startOrResumeLesson = (lessonId: string) => {
    const lesson = ACADEMY_LESSONS_BY_ID[lessonId];
    if (!lesson) return;
    const prog = progressMap[lessonId];
    const savedStep =
      prog && prog.currentStepIndex > 0 && prog.currentStepIndex < lesson.steps.length
        ? prog.currentStepIndex
        : 0;

    const nowIso = new Date().toISOString();
    onUpdateLessonProgress(lessonId, (prev) => ({
      ...prev,
      openedAt: prev.openedAt ?? nowIso,
      status: prev.status === "available" ? "reading" : prev.status,
      readCompletedAt: prev.readCompletedAt ?? nowIso,
    }));

    setPlayerStepIndex(savedStep);
    setComboCount(0);
    setLessonMistakesCount(0);
    setLessonHintsCount(0);
    setLessonCompleteSummary(null);
    resetStepInteractionState();
    onSelectLesson(lessonId);
  };

  // Next recommended lesson on the path
  const nextRecommendedLesson = useMemo(() => {
    for (const lesson of ENRICHED_ACADEMY_LESSONS) {
      const st = progressMap[lesson.id]?.status ?? "available";
      if (st !== "provisionally_passed" && st !== "mastered_after_delay") {
        return lesson;
      }
    }
    return ENRICHED_ACADEMY_LESSONS[0];
  }, [progressMap]);

  // Helper to push a mistake into the persistent Mistake Queue
  const enqueueMistake = (
    lesson: EnrichedAcademyLesson,
    step: LessonStepSpec,
    expectedAnswer: string,
    explanation: string
  ) => {
    const mistakeId = `mistake-${lesson.id}-${step.stepId}`;
    const newItem: AcademyMistakeItem = {
      id: mistakeId,
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      stepId: step.stepId,
      prompt: step.title,
      expectedAnswer,
      explanation,
      createdAt: new Date().toISOString(),
    };
    setGamification((prev) => {
      const filtered = prev.mistakeQueue.filter((m) => m.id !== mistakeId);
      return {
        ...prev,
        mistakeQueue: [newItem, ...filtered],
      };
    });
  };

  // Evaluate the current interactive step when the user clicks "VERIFICA"
  const handleVerifyCurrentStep = () => {
    if (!activeLesson || !activeProgress) return;
    const step = activeLesson.steps[playerStepIndex];
    if (!step) return;

    // Narrative steps (hook, explanation, demonstration) succeed immediately on continue
    if (
      step.type === "hook" ||
      step.type === "explanation" ||
      step.type === "demonstration"
    ) {
      handleAdvanceToNextStep();
      return;
    }

    let isCorrect = false;
    let feedbackDetail = step.explanationOnSuccess;
    let expectedForMistakeQueue = activeLesson.checkpoint.expectedAnswer;

    if (
      step.type === "multiple_choice" ||
      step.type === "image_association" ||
      step.type === "error_correction"
    ) {
      const chosen = step.options?.find((o) => o.id === selectedOptionId);
      if (!chosen) return;
      isCorrect = chosen.isCorrect;
      feedbackDetail = chosen.explanation || (isCorrect ? step.explanationOnSuccess : step.explanationOnMistake);
      const rightOpt = step.options?.find((o) => o.isCorrect);
      expectedForMistakeQueue = rightOpt?.label ?? activeLesson.checkpoint.expectedAnswer;
    } else if (step.type === "matching_pairs") {
      const totalPairs = step.pairs?.length ?? 0;
      isCorrect = matchedPairIds.length >= totalPairs;
      expectedForMistakeQueue = (step.pairs ?? [])
        .map((p) => `${p.left} = ${p.right}`)
        .join(" · ");
    } else if (step.type === "sequence_ordering") {
      const targetSeq = step.sequenceItems ?? [];
      isCorrect =
        orderedSequence.length === targetSeq.length &&
        orderedSequence.every((item, i) => item === targetSeq[i]);
      expectedForMistakeQueue = targetSeq.join(" → ");
    } else if (step.type === "memory_flash") {
      const targetFlash = step.flashItems ?? [];
      isCorrect =
        flashRecallSelection.length === targetFlash.length &&
        flashRecallSelection.every((item, i) => item === targetFlash[i]);
      expectedForMistakeQueue = targetFlash.join(", ");
    } else if (step.type === "fill_in_blank") {
      const expected = step.blankSentence?.expectedWord ?? "";
      isCorrect = blankChoice.trim().toLowerCase() === expected.trim().toLowerCase();
      expectedForMistakeQueue = expected;
    } else if (step.type === "loci_placement") {
      const targetCount = step.lociPlacementSpec?.itemsToPlace.length ?? 5;
      isCorrect = placedLociCount >= targetCount;
      expectedForMistakeQueue = "5 loci ordinati nella scena";
    } else if (step.type === "mnemonic_builder") {
      isCorrect = Boolean(builderObj && builderAct && builderLoc);
      expectedForMistakeQueue = "Oggetto concreto + Azione fisica + Locus stabile";
      if (isCorrect && activeLesson.id === "S04") {
        onCreateOnboardingRouteFromAcademy([
          {
            locusLabel: builderLoc,
            itemWord: builderObj,
            actionCue: `${builderObj} ${builderAct} ${builderLoc}`,
          },
        ]);
      }
    } else if (step.type === "number_encoding") {
      const targetNum = step.numberEncodingSpec?.targetNumber ?? "14";
      const encoded = encodeItalianWordToMajorDigits(majorInputText);
      isCorrect = encoded === targetNum;
      expectedForMistakeQueue = `Parola con cifre ${targetNum} (es. ${
        step.numberEncodingSpec?.exampleValidWords.join(", ") ?? "toro"
      })`;
      setGamification((prev) => ({
        ...prev,
        forwardEncodingTotalCount: prev.forwardEncodingTotalCount + 1,
        forwardEncodingCorrectCount:
          prev.forwardEncodingCorrectCount + (isCorrect ? 1 : 0),
      }));
    } else if (step.type === "reverse_decoding") {
      const expectedDigits = step.reverseDecodingSpec?.expectedDigits ?? "02";
      isCorrect = majorInputText.trim() === expectedDigits;
      expectedForMistakeQueue = `${step.reverseDecodingSpec?.stimulusWord} → ${expectedDigits}`;
      setGamification((prev) => ({
        ...prev,
        reverseDecodingTotalCount: prev.reverseDecodingTotalCount + 1,
        reverseDecodingCorrectCount:
          prev.reverseDecodingCorrectCount + (isCorrect ? 1 : 0),
      }));
    } else if (step.type === "free_recall") {
      const clean = freeRecallInput.trim().toLowerCase();
      const kws = step.freeRecallPrompt?.acceptedKeywords ?? [];
      const matched = kws.filter((k) => clean.includes(k));
      isCorrect =
        clean.length > 0 &&
        (matched.length >= Math.max(1, Math.ceil(kws.length * 0.4)) ||
          clean ===
            (step.freeRecallPrompt?.expectedAnswer ?? "")
              .trim()
              .replace(/\.$/, "")
              .toLowerCase());
      expectedForMistakeQueue =
        step.freeRecallPrompt?.expectedAnswer ?? activeLesson.checkpoint.expectedAnswer;
    }

    if (isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      const praise =
        COMBO_PRAISES[Math.min(nextCombo - 1, COMBO_PRAISES.length - 1)] ??
        "Perfetto!";
      setStepFeedback({
        isCorrect: true,
        headline: nextCombo >= 2 ? `${praise} (Combo x${nextCombo})` : praise,
        detail: feedbackDetail,
      });
    } else {
      setComboCount(0);
      setLessonMistakesCount((m) => m + 1);
      enqueueMistake(
        activeLesson,
        step,
        expectedForMistakeQueue,
        step.explanationOnMistake || `Evita di ${activeLesson.commonMistake}`
      );
      setStepFeedback({
        isCorrect: false,
        headline: "Da ripassare! Aggiunto alla coda errori",
        detail: `${
          step.explanationOnMistake || feedbackDetail
        } — Risposta corretta: «${expectedForMistakeQueue}»`,
      });
    }
  };

  // Advance to the next step or finish the lesson
  const handleAdvanceToNextStep = () => {
    if (!activeLesson || !activeProgress) return;
    const currentStep = activeLesson.steps[playerStepIndex];
    const nextIdx = playerStepIndex + 1;
    const nowIso = new Date().toISOString();

    if (nextIdx < activeLesson.steps.length) {
      onUpdateLessonProgress(activeLesson.id, (prev) => ({
        ...prev,
        currentStepIndex: nextIdx,
        practiceCompletedAt:
          nextIdx >= 3 ? prev.practiceCompletedAt ?? nowIso : prev.practiceCompletedAt,
        status:
          prev.status === "available" || prev.status === "reading"
            ? nextIdx >= 3
              ? "practice_done"
              : "reading"
            : prev.status,
        completedStepIds: currentStep
          ? Array.from(new Set([...prev.completedStepIds, currentStep.stepId]))
          : prev.completedStepIds,
      }));
      setPlayerStepIndex(nextIdx);
      resetStepInteractionState();
      return;
    }

    // Lesson finished! Record checkpoint attempt & award idempotent XP
    const isDelayedFollowUp = Boolean(activeProgress.provisionallyPassedAt);
    const { updated } = recordAcademyCheckpointAttempt(activeProgress, activeLesson, {
      userAnswer: activeLesson.checkpoint.expectedAnswer,
      hintsUsedInAttempt: lessonHintsCount,
      viewedAnswerBeforeAttempt: false,
      isDelayedFollowUp,
      nowIso,
    });

    const finalRecord: AcademyLessonProgress = {
      ...updated,
      currentStepIndex: 0,
      practiceCompletedAt: updated.practiceCompletedAt ?? nowIso,
      completedStepIds: activeLesson.steps.map((s) => s.stepId),
    };
    onUpdateLessonProgress(activeLesson.id, () => finalRecord);

    // Award XP idempotently
    let xpEarnedNow = 0;
    let bonusXpEarned = 0;

    setGamification((prev) => {
      let working = prev;
      const firstPassEventId = `xp-lesson-complete-${activeLesson.id}`;
      const firstAward = awardIdempotentXp(
        working,
        firstPassEventId,
        XP_REWARDS.LESSON_COMPLETED
      );
      working = firstAward.updated;
      xpEarnedNow += firstAward.awardedNow;

      if (lessonMistakesCount === 0 && lessonHintsCount === 0) {
        const bonusEventId = `xp-lesson-perfect-${activeLesson.id}`;
        const bonusAward = awardIdempotentXp(
          working,
          bonusEventId,
          XP_REWARDS.PERFECT_FIRST_TRY_BONUS
        );
        working = bonusAward.updated;
        bonusXpEarned = bonusAward.awardedNow;
      }

      // If lesson was already completed previously, award +5 XP review if delayed follow-up
      if (firstAward.awardedNow === 0 && isDelayedFollowUp) {
        const revEventId = `xp-review-${activeLesson.id}-${activeProgress.checkpointAttempts + 1}`;
        const revAward = awardIdempotentXp(
          working,
          revEventId,
          XP_REWARDS.REVIEW_COMPLETED
        );
        working = {
          ...revAward.updated,
          reviewsCompletedCount: working.reviewsCompletedCount + 1,
        };
        xpEarnedNow += revAward.awardedNow;
      }

      return working;
    });

    setLessonCompleteSummary({
      xpEarnedNow: xpEarnedNow || XP_REWARDS.REVIEW_COMPLETED,
      bonusXpEarned,
      totalSteps: activeLesson.steps.length,
      mistakesCount: lessonMistakesCount,
    });
  };

  return (
    <div className="mt-6 space-y-6">
      {/* =====================================================================
          TOP GAMIFICATION & NAVIGATION HUD (XP, Livello, Obiettivo, Streak, Energia)
          ===================================================================== */}
      <div className="rounded-[26px] border-2 border-[#613BE0]/30 bg-[#2513A4] p-4 md:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Level & Mascot */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8EC] p-2 shadow-md">
              <img
                src={levelInfo.current.mascotAsset}
                alt={levelInfo.current.title}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#E9FF60] px-3 py-0.5 font-display text-xs font-extrabold text-[#2513A4]">
                  LIVELLO {levelInfo.current.level} · {levelInfo.current.title.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-white/80">
                  {gamification.totalXp} XP totali
                </span>
              </div>
              <p className="mt-1 text-xs text-white/80">
                {levelInfo.current.description}
              </p>
              {levelInfo.next && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 w-40 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#E9FF60] transition-all"
                      style={{ width: `${levelInfo.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-white/70">
                    Prossimo: {levelInfo.next.title} ({levelInfo.next.minXp} XP)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Daily Goal, Streak, Positive Energy & Tier Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase text-white/70">
                Obiettivo Giornaliero
              </div>
              <div className="mt-0.5 font-display text-lg font-extrabold text-[#E9FF60]">
                {gamification.todayXp} / {gamification.dailyGoalXp} XP
              </div>
              <div className="text-[10px] text-white/70">
                {gamification.todayXp >= gamification.dailyGoalXp
                  ? "✓ Obiettivo centrato!"
                  : "+10 XP a lezione"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase text-white/70">
                Giorni Attivi (Streak)
              </div>
              <div className="mt-0.5 font-display text-lg font-extrabold text-[#FFD014]">
                🔥 {gamification.streakDays} {gamification.streakDays === 1 ? "giorno" : "giorni"}
              </div>
              <div className="text-[10px] text-white/70">Ritmo positivo, zero stress</div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <div className="text-[10px] font-bold uppercase text-white/70">
                Carica Allenamento
              </div>
              <div className="mt-0.5 font-display text-lg font-extrabold text-emerald-300">
                ⚡ 100% Attiva
              </div>
              <div className="text-[10px] text-white/70">Gli errori non bloccano mai</div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5">
              <label className="block text-[10px] font-bold uppercase text-white/70">
                Piano attivo (Demo)
              </label>
              <select
                value={simulatedPlanTier}
                onChange={(e) => setSimulatedPlanTier(e.target.value as LessonTier)}
                aria-label="Seleziona il piano di abbonamento per testare gli sblocchi"
                className="mt-1 w-full rounded-lg bg-[#2513A4] px-2 py-1 text-xs font-extrabold text-[#E9FF60] border border-white/25"
              >
                <option value="free">LOCOMPRO DOPO (Free)</option>
                <option value="plus">POCO LOCO (Plus)</option>
                <option value="pro">PRO LOCO (Pro)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Pills between the Academy Views */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSubScreen("path")}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                subScreen === "path"
                  ? "bg-[#E9FF60] text-[#2513A4]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              🗺️ Percorso di Apprendimento (12 Unità)
            </button>
            <button
              type="button"
              onClick={() => setSubScreen("mistakes")}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                subScreen === "mistakes"
                  ? "bg-[#E9FF60] text-[#2513A4]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              🔁 Ripassa Errori & Scadenze (
              {gamification.mistakeQueue.length + dueReviewsCount})
            </button>
            <button
              type="button"
              onClick={() => setSubScreen("progress")}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                subScreen === "progress"
                  ? "bg-[#E9FF60] text-[#2513A4]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              🏆 Abilità, Livelli & Badge ({unlockedBadgeIds.length}/{ACADEMY_BADGES.length})
            </button>
            <button
              type="button"
              onClick={() => setSubScreen("catalog")}
              className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                subScreen === "catalog"
                  ? "bg-[#E9FF60] text-[#2513A4]"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              📚 Catalogo Rapido (56 Lezioni)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMajorReferenceModal((v) => !v)}
              className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-white/20"
            >
              🔢 Tabella Fonetica `major-it-v1`
            </button>
            {nextRecommendedLesson && (
              <button
                type="button"
                onClick={() => startOrResumeLesson(nextRecommendedLesson.id)}
                className="rounded-full bg-[#FFD014] px-4 py-2 font-display text-xs font-extrabold text-[#181818] shadow-md hover:brightness-105"
              >
                ▶ Gioca ora: {nextRecommendedLesson.id} · {nextRecommendedLesson.title}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabella Fonetica major-it-v1 espandibile */}
      {showMajorReferenceModal && (
        <div className="rounded-[24px] border-2 border-[#613BE0] bg-[#2513A4] p-5 text-white shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="font-display text-xl font-extrabold text-[#E9FF60]">
                Tabella Fonetica Italiana Ufficiale (`major-it-v1`)
              </h3>
              <p className="text-xs text-white/80">
                0 = S/Z/SC dolce (<em>scena</em>=02) · 6 = C/G dolce (<em>ciao</em>=6,{" "}
                <em>micio</em>=36) · 7 = C/G dura (<em>casa</em>=70, <em>mago</em>=37).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMajorReferenceModal(false)}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white"
            >
              Chiudi ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {MAJOR_IT_V1_TABLE.map((row) => (
              <div
                key={row.digit}
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-[#E9FF60]">
                    {row.digit}
                  </span>
                  <span className="font-mono text-[11px] text-white/80">
                    {row.phonemes}
                  </span>
                </div>
                <div className="mt-1 font-bold">{row.sounds}</div>
                <div className="mt-1 text-[11px] text-[#E9FF60]">
                  {row.exampleWords.map((e) => `${e.word} (${e.digits})`).join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 1: VISUAL LEARNING PATH (Mappa verticale sinuosa a nodi & tappe)
          ===================================================================== */}
      {subScreen === "path" && (
        <div className="space-y-8">
          {/* Assistenza Contestuale / Lezione al momento giusto */}
          {adaptiveRecommendations.length > 0 && (
            <div className="rounded-[24px] border border-[#613BE0]/35 bg-[#D0C4F6]/65 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="rounded-full bg-[#613BE0] px-3 py-0.5 text-[11px] font-extrabold uppercase text-white">
                    Lezione al momento giusto · Routing Adattivo
                  </span>
                  <p className="mt-1 text-xs font-semibold text-[#181818]/80">
                    Consigli mirati in base agli errori osservati nei tuoi tentativi:
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {adaptiveRecommendations.slice(0, 2).map((rec) => (
                  <div
                    key={rec.id}
                    className="rounded-2xl bg-white p-3.5 shadow-xs flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-[#613BE0]">
                          {rec.observedSignal}
                        </span>
                        <span className="rounded-full bg-[#D0C4F6] px-2.5 py-0.5 text-[10px] font-bold text-[#181818]">
                          Campione n={rec.sampleSize}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#181818]/80">{rec.explanation}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.recommendedLessonIds.map((lid) => (
                        <button
                          key={lid}
                          type="button"
                          onClick={() => startOrResumeLesson(lid)}
                          className="rounded-full bg-[#613BE0] px-3 py-1 text-xs font-bold text-white hover:opacity-95"
                        >
                          ▶ Gioca {lid}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Le 12 Unità del Learning Path */}
          {ACADEMY_COURSES.map((unit) => {
            const tierMeta = TIER_NAMING[unit.planTier];
            const isCheckpointDone = gamification.completedUnitCheckpoints.includes(
              unit.courseId
            );
            const unitCompletedCount = unit.lessons.filter((l) => {
              const st = progressMap[l.id]?.status;
              return st === "provisionally_passed" || st === "mastered_after_delay";
            }).length;
            const isHighlightedFromHome =
              focusedCourseNumber !== null &&
              focusedCourseNumber !== undefined &&
              unit.courseNumber === focusedCourseNumber;

            // Sinuous horizontal offsets (px) for nodes along the vertical trail
            const waveOffsets = [0, -48, -72, -32, 36, 72, 28, -28];

            return (
              <section
                key={unit.courseId}
                id={`academy-unit-${unit.courseNumber}`}
                className={`rounded-[30px] border-2 p-5 md:p-7 transition ${
                  isHighlightedFromHome
                    ? "border-[#FFD014] bg-[#2513A4] text-white ring-4 ring-[#FFD014]/50"
                    : "border-[#613BE0]/25 bg-[#2513A4] text-white"
                } shadow-xl`}
              >
                {/* Unit Header Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-[#2E1BC4] p-4 md:p-5 border border-white/15">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8EC] p-2 shadow">
                      <img
                        src={unit.mascotAsset}
                        alt={unit.unitTitle}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#E9FF60] px-3 py-0.5 font-display text-xs font-extrabold text-[#2513A4]">
                          {unit.unitTitle}
                        </span>
                        <span
                          className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                            unit.planTier === "free"
                              ? "bg-emerald-400/20 text-emerald-200"
                              : unit.planTier === "plus"
                                ? "bg-[#FFD014]/25 text-[#FFD014]"
                                : "bg-fuchsia-400/25 text-fuchsia-200"
                          }`}
                        >
                          {tierMeta.shortBadge}
                        </span>
                        <span className="text-xs font-bold text-white/75">
                          {unitCompletedCount}/{unit.lessons.length} tappe completate
                        </span>
                      </div>
                      <h3 className="mt-1 font-display text-xl md:text-2xl font-extrabold text-white">
                        {unit.title}
                      </h3>
                      <p className="text-xs md:text-sm text-white/80">{unit.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setUnitDetailCourseId(unit.courseId)}
                      className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      📋 Panoramica Unità
                    </button>
                  </div>
                </div>

                {/* Sinuous Node Trail */}
                <div className="relative mt-8 flex flex-col items-center space-y-6 pb-4">
                  {unit.lessons.map((lesson, idx) => {
                    const prog = progressMap[lesson.id];
                    const { state: visualState, missingPrerequisites } =
                      resolvePathNodeVisualState(lesson, progressMap, simulatedPlanTier);
                    const offsetPx = waveOffsets[idx % waveOffsets.length] ?? 0;
                    const isNextUp = nextRecommendedLesson?.id === lesson.id;

                    // Styling per node visual state
                    let circleStyle =
                      "border-[#E9FF60] bg-[#613BE0] text-white shadow-[0_6px_0_#170B6E]";
                    let stateBadgeText = "Disponibile";
                    let iconSymbol = "★";

                    if (visualState === "completed") {
                      circleStyle =
                        "border-white bg-[#E9FF60] text-[#2513A4] shadow-[0_6px_0_#9BB01A]";
                      stateBadgeText =
                        prog?.status === "mastered_after_delay"
                          ? "Padroneggiata ✓✓"
                          : "Completata ✓";
                      iconSymbol = "✓";
                    } else if (visualState === "in_progress") {
                      circleStyle =
                        "border-[#FFD014] bg-[#FFD014] text-[#181818] shadow-[0_6px_0_#B58E00]";
                      stateBadgeText = `In corso (Step ${
                        (prog?.currentStepIndex ?? 0) + 1
                      }/${lesson.steps.length})`;
                      iconSymbol = "▶";
                    } else if (visualState === "needs_review") {
                      circleStyle =
                        "border-rose-200 bg-rose-500 text-white shadow-[0_6px_0_#881337]";
                      stateBadgeText = "Ripasso consigliato";
                      iconSymbol = "↻";
                    } else if (visualState === "premium") {
                      circleStyle =
                        "border-[#FFD014] bg-[#3B23B8] text-[#FFD014] shadow-[0_6px_0_#170B6E]";
                      stateBadgeText = `Piano ${
                        TIER_NAMING[lesson.planTier].editorialName
                      }`;
                      iconSymbol = "👑";
                    } else if (visualState === "locked") {
                      circleStyle =
                        "border-white/25 bg-white/10 text-white/60 shadow-[0_5px_0_rgba(0,0,0,0.35)]";
                      stateBadgeText = `Prerequisito: ${missingPrerequisites.join(", ")}`;
                      iconSymbol = "🔒";
                    }

                    return (
                      <div
                        key={lesson.id}
                        className="relative flex flex-col items-center"
                        style={{ transform: `translateX(${offsetPx}px)` }}
                      >
                        {/* Connector line from previous node */}
                        {idx > 0 && (
                          <div
                            className={`-mt-6 mb-2 h-6 w-1.5 rounded-full ${
                              visualState === "completed"
                                ? "bg-[#E9FF60]"
                                : "bg-white/20"
                            }`}
                          />
                        )}

                        {/* Callout bubble on the active / next lesson */}
                        {isNextUp && (
                          <div className="mb-2 animate-bounce rounded-full bg-[#FFD014] px-4 py-1 font-display text-xs font-extrabold text-[#181818] shadow-lg">
                            INIZIA ORA · +10 XP
                          </div>
                        )}

                        {/* Circular Interactive Node Button */}
                        <button
                          type="button"
                          onClick={() => {
                            if (visualState === "premium") {
                              setPremiumPreviewLesson(lesson);
                              return;
                            }
                            startOrResumeLesson(lesson.id);
                          }}
                          className={`group relative flex h-20 w-20 items-center justify-center rounded-full border-4 font-display text-2xl font-extrabold transition active:translate-y-1 ${circleStyle}`}
                          aria-label={`${lesson.id} ${lesson.title} — ${stateBadgeText}`}
                        >
                          <span>{iconSymbol}</span>
                          <span className="absolute -bottom-2 rounded-full bg-[#181818] px-2.5 py-0.5 text-[10px] font-extrabold text-[#E9FF60]">
                            {lesson.id}
                          </span>
                        </button>

                        {/* Node Label Card */}
                        <div className="mt-3 max-w-[250px] text-center">
                          <div className="font-display text-sm font-extrabold text-white">
                            {lesson.title}
                          </div>
                          <div className="mt-0.5 text-[11px] font-semibold text-white/75">
                            {stateBadgeText} · {lesson.steps.length} step
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Unit Checkpoint Challenge Node (+20 XP) */}
                  <div className="flex flex-col items-center pt-2">
                    <div
                      className={`mb-2 h-6 w-1.5 rounded-full ${
                        isCheckpointDone ? "bg-[#E9FF60]" : "bg-white/25"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveCheckpointCourse(unit);
                        setCheckpointStepIdx(0);
                        setCheckpointSelectedValue(null);
                        setCheckpointMistakes(0);
                        setCheckpointFinished(false);
                      }}
                      className={`flex items-center gap-3 rounded-3xl border-4 px-6 py-3.5 font-display text-sm font-extrabold shadow-xl transition hover:scale-105 ${
                        isCheckpointDone
                          ? "border-white bg-[#E9FF60] text-[#2513A4]"
                          : "border-[#FFD014] bg-[#613BE0] text-white"
                      }`}
                    >
                      <span className="text-xl">{isCheckpointDone ? "🏆" : "🛡️"}</span>
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-wider opacity-85">
                          Checkpoint Fine Unità {unit.unitNumber}
                        </div>
                        <div>
                          {isCheckpointDone
                            ? "Sfida Superata (+20 XP) · Ripeti"
                            : "Sfida Conclusiva Unità · +20 XP"}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* =====================================================================
          SCREEN 6: REVIEW MISTAKES & SPACED REPETITION QUEUE
          ===================================================================== */}
      {subScreen === "mistakes" && (
        <div className="rounded-[28px] border-2 border-[#613BE0]/30 bg-[#2513A4] p-6 text-white shadow-xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/figma-curated/academy-item-clock.svg"
                alt=""
                className="h-12 w-12 object-contain"
              />
              <div>
                <h3 className="font-display text-2xl font-extrabold text-[#E9FF60]">
                  Ripasso Intelligente: Coda Errori & Scadenze FSRS-7
                </h3>
                <p className="text-xs text-white/80">
                  Ogni errore alimenta una prova mirata. Superare un errore in autonomia assegna{" "}
                  <strong>+{XP_REWARDS.REVIEW_COMPLETED} XP</strong> e consolida la tecnica.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onStartBlindRecallFromAcademy}
              className="rounded-full bg-[#FFD014] px-4 py-2 font-display text-xs font-extrabold text-[#181818]"
            >
              Apri Blind Recall Completo ({dueReviewsCount} target in scadenza) ↗
            </button>
          </div>

          {gamification.mistakeQueue.length === 0 ? (
            <div className="rounded-2xl bg-white/10 p-6 text-center space-y-2">
              <img
                src="/assets/figma-curated/academy-mascot-goose.svg"
                alt=""
                className="mx-auto h-20 w-20 object-contain"
              />
              <div className="font-display text-xl font-extrabold text-[#E9FF60]">
                Nessun errore in sospeso nella coda Academy!
              </div>
              <p className="text-xs text-white/80">
                Continua il percorso di apprendimento o ripassa una lezione già completata per verificare la ritenzione a distanza.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gamification.mistakeQueue.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-rose-500/30 px-3 py-0.5 text-xs font-bold text-rose-200">
                      Errore da riprovare #{idx + 1} · {item.lessonId} ({item.lessonTitle})
                    </span>
                    <button
                      type="button"
                      onClick={() => startOrResumeLesson(item.lessonId)}
                      className="text-xs font-bold text-[#E9FF60] underline"
                    >
                      Rigioca intera lezione {item.lessonId} →
                    </button>
                  </div>
                  <div className="font-display text-base font-extrabold text-white">
                    {item.prompt}
                  </div>
                  <p className="text-xs text-white/80">{item.explanation}</p>

                  {idx === 0 && (
                    <div className="pt-2 space-y-2">
                      <input
                        type="text"
                        value={mistakeReplyText}
                        onChange={(e) => setMistakeReplyText(e.target.value)}
                        placeholder="Scrivi qui la risposta corretta senza guardare..."
                        className="w-full rounded-xl border border-white/30 bg-[#2513A4] px-3.5 py-2 text-xs text-white"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const clean = mistakeReplyText.trim().toLowerCase();
                            const expected = item.expectedAnswer.trim().toLowerCase();
                            if (
                              clean.length > 0 &&
                              (expected.includes(clean) || clean.includes(expected.slice(0, 4)))
                            ) {
                              setGamification((prev) => {
                                const revId = `xp-mistake-fixed-${item.id}-${prev.reviewsCompletedCount + 1}`;
                                const awarded = awardIdempotentXp(
                                  prev,
                                  revId,
                                  XP_REWARDS.REVIEW_COMPLETED
                                );
                                return {
                                  ...awarded.updated,
                                  reviewsCompletedCount:
                                    awarded.updated.reviewsCompletedCount + 1,
                                  mistakeQueue: awarded.updated.mistakeQueue.filter(
                                    (m) => m.id !== item.id
                                  ),
                                };
                              });
                              setMistakeReplyText("");
                              setMistakeFeedbackMsg(
                                `✓ Ottimo recupero! Errore risolto (+${XP_REWARDS.REVIEW_COMPLETED} XP).`
                              );
                            } else {
                              setMistakeFeedbackMsg(
                                `Riprova! Chiave attesa: «${item.expectedAnswer}»`
                              );
                            }
                          }}
                          className="rounded-full bg-[#E9FF60] px-4 py-1.5 text-xs font-extrabold text-[#2513A4]"
                        >
                          Verifica e Rimuovi dalla Coda (+5 XP)
                        </button>
                      </div>
                      {mistakeFeedbackMsg && (
                        <div className="text-xs font-bold text-[#E9FF60]">
                          {mistakeFeedbackMsg}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SCREEN 8: ACADEMY PROGRESS (Abilità direzionali, Livelli LOCO & Badge)
          ===================================================================== */}
      {subScreen === "progress" && (
        <div className="space-y-6">
          {/* Directional Competence & Mastery Breakdown */}
          <div className="rounded-[28px] border-2 border-[#613BE0]/30 bg-[#2513A4] p-6 text-white shadow-xl">
            <h3 className="font-display text-2xl font-extrabold text-[#E9FF60]">
              Competenze Verificate & Indicatori Direzionali
            </h3>
            <p className="mt-1 text-xs text-white/80">
              LOCO separa gli XP di attività dalla reale padronanza nel tempo e distingue le direzioni di codifica/decodifica.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/15 bg-[#2E1BC4] p-4">
                <div className="text-xs font-bold text-[#E9FF60]">
                  Major System · Codifica (Numero → Parola)
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold">
                  {gamification.forwardEncodingCorrectCount} /{" "}
                  {gamification.forwardEncodingTotalCount} prove
                </div>
                <p className="mt-1 text-[11px] text-white/75">
                  Trasformazione di cifre astratte in parole foneticamente valide (`major-it-v1`).
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[#2E1BC4] p-4">
                <div className="text-xs font-bold text-[#E9FF60]">
                  Major System · Decodifica Inversa (Parola → Numero)
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold">
                  {gamification.reverseDecodingCorrectCount} /{" "}
                  {gamification.reverseDecodingTotalCount} prove
                </div>
                <p className="mt-1 text-[11px] text-white/75">
                  Estrazione delle cifre a partire dai suoni consonantici dell&apos;immagine.
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-[#2E1BC4] p-4">
                <div className="text-xs font-bold text-[#E9FF60]">
                  Ripassi & Consolidamento a Distanza
                </div>
                <div className="mt-1 font-display text-2xl font-extrabold">
                  {gamification.reviewsCompletedCount} ripassi svolti
                </div>
                <p className="mt-1 text-[11px] text-white/75">
                  Prove autonome effettuate dopo un intervallo o sulla coda errori.
                </p>
              </div>
            </div>

            {/* I 5 Livelli LOCO */}
            <h4 className="mt-6 font-display text-lg font-extrabold text-white">
              Scala dei Livelli LOCO
            </h4>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {LOCO_LEVELS.map((lvl) => {
                const isReached = gamification.totalXp >= lvl.minXp;
                return (
                  <div
                    key={lvl.level}
                    className={`rounded-2xl border p-3.5 text-center ${
                      isReached
                        ? "border-[#E9FF60] bg-[#2E1BC4]"
                        : "border-white/15 bg-white/5 opacity-60"
                    }`}
                  >
                    <img
                      src={lvl.mascotAsset}
                      alt={lvl.title}
                      className="mx-auto h-14 w-14 object-contain"
                    />
                    <div className="mt-2 font-display text-sm font-extrabold text-[#E9FF60]">
                      Liv. {lvl.level} · {lvl.title}
                    </div>
                    <div className="text-[11px] text-white/75">{lvl.minXp}+ XP</div>
                  </div>
                );
              })}
            </div>

            {/* I 6 Badge Verificabili */}
            <h4 className="mt-6 font-display text-lg font-extrabold text-white">
              Badge Verificabili ({unlockedBadgeIds.length} / {ACADEMY_BADGES.length})
            </h4>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ACADEMY_BADGES.map((badge) => {
                const unlocked = unlockedBadgeIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3.5 ${
                      unlocked
                        ? "border-[#E9FF60] bg-[#2E1BC4]"
                        : "border-white/15 bg-white/5 opacity-65"
                    }`}
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#FFF8EC] p-2">
                      <img
                        src={badge.asset}
                        alt={badge.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-display text-sm font-extrabold text-white">
                          {badge.title}
                        </span>
                        <span className="text-xs">
                          {unlocked ? "✅" : "🔒"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/75">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          CATALOGO COMPLETO RICERCABILE (Accesso libero a tutte le 56 lezioni)
          ===================================================================== */}
      {subScreen === "catalog" && (
        <div className="rounded-[28px] border-2 border-[#613BE0]/30 bg-[#2513A4] p-6 text-white shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-extrabold text-[#E9FF60]">
                Catalogo Completo: 12 Unità · 56 Microlezioni Interattive
              </h3>
              <p className="text-xs text-white/80">
                Il percorso principale è guidato, ma da qui puoi esplorare liberamente qualsiasi approfondimento o tecnica.
              </p>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca ID (S01, L06, N02...) o parola..."
              className="w-full md:w-72 rounded-full border border-white/30 bg-[#2E1BC4] px-4 py-2 text-xs text-white"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "Tutti (56)" },
                { id: "free", label: "LOCOMPRO DOPO · Free (32)" },
                { id: "plus", label: "POCO LOCO · Plus (20)" },
                { id: "pro", label: "PRO LOCO · Pro (4)" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTierFilter(t.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${
                  selectedTierFilter === t.id
                    ? "bg-[#E9FF60] text-[#2513A4]"
                    : "bg-white/10 text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ENRICHED_ACADEMY_LESSONS.filter((l) => {
              if (selectedTierFilter !== "all" && l.planTier !== selectedTierFilter)
                return false;
              if (selectedThemeFilter !== "all" && l.theme !== selectedThemeFilter)
                return false;
              if (!searchQuery.trim()) return true;
              const q = searchQuery.toLowerCase();
              return (
                l.id.toLowerCase().includes(q) ||
                l.title.toLowerCase().includes(q) ||
                l.reading.toLowerCase().includes(q)
              );
            }).map((lesson) => {
              const prog = progressMap[lesson.id];
              const isDone =
                prog?.status === "provisionally_passed" ||
                prog?.status === "mastered_after_delay";
              return (
                <div
                  key={lesson.id}
                  className="rounded-2xl border border-white/15 bg-[#2E1BC4] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-extrabold text-[#E9FF60]">
                        {lesson.id} · Unità {lesson.unitNumber}
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold">
                        {TIER_NAMING[lesson.planTier].editorialName}
                      </span>
                    </div>
                    <h4 className="mt-1 font-display text-base font-extrabold text-white">
                      {lesson.title}
                    </h4>
                    <p className="mt-1 text-xs text-white/75 line-clamp-2">
                      {lesson.reading}
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-white/70">
                      {lesson.steps.length} schermate · {isDone ? "✓ Completata" : "Da giocare"}
                    </span>
                    <button
                      type="button"
                      onClick={() => startOrResumeLesson(lesson.id)}
                      className="rounded-full bg-[#E9FF60] px-3.5 py-1 text-xs font-extrabold text-[#2513A4]"
                    >
                      ▶ Gioca
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 2: UNIT DETAIL MODAL
          ===================================================================== */}
      {unitDetailCourseId &&
        (() => {
          const unit = ACADEMY_COURSES.find((c) => c.courseId === unitDetailCourseId);
          if (!unit) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
              <div className="w-full max-w-2xl rounded-[28px] border-2 border-[#E9FF60] bg-[#2513A4] p-6 text-white shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={unit.mascotAsset}
                      alt=""
                      className="h-14 w-14 rounded-xl bg-[#FFF8EC] p-1.5 object-contain"
                    />
                    <div>
                      <span className="text-xs font-extrabold text-[#E9FF60]">
                        {unit.unitTitle}
                      </span>
                      <h3 className="font-display text-2xl font-extrabold">
                        {unit.title}
                      </h3>
                      <p className="text-xs text-white/80">{unit.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnitDetailCourseId(null)}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold"
                  >
                    Chiudi ✕
                  </button>
                </div>

                <div className="space-y-2">
                  {unit.lessons.map((l) => {
                    const p = progressMap[l.id];
                    return (
                      <div
                        key={l.id}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-[#2E1BC4] p-3"
                      >
                        <div>
                          <div className="font-display text-sm font-extrabold text-[#E9FF60]">
                            {l.id} · {l.title}
                          </div>
                          <div className="text-[11px] text-white/75">
                            {l.steps.length} schermate interattive · ~{l.estimatedMinutes ?? 5} min · Stato:{" "}
                            {p?.status ?? "available"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUnitDetailCourseId(null);
                            startOrResumeLesson(l.id);
                          }}
                          className="rounded-full bg-[#E9FF60] px-4 py-1.5 text-xs font-extrabold text-[#2513A4]"
                        >
                          ▶ Avvia
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

      {/* =====================================================================
          SCREEN 9: PREMIUM PREVIEW MODAL (POCO LOCO & PRO LOCO)
          ===================================================================== */}
      {premiumPreviewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-lg rounded-[28px] border-2 border-[#FFD014] bg-[#2513A4] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#FFD014] px-3 py-1 text-xs font-extrabold text-[#181818]">
                👑 Anteprima Piano {TIER_NAMING[premiumPreviewLesson.planTier].editorialName}
              </span>
              <button
                type="button"
                onClick={() => setPremiumPreviewLesson(null)}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold"
              >
                Chiudi ✕
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src="/assets/figma-curated/illustration-plan-poco-loco.svg"
                alt=""
                className="h-20 w-20 object-contain"
              />
              <div>
                <h3 className="font-display text-2xl font-extrabold text-white">
                  {premiumPreviewLesson.id} · {premiumPreviewLesson.title}
                </h3>
                <p className="mt-1 text-xs text-white/85">
                  {TIER_NAMING[premiumPreviewLesson.planTier].description}
                </p>
              </div>
            </div>

            <ul className="space-y-1.5 rounded-2xl bg-[#2E1BC4] p-4 text-xs text-white/90">
              {TIER_NAMING[premiumPreviewLesson.planTier].featuresList.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>

            {premiumPreviewLesson.requiresSimulatedFallbackNotice &&
              premiumPreviewLesson.fallbackNoticeText && (
                <div className="rounded-xl border border-amber-300/50 bg-amber-500/15 p-3 text-xs text-amber-100">
                  {premiumPreviewLesson.fallbackNoticeText}
                </div>
              )}

            <div className="flex flex-wrap justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const targetId = premiumPreviewLesson.id;
                  setSimulatedPlanTier(premiumPreviewLesson.planTier);
                  setPremiumPreviewLesson(null);
                  startOrResumeLesson(targetId);
                }}
                className="rounded-full bg-[#E9FF60] px-5 py-2.5 font-display text-xs font-extrabold text-[#2513A4]"
              >
                Attiva Anteprima {TIER_NAMING[premiumPreviewLesson.planTier].editorialName} e Gioca Lezione →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREEN 7: UNIT CHECKPOINT CHALLENGE MODAL (+20 XP)
          ===================================================================== */}
      {activeCheckpointCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-xl rounded-[28px] border-2 border-[#FFD014] bg-[#2513A4] p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[#FFD014]">
                  🛡️ Sfida Finale {activeCheckpointCourse.unitTitle}
                </span>
                <h3 className="font-display text-xl font-extrabold">
                  Checkpoint senza suggerimenti · +{XP_REWARDS.CHECKPOINT_PASSED} XP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheckpointCourse(null)}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold"
              >
                Esci ✕
              </button>
            </div>

            {!checkpointFinished ? (
              (() => {
                const q =
                  activeCheckpointCourse.checkpointQuestions[checkpointStepIdx];
                if (!q) return null;
                return (
                  <div className="space-y-4">
                    <div className="text-xs text-white/75">
                      Domanda {checkpointStepIdx + 1} di{" "}
                      {activeCheckpointCourse.checkpointQuestions.length}
                    </div>
                    <div className="font-display text-lg font-extrabold text-white">
                      {q.question}
                    </div>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCheckpointSelectedValue(opt.value)}
                          className={`w-full rounded-2xl border-2 p-3.5 text-left text-xs font-bold transition ${
                            checkpointSelectedValue === opt.value
                              ? "border-[#E9FF60] bg-[#E9FF60] text-[#2513A4]"
                              : "border-white/20 bg-[#2E1BC4] text-white"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!checkpointSelectedValue}
                      onClick={() => {
                        const isRight = checkpointSelectedValue === "correct";
                        const nextMistakes = checkpointMistakes + (isRight ? 0 : 1);
                        setCheckpointMistakes(nextMistakes);
                        if (
                          checkpointStepIdx + 1 <
                          activeCheckpointCourse.checkpointQuestions.length
                        ) {
                          setCheckpointStepIdx((i) => i + 1);
                          setCheckpointSelectedValue(null);
                        } else {
                          setCheckpointFinished(true);
                          if (nextMistakes === 0) {
                            setGamification((prev) => {
                              const evId = `xp-checkpoint-${activeCheckpointCourse.courseId}`;
                              const awarded = awardIdempotentXp(
                                prev,
                                evId,
                                XP_REWARDS.CHECKPOINT_PASSED
                              );
                              return {
                                ...awarded.updated,
                                completedUnitCheckpoints: Array.from(
                                  new Set([
                                    ...awarded.updated.completedUnitCheckpoints,
                                    activeCheckpointCourse.courseId,
                                  ])
                                ),
                              };
                            });
                          }
                        }
                      }}
                      className="w-full rounded-full bg-[#FFD014] py-3 font-display text-sm font-extrabold text-[#181818] disabled:opacity-40"
                    >
                      Conferma risposta
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="text-center space-y-4 py-3">
                <img
                  src="/assets/figma-curated/academy-mascot-lion.svg"
                  alt=""
                  className="mx-auto h-24 w-24 object-contain"
                />
                <h4 className="font-display text-2xl font-extrabold text-[#E9FF60]">
                  {checkpointMistakes === 0
                    ? `🏆 Checkpoint Superato! +${XP_REWARDS.CHECKPOINT_PASSED} XP`
                    : `Quasi! Hai commesso ${checkpointMistakes} errori`}
                </h4>
                <p className="text-xs text-white/80">
                  {checkpointMistakes === 0
                    ? "Hai dimostrato padronanza sui concetti chiave dell'unità senza aiuti."
                    : "Ripassa le tappe dell'unità e riprova per conquistare il trofeo del Checkpoint."}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCheckpointCourse(null)}
                  className="rounded-full bg-[#E9FF60] px-6 py-2.5 font-display text-sm font-extrabold text-[#2513A4]"
                >
                  Torna al Percorso
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SCREENS 3, 4 & 5: INTERACTIVE MULTI-STEP LESSON PLAYER + FEEDBACK + LESSON COMPLETE
          ===================================================================== */}
      {activeLesson && activeProgress && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="duolingo-like-lesson-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#140A5E]/90 p-3 md:p-6 overflow-y-auto"
        >
          <div className="my-auto w-full max-w-3xl rounded-[32px] border-2 border-[#E9FF60] bg-[#2513A4] p-5 md:p-8 text-white shadow-2xl">
            {/* SCREEN 5: LESSON COMPLETE CELEBRATION */}
            {lessonCompleteSummary ? (
              <div className="space-y-6 text-center py-4">
                <img
                  src="/assets/figma-curated/illustration-finish-runner.svg"
                  alt="Lezione completata"
                  className="mx-auto h-36 w-auto object-contain"
                />
                <div>
                  <span className="rounded-full bg-[#E9FF60] px-4 py-1 font-display text-xs font-extrabold text-[#2513A4]">
                    TAPPA COMPLETATA · {activeLesson.id}
                  </span>
                  <h3 className="mt-3 font-display text-3xl font-extrabold text-white">
                    Ottimo lavoro su «{activeLesson.title}»!
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    Criterio allenato: {activeLesson.masteryCriterion}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
                  <div className="rounded-2xl border border-[#E9FF60] bg-[#2E1BC4] p-3">
                    <div className="text-[10px] uppercase text-white/70">XP Guadagnati</div>
                    <div className="font-display text-2xl font-extrabold text-[#E9FF60]">
                      +{lessonCompleteSummary.xpEarnedNow} XP
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#FFD014] bg-[#2E1BC4] p-3">
                    <div className="text-[10px] uppercase text-white/70">Bonus Precisione</div>
                    <div className="font-display text-2xl font-extrabold text-[#FFD014]">
                      +{lessonCompleteSummary.bonusXpEarned} XP
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-3">
                    <div className="text-[10px] uppercase text-white/70">Errori in Coda</div>
                    <div className="font-display text-2xl font-extrabold text-white">
                      {lessonCompleteSummary.mistakesCount}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectLesson(null)}
                    className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs font-extrabold text-white"
                  >
                    Torna alla Mappa
                  </button>
                  {nextRecommendedLesson &&
                    nextRecommendedLesson.id !== activeLesson.id && (
                      <button
                        type="button"
                        onClick={() =>
                          startOrResumeLesson(nextRecommendedLesson.id)
                        }
                        className="rounded-full bg-[#E9FF60] px-7 py-3 font-display text-sm font-extrabold text-[#2513A4] shadow-lg"
                      >
                        Prossima Tappa: {nextRecommendedLesson.id} →
                      </button>
                    )}
                </div>
              </div>
            ) : (
              /* SCREEN 3: ACTIVE STEP IN THE LESSON PLAYER */
              (() => {
                const step = activeLesson.steps[playerStepIndex] ?? activeLesson.steps[0];
                const progressPct = Math.round(
                  ((playerStepIndex + 1) / activeLesson.steps.length) * 100
                );

                return (
                  <div className="space-y-5">
                    {/* Top Progress Bar & Navigation */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectLesson(null)}
                        title="Esci e riprendi da questo step più tardi"
                        className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                      >
                        ✕ Esci
                      </button>
                      {playerStepIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const prevIdx = Math.max(0, playerStepIndex - 1);
                            setPlayerStepIndex(prevIdx);
                            onUpdateLessonProgress(activeLesson.id, (p) => ({
                              ...p,
                              currentStepIndex: prevIdx,
                            }));
                            resetStepInteractionState();
                          }}
                          className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                        >
                          ← Indietro
                        </button>
                      )}

                      <div className="flex-1 h-3.5 rounded-full bg-white/15 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#E9FF60] transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <span className="text-xs font-extrabold text-[#E9FF60]">
                        {playerStepIndex + 1}/{activeLesson.steps.length}
                      </span>
                      {comboCount >= 2 && (
                        <span className="rounded-full bg-[#FFD014] px-2.5 py-0.5 text-[11px] font-extrabold text-[#181818]">
                          🔥 x{comboCount}
                        </span>
                      )}
                    </div>

                    {/* Step Header & LOCO Character */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-[#2E1BC4] p-4 border border-white/15">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8EC] p-2 shadow">
                        <img
                          src={step.illustrationAsset}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#E9FF60]">
                          {activeLesson.id} · {step.stageLabel}
                        </span>
                        <h3
                          id="duolingo-like-lesson-title"
                          className="mt-1 font-display text-xl md:text-2xl font-extrabold text-white"
                        >
                          {step.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-white/90">
                          {step.bodyText}
                        </p>
                        {step.expandableFullText &&
                          step.expandableFullText !== step.bodyText && (
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => setExpandedExplanation((v) => !v)}
                                className="text-xs font-bold text-[#E9FF60] underline"
                              >
                                {expandedExplanation
                                  ? "Riduci spiegazione"
                                  : "Approfondisci spiegazione completa ▾"}
                              </button>
                              {expandedExplanation && (
                                <p className="mt-2 rounded-xl bg-[#2513A4] p-3 text-xs leading-relaxed text-white/90">
                                  {step.expandableFullText}
                                </p>
                              )}
                            </div>
                          )}
                        {step.scientificNote && (
                          <div className="mt-2 rounded-xl bg-amber-400/15 border border-amber-300/40 px-3 py-1.5 text-xs text-amber-100">
                            {step.scientificNote}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* =========================================================
                        REUSABLE EXERCISE ENGINE (12 INTERACTION TYPES)
                        ========================================================= */}

                    {/* A, G, J: MULTIPLE CHOICE / IMAGE ASSOCIATION / ERROR CORRECTION */}
                    {(step.type === "multiple_choice" ||
                      step.type === "image_association" ||
                      step.type === "error_correction") &&
                      step.options && (
                        <div className="space-y-2.5">
                          {step.options.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setSelectedOptionId(opt.id)}
                              className={`w-full rounded-2xl border-2 p-4 text-left text-sm font-bold transition ${
                                selectedOptionId === opt.id
                                  ? "border-[#E9FF60] bg-[#E9FF60] text-[#2513A4]"
                                  : "border-white/20 bg-[#2E1BC4] text-white hover:border-white/50"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* B: MATCHING PAIRS */}
                    {step.type === "matching_pairs" && step.pairs && (
                      <div className="space-y-3">
                        <div className="text-xs text-white/80">
                          Tocca prima un elemento a sinistra e poi il suo corrispondente a destra ({matchedPairIds.length}/{step.pairs.length} abbinati):
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            {step.pairs.map((p) => {
                              const done = matchedPairIds.includes(p.id);
                              const active = selectedLeftPairId === p.id;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={done}
                                  onClick={() => setSelectedLeftPairId(p.id)}
                                  className={`w-full rounded-xl border-2 p-3 font-display text-sm font-extrabold ${
                                    done
                                      ? "border-emerald-400 bg-emerald-900/40 text-emerald-200"
                                      : active
                                        ? "border-[#E9FF60] bg-[#E9FF60] text-[#2513A4]"
                                        : "border-white/20 bg-[#2E1BC4] text-white"
                                  }`}
                                >
                                  {p.left}
                                </button>
                              );
                            })}
                          </div>
                          <div className="space-y-2">
                            {[...step.pairs].reverse().map((p) => {
                              const done = matchedPairIds.includes(p.id);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  disabled={done}
                                  onClick={() => {
                                    if (selectedLeftPairId === p.id) {
                                      setMatchedPairIds((prev) => [...prev, p.id]);
                                      setSelectedLeftPairId(null);
                                    } else {
                                      setSelectedLeftPairId(null);
                                    }
                                  }}
                                  className={`w-full rounded-xl border-2 p-3 text-xs font-bold ${
                                    done
                                      ? "border-emerald-400 bg-emerald-900/40 text-emerald-200"
                                      : "border-white/20 bg-[#2E1BC4] text-white hover:border-[#E9FF60]"
                                  }`}
                                >
                                  {p.right}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* C: SEQUENCE ORDERING */}
                    {step.type === "sequence_ordering" && step.sequenceItems && (
                      <div className="space-y-3">
                        <div className="rounded-2xl border border-white/20 bg-black/20 p-3 min-h-[54px] flex flex-wrap gap-2 items-center">
                          {orderedSequence.length === 0 ? (
                            <span className="text-xs text-white/50">
                              Tocca gli elementi qui sotto nell&apos;ordine esatto (1 → {step.sequenceItems.length})...
                            </span>
                          ) : (
                            orderedSequence.map((item, idx) => (
                              <span
                                key={item}
                                className="rounded-xl bg-[#E9FF60] px-3 py-1.5 text-xs font-extrabold text-[#2513A4]"
                              >
                                {idx + 1}. {item.replace(/^\d+\.\s*/, "")}
                              </span>
                            ))
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[...step.sequenceItems].reverse().map((item) => {
                            const used = orderedSequence.includes(item);
                            return (
                              <button
                                key={item}
                                type="button"
                                disabled={used}
                                onClick={() =>
                                  setOrderedSequence((prev) => [...prev, item])
                                }
                                className="rounded-xl border border-white/30 bg-[#2E1BC4] px-3.5 py-2 text-xs font-bold text-white disabled:opacity-35"
                              >
                                {item.replace(/^\d+\.\s*/, "")}
                              </button>
                            );
                          })}
                          {orderedSequence.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setOrderedSequence([])}
                              className="text-xs underline text-white/75 ml-2"
                            >
                              Ricomincia ordine
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* D: MEMORY FLASH */}
                    {step.type === "memory_flash" && step.flashItems && (
                      <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3">
                        {!flashHidden ? (
                          <div className="space-y-3 text-center">
                            <div className="text-xs font-bold text-[#E9FF60]">
                              Osserva i {step.flashItems.length} oggetti nell&apos;ordine originale (nessuna penalità di tempo):
                            </div>
                            <div className="flex flex-wrap justify-center gap-2.5">
                              {step.flashItems.map((w, i) => (
                                <div
                                  key={w}
                                  className="rounded-2xl bg-[#FFF8EC] px-4 py-3 font-display text-base font-extrabold text-[#2513A4] shadow"
                                >
                                  {i + 1}. {w}
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFlashHidden(true);
                                setFlashRecallSelection([]);
                              }}
                              className="rounded-full bg-[#FFD014] px-6 py-2.5 font-display text-xs font-extrabold text-[#181818]"
                            >
                              Nascondi gli oggetti e prova a ricordarli in ordine →
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-[#E9FF60]">
                              Oggetti nascosti! Toccali nell&apos;ordine originale (1 → {step.flashItems.length}):
                            </div>
                            <div className="rounded-xl bg-black/25 p-3 min-h-[46px] flex flex-wrap gap-2">
                              {flashRecallSelection.map((w, i) => (
                                <span
                                  key={w}
                                  className="rounded-lg bg-[#E9FF60] px-3 py-1 text-xs font-extrabold text-[#2513A4]"
                                >
                                  {i + 1}. {w}
                                </span>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[...step.flashItems].reverse().map((w) => {
                                const picked = flashRecallSelection.includes(w);
                                return (
                                  <button
                                    key={w}
                                    type="button"
                                    disabled={picked}
                                    onClick={() =>
                                      setFlashRecallSelection((prev) => [...prev, w])
                                    }
                                    className="rounded-xl border border-white/30 bg-[#2513A4] px-4 py-2 text-xs font-bold text-white disabled:opacity-35"
                                  >
                                    {w}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => setFlashRecallSelection([])}
                                className="text-xs underline text-white/70"
                              >
                                Ripristina
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* E: FILL IN THE BLANK */}
                    {step.type === "fill_in_blank" && step.blankSentence && (
                      <div className="space-y-3 rounded-2xl border border-white/20 bg-[#2E1BC4] p-4">
                        <p className="text-sm leading-relaxed">
                          {step.blankSentence.before}{" "}
                          <span className="inline-block min-w-[110px] border-b-2 border-[#E9FF60] px-2 font-extrabold text-[#E9FF60]">
                            {blankChoice || "______"}
                          </span>{" "}
                          {step.blankSentence.after}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {step.blankSentence.wordBank.map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => setBlankChoice(w)}
                              className={`rounded-xl px-4 py-2 text-xs font-extrabold ${
                                blankChoice === w
                                  ? "bg-[#E9FF60] text-[#2513A4]"
                                  : "bg-[#2513A4] text-white border border-white/25"
                              }`}
                            >
                              {w}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* H: LOCI PLACEMENT (IN-SCENE) */}
                    {step.type === "loci_placement" && step.lociPlacementSpec && (
                      <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#E9FF60]">
                            Tocca i 5 punti della stanza in ordine per collocare/recuperare i ricordi ({placedLociCount}/5):
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenSceneForLesson(activeLesson.id)}
                            className="rounded-full bg-[#6CA6FF] px-3 py-1 text-[11px] font-extrabold text-[#170B6E]"
                          >
                            Apri Stanza 3D Interattiva ↗
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {step.lociPlacementSpec.roomObjects.map((obj, idx) => {
                            const isActivated = idx < placedLociCount;
                            const itemInfo = step.lociPlacementSpec?.itemsToPlace[idx];
                            return (
                              <button
                                key={obj.id}
                                type="button"
                                onClick={() => {
                                  if (idx === placedLociCount) {
                                    setPlacedLociCount((c) => c + 1);
                                  }
                                }}
                                className={`rounded-2xl border-2 p-3 text-center transition ${
                                  isActivated
                                    ? "border-[#E9FF60] bg-[#E9FF60]/20 text-white"
                                    : idx === placedLociCount
                                      ? "border-[#FFD014] bg-[#2513A4] animate-pulse"
                                      : "border-white/15 bg-[#2513A4]/60 opacity-70"
                                }`}
                              >
                                <img
                                  src={obj.asset}
                                  alt={obj.label}
                                  className="mx-auto h-10 w-10 object-contain"
                                />
                                <div className="mt-1.5 text-xs font-extrabold">
                                  {idx + 1}. {obj.label}
                                </div>
                                {isActivated && itemInfo && (
                                  <div className="mt-1 text-[10px] text-[#E9FF60] font-bold">
                                    ✓ {itemInfo.item}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* I: MNEMONIC BUILDER */}
                    {step.type === "mnemonic_builder" && step.mnemonicBuilderSpec && (
                      <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div>
                            <div className="font-bold text-[#E9FF60] mb-1">
                              1. Immagine concreta:
                            </div>
                            {step.mnemonicBuilderSpec.suggestedObjects.map((o) => (
                              <button
                                key={o}
                                type="button"
                                onClick={() => setBuilderObj(o)}
                                className={`mb-1.5 w-full rounded-xl p-2 text-left font-bold ${
                                  builderObj === o
                                    ? "bg-[#E9FF60] text-[#2513A4]"
                                    : "bg-[#2513A4] text-white"
                                }`}
                              >
                                {o}
                              </button>
                            ))}
                          </div>
                          <div>
                            <div className="font-bold text-[#E9FF60] mb-1">
                              2. Azione fisica:
                            </div>
                            {step.mnemonicBuilderSpec.suggestedActions.map((a) => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => setBuilderAct(a)}
                                className={`mb-1.5 w-full rounded-xl p-2 text-left font-bold ${
                                  builderAct === a
                                    ? "bg-[#E9FF60] text-[#2513A4]"
                                    : "bg-[#2513A4] text-white"
                                }`}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                          <div>
                            <div className="font-bold text-[#E9FF60] mb-1">
                              3. Punto stabile (Locus):
                            </div>
                            {step.mnemonicBuilderSpec.suggestedLoci.map((l) => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setBuilderLoc(l)}
                                className={`mb-1.5 w-full rounded-xl p-2 text-left font-bold ${
                                  builderLoc === l
                                    ? "bg-[#E9FF60] text-[#2513A4]"
                                    : "bg-[#2513A4] text-white"
                                }`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                        {builderObj && builderAct && builderLoc && (
                          <div className="rounded-xl bg-[#FFF8EC] p-3 text-xs font-extrabold text-[#2513A4]">
                            Associazione creata: «{builderObj} {builderAct} {builderLoc}.»
                          </div>
                        )}
                      </div>
                    )}

                    {/* K & L: NUMBER ENCODING & REVERSE DECODING */}
                    {(step.type === "number_encoding" ||
                      step.type === "reverse_decoding") && (
                      <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3">
                        <div className="text-xs font-bold text-[#E9FF60]">
                          {step.type === "number_encoding"
                            ? `Numero da codificare: ${step.numberEncodingSpec?.targetNumber} (${step.numberEncodingSpec?.phoneticHint})`
                            : `Parola da decodificare: «${step.reverseDecodingSpec?.stimulusWord}»`}
                        </div>
                        <input
                          type="text"
                          value={majorInputText}
                          onChange={(e) => setMajorInputText(e.target.value)}
                          placeholder={
                            step.type === "number_encoding"
                              ? "Scrivi una parola italiana valida (es. toro, mano)..."
                              : "Scrivi le cifre corrispondenti (es. 02, 37)..."
                          }
                          className="w-full rounded-xl border border-white/30 bg-[#2513A4] px-4 py-2.5 text-sm text-white"
                        />
                        {step.type === "number_encoding" && majorInputText && (
                          <div className="text-xs text-white/80">
                            Cifre lette dal trasduttore `major-it-v1`:{" "}
                            <strong className="text-[#E9FF60]">
                              {encodeItalianWordToMajorDigits(majorInputText) || "—"}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* F: FREE RECALL (Risposta nascosta) */}
                    {step.type === "free_recall" && step.freeRecallPrompt && (
                      <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-4 space-y-3">
                        <input
                          type="text"
                          value={freeRecallInput}
                          onChange={(e) => setFreeRecallInput(e.target.value)}
                          placeholder="Scrivi la tua risposta senza guardare la soluzione..."
                          className="w-full rounded-xl border border-white/30 bg-[#2513A4] px-4 py-2.5 text-sm text-white"
                        />
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setFreeRecallHintShown(true);
                              setLessonHintsCount((h) => h + 1);
                            }}
                            className="text-xs font-bold text-[#FFD014] underline"
                          >
                            Chiedi un indizio graduato (registrato)
                          </button>
                        </div>
                        {freeRecallHintShown && (
                          <div className="rounded-xl bg-amber-400/15 border border-amber-300/40 p-2.5 text-xs text-amber-100">
                            Indizio: {step.freeRecallPrompt.progressiveHint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SCREEN 4: IMMEDIATE ANSWER FEEDBACK SHEET + PRIMARY ACTION */}
                    {stepFeedback ? (
                      <div
                        className={`rounded-2xl border-2 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          stepFeedback.isCorrect
                            ? "border-[#E9FF60] bg-emerald-950/70"
                            : "border-rose-300 bg-rose-950/70"
                        }`}
                      >
                        <div>
                          <div className="font-display text-lg font-extrabold text-[#E9FF60]">
                            {stepFeedback.headline}
                          </div>
                          <p className="text-xs text-white/95 mt-0.5">
                            {stepFeedback.detail}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAdvanceToNextStep}
                          className="shrink-0 rounded-full bg-[#E9FF60] px-7 py-3 font-display text-sm font-extrabold text-[#2513A4] shadow-lg"
                        >
                          CONTINUA →
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleVerifyCurrentStep}
                          className="w-full sm:w-auto rounded-full bg-[#E9FF60] px-8 py-3.5 font-display text-sm font-extrabold text-[#2513A4] shadow-lg hover:brightness-105 transition"
                        >
                          {step.type === "hook" ||
                          step.type === "explanation" ||
                          step.type === "demonstration"
                            ? "CONTINUA →"
                            : "VERIFICA RISPOSTA"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
