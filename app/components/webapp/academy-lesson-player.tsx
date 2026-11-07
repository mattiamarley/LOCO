"use client";

import React, { useState } from "react";
import {
  AcademyLessonProgress,
  EnrichedAcademyLesson,
  LessonStepSpec,
  XP_REWARDS,
  encodeItalianWordToMajorDigits,
  evaluateLessonCheckpointAnswer,
  recordAcademyCheckpointAttempt,
} from "./loco-academy-curriculum";

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

  // Answer feedback state
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    headline: string;
    detail: string;
  } | null>(null);

  // Completion screen state
  const [completionSummary, setCompletionSummary] = useState<{
    xpEarned: number;
    bonusXp: number;
    mistakesCount: number;
  } | null>(null);

  // Per-step exercise states
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

  const resetExerciseState = () => {
    setFeedback(null);
    setExpandedReading(false);
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

  const currentStep = lesson.steps[stepIndex];
  const isNarrativeStep =
    currentStep?.type === "hook" ||
    currentStep?.type === "explanation" ||
    currentStep?.type === "demonstration";

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
        practiceCompletedAt: prev.practiceCompletedAt ?? nowIso,
      }));
      setStepIndex(nextIdx);
      resetExerciseState();
      return;
    }

    // Completed the final step of the lesson
    onUpdateProgress((prev) => {
      const attemptRes = recordAcademyCheckpointAttempt(prev, lesson, {
        userAnswer: lesson.checkpoint.expectedAnswer,
        hintsUsedInAttempt: hintsInSession,
        viewedAnswerBeforeAttempt: false,
        isDelayedFollowUp: Boolean(prev.provisionallyPassedAt),
        nowIso,
      });
      return {
        ...attemptRes.updated,
        practiceCompletedAt: attemptRes.updated.practiceCompletedAt ?? nowIso,
        currentStepIndex: 0,
        completedStepIds: lesson.steps.map((s) => s.stepId),
      };
    });

    const isPerfect = mistakesInSession === 0 && hintsInSession === 0;
    const { xpEarnedNow, bonusXpEarned } = onCompleteLessonXp(lesson.id, isPerfect);

    setCompletionSummary({
      xpEarned: xpEarnedNow || XP_REWARDS.LESSON_COMPLETED,
      bonusXp: bonusXpEarned,
      mistakesCount: mistakesInSession,
    });
  };

  const handleVerifyStep = () => {
    if (!currentStep) return;

    if (isNarrativeStep) {
      advanceToNextStep();
      return;
    }

    let isCorrect = false;
    let feedbackDetail = "";
    let expectedForMistake = lesson.checkpoint.expectedAnswer;

    if (
      currentStep.type === "multiple_choice" ||
      currentStep.type === "image_association" ||
      currentStep.type === "error_correction"
    ) {
      const chosen = currentStep.options?.find((o) => o.id === selectedOptionId);
      if (!chosen) return;
      isCorrect = chosen.isCorrect;
      feedbackDetail =
        chosen.explanation ||
        (isCorrect
          ? currentStep.explanationOnSuccess
          : currentStep.explanationOnMistake);
      const rightOpt = currentStep.options?.find((o) => o.isCorrect);
      expectedForMistake = rightOpt?.label ?? lesson.checkpoint.expectedAnswer;
    } else if (currentStep.type === "matching_pairs") {
      const totalPairs = currentStep.pairs?.length ?? 0;
      isCorrect = matchedPairIds.length >= totalPairs;
      expectedForMistake = (currentStep.pairs ?? [])
        .map((p) => `${p.left} = ${p.right}`)
        .join(" · ");
    } else if (currentStep.type === "sequence_ordering") {
      const targetSeq = currentStep.sequenceItems ?? [];
      isCorrect =
        orderedSequence.length === targetSeq.length &&
        orderedSequence.every((item, i) => item === targetSeq[i]);
      expectedForMistake = targetSeq.join(" → ");
    } else if (currentStep.type === "memory_flash") {
      const targetFlash = currentStep.flashItems ?? [];
      isCorrect =
        flashRecallSelection.length === targetFlash.length &&
        flashRecallSelection.every((item, i) => item === targetFlash[i]);
      expectedForMistake = targetFlash.join(", ");
    } else if (currentStep.type === "fill_in_blank") {
      const expected = currentStep.blankSentence?.expectedWord ?? "";
      isCorrect = blankChoice.trim().toLowerCase() === expected.trim().toLowerCase();
      expectedForMistake = expected;
    } else if (currentStep.type === "loci_placement") {
      const targetCount = currentStep.lociPlacementSpec?.itemsToPlace.length ?? 5;
      isCorrect = placedLociCount >= targetCount;
      expectedForMistake = "5 loci ordinati nella scena";
    } else if (currentStep.type === "mnemonic_builder") {
      isCorrect = Boolean(builderObj && builderAct && builderLoc);
      expectedForMistake = "Immagine concreta + azione + locus";
      if (isCorrect && (lesson.id === "S01" || lesson.id === "S04")) {
        onCreateOnboardingRoute([
          {
            locusLabel: builderLoc,
            itemWord: builderObj,
            actionCue: `${builderObj} ${builderAct} ${builderLoc}`,
          },
        ]);
      }
    } else if (currentStep.type === "number_encoding") {
      const targetNum = currentStep.numberEncodingSpec?.targetNumber ?? "14";
      const encoded = encodeItalianWordToMajorDigits(majorInputText);
      isCorrect = encoded === targetNum;
      expectedForMistake = `Parola con cifre ${targetNum}`;
      onRecordDirectionalMajorAttempt("forward", isCorrect);
    } else if (currentStep.type === "reverse_decoding") {
      const expectedDigits = currentStep.reverseDecodingSpec?.expectedDigits ?? "02";
      isCorrect = majorInputText.trim() === expectedDigits;
      expectedForMistake = expectedDigits;
      onRecordDirectionalMajorAttempt("reverse", isCorrect);
    } else if (currentStep.type === "free_recall") {
      const evalRes = evaluateLessonCheckpointAnswer(lesson, freeRecallInput);
      isCorrect = evalRes.isCorrect;
      feedbackDetail = evalRes.feedback;
      expectedForMistake = lesson.checkpoint.expectedAnswer;
    }

    if (isCorrect) {
      setFeedback({
        isCorrect: true,
        headline: "Risposta corretta",
        detail: feedbackDetail || currentStep.explanationOnSuccess,
      });
    } else {
      setMistakesInSession((m) => m + 1);
      onRecordMistake(
        currentStep,
        expectedForMistake,
        currentStep.explanationOnMistake || lesson.commonMistake
      );
      setFeedback({
        isCorrect: false,
        headline: "Rivediamo insieme",
        detail:
          feedbackDetail ||
          currentStep.explanationOnMistake ||
          `Attenzione a non ${lesson.commonMistake}`,
      });
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

        <p className="mt-2 max-w-[420px] text-[16px] text-[#181818]/75">
          {lesson.title}
        </p>

        {/* Compact XP & Accuracy Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
              Prossima lezione
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

  const progressPercent = Math.round(((stepIndex + 1) / lesson.steps.length) * 100);

  /* =========================================================================
     DISTRACTION-FREE LESSON PLAYER (Top Bar + Centered Activity + Bottom CTA)
     ========================================================================= */
  return (
    <div className="mx-auto flex min-h-[74vh] max-w-[660px] flex-col justify-between pb-8">
      {/* TOP BAR: Back/Close + Thin Progress Bar + Minimal Step Indicator */}
      <div className="flex items-center gap-4 pb-6">
        <button
          type="button"
          onClick={() => {
            if (stepIndex > 0) {
              const prevIdx = stepIndex - 1;
              onUpdateProgress((prev) => ({ ...prev, currentStepIndex: prevIdx }));
              setStepIndex(prevIdx);
              resetExerciseState();
            } else {
              onCloseToCoursePath();
            }
          }}
          aria-label="Indietro"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#181818]/15 bg-white text-[#181818] transition hover:border-[#613BE0] hover:text-[#613BE0]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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

      {/* CENTER STAGE: Single Question / Explanation / Exercise */}
      <div className="my-auto py-4">
        {/* Illustrations appear ONLY on narrative/explanatory steps, never cluttering every exercise */}
        {isNarrativeStep && (
          <div className="mb-6 flex justify-center">
            <div className="flex h-40 w-40 items-center justify-center rounded-[28px] bg-[#D2C4F5]/35 p-4">
              <img
                src={currentStep.illustrationAsset}
                alt=""
                className="max-h-full w-auto object-contain"
              />
            </div>
          </div>
        )}

        <h1 className="loco-display text-[28px] font-bold leading-snug text-[#181818] sm:text-[32px]">
          {currentStep.title}
        </h1>

        <p className="mt-3 text-[16px] leading-relaxed text-[#181818]/85">
          {currentStep.bodyText}
        </p>

        {/* Expandable Deep Reading on Explanation Step */}
        {currentStep.expandableFullText &&
          currentStep.expandableFullText.length > currentStep.bodyText.length && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setExpandedReading((v) => !v)}
                className="text-xs font-bold text-[#613BE0] hover:underline"
              >
                {expandedReading ? "Riduci approfondimento ↑" : "Approfondisci ↓"}
              </button>
              {expandedReading && (
                <div className="mt-2.5 rounded-[18px] bg-[#D2C4F5]/25 p-4 text-sm leading-relaxed text-[#181818]">
                  {currentStep.expandableFullText}
                </div>
              )}
            </div>
          )}

        {currentStep.scientificNote && (
          <div className="mt-4 rounded-[14px] bg-[#D2C4F5]/30 px-4 py-3 text-xs leading-relaxed text-[#181818]/80">
            {currentStep.scientificNote}
          </div>
        )}

        {/* ===============================================================
            INTERACTIVE EXERCISE CONTROLS (12 Types — Clean White Cards)
            =============================================================== */}
        <div className="mt-6">
          {/* A, G, J: MULTIPLE CHOICE / IMAGE ASSOCIATION / ERROR CORRECTION */}
          {(currentStep.type === "multiple_choice" ||
            currentStep.type === "image_association" ||
            currentStep.type === "error_correction") &&
            currentStep.options && (
              <div className="space-y-3">
                {currentStep.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`w-full rounded-[18px] border-2 p-4 text-left text-[15px] font-medium transition ${
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
            )}

          {/* B: MATCHING PAIRS */}
          {currentStep.type === "matching_pairs" && currentStep.pairs && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                {currentStep.pairs.map((p) => {
                  const isMatched = matchedPairIds.includes(p.id);
                  const isSelected = selectedLeftPairId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={isMatched}
                      onClick={() => setSelectedLeftPairId(p.id)}
                      className={`w-full rounded-[16px] border-2 p-3.5 text-left text-sm font-semibold transition ${
                        isMatched
                          ? "border-[#D2C4F5] bg-[#D2C4F5]/40 text-[#181818]/50"
                          : isSelected
                            ? "border-[#613BE0] bg-[#D2C4F5]/35 text-[#181818]"
                            : "border-[#181818]/15 bg-white text-[#181818]"
                      }`}
                    >
                      {p.left} {isMatched && "✓"}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2.5">
                {currentStep.pairs.map((p) => {
                  const isMatched = matchedPairIds.includes(p.id);
                  return (
                    <button
                      key={`${p.id}-right`}
                      type="button"
                      disabled={isMatched}
                      onClick={() => {
                        if (selectedLeftPairId === p.id) {
                          setMatchedPairIds((prev) => [...prev, p.id]);
                          setSelectedLeftPairId(null);
                        }
                      }}
                      className={`w-full rounded-[16px] border-2 p-3.5 text-left text-sm font-medium transition ${
                        isMatched
                          ? "border-[#D2C4F5] bg-[#D2C4F5]/40 text-[#181818]/50"
                          : "border-[#181818]/15 bg-white text-[#181818] hover:border-[#613BE0]"
                      }`}
                    >
                      {p.right}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* C: SEQUENCE ORDERING */}
          {currentStep.type === "sequence_ordering" && currentStep.sequenceItems && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[...currentStep.sequenceItems]
                  .sort((a, b) => a.localeCompare(b))
                  .map((item) => {
                    const alreadyChosen = orderedSequence.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        disabled={alreadyChosen}
                        onClick={() =>
                          setOrderedSequence((prev) => [...prev, item])
                        }
                        className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                          alreadyChosen
                            ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                            : "border-[#613BE0] bg-white text-[#181818] hover:bg-[#D2C4F5]/30"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
              </div>

              <div className="min-h-[60px] rounded-[18px] border border-[#181818]/15 bg-[#D2C4F5]/20 p-4">
                <div className="flex items-center justify-between text-xs text-[#181818]/65">
                  <span>Ordine selezionato ({orderedSequence.length}/{currentStep.sequenceItems.length}):</span>
                  {orderedSequence.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrderedSequence([])}
                      className="font-bold text-[#613BE0] hover:underline"
                    >
                      Ricomincia
                    </button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {orderedSequence.map((it, idx) => (
                    <span
                      key={it}
                      className="rounded-full bg-[#613BE0] px-3.5 py-1 text-xs font-bold text-white"
                    >
                      {idx + 1}. {it}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* D: MEMORY FLASH */}
          {currentStep.type === "memory_flash" && currentStep.flashItems && (
            <div className="rounded-[20px] border border-[#181818]/15 bg-white p-5">
              {!flashHidden ? (
                <div className="space-y-5 text-center">
                  <div className="flex flex-wrap justify-center gap-2.5">
                    {currentStep.flashItems.map((it, idx) => (
                      <div
                        key={it}
                        className="rounded-[14px] bg-[#D2C4F5]/45 px-4 py-2.5 text-sm font-bold text-[#181818]"
                      >
                        {idx + 1}. {it}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlashHidden(true)}
                    className="rounded-[15px] bg-[#613BE0] px-7 py-2.5 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
                  >
                    Nascondi e ricostruisci l&apos;ordine
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-[#181818]/80">
                    Tocca gli oggetti nell&apos;ordine esatto in cui erano mostrati:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[...currentStep.flashItems]
                      .sort((a, b) => a.localeCompare(b))
                      .map((it) => {
                        const used = flashRecallSelection.includes(it);
                        return (
                          <button
                            key={it}
                            type="button"
                            disabled={used}
                            onClick={() =>
                              setFlashRecallSelection((prev) => [...prev, it])
                            }
                            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${
                              used
                                ? "border-[#181818]/10 bg-[#181818]/5 text-[#181818]/30"
                                : "border-[#613BE0] bg-white text-[#181818] hover:bg-[#D2C4F5]/30"
                            }`}
                          >
                            {it}
                          </button>
                        );
                      })}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                    <span className="font-semibold text-[#181818]">
                      La tua sequenza: {flashRecallSelection.join(" → ") || "—"}
                    </span>
                    {flashRecallSelection.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFlashRecallSelection([])}
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

          {/* E: FILL IN THE BLANK */}
          {currentStep.type === "fill_in_blank" && currentStep.blankSentence && (
            <div className="space-y-4">
              <div className="rounded-[18px] bg-[#D2C4F5]/30 p-5 text-[16px] leading-relaxed text-[#181818]">
                {currentStep.blankSentence.before}{" "}
                <span className="inline-block min-w-[110px] rounded-[10px] border-b-2 border-[#613BE0] bg-white px-3 py-0.5 text-center font-bold text-[#613BE0]">
                  {blankChoice || "______"}
                </span>{" "}
                {currentStep.blankSentence.after}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {currentStep.blankSentence.wordBank.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setBlankChoice(w)}
                    className={`rounded-full border-2 px-5 py-2 text-sm font-bold transition ${
                      blankChoice === w
                        ? "border-[#613BE0] bg-[#613BE0] text-white"
                        : "border-[#181818]/15 bg-white text-[#181818] hover:border-[#613BE0]"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* H: LOCI PLACEMENT */}
          {currentStep.type === "loci_placement" &&
            currentStep.lociPlacementSpec && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {currentStep.lociPlacementSpec.roomObjects.map((obj, idx) => {
                    const isActivated = idx < placedLociCount;
                    const isNext = idx === placedLociCount;
                    const itemInfo =
                      currentStep.lociPlacementSpec?.itemsToPlace[idx];
                    return (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => {
                          if (isNext) {
                            setPlacedLociCount((c) => c + 1);
                          }
                        }}
                        className={`flex flex-col items-center rounded-[18px] border-2 p-3.5 text-center transition ${
                          isActivated
                            ? "border-[#613BE0] bg-[#D2C4F5]/40 text-[#181818]"
                            : isNext
                              ? "border-[#613BE0] bg-white text-[#181818] ring-4 ring-[#D2C4F5]/50"
                              : "border-[#181818]/15 bg-white text-[#181818]/50"
                        }`}
                      >
                        <img
                          src={obj.asset}
                          alt={obj.label}
                          className="h-10 w-10 object-contain"
                        />
                        <span className="mt-2 text-xs font-bold">
                          {idx + 1}. {obj.label}
                        </span>
                        {isActivated && itemInfo && (
                          <span className="mt-1 rounded-full bg-[#FFD014] px-2.5 py-0.5 text-[11px] font-bold text-[#181818]">
                            {itemInfo.item}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-[#181818]/65">
                  Tocca in ordine i punti dal #1 al #5 per fissare o richiamare la sequenza ({placedLociCount}/5).
                </p>
              </div>
            )}

          {/* I: MNEMONIC BUILDER */}
          {currentStep.type === "mnemonic_builder" &&
            currentStep.mnemonicBuilderSpec && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#181818]/70">
                      1. Immagine:
                    </span>
                    {currentStep.mnemonicBuilderSpec.suggestedObjects.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setBuilderObj(o)}
                        className={`w-full rounded-[14px] border-2 p-3 text-left text-xs font-semibold transition ${
                          builderObj === o
                            ? "border-[#613BE0] bg-[#D2C4F5]/35 text-[#181818]"
                            : "border-[#181818]/15 bg-white text-[#181818]"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#181818]/70">
                      2. Azione:
                    </span>
                    {currentStep.mnemonicBuilderSpec.suggestedActions.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setBuilderAct(a)}
                        className={`w-full rounded-[14px] border-2 p-3 text-left text-xs font-semibold transition ${
                          builderAct === a
                            ? "border-[#613BE0] bg-[#D2C4F5]/35 text-[#181818]"
                            : "border-[#181818]/15 bg-white text-[#181818]"
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#181818]/70">
                      3. Locus:
                    </span>
                    {currentStep.mnemonicBuilderSpec.suggestedLoci.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setBuilderLoc(l)}
                        className={`w-full rounded-[14px] border-2 p-3 text-left text-xs font-semibold transition ${
                          builderLoc === l
                            ? "border-[#613BE0] bg-[#D2C4F5]/35 text-[#181818]"
                            : "border-[#181818]/15 bg-white text-[#181818]"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {builderObj && builderAct && builderLoc && (
                  <div className="rounded-[16px] bg-[#D2C4F5]/35 px-4 py-3 text-sm font-semibold text-[#181818]">
                    Associazione: «{builderObj} {builderAct} {builderLoc}.»
                  </div>
                )}
              </div>
            )}

          {/* K & L: NUMBER ENCODING & REVERSE DECODING */}
          {(currentStep.type === "number_encoding" ||
            currentStep.type === "reverse_decoding") && (
            <div className="space-y-3">
              <div className="rounded-[16px] bg-[#D2C4F5]/30 px-4 py-3 text-sm font-semibold text-[#181818]">
                {currentStep.type === "number_encoding"
                  ? `Numero da codificare: ${currentStep.numberEncodingSpec?.targetNumber} (${currentStep.numberEncodingSpec?.phoneticHint})`
                  : `Parola da decodificare: «${currentStep.reverseDecodingSpec?.stimulusWord}»`}
              </div>

              <input
                type="text"
                value={majorInputText}
                onChange={(e) => setMajorInputText(e.target.value)}
                placeholder={
                  currentStep.type === "number_encoding"
                    ? "Scrivi una parola italiana (es. toro, mano)..."
                    : "Scrivi le cifre corrispondenti (es. 02, 37)..."
                }
                className="w-full rounded-[15px] border-2 border-[#181818]/20 bg-white px-4 py-3 text-[15px] text-[#181818] outline-none focus:border-[#613BE0]"
              />

              {currentStep.type === "number_encoding" && majorInputText && (
                <p className="text-xs text-[#181818]/70">
                  Cifre rilevate:{" "}
                  <strong className="text-[#613BE0]">
                    {encodeItalianWordToMajorDigits(majorInputText) || "—"}
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* F: FREE RECALL */}
          {currentStep.type === "free_recall" && currentStep.freeRecallPrompt && (
            <div className="space-y-3">
              <input
                type="text"
                value={freeRecallInput}
                onChange={(e) => setFreeRecallInput(e.target.value)}
                placeholder="Scrivi la tua risposta..."
                className="w-full rounded-[15px] border-2 border-[#181818]/20 bg-white px-4 py-3 text-[15px] text-[#181818] outline-none focus:border-[#613BE0]"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFreeRecallHintShown(true);
                    setHintsInSession((h) => h + 1);
                  }}
                  className="text-xs font-bold text-[#613BE0] hover:underline"
                >
                  Mostra un indizio
                </button>
              </div>
              {freeRecallHintShown && (
                <div className="rounded-[14px] bg-[#D2C4F5]/30 px-4 py-2.5 text-xs text-[#181818]">
                  Indizio: {currentStep.freeRecallPrompt.progressiveHint}
                </div>
              )}
            </div>
          )}
        </div>
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
              <p className="loco-display text-lg font-bold text-[#181818]">
                {feedback.headline}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-[#181818]/85">
                {feedback.detail}
              </p>
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
              className="w-full rounded-[15px] bg-[#613BE0] px-9 py-3 text-[15px] font-bold text-white transition hover:bg-[#4B2FC4] sm:w-auto"
            >
              {isNarrativeStep ? "Continua" : "Verifica"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
