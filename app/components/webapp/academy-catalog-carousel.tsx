"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AcademyCourse,
  AcademyProgressMap,
  TIER_NAMING,
} from "./loco-academy-curriculum";
import {
  CATALOG_COURSE_ORDER,
  CATALOG_COURSE_PRESENTATION,
} from "@/lib/loco-design-tokens";

interface AcademyCatalogCarouselProps {
  courses: AcademyCourse[];
  progressMap: AcademyProgressMap;
  mistakeCount: number;
  dueReviewsCount: number;
  onSelectCourse: (courseId: string) => void;
  onOpenPalestra: () => void;
  onOpenArena: () => void;
  onOpenMistakes: () => void;
}

export function AcademyCatalogCarousel({
  courses,
  progressMap,
  mistakeCount,
  dueReviewsCount,
  onSelectCourse,
  onOpenPalestra,
  onOpenArena,
  onOpenMistakes,
}: AcademyCatalogCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Order the 12 courses so Corso 1, Corso 2, Corso 3 appear first as in the original screen
  const orderedCourses = React.useMemo(() => {
    const byId = Object.fromEntries(courses.map((c) => [c.courseId, c]));
    const ordered: AcademyCourse[] = [];
    for (const id of CATALOG_COURSE_ORDER) {
      if (byId[id]) ordered.push(byId[id]);
    }
    for (const c of courses) {
      if (!ordered.some((o) => o.courseId === c.courseId)) {
        ordered.push(c);
      }
    }
    return ordered;
  }, [courses]);

  const updateScrollIndicators = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 12);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 12);

    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 32
      : clientWidth / 3;
    const approxIndex = Math.round(scrollLeft / Math.max(1, cardWidth));
    setActivePageIndex(Math.max(0, Math.min(orderedCourses.length - 1, approxIndex)));
  }, [orderedCourses.length]);

  useEffect(() => {
    updateScrollIndicators();
    window.addEventListener("resize", updateScrollIndicators);
    return () => window.removeEventListener("resize", updateScrollIndicators);
  }, [updateScrollIndicators]);

  const scrollByCards = (direction: "prev" | "next") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const firstCard = el.firstElementChild as HTMLElement | null;
    const step = firstCard ? firstCard.offsetWidth + 32 : el.clientWidth * 0.85;
    const delta = direction === "next" ? step : -step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollByCards("next");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollByCards("prev");
    }
  };

  return (
    <div className="flex flex-col justify-between">
      {/* Top Heading & Carousel Controls — Exact Original LOCO "I nostri corsi" Hierarchy */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="loco-display text-[38px] font-bold leading-none text-[#181818] sm:text-[44px]">
            I nostri corsi
          </h1>
          <p className="mt-2.5 max-w-[520px] text-[16px] leading-snug text-[#181818]/80">
            Segui le lezioni per comprendere al meglio le tecniche mnemoniche
          </p>
        </div>

        {/* Discreet Carousel Navigation Controls */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[#181818]/60">
            {Math.min(activePageIndex + 1, orderedCourses.length)}–
            {Math.min(activePageIndex + 3, orderedCourses.length)} di{" "}
            {orderedCourses.length} corsi
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollByCards("prev")}
              disabled={!canScrollPrev}
              aria-label="Corsi precedenti"
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-[#181818]/15 transition ${
                canScrollPrev
                  ? "bg-white text-[#181818] hover:border-[#613BE0] hover:text-[#613BE0]"
                  : "cursor-not-allowed bg-[#181818]/5 text-[#181818]/30"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByCards("next")}
              disabled={!canScrollNext}
              aria-label="Prossimi corsi"
              className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                canScrollNext
                  ? "bg-[#613BE0] text-white hover:bg-[#4B2FC4]"
                  : "cursor-not-allowed bg-[#181818]/10 text-[#181818]/30"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal 12-Course Carousel (3 visible on Desktop, 2 on Tablet, 1 on Mobile) */}
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollIndicators}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Catalogo dei 12 corsi LOCO"
        className="mt-8 flex snap-x snap-mandatory gap-8 overflow-x-auto pb-6 pt-2 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {orderedCourses.map((course) => {
          const presentation = CATALOG_COURSE_PRESENTATION[course.courseId] ?? {
            courseId: course.courseId,
            catalogLabel: `Corso ${course.courseNumber}`,
            shortTitle: course.title,
            cardDescription: course.subtitle,
            illustration: course.mascotAsset,
          };

          const completedCount = course.lessons.filter((l) => {
            const st = progressMap[l.id]?.status;
            return st === "provisionally_passed" || st === "mastered_after_delay";
          }).length;

          const inProgressCount = course.lessons.filter((l) => {
            const prog = progressMap[l.id];
            if (!prog) return false;
            return (
              prog.currentStepIndex > 0 ||
              prog.status === "practice_done"
            );
          }).length;

          const isCompleted = completedCount === course.lessons.length && course.lessons.length > 0;
          const isStarted = completedCount > 0 || inProgressCount > 0;
          const ctaLabel = isCompleted
            ? "Rivedi"
            : isStarted
              ? "Continua"
              : "Inizia";
          const hasBakedLavenderBackdrop = presentation.illustration.endsWith(".webp");

          return (
            <article
              key={course.courseId}
              onClick={() => onSelectCourse(course.courseId)}
              className="group flex w-[86%] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-[24px] bg-white transition sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)]"
            >
              {/* Illustration Field (Top of Card — Original LOCO Proportion) */}
              <div>
                <div
                  className={`relative flex h-[250px] w-full items-center justify-center overflow-hidden rounded-[24px] transition group-hover:scale-[1.01] ${
                    hasBakedLavenderBackdrop
                      ? "bg-white p-1"
                      : "bg-[#D2C4F5]/70 p-6"
                  }`}
                >
                  <img
                    src={presentation.illustration}
                    alt={presentation.shortTitle}
                    className={
                      hasBakedLavenderBackdrop
                        ? "max-h-[244px] w-auto object-contain"
                        : "max-h-[195px] w-auto object-contain"
                    }
                  />
                  {course.planTier !== "free" && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#D2C4F5]/80 px-3 py-1 text-[11px] font-bold text-[#181818]">
                      {TIER_NAMING[course.planTier].editorialName}
                    </span>
                  )}
                </div>

                {/* Course Label, Title & Short Description on White Canvas */}
                <div className="mt-4 pr-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-medium text-[#181818]">
                      {presentation.catalogLabel}
                    </span>
                    {completedCount > 0 && (
                      <span className="text-xs font-semibold text-[#613BE0]">
                        {completedCount}/{course.lessons.length} lezioni
                      </span>
                    )}
                  </div>

                  <h2 className="loco-display mt-0.5 text-[26px] font-bold leading-tight text-[#181818] group-hover:text-[#613BE0]">
                    {presentation.shortTitle}
                  </h2>

                  <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-[#181818]/80">
                    {presentation.cardDescription}
                  </p>
                </div>
              </div>

              {/* Compact Rounded Purple Pill CTA ("Inizia" / "Continua") */}
              <div className="mt-5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCourse(course.courseId);
                  }}
                  className={`rounded-[15px] px-9 py-2 text-[15px] font-bold transition ${
                    isCompleted
                      ? "bg-[#D2C4F5] text-[#181818] hover:bg-[#613BE0] hover:text-white"
                      : "bg-[#613BE0] text-white hover:bg-[#4B2FC4]"
                  }`}
                >
                  {ctaLabel}
                </button>
                {isCompleted && (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FFD014] text-xs font-bold text-[#181818]">
                    ✓
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {/* Discreet Carousel Progress Dots */}
      <div className="mt-2 flex items-center justify-center gap-1.5" aria-hidden="true">
        {orderedCourses.map((c, idx) => {
          const isVisibleDot = idx >= activePageIndex && idx < activePageIndex + 3;
          return (
            <button
              key={c.courseId}
              type="button"
              onClick={() => {
                const el = scrollContainerRef.current;
                if (!el) return;
                const card = el.children[idx] as HTMLElement | undefined;
                if (card) {
                  el.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
                }
              }}
              className={`h-2 rounded-full transition-all ${
                idx === activePageIndex
                  ? "w-6 bg-[#613BE0]"
                  : isVisibleDot
                    ? "w-2 bg-[#D2C4F5]"
                    : "w-2 bg-[#181818]/15"
              }`}
            />
          );
        })}
      </div>

      {/* Quiet Secondary Tools Row (Palestra, Arena, Ripasso Errori) */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#181818]/10 pt-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#181818]/75">
          <span>Allenamento libero:</span>
          <button
            type="button"
            onClick={onOpenPalestra}
            className="rounded-full bg-[#D2C4F5]/45 px-4 py-1.5 text-xs font-bold text-[#181818] transition hover:bg-[#D2C4F5]"
          >
            Palestra Fonetica &amp; Carte
          </button>
          <button
            type="button"
            onClick={onOpenArena}
            className="rounded-full bg-[#D2C4F5]/45 px-4 py-1.5 text-xs font-bold text-[#181818] transition hover:bg-[#D2C4F5]"
          >
            Arena Sfide
          </button>
        </div>

        {(mistakeCount > 0 || dueReviewsCount > 0) && (
          <button
            type="button"
            onClick={onOpenMistakes}
            className="rounded-full border border-[#613BE0]/30 bg-white px-4 py-1.5 text-xs font-bold text-[#613BE0] transition hover:bg-[#D2C4F5]/30"
          >
            {mistakeCount > 0
              ? `Ripassa ${mistakeCount} concetti da consolidare →`
              : `${dueReviewsCount} ripassi programmati →`}
          </button>
        )}
      </div>
    </div>
  );
}
