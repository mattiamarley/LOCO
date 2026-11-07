"use client";

import React, { useMemo, useState } from "react";
import {
  ACADEMY_LESSONS_BY_ID,
  AcademyCourse,
  AcademyProgressMap,
  EnrichedAcademyLesson,
  TIER_NAMING,
  XP_REWARDS,
  resolvePathNodeVisualState,
} from "./loco-academy-curriculum";
import { CATALOG_COURSE_PRESENTATION } from "@/lib/loco-design-tokens";

interface AcademyCoursePathProps {
  course: AcademyCourse;
  progressMap: AcademyProgressMap;
  isCheckpointCompleted: boolean;
  totalXp: number;
  streakDays: number;
  mistakeCountForCourse: number;
  onBackToCatalog: () => void;
  onStartOrResumeLesson: (lessonId: string) => void;
  onStartUnitCheckpoint: (course: AcademyCourse) => void;
  onOpenMistakes: () => void;
}

const STAGGER_OFFSETS_PX = [0, -44, -64, -24, 36, 64, 24, -28];

export function AcademyCoursePath({
  course,
  progressMap,
  isCheckpointCompleted,
  totalXp,
  streakDays,
  mistakeCountForCourse,
  onBackToCatalog,
  onStartOrResumeLesson,
  onStartUnitCheckpoint,
  onOpenMistakes,
}: AcademyCoursePathProps) {
  const presentation = CATALOG_COURSE_PRESENTATION[course.courseId] ?? {
    courseId: course.courseId,
    catalogLabel: `Corso ${course.courseNumber}`,
    shortTitle: course.title,
    cardDescription: course.subtitle,
    illustration: course.mascotAsset,
  };

  // Identify the current / next recommended lesson in this course
  const currentLessonId = useMemo(() => {
    for (const lesson of course.lessons) {
      const st = progressMap[lesson.id]?.status ?? "available";
      if (st !== "provisionally_passed" && st !== "mastered_after_delay") {
        return lesson.id;
      }
    }
    return course.lessons[0]?.id ?? null;
  }, [course.lessons, progressMap]);

  // Default contextual card open on the current lesson so the primary action is immediately obvious
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(currentLessonId);

  const completedCount = useMemo(
    () =>
      course.lessons.filter((l) => {
        const st = progressMap[l.id]?.status;
        return st === "provisionally_passed" || st === "mastered_after_delay";
      }).length,
    [course.lessons, progressMap]
  );

  return (
    <div className="mx-auto max-w-[820px] pb-14">
      {/* Top Course Header (Clean White Canvas) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#181818]/10 pb-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onBackToCatalog}
            aria-label="Torna a I nostri corsi"
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#181818]/15 bg-white text-[#181818] transition hover:border-[#613BE0] hover:text-[#613BE0]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-sm font-semibold text-[#613BE0]">
                {presentation.catalogLabel}
              </span>
              <span className="text-xs text-[#181818]/50">•</span>
              <span className="text-xs font-medium text-[#181818]/70">
                {completedCount} di {course.lessons.length} lezioni completate
              </span>
              {course.planTier !== "free" && (
                <span className="rounded-full bg-[#D2C4F5]/60 px-2.5 py-0.5 text-[11px] font-bold text-[#181818]">
                  {TIER_NAMING[course.planTier].editorialName}
                </span>
              )}
            </div>

            <h1 className="loco-display mt-1 text-[32px] font-bold leading-tight text-[#181818] sm:text-[38px]">
              {presentation.shortTitle}
            </h1>
            <p className="mt-1 max-w-[500px] text-[15px] leading-snug text-[#181818]/75">
              {course.subtitle}
            </p>
          </div>
        </div>

        {/* Minimal Secondary Indicators (No Dashboard Clutter) */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div className="rounded-full bg-[#D2C4F5]/40 px-3.5 py-1.5 text-xs font-bold text-[#181818]">
            {totalXp} XP
          </div>
          {streakDays > 0 && (
            <div className="rounded-full bg-[#FFD014]/35 px-3.5 py-1.5 text-xs font-bold text-[#181818]">
              {streakDays}g costanza
            </div>
          )}
          <img
            src={course.mascotAsset}
            alt=""
            className="hidden h-12 w-12 object-contain sm:block"
          />
        </div>
      </div>

      {/* Optional Gentle Mistake Review Prompt if this course has unresolved mistakes */}
      {mistakeCountForCourse > 0 && (
        <div className="mx-auto mt-6 flex max-w-[520px] items-center justify-between gap-3 rounded-[18px] bg-[#D2C4F5]/35 px-5 py-3">
          <span className="text-xs font-medium text-[#181818]">
            Hai <strong>{mistakeCountForCourse}</strong>{" "}
            {mistakeCountForCourse === 1 ? "concetto" : "concetti"} da ripassare in questo corso.
          </span>
          <button
            type="button"
            onClick={onOpenMistakes}
            className="shrink-0 rounded-full bg-[#613BE0] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[#4B2FC4]"
          >
            Ripassa ora
          </button>
        </div>
      )}

      {/* Centered Narrow Vertical Learning Path (Duolingo-like Progression on White Canvas) */}
      <div className="mx-auto mt-10 flex max-w-[500px] flex-col items-center">
        {course.lessons.map((lesson: EnrichedAcademyLesson, index: number) => {
          const prog = progressMap[lesson.id];
          // Allow exploring lessons while preserving truthful prerequisite and plan indicators
          const { state: rawVisualState, missingPrerequisites } =
            resolvePathNodeVisualState(lesson, progressMap, "free");

          const isCurrent = lesson.id === currentLessonId;
          const isSelected = selectedNodeId === lesson.id;
          const offsetPx = STAGGER_OFFSETS_PX[index % STAGGER_OFFSETS_PX.length] ?? 0;

          const hasSavedSteps = (prog?.currentStepIndex ?? 0) > 0;
          const isCompleted = rawVisualState === "completed";
          const isInProgress =
            !isCompleted && (hasSavedSteps || prog?.status === "practice_done");
          const isLocked = rawVisualState === "locked" && !isCurrent && !isInProgress;
          const isPremium = lesson.planTier !== "free";

          // Node Circle Styling — Strictly LOCO White / Black / Purple / Lavender / Yellow
          let nodeClasses =
            "border-2 border-[#613BE0] bg-white text-[#613BE0] hover:bg-[#D2C4F5]/25";
          if (isCurrent) {
            nodeClasses =
              "border-2 border-[#613BE0] bg-[#613BE0] text-white ring-8 ring-[#D2C4F5]/60 shadow-md";
          } else if (isCompleted) {
            nodeClasses =
              "border-2 border-[#613BE0]/30 bg-[#D2C4F5] text-[#181818] hover:border-[#613BE0]";
          } else if (isInProgress) {
            nodeClasses =
              "border-2 border-[#613BE0] bg-[#FFD014] text-[#181818]";
          } else if (isLocked) {
            nodeClasses =
              "border-2 border-[#181818]/15 bg-[#F4F3F8] text-[#181818]/45 hover:border-[#181818]/30";
          }

          const durationMin = lesson.estimatedMinutes ?? 4;
          const primaryCtaText = isCompleted
            ? "Ripeti lezione"
            : isInProgress || hasSavedSteps
              ? "Continua"
              : "Inizia";

          return (
            <div
              key={lesson.id}
              className="flex w-full flex-col items-center"
            >
              {/* Short Vertical Connection Line from Previous Node */}
              {index > 0 && (
                <div
                  className={`h-8 w-1 rounded-full ${
                    isCompleted || isCurrent ? "bg-[#D2C4F5]" : "bg-[#181818]/10"
                  }`}
                />
              )}

              {/* Staggered Node Wrapper */}
              <div
                className="relative flex flex-col items-center transition-transform"
                style={{ transform: `translateX(${offsetPx}px)` }}
              >
                {/* Floating "Lezione attuale" Callout on Current Node */}
                {isCurrent && !isSelected && (
                  <div className="mb-2 rounded-full bg-[#FFD014] px-3.5 py-1 text-xs font-bold text-[#181818]">
                    {hasSavedSteps ? "Continua da qui" : "Inizia qui"}
                  </div>
                )}

                {/* Circular Lesson Node */}
                <button
                  type="button"
                  onClick={() =>
                    setSelectedNodeId((prev) =>
                      prev === lesson.id ? null : lesson.id
                    )
                  }
                  aria-expanded={isSelected}
                  aria-label={`Lezione ${index + 1}: ${lesson.title}`}
                  className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full transition-transform active:scale-95 ${nodeClasses}`}
                >
                  {isCompleted ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : isLocked ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  ) : (
                    <span className="loco-display text-[24px] font-bold">
                      {index + 1}
                    </span>
                  )}

                  {isPremium && (
                    <span className="absolute -right-1 -top-1 rounded-full bg-[#FFD014] px-1.5 py-0.5 text-[9px] font-bold text-[#181818]">
                      {lesson.planTier === "plus" ? "PLUS" : "PRO"}
                    </span>
                  )}
                </button>

                {/* Minimal Short Title below Node (No Paragraphs) */}
                <span className="mt-2 max-w-[180px] text-center text-[13px] font-semibold leading-tight text-[#181818]">
                  {lesson.title}
                </span>
              </div>

              {/* Contextual Popover Card when Node is Selected */}
              {isSelected && (
                <div className="mt-3 w-full max-w-[360px] rounded-[20px] border border-[#181818]/15 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#181818]/65">
                    <span>
                      Lezione {index + 1} di {course.lessons.length}
                    </span>
                    <span>~{durationMin} min</span>
                  </div>

                  <h2 className="loco-display mt-1 text-[22px] font-bold leading-snug text-[#181818]">
                    {lesson.title}
                  </h2>

                  {hasSavedSteps && !isCompleted && (
                    <p className="mt-1 text-xs font-medium text-[#613BE0]">
                      Progresso salvato: step {(prog?.currentStepIndex ?? 0) + 1} di{" "}
                      {lesson.steps.length}
                    </p>
                  )}

                  {missingPrerequisites.length > 0 && (
                    <p className="mt-2 rounded-[12px] bg-[#D2C4F5]/30 px-3 py-2 text-xs text-[#181818]/80">
                      Consigliato prima:{" "}
                      {missingPrerequisites
                        .map((id) => ACADEMY_LESSONS_BY_ID[id]?.title ?? id)
                        .join(", ")}
                    </p>
                  )}

                  {isPremium && (
                    <p className="mt-2 text-xs text-[#181818]/70">
                      Approfondimento del piano{" "}
                      <strong>{TIER_NAMING[lesson.planTier].editorialName}</strong>.
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onStartOrResumeLesson(lesson.id)}
                      className="w-full rounded-[15px] bg-[#613BE0] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#4B2FC4]"
                    >
                      {primaryCtaText}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Final Unit Checkpoint Node at the End of the Course Path */}
        <div className="flex flex-col items-center">
          <div
            className={`h-8 w-1 rounded-full ${
              isCheckpointCompleted ? "bg-[#FFD014]" : "bg-[#181818]/10"
            }`}
          />
          <button
            type="button"
            onClick={() => onStartUnitCheckpoint(course)}
            className={`flex items-center gap-3 rounded-full border-2 px-6 py-3 text-sm font-bold transition ${
              isCheckpointCompleted
                ? "border-[#181818] bg-[#FFD014] text-[#181818]"
                : "border-[#FFD014] bg-[#FFD014]/25 text-[#181818] hover:bg-[#FFD014]"
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181818] text-xs font-bold text-[#FFD014]">
              ★
            </span>
            <span>
              {isCheckpointCompleted
                ? "Checkpoint del corso superato"
                : `Sfida conclusiva del corso (+${XP_REWARDS.CHECKPOINT_PASSED} XP)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
