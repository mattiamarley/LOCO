"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ACADEMY_COURSES,
  ACADEMY_LESSONS_BY_ID,
  AcademyCourse,
  AcademyGamificationState,
  AcademyLessonProgress,
  AcademyMistakeItem,
  AcademyProgressMap,
  AdaptiveAcademyRecommendation,
  EnrichedAcademyLesson,
  LOCO_ACADEMY_GAMIFICATION_KEY,
  LessonStepSpec,
  XP_REWARDS,
  awardIdempotentXp,
  computeUnlockedBadgeIds,
  createDefaultGamificationState,
} from "./loco-academy-curriculum";
import { WebAppRoute } from "./loco-webapp-data";
import { AcademyCatalogCarousel } from "./academy-catalog-carousel";
import { AcademyCoursePath } from "./academy-course-path";
import { AcademyLessonPlayer } from "./academy-lesson-player";

const SELECTED_COURSE_STORAGE_KEY = "loco-academy-selected-course-v1";

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
  onClearFocusedCourseNumber?: () => void;
  onOpenPalestra?: () => void;
  onOpenArena?: () => void;
}

export function LocoAcademySection({
  progressMap,
  onUpdateLessonProgress,
  activeLessonId,
  onSelectLesson,
  routes,
  dueReviewsCount,
  onStartBlindRecallFromAcademy,
  onCreateOnboardingRouteFromAcademy,
  focusedCourseNumber,
  onClearFocusedCourseNumber,
  onOpenPalestra,
  onOpenArena,
}: LocoAcademySectionProps) {
  // Persistent Gamification Engine (XP, Streaks, Mistake Queue, Badges)
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

  const totalLociInRoutes = useMemo(
    () => routes.reduce((acc, r) => acc + r.loci.length, 0),
    [routes]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const unlocked = computeUnlockedBadgeIds(
        progressMap,
        gamification,
        totalLociInRoutes
      );
      window.localStorage.setItem(
        LOCO_ACADEMY_GAMIFICATION_KEY,
        JSON.stringify({ ...gamification, unlockedBadgeIds: unlocked })
      );
    } catch {
      // ignore storage quota errors
    }
  }, [gamification, progressMap, totalLociInRoutes]);

  const LEGACY_COURSE_ALIAS: Record<string, string> = {
    "course-0": "course-fondamenta",
    "course-1": "course-palazzi",
    "course-2": "course-associazioni",
    "course-3": "course-numeri",
    "course-4": "course-studio",
    "course-5": "course-vita-reale",
    "course-6": "course-specializzazioni",
    "course-7": "course-specializzazioni",
    "course-8": "course-studio",
    "course-9": "course-palazzi",
    "course-10": "course-carte",
    "course-11": "course-specializzazioni",
  };

  const resolveCourseId = (id: string | null): string | null => {
    if (!id) return null;
    if (ACADEMY_COURSES.some((c) => c.courseId === id)) return id;
    if (LEGACY_COURSE_ALIAS[id] && ACADEMY_COURSES.some((c) => c.courseId === LEGACY_COURSE_ALIAS[id])) {
      return LEGACY_COURSE_ALIAS[id];
    }
    return null;
  };

  // Selected Course State (restored from URL `?course=` or localStorage so reloads keep context)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCourse = resolveCourseId(params.get("course"));
      if (urlCourse) return urlCourse;

      const saved = resolveCourseId(window.localStorage.getItem(SELECTED_COURSE_STORAGE_KEY));
      if (saved) return saved;
    } catch {
      // ignore
    }
    return null;
  });

  // Derive effective selected course without cascading setState-in-effect
  const effectiveCourseId = useMemo(() => {
    if (activeLessonId) {
      const lesson = ACADEMY_LESSONS_BY_ID[activeLessonId];
      if (lesson) return lesson.courseId;
    }
    if (selectedCourseId) return selectedCourseId;
    if (focusedCourseNumber !== null && focusedCourseNumber !== undefined) {
      const match = ACADEMY_COURSES.find(
        (c) => c.courseNumber === focusedCourseNumber || c.courseId === `course-${focusedCourseNumber}`
      );
      if (match) return match.courseId;
    }
    return null;
  }, [activeLessonId, selectedCourseId, focusedCourseNumber]);

  // Synchronize course and lesson navigation with URL query parameters & browser Back/Forward
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (effectiveCourseId) {
        window.localStorage.setItem(SELECTED_COURSE_STORAGE_KEY, effectiveCourseId);
      } else {
        window.localStorage.removeItem(SELECTED_COURSE_STORAGE_KEY);
      }

      const url = new URL(window.location.href);
      if (effectiveCourseId) {
        url.searchParams.set("course", effectiveCourseId);
      } else {
        url.searchParams.delete("course");
      }
      if (activeLessonId) {
        url.searchParams.set("lesson", activeLessonId);
      } else {
        url.searchParams.delete("lesson");
      }

      if (url.search !== window.location.search) {
        window.history.pushState({}, "", url.toString());
      }
    } catch {
      // ignore history errors
    }
  }, [effectiveCourseId, activeLessonId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const urlLesson = params.get("lesson");
      const urlCourse = params.get("course");
      onSelectLesson(urlLesson && ACADEMY_LESSONS_BY_ID[urlLesson] ? urlLesson : null);
      setSelectedCourseId(
        urlCourse && ACADEMY_COURSES.some((c) => c.courseId === urlCourse)
          ? urlCourse
          : null
      );
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onSelectLesson]);

  // Secondary quiet subviews (Unit Checkpoint or Mistake Review)
  const [activeCheckpointCourse, setActiveCheckpointCourse] =
    useState<AcademyCourse | null>(null);
  const [checkpointStepIdx, setCheckpointStepIdx] = useState(0);
  const [checkpointSelectedValue, setCheckpointSelectedValue] = useState<string | null>(
    null
  );
  const [checkpointMistakes, setCheckpointMistakes] = useState(0);
  const [checkpointFinished, setCheckpointFinished] = useState(false);

  const [showMistakeReview, setShowMistakeReview] = useState(false);
  const [mistakeReplyText, setMistakeReplyText] = useState("");
  const [mistakeFeedbackMsg, setMistakeFeedbackMsg] = useState<string | null>(null);

  const activeLesson: EnrichedAcademyLesson | null = activeLessonId
    ? ACADEMY_LESSONS_BY_ID[activeLessonId] ?? null
    : null;

  const selectedCourse: AcademyCourse | null = useMemo(
    () => ACADEMY_COURSES.find((c) => c.courseId === effectiveCourseId) ?? null,
    [effectiveCourseId]
  );

  const nextLessonInCourse: EnrichedAcademyLesson | null = useMemo(() => {
    if (!activeLesson || !selectedCourse) return null;
    const idx = selectedCourse.lessons.findIndex((l) => l.id === activeLesson.id);
    if (idx === -1 || idx + 1 >= selectedCourse.lessons.length) return null;
    return selectedCourse.lessons[idx + 1] ?? null;
  }, [activeLesson, selectedCourse]);

  const startOrResumeLesson = (lessonId: string) => {
    const lesson = ACADEMY_LESSONS_BY_ID[lessonId];
    if (!lesson) return;
    const nowIso = new Date().toISOString();
    onUpdateLessonProgress(lessonId, (prev) => ({
      ...prev,
      openedAt: prev.openedAt ?? nowIso,
      status: prev.status === "available" ? "reading" : prev.status,
      readCompletedAt: prev.readCompletedAt ?? nowIso,
    }));
    setSelectedCourseId(lesson.courseId);
    setShowMistakeReview(false);
    setActiveCheckpointCourse(null);
    onSelectLesson(lessonId);
  };

  /* =========================================================================
     VIEW 1: FOCUSED LESSON PLAYER (When a lesson is active)
     ========================================================================= */
  if (activeLesson && progressMap[activeLesson.id]) {
    return (
      <AcademyLessonPlayer
        key={activeLesson.id}
        lesson={activeLesson}
        progress={progressMap[activeLesson.id]}
        nextLessonInCourse={nextLessonInCourse}
        onUpdateProgress={(updater) =>
          onUpdateLessonProgress(activeLesson.id, updater)
        }
        onRecordMistake={(
          step: LessonStepSpec,
          expectedAnswer: string,
          explanation: string
        ) => {
          const mistakeId = `mistake-${activeLesson.id}-${step.stepId}`;
          const newItem: AcademyMistakeItem = {
            id: mistakeId,
            lessonId: activeLesson.id,
            lessonTitle: activeLesson.title,
            stepId: step.stepId,
            prompt: step.title,
            expectedAnswer,
            explanation,
            createdAt: new Date().toISOString(),
          };
          setGamification((prev) => ({
            ...prev,
            mistakeQueue: [
              newItem,
              ...prev.mistakeQueue.filter((m) => m.id !== mistakeId),
            ],
          }));
        }}
        onRecordDirectionalMajorAttempt={(direction, isCorrect) => {
          setGamification((prev) =>
            direction === "forward"
              ? {
                  ...prev,
                  forwardEncodingTotalCount: prev.forwardEncodingTotalCount + 1,
                  forwardEncodingCorrectCount:
                    prev.forwardEncodingCorrectCount + (isCorrect ? 1 : 0),
                }
              : {
                  ...prev,
                  reverseDecodingTotalCount: prev.reverseDecodingTotalCount + 1,
                  reverseDecodingCorrectCount:
                    prev.reverseDecodingCorrectCount + (isCorrect ? 1 : 0),
                }
          );
        }}
        onCompleteLessonXp={(lessonId, isPerfectFirstTry) => {
          let xpEarnedNow = 0;
          let bonusXpEarned = 0;
          setGamification((prev) => {
            const baseRes = awardIdempotentXp(
              prev,
              `xp-lesson-complete-${lessonId}`,
              XP_REWARDS.LESSON_COMPLETED
            );
            xpEarnedNow = baseRes.awardedNow;
            let nextState = baseRes.updated;
            if (isPerfectFirstTry) {
              const bonusRes = awardIdempotentXp(
                nextState,
                `xp-lesson-perfect-${lessonId}`,
                XP_REWARDS.PERFECT_FIRST_TRY_BONUS
              );
              bonusXpEarned = bonusRes.awardedNow;
              nextState = bonusRes.updated;
            }
            return nextState;
          });
          return { xpEarnedNow, bonusXpEarned };
        }}
        onCreateOnboardingRoute={onCreateOnboardingRouteFromAcademy}
        onCloseToCoursePath={() => onSelectLesson(null)}
        onStartNextLesson={(nextId) => startOrResumeLesson(nextId)}
      />
    );
  }

  /* =========================================================================
     VIEW 2: UNIT CHECKPOINT CHALLENGE (Clean White-Canvas Focused View)
     ========================================================================= */
  if (activeCheckpointCourse) {
    const q = activeCheckpointCourse.checkpointQuestions[checkpointStepIdx];
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-[620px] flex-col justify-between pb-10">
        <div className="flex items-center justify-between border-b border-[#181818]/10 pb-5">
          <button
            type="button"
            onClick={() => setActiveCheckpointCourse(null)}
            className="flex items-center gap-2 text-sm font-bold text-[#181818] hover:text-[#613BE0]"
          >
            ← Torna al corso
          </button>
          <span className="text-xs font-semibold text-[#181818]/60">
            Checkpoint • {activeCheckpointCourse.title}
          </span>
        </div>

        {checkpointFinished ? (
          <div className="my-auto py-8 text-center">
            <img
              src="/assets/figma-curated/illustration-finish-runner.svg"
              alt=""
              className="mx-auto h-40 w-auto object-contain"
            />
            <h1 className="loco-display mt-5 text-[34px] font-bold text-[#181818]">
              {checkpointMistakes === 0
                ? "Checkpoint superato!"
                : "Quasi fatto: rivedi un passaggio"}
            </h1>
            <p className="mx-auto mt-2 max-w-[400px] text-sm text-[#181818]/75">
              {checkpointMistakes === 0
                ? `Hai completato la verifica conclusiva del corso (+${XP_REWARDS.CHECKPOINT_PASSED} XP).`
                : `Hai commesso ${checkpointMistakes} errori. Ripassa i concetti chiave e riprova quando vuoi.`}
            </p>
            <div className="mt-7">
              <button
                type="button"
                onClick={() => setActiveCheckpointCourse(null)}
                className="rounded-[15px] bg-[#613BE0] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
              >
                Torna al percorso del corso
              </button>
            </div>
          </div>
        ) : q ? (
          <div className="my-auto space-y-6 py-6">
            <span className="text-xs font-semibold text-[#613BE0]">
              Domanda {checkpointStepIdx + 1} di{" "}
              {activeCheckpointCourse.checkpointQuestions.length}
            </span>
            <h1 className="loco-display text-[28px] font-bold leading-snug text-[#181818]">
              {q.question}
            </h1>
            <div className="space-y-3">
              {q.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCheckpointSelectedValue(opt.value)}
                  className={`w-full rounded-[18px] border-2 p-4 text-left text-[15px] font-medium transition ${
                    checkpointSelectedValue === opt.value
                      ? "border-[#613BE0] bg-[#D2C4F5]/30 font-semibold text-[#181818]"
                      : "border-[#181818]/15 bg-white text-[#181818] hover:border-[#613BE0]/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!checkpointFinished && q && (
          <div className="flex justify-end border-t border-[#181818]/10 pt-5">
            <button
              type="button"
              disabled={!checkpointSelectedValue}
              onClick={() => {
                const chosen = q.options.find(
                  (o) => o.value === checkpointSelectedValue
                );
                if (!chosen) return;
                const nextMistakes =
                  checkpointMistakes + (chosen.isCorrect ? 0 : 1);
                setCheckpointMistakes(nextMistakes);
                const nextIdx = checkpointStepIdx + 1;
                if (
                  nextIdx < activeCheckpointCourse.checkpointQuestions.length
                ) {
                  setCheckpointStepIdx(nextIdx);
                  setCheckpointSelectedValue(null);
                } else {
                  setCheckpointFinished(true);
                  if (nextMistakes === 0) {
                    setGamification((prev) => {
                      const xpEvent = `xp-unit-checkpoint-${activeCheckpointCourse.courseId}`;
                      const awarded = awardIdempotentXp(
                        prev,
                        xpEvent,
                        XP_REWARDS.CHECKPOINT_PASSED
                      );
                      const completedSet = new Set([
                        ...awarded.updated.completedUnitCheckpoints,
                        activeCheckpointCourse.courseId,
                      ]);
                      return {
                        ...awarded.updated,
                        completedUnitCheckpoints: Array.from(completedSet),
                      };
                    });
                  }
                }
              }}
              className="rounded-[15px] bg-[#613BE0] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#4B2FC4] disabled:opacity-40"
            >
              Verifica
            </button>
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
     VIEW 3: QUIET MISTAKE REVIEW SCREEN (Clean White Canvas)
     ========================================================================= */
  if (showMistakeReview) {
    return (
      <div className="mx-auto max-w-[680px] space-y-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181818]/10 pb-5">
          <div>
            <button
              type="button"
              onClick={() => setShowMistakeReview(false)}
              className="text-sm font-bold text-[#613BE0] hover:underline"
            >
              ← Torna indietro
            </button>
            <h1 className="loco-display mt-2 text-[34px] font-bold text-[#181818]">
              Ripassa i concetti da consolidare
            </h1>
          </div>

          {dueReviewsCount > 0 && (
            <button
              type="button"
              onClick={onStartBlindRecallFromAcademy}
              className="rounded-[15px] bg-[#613BE0] px-5 py-2 text-xs font-bold text-white"
            >
              Apri ripasso programmato ({dueReviewsCount})
            </button>
          )}
        </div>

        {gamification.mistakeQueue.length === 0 ? (
          <div className="rounded-[24px] bg-[#D2C4F5]/30 p-8 text-center">
            <p className="loco-display text-2xl font-bold text-[#181818]">
              Nessun errore in sospeso!
            </p>
            <p className="mt-2 text-sm text-[#181818]/75">
              Hai consolidato tutti i passaggi recenti. Continua con la prossima lezione del tuo corso.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {gamification.mistakeQueue.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-[#181818]/15 bg-white p-5 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[#613BE0]">
                    {item.lessonTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => startOrResumeLesson(item.lessonId)}
                    className="font-semibold text-[#181818]/70 hover:text-[#613BE0] hover:underline"
                  >
                    Apri lezione →
                  </button>
                </div>

                <h2 className="loco-display text-xl font-bold text-[#181818]">
                  {item.prompt}
                </h2>
                <p className="text-xs text-[#181818]/75">{item.explanation}</p>

                {idx === 0 && (
                  <div className="space-y-2.5 pt-2">
                    <input
                      type="text"
                      value={mistakeReplyText}
                      onChange={(e) => setMistakeReplyText(e.target.value)}
                      placeholder="Scrivi la risposta corretta..."
                      className="w-full rounded-[14px] border border-[#181818]/20 bg-white px-4 py-2.5 text-sm text-[#181818] outline-none focus:border-[#613BE0]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const clean = mistakeReplyText.trim().toLowerCase();
                        const expected = item.expectedAnswer.trim().toLowerCase();
                        if (
                          clean.length > 0 &&
                          (expected.includes(clean) ||
                            clean.includes(expected.slice(0, 4)))
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
                            `Ottimo recupero! (+${XP_REWARDS.REVIEW_COMPLETED} XP)`
                          );
                        } else {
                          setMistakeFeedbackMsg(
                            `Chiave di riferimento: «${item.expectedAnswer}»`
                          );
                        }
                      }}
                      className="rounded-[14px] bg-[#613BE0] px-5 py-2 text-xs font-bold text-white"
                    >
                      Verifica (+5 XP)
                    </button>
                    {mistakeFeedbackMsg && (
                      <p className="text-xs font-semibold text-[#613BE0]">
                        {mistakeFeedbackMsg}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* =========================================================================
     VIEW 4: SELECTED COURSE DETAIL = DUOLINGO-LIKE VERTICAL LEARNING PATH
     ========================================================================= */
  if (selectedCourse) {
    const courseMistakesCount = gamification.mistakeQueue.filter((m) =>
      selectedCourse.lessonIds.includes(m.lessonId)
    ).length;

    return (
      <AcademyCoursePath
        key={selectedCourse.courseId}
        course={selectedCourse}
        progressMap={progressMap}
        isCheckpointCompleted={gamification.completedUnitCheckpoints.includes(
          selectedCourse.courseId
        )}
        totalXp={gamification.totalXp}
        streakDays={gamification.streakDays}
        mistakeCountForCourse={courseMistakesCount}
        onBackToCatalog={() => {
          setSelectedCourseId(null);
          onClearFocusedCourseNumber?.();
        }}
        onStartOrResumeLesson={(lessonId) => startOrResumeLesson(lessonId)}
        onStartUnitCheckpoint={(course) => {
          setActiveCheckpointCourse(course);
          setCheckpointStepIdx(0);
          setCheckpointSelectedValue(null);
          setCheckpointMistakes(0);
          setCheckpointFinished(false);
        }}
        onOpenMistakes={() => setShowMistakeReview(true)}
      />
    );
  }

  /* =========================================================================
     VIEW 5: DEFAULT "I NOSTRI CORSI" HORIZONTAL 12-COURSE CAROUSEL
     ========================================================================= */
  return (
    <AcademyCatalogCarousel
      courses={ACADEMY_COURSES}
      progressMap={progressMap}
      mistakeCount={gamification.mistakeQueue.length}
      dueReviewsCount={dueReviewsCount}
      onSelectCourse={(courseId) => setSelectedCourseId(courseId)}
      onOpenPalestra={() => onOpenPalestra?.()}
      onOpenArena={() => onOpenArena?.()}
      onOpenMistakes={() => setShowMistakeReview(true)}
    />
  );
}
