"use client";

import React, { useMemo, useState } from "react";
import {
  ACADEMY_COURSES,
  ACADEMY_LESSONS_BY_ID,
  AcademyCourse,
  AcademyLessonProgress,
  AcademyProgressMap,
  AcademyTheme,
  AdaptiveAcademyRecommendation,
  ENRICHED_ACADEMY_LESSONS,
  EnrichedAcademyLesson,
  LEGACY_LESSON_MAP,
  LessonStatus,
  LessonTier,
  MAJOR_IT_V1_TABLE,
  TIER_NAMING,
  encodeItalianWordToMajorDigits,
  recordAcademyCheckpointAttempt,
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
}

const STATUS_LABELS: Record<
  LessonStatus,
  { label: string; badgeBg: string; badgeText: string; dotColor: string }
> = {
  available: {
    label: "Disponibile",
    badgeBg: "bg-white/15",
    badgeText: "text-white/85",
    dotColor: "bg-white/50",
  },
  reading: {
    label: "Lezione letta",
    badgeBg: "bg-[#6CA6FF]/25",
    badgeText: "text-[#CFE2FF]",
    dotColor: "bg-[#6CA6FF]",
  },
  practice_done: {
    label: "Esercizio svolto",
    badgeBg: "bg-[#FFE27A]/25",
    badgeText: "text-[#FFE27A]",
    dotColor: "bg-[#FFE27A]",
  },
  provisionally_passed: {
    label: "Superata (attende verifica ritardata)",
    badgeBg: "bg-[#E9FF60]/25",
    badgeText: "text-[#E9FF60]",
    dotColor: "bg-[#E9FF60]",
  },
  mastered_after_delay: {
    label: "Padronanza verificata",
    badgeBg: "bg-[#E9FF60]",
    badgeText: "text-[#2513A4]",
    dotColor: "bg-[#2513A4]",
  },
  needs_review: {
    label: "Da ripassare",
    badgeBg: "bg-[#FF8A8A]/25",
    badgeText: "text-[#FFD2D2]",
    dotColor: "bg-[#FF8A8A]",
  },
};

const THEME_LABELS: { id: "all" | AcademyTheme; label: string }[] = [
  { id: "all", label: "Tutti i temi (56)" },
  { id: "onboarding", label: "0 · Onboarding (S01–S06)" },
  { id: "loci", label: "1 · Tecnica dei Loci (L01–L07)" },
  { id: "linked", label: "2 · Linked Method (K01–K04)" },
  { id: "numbers", label: "3 & 7 · Numeri & Major System (N, Q)" },
  { id: "study", label: "4 & 8 · Metodo di Studio & Esami (T, R)" },
  { id: "real-life", label: "5 · Vita Reale (X01–X04)" },
  { id: "palaces-advanced", label: "6 & 9 · Architettura & Spazi (P, W)" },
  { id: "training", label: "10 · Palestra dei Campioni (U01–U04)" },
  { id: "ai-studio", label: "11 · AI Memory Studio (A01–A04)" },
];

const S01_TARGET_WORDS = ["limone", "violino", "ponte", "bussola", "moneta"];
const S03_DEMO_SURFACES = [
  { id: "surf-porta", label: "Porta d'ingresso", zone: "Parete Nord · Ingresso" },
  { id: "surf-attaccapanni", label: "Attaccapanni in legno", zone: "Parete Nord-Est" },
  { id: "surf-tavolo", label: "Tavolo / Scrivania", zone: "Centro Stanza" },
  { id: "surf-divano", label: "Divano / Poltrona", zone: "Parete Sud" },
  { id: "surf-finestra", label: "Finestra panoramica", zone: "Parete Ovest" },
  { id: "surf-libreria", label: "Libreria a parete", zone: "Parete Est" },
  { id: "surf-lampada", label: "Lampada da terra", zone: "Angolo Lettura" },
  { id: "surf-specchio", label: "Specchio a muro", zone: "Corridoio" },
  { id: "surf-pianta", label: "Pianta di ficus", zone: "Balcone" },
  { id: "surf-quadro", label: "Quadro geometrico", zone: "Sopra il divano" },
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
}: LocoAcademySectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<"all" | LessonTier>("all");
  const [selectedTheme, setSelectedTheme] = useState<"all" | AcademyTheme>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    "all" | "todo" | "in_progress" | "passed" | "needs_review"
  >("all");
  const [calmModeNoTimers, setCalmModeNoTimers] = useState(false);
  const [hideRecommendations, setHideRecommendations] = useState(false);
  const [showMajorTableModal, setShowMajorTableModal] = useState(false);

  // Player states (reset when activeLessonId changes via helper)
  const [activeBlockTab, setActiveBlockTab] = useState<
    "reading" | "exercise" | "checkpoint"
  >("reading");
  const [checkpointUserAnswer, setCheckpointUserAnswer] = useState("");
  const [checkpointHintsUsed, setCheckpointHintsUsed] = useState(0);
  const [checkpointViewedAnswerBefore, setCheckpointViewedAnswerBefore] =
    useState(false);
  const [checkpointSubmittedResult, setCheckpointSubmittedResult] = useState<{
    isCorrect: boolean;
    feedback: string;
    autonomousSuccess: boolean;
    resultingStatus: LessonStatus;
  } | null>(null);

  // S01 exercise states
  const [s01Phase, setS01Phase] = useState<"observe" | "recall" | "compared">(
    "observe"
  );
  const [s01Input, setS01Input] = useState("");

  // S02 exercise states
  const [s02QOrder, setS02QOrder] = useState(
    "Qual è l'ordine dei primi quattro pianeti partendo dal Sole?"
  );
  const [s02QFeature, setS02QFeature] = useState(
    "Quale caratteristica distingue l'atmosfera di Venere?"
  );
  const [s02QCompare, setS02QCompare] = useState("");

  // S03 / L-series locus builder states
  const [selectedSurfaceIds, setSelectedSurfaceIds] = useState<string[]>([
    "surf-porta",
    "surf-attaccapanni",
    "surf-tavolo",
    "surf-divano",
    "surf-finestra",
  ]);
  const [s03LabelsHidden, setS03LabelsHidden] = useState(false);
  const [s03OrderAttemptIds, setS03OrderAttemptIds] = useState<string[]>([]);
  const [s03OrderVerified, setS03OrderVerified] = useState<boolean | null>(null);

  // S04 association builder states
  const [s04Cues, setS04Cues] = useState<string[]>([
    "Un limone gigante si incastra nella maniglia della porta e spruzza succo acido.",
    "Un violino appeso all'attaccapanni suona da solo appena passa una corrente d'aria.",
    "Un ponte in miniatura di pietra attraversa il tavolo da un bordo all'altro.",
    "Una bussola magnetica gigante gira vorticosamente sui cuscini del divano.",
    "",
  ]);
  const [s04SavedToRoutes, setS04SavedToRoutes] = useState(false);

  // S05 blind recall mini-run states
  const [s05Index, setS05Index] = useState(0);
  const [s05Answer, setS05Answer] = useState("");
  const [s05HintUsedOnCurrent, setS05HintUsedOnCurrent] = useState(false);
  const [s05Log, setS05Log] = useState<
    { locus: string; expected: string; given: string; correct: boolean; assisted: boolean }[]
  >([]);

  // Major phonetic drill states (N01-N05, Q01-Q04)
  const [majorWordInput, setMajorWordInput] = useState("scena");
  const [majorForward14, setMajorForward14] = useState("");
  const [majorForward32, setMajorForward32] = useState("");
  const [majorReverseMicio, setMajorReverseMicio] = useState("");
  const [majorReverseMago, setMajorReverseMago] = useState("");
  const [majorHideReferenceTable, setMajorHideReferenceTable] = useState(false);
  const [majorDrillChecked, setMajorDrillChecked] = useState(false);

  // A01 AI audit exercise state
  const [a01RejectedFalseCard, setA01RejectedFalseCard] = useState(false);
  const [a01ApprovedVerifiedCard, setA01ApprovedVerifiedCard] = useState(false);

  // Generic practice reflection state for lessons
  const [practiceNotes, setPracticeNotes] = useState("");

  const activeLesson: EnrichedAcademyLesson | null = activeLessonId
    ? ACADEMY_LESSONS_BY_ID[activeLessonId] ?? null
    : null;

  const activeProgress: AcademyLessonProgress | null =
    activeLesson && progressMap[activeLesson.id]
      ? progressMap[activeLesson.id]
      : null;

  const openLessonPlayer = (
    lessonId: string,
    initialTab: "reading" | "exercise" | "checkpoint" = "reading",
    skippedReading: boolean = false
  ) => {
    const lesson = ACADEMY_LESSONS_BY_ID[lessonId];
    if (!lesson) return;
    const nowIso = new Date().toISOString();
    onUpdateLessonProgress(lessonId, (prev) => ({
      ...prev,
      openedAt: prev.openedAt ?? nowIso,
      status:
        !skippedReading && prev.status === "available" ? "reading" : prev.status,
      readCompletedAt:
        !skippedReading && !prev.readCompletedAt ? nowIso : prev.readCompletedAt,
      skippedReadingToTest: prev.skippedReadingToTest || skippedReading,
    }));
    onSelectLesson(lessonId);
    setActiveBlockTab(initialTab);
    setCheckpointUserAnswer("");
    setCheckpointHintsUsed(0);
    setCheckpointViewedAnswerBefore(false);
    setCheckpointSubmittedResult(null);
  };

  // Summary counts across all 56 lessons
  const stats = useMemo(() => {
    let readCount = 0;
    let practiceCount = 0;
    let passedCount = 0;
    let masteredCount = 0;
    let onboardingCompleted = 0;

    for (const lesson of ENRICHED_ACADEMY_LESSONS) {
      const p = progressMap[lesson.id];
      if (!p) continue;
      if (p.status !== "available") readCount += 1;
      if (
        p.practiceCompletedAt ||
        p.status === "practice_done" ||
        p.status === "provisionally_passed" ||
        p.status === "mastered_after_delay"
      ) {
        practiceCount += 1;
      }
      if (
        p.status === "provisionally_passed" ||
        p.status === "mastered_after_delay"
      ) {
        passedCount += 1;
      }
      if (p.status === "mastered_after_delay") {
        masteredCount += 1;
      }
      if (
        lesson.requiredInOnboarding &&
        (p.status === "provisionally_passed" ||
          p.status === "mastered_after_delay" ||
          p.status === "practice_done")
      ) {
        onboardingCompleted += 1;
      }
    }

    return {
      totalLessons: ENRICHED_ACADEMY_LESSONS.length,
      totalCourses: ACADEMY_COURSES.length,
      readCount,
      practiceCount,
      passedCount,
      masteredCount,
      onboardingCompleted,
    };
  }, [progressMap]);

  // Filtered courses & lessons
  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return ACADEMY_COURSES.map((course) => {
      const matchingLessons = course.lessons.filter((lesson) => {
        if (selectedTier !== "all" && lesson.planTier !== selectedTier) {
          return false;
        }
        if (selectedTheme !== "all" && lesson.theme !== selectedTheme) {
          return false;
        }
        const p = progressMap[lesson.id];
        const status = p?.status ?? "available";
        if (selectedStatusFilter === "todo" && status !== "available") {
          return false;
        }
        if (
          selectedStatusFilter === "in_progress" &&
          status !== "reading" &&
          status !== "practice_done"
        ) {
          return false;
        }
        if (
          selectedStatusFilter === "passed" &&
          status !== "provisionally_passed" &&
          status !== "mastered_after_delay"
        ) {
          return false;
        }
        if (selectedStatusFilter === "needs_review" && status !== "needs_review") {
          return false;
        }

        if (!q) return true;
        return (
          lesson.id.toLowerCase().includes(q) ||
          lesson.title.toLowerCase().includes(q) ||
          lesson.courseName.toLowerCase().includes(q) ||
          lesson.reading.toLowerCase().includes(q) ||
          lesson.workedExample.toLowerCase().includes(q)
        );
      });

      return {
        ...course,
        lessons: matchingLessons,
      };
    }).filter((c) => c.lessons.length > 0);
  }, [
    searchQuery,
    selectedTier,
    selectedTheme,
    selectedStatusFilter,
    progressMap,
  ]);

  const markPracticeCompleted = (lessonId: string, summary: string) => {
    const nowIso = new Date().toISOString();
    onUpdateLessonProgress(lessonId, (prev) => ({
      ...prev,
      practiceCompletedAt: nowIso,
      practiceSummary: summary,
      status:
        prev.status === "available" || prev.status === "reading"
          ? "practice_done"
          : prev.status,
    }));
  };

  const handleVerifyCheckpoint = (isDelayedFollowUp: boolean = false) => {
    if (!activeLesson || !activeProgress) return;
    const nowIso = new Date().toISOString();
    const { updated, evaluation } = recordAcademyCheckpointAttempt(
      activeProgress,
      activeLesson,
      {
        userAnswer: checkpointUserAnswer,
        hintsUsedInAttempt: checkpointHintsUsed,
        viewedAnswerBeforeAttempt: checkpointViewedAnswerBefore,
        isDelayedFollowUp,
        nowIso,
      }
    );

    onUpdateLessonProgress(activeLesson.id, () => updated);
    setCheckpointSubmittedResult({
      isCorrect: evaluation.isCorrect,
      feedback: evaluation.feedback,
      autonomousSuccess: evaluation.autonomousSuccess,
      resultingStatus: updated.status,
    });
  };

  const onboardingLessons = ACADEMY_COURSES[0]?.lessons ?? [];
  const nextOnboardingLesson =
    onboardingLessons.find((l) => {
      const st = progressMap[l.id]?.status ?? "available";
      return st !== "provisionally_passed" && st !== "mastered_after_delay";
    }) ?? onboardingLessons[0];

  return (
    <div className="mt-10 space-y-7">
      {/* Header Banner LOCO Academy */}
      <div className="rounded-[28px] border-2 border-[#E9FF60]/60 bg-[#2E1BC4] p-5 md:p-7 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E9FF60] px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-[#2513A4]">
              <span>LOCO Academy · Curriculum v1.0</span>
              <span>•</span>
              <span>12 Corsi · 56 Microlezioni</span>
            </div>
            <h2 className="mt-3 font-display text-2xl md:text-4xl font-extrabold text-white">
              Scuola Interattiva della Memoria: Capire → Codificare → Recuperare → Consolidare
            </h2>
            <p className="mt-1.5 max-w-3xl text-sm md:text-base text-white/85">
              Leggere una spiegazione non equivale a padroneggiare una tecnica. Ogni modulo separa{" "}
              <strong className="text-[#E9FF60]">lettura</strong>,{" "}
              <strong className="text-[#E9FF60]">esercizio guidato</strong>,{" "}
              <strong className="text-[#E9FF60]">verifica a risposta nascosta</strong> e{" "}
              <strong className="text-[#E9FF60]">consolidamento nel tempo</strong>. Onboarding,
              fondamenti, Blind Recall e coda ripassi sono sempre gratuiti.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                nextOnboardingLesson && openLessonPlayer(nextOnboardingLesson.id)
              }
              className="rounded-full bg-[#E9FF60] px-5 py-2.5 font-display text-sm font-extrabold text-[#2513A4] shadow-md hover:brightness-105 transition"
            >
              {stats.onboardingCompleted === 6
                ? "Rivedi Corso 0 (S01–S06)"
                : `Continua Percorso Iniziale (${nextOnboardingLesson?.id ?? "S01"})`}
            </button>
            <button
              type="button"
              onClick={() => setShowMajorTableModal((v) => !v)}
              className="rounded-full border border-white/30 bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              {showMajorTableModal
                ? "Chiudi Tabella Fonetica major-it-v1"
                : "Tabella Fonetica major-it-v1"}
            </button>
          </div>
        </div>

        {/* Statistiche reali progresso Academy (distinte tra lettura, pratica, verifica, padronanza) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl bg-[#2513A4]/80 border border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              Onboarding (S01–S06)
            </div>
            <div className="mt-1 font-display text-xl font-extrabold text-[#E9FF60]">
              {stats.onboardingCompleted} / 6
            </div>
            <div className="text-[11px] text-white/65">Percorso iniziale gratuito</div>
          </div>
          <div className="rounded-2xl bg-[#2513A4]/80 border border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              Lezioni lette (`reading`)
            </div>
            <div className="mt-1 font-display text-xl font-extrabold text-white">
              {stats.readCount} / {stats.totalLessons}
            </div>
            <div className="text-[11px] text-white/65">Include migrazione legacy</div>
          </div>
          <div className="rounded-2xl bg-[#2513A4]/80 border border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              Esercizi svolti
            </div>
            <div className="mt-1 font-display text-xl font-extrabold text-[#FFE27A]">
              {stats.practiceCount} / {stats.totalLessons}
            </div>
            <div className="text-[11px] text-white/65">Pratica guidata completata</div>
          </div>
          <div className="rounded-2xl bg-[#2513A4]/80 border border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              Verifiche superate
            </div>
            <div className="mt-1 font-display text-xl font-extrabold text-[#E9FF60]">
              {stats.passedCount} / {stats.totalLessons}
            </div>
            <div className="text-[11px] text-white/65">Tentativo a risposta nascosta</div>
          </div>
          <div className="rounded-2xl bg-[#2513A4]/80 border border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wider text-white/70">
              Padronanza (`mastered`)
            </div>
            <div className="mt-1 font-display text-xl font-extrabold text-[#6CA6FF]">
              {stats.masteredCount} / {stats.totalLessons}
            </div>
            <div className="text-[11px] text-white/65">Solo dopo prova autonoma</div>
          </div>
        </div>

        {/* Striscia Corso 0 — Benvenuto in LOCO (S01-S06) */}
        <div className="mt-5 rounded-2xl bg-[#2513A4]/90 border border-white/15 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#E9FF60]">
                Corso 0 · Percorso Iniziale Consigliato (Impara facendo)
              </span>
              <p className="text-xs text-white/80">
                Costruisci il tuo primo palazzo mentre impari la differenza tra riconoscimento e richiamo attivo.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-white/80 cursor-pointer">
              <input
                type="checkbox"
                checked={calmModeNoTimers}
                onChange={(e) => setCalmModeNoTimers(e.target.checked)}
                className="rounded accent-[#E9FF60]"
              />
              <span>Modalità senza pressione (disattiva timer)</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {onboardingLessons.map((lesson) => {
              const p = progressMap[lesson.id];
              const st = p?.status ?? "available";
              const stMeta = STATUS_LABELS[st];
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => openLessonPlayer(lesson.id)}
                  className="text-left rounded-xl border border-white/20 bg-white/5 hover:bg-white/15 p-3 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-display text-sm font-extrabold text-[#E9FF60]">
                        {lesson.id}
                      </span>
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${stMeta.dotColor}`}
                        title={stMeta.label}
                      />
                    </div>
                    <div className="mt-1 font-bold text-xs text-white line-clamp-2">
                      {lesson.title}
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-white/75">
                    {stMeta.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabella Fonetica Ufficiale major-it-v1 (apribile a richiesta) */}
      {showMajorTableModal && (
        <div className="rounded-[24px] border-2 border-[#E9FF60] bg-[#2513A4] p-5 shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="font-display text-xl font-extrabold text-[#E9FF60]">
                Convenzione Fonetica Italiana Ufficiale (`major-it-v1`)
              </h3>
              <p className="text-xs text-white/80">
                Il Major System valuta i <strong>suoni consonantici pronunciati</strong>, non la semplice grafia.
                Nota: il suono dolce «SC» di <em>scena</em> (/ʃ/) appartiene allo <strong>0</strong>, mentre il <strong>6</strong> codifica solo C/G dolci (/tʃ/, /dʒ/ di <em>ciao, gelato</em>).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowMajorTableModal(false)}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white hover:bg-white/25"
            >
              Chiudi
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {MAJOR_IT_V1_TABLE.map((row) => (
              <div
                key={row.digit}
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-2xl font-extrabold text-[#E9FF60]">
                    {row.digit}
                  </span>
                  <span className="rounded bg-[#2513A4] px-2 py-0.5 font-mono text-[11px] text-white/90">
                    {row.phonemes}
                  </span>
                </div>
                <div className="mt-1 font-bold text-white">{row.sounds}</div>
                <div className="mt-1 text-white/75 text-[11px]">{row.mnemonicHint}</div>
                <div className="mt-2 pt-1.5 border-t border-white/15 text-[11px] text-[#E9FF60]">
                  Es:{" "}
                  {row.exampleWords
                    .map((ex) => `${ex.word} (${ex.digits})`)
                    .join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routing Adattivo ("Durante lo studio — Lezione al momento giusto") */}
      {!hideRecommendations && adaptiveRecommendations.length > 0 && (
        <div className="rounded-[24px] border border-white/25 bg-[#2B18B8] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#E9FF60]">
                Assistenza Contestuale · Lezione al momento giusto
              </span>
              <p className="text-xs text-white/80">
                Suggerimenti basati sui tentativi registrati nella sessione (spiegabili e disattivabili).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHideRecommendations(true)}
              className="text-xs text-white/70 underline hover:text-white"
            >
              Nascondi suggerimenti adattivi
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adaptiveRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="rounded-xl border border-white/15 bg-[#2513A4]/85 p-3.5 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#E9FF60]">
                      {rec.observedSignal}
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white/80">
                      {rec.isSufficientSample
                        ? `Campione n=${rec.sampleSize}`
                        : `Campione ridotto (n=${rec.sampleSize})`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/85">{rec.explanation}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {rec.recommendedLessonIds.map((lid) => {
                    const l = ACADEMY_LESSONS_BY_ID[lid];
                    if (!l) return null;
                    return (
                      <button
                        key={lid}
                        type="button"
                        onClick={() => openLessonPlayer(lid)}
                        className="rounded-full bg-[#E9FF60] px-3 py-1 text-xs font-extrabold text-[#2513A4] hover:brightness-105"
                      >
                        Apri {lid} · {l.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtri & Ricerca Catalogo (12 Corsi, 56 Lezioni, 32 Free / 20 Plus / 4 Pro) */}
      <div className="rounded-[24px] border border-white/20 bg-[#2A17B5] p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl md:text-2xl font-extrabold text-white">
              Catalogo Completo LOCO Academy (12 Corsi · 56 Microlezioni)
            </h3>
            <p className="text-xs text-white/75">
              32 lezioni gratuite (<strong>{TIER_NAMING.free.editorialName}</strong>) · 20 specializzazioni{" "}
              <strong>{TIER_NAMING.plus.editorialName}</strong> · 4 laboratori{" "}
              <strong>{TIER_NAMING.pro.editorialName}</strong> (anteprima ed esercizi simulati liberi).
            </p>
          </div>
          <div className="w-full md:w-72">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca ID (es. S01, L06, N02) o tema..."
              aria-label="Cerca lezione nel catalogo LOCO Academy"
              className="w-full rounded-full border border-white/30 bg-[#2513A4] px-4 py-2 text-xs text-white placeholder:text-white/55 focus:border-[#E9FF60] focus:outline-none"
            />
          </div>
        </div>

        {/* Tier filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: "all", label: "Tutti i piani (56)" },
              { id: "free", label: "LOCOMPRO DOPO · Free (32)" },
              { id: "plus", label: "POCO LOCO · Plus (20)" },
              { id: "pro", label: "PRO LOCO · Pro (4)" },
            ] as const
          ).map((tierOpt) => (
            <button
              key={tierOpt.id}
              type="button"
              onClick={() => setSelectedTier(tierOpt.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                selectedTier === tierOpt.id
                  ? "bg-[#E9FF60] text-[#2513A4]"
                  : "bg-white/10 text-white/85 hover:bg-white/20"
              }`}
            >
              {tierOpt.label}
            </button>
          ))}

          <span className="mx-1 text-white/30">|</span>

          {(
            [
              { id: "all", label: "Tutti gli stati" },
              { id: "todo", label: "Da iniziare" },
              { id: "in_progress", label: "Lette / In pratica" },
              { id: "passed", label: "Superate / Padroneggiate" },
              { id: "needs_review", label: "Da ripassare" },
            ] as const
          ).map((stOpt) => (
            <button
              key={stOpt.id}
              type="button"
              onClick={() => setSelectedStatusFilter(stOpt.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedStatusFilter === stOpt.id
                  ? "bg-white text-[#2513A4]"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {stOpt.label}
            </button>
          ))}
        </div>

        {/* Theme filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {THEME_LABELS.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setSelectedTheme(th.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                selectedTheme === th.id
                  ? "bg-[#6CA6FF] text-[#170B6E] font-bold"
                  : "bg-[#2513A4] text-white/80 hover:bg-white/15 border border-white/15"
              }`}
            >
              {th.label}
            </button>
          ))}
        </div>
      </div>

      {/* Elenco dei 12 Corsi e delle 56 Lezioni */}
      <div className="space-y-6">
        {filteredCourses.map((course: AcademyCourse) => {
          const tierInfo = TIER_NAMING[course.planTier];
          return (
            <section
              key={course.courseId}
              className="rounded-[26px] border border-white/20 bg-[#2B18B8]/90 p-5 md:p-6 shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/15 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#E9FF60] px-3 py-0.5 font-display text-xs font-extrabold text-[#2513A4]">
                      Corso {course.courseNumber}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                        course.planTier === "free"
                          ? "bg-emerald-400/20 text-emerald-200 border border-emerald-300/30"
                          : course.planTier === "plus"
                            ? "bg-amber-300/20 text-amber-200 border border-amber-300/30"
                            : "bg-fuchsia-400/20 text-fuchsia-200 border border-fuchsia-300/30"
                      }`}
                    >
                      {tierInfo.shortBadge}
                      {tierInfo.isPaidHypothesis ? " · Anteprima aperta" : ""}
                    </span>
                    <span className="text-xs text-white/70">
                      {course.lessons.length} lezioni · Ingresso: {course.entrySuggestion}
                    </span>
                  </div>
                  <h4 className="mt-2 font-display text-xl md:text-2xl font-extrabold text-white">
                    {course.title}
                  </h4>
                  <p className="text-xs md:text-sm text-white/80">{course.subtitle}</p>
                </div>
                <div className="text-right text-xs text-white/70">
                  <div>Regola sblocco: {course.unlockPolicy}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {course.lessons.map((lesson) => {
                  const prog = progressMap[lesson.id];
                  const status: LessonStatus = prog?.status ?? "available";
                  const statusMeta = STATUS_LABELS[status];
                  const isSelected = activeLessonId === lesson.id;

                  return (
                    <div
                      key={lesson.id}
                      className={`rounded-2xl border p-4 transition flex flex-col justify-between ${
                        isSelected
                          ? "border-[#E9FF60] bg-[#2513A4] ring-2 ring-[#E9FF60]"
                          : "border-white/15 bg-[#2513A4]/80 hover:border-white/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-extrabold text-[#E9FF60]">
                            {lesson.id}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusMeta.badgeBg} ${statusMeta.badgeText}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>
                        <h5 className="mt-1.5 font-display text-base font-extrabold text-white">
                          {lesson.title}
                        </h5>
                        <p className="mt-1 text-xs text-white/75 line-clamp-3">
                          {lesson.reading}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-white/65">
                          <span>
                            ⏱ ~{lesson.estimatedMinutes ?? 6} min
                          </span>
                          <span>
                            Prereq:{" "}
                            {lesson.prerequisites.length > 0
                              ? lesson.prerequisites.join(", ")
                              : "Nessuno"}
                          </span>
                        </div>

                        {prog?.legacyMigratedFrom &&
                          prog.legacyMigratedFrom.length > 0 && (
                            <div className="text-[10px] text-[#6CA6FF]">
                              Continuità legacy:{" "}
                              {prog.legacyMigratedFrom
                                .map((id) => `${id} (${LEGACY_LESSON_MAP[id]?.legacyTitle ?? id})`)
                                .join(", ")}{" "}
                              → stato lettura (non padronanza automatica)
                            </div>
                          )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => openLessonPlayer(lesson.id, "reading", false)}
                            className="flex-1 rounded-full bg-[#E9FF60] px-3 py-1.5 text-xs font-extrabold text-[#2513A4] hover:brightness-105 transition"
                          >
                            Apri Lezione
                          </button>
                          <button
                            type="button"
                            onClick={() => openLessonPlayer(lesson.id, "checkpoint", true)}
                            title="Salta la lettura, prova ora la verifica a risposta nascosta"
                            className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-white/20 transition"
                          >
                            Prova ora
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal / Player Interattivo della Singola Lezione (5 Blocchi) */}
      {activeLesson && activeProgress && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="academy-lesson-player-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 md:p-6 overflow-y-auto"
        >
          <div className="my-auto w-full max-w-4xl rounded-[28px] border-2 border-[#E9FF60] bg-[#2513A4] p-5 md:p-7 text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Top header bar */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#E9FF60] px-3 py-0.5 font-display text-xs font-extrabold text-[#2513A4]">
                    {activeLesson.id} · {activeLesson.courseName}
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {TIER_NAMING[activeLesson.planTier].shortBadge}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      STATUS_LABELS[activeProgress.status].badgeBg
                    } ${STATUS_LABELS[activeProgress.status].badgeText}`}
                  >
                    Stato: {STATUS_LABELS[activeProgress.status].label}
                  </span>
                </div>
                <h3
                  id="academy-lesson-player-title"
                  className="mt-2 font-display text-2xl md:text-3xl font-extrabold text-white"
                >
                  {activeLesson.title}
                </h3>
                <p className="text-xs text-white/75">
                  Versione contenuto {activeLesson.contentVersion} · Tempo stimato ~
                  {activeLesson.estimatedMinutes ?? 6} min · Prerequisiti:{" "}
                  {activeLesson.prerequisites.length > 0
                    ? activeLesson.prerequisites.join(", ")
                    : "nessuno"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectLesson(null)}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold text-white hover:bg-white/25"
              >
                Chiudi ✕
              </button>
            </div>

            {/* Step switcher (1. Lettura & Esempio | 2. Fai tu: Esercizio | 3. Richiama e controlla: Verifica) */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveBlockTab("reading")}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    activeBlockTab === "reading"
                      ? "bg-[#E9FF60] text-[#2513A4]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  1. Da leggere & Esempio LOCO
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBlockTab("exercise")}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    activeBlockTab === "exercise"
                      ? "bg-[#E9FF60] text-[#2513A4]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  2. Fai tu (Esercizio guidato)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBlockTab("checkpoint")}
                  className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                    activeBlockTab === "checkpoint"
                      ? "bg-[#E9FF60] text-[#2513A4]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  3. Verifica (Risposta nascosta)
                </button>
              </div>

              {activeBlockTab === "reading" && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateLessonProgress(activeLesson.id, (prev) => ({
                      ...prev,
                      skippedReadingToTest: true,
                    }));
                    setActiveBlockTab("checkpoint");
                  }}
                  className="text-xs font-bold text-[#E9FF60] underline hover:opacity-90"
                >
                  Salta la lettura, prova ora →
                </button>
              )}
            </div>

            {/* TAB 1: LETTURA & ESEMPIO LOCO */}
            {activeBlockTab === "reading" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-white/20 bg-[#2E1BC4] p-5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#E9FF60]">
                    Da leggere
                  </div>
                  <p className="mt-2 text-sm md:text-base leading-relaxed text-white/95">
                    {activeLesson.reading}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#E9FF60]/50 bg-[#FFF8EC] p-4 text-[#2513A4]">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-[#2513A4]/80">
                      Esempio LOCO
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-relaxed">
                      {activeLesson.workedExample}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-rose-300/40 bg-rose-950/40 p-4 text-white">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-rose-300">
                      Errore tipico da evitare
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/90">
                      Non {activeLesson.commonMistake}
                    </p>
                    <div className="mt-3 text-xs text-white/75">
                      <strong>Criterio di padronanza:</strong>{" "}
                      {activeLesson.masteryCriterion}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-white/75">
                    Stato lettura:{" "}
                    <strong>
                      {activeProgress.readCompletedAt
                        ? "Registrata (`lesson_read`)"
                        : "In corso"}
                    </strong>{" "}
                    — Nota: la sola lettura non assegna la padronanza (`mastered`).
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveBlockTab("exercise")}
                    className="rounded-full bg-[#E9FF60] px-5 py-2.5 font-display text-sm font-extrabold text-[#2513A4] hover:brightness-105"
                  >
                    Passa all&apos;Esercizio Guidato (Fai tu) →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: ESERCIZIO PRATICO GUIDATO */}
            {activeBlockTab === "exercise" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[#E9FF60]/60 bg-[#2E1BC4] p-4">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#E9FF60]">
                    Consegna Esercizio Guidato ({activeLesson.id})
                  </div>
                  <p className="mt-1 text-sm md:text-base font-semibold text-white">
                    {activeLesson.exercise.prompt}
                  </p>
                  {activeLesson.requiresSimulatedFallbackNotice &&
                    activeLesson.fallbackNoticeText && (
                      <div className="mt-3 rounded-xl border border-amber-300/50 bg-amber-500/15 p-3 text-xs text-amber-100">
                        <strong>Avviso trasparenza runtime:</strong>{" "}
                        {activeLesson.fallbackNoticeText}
                      </div>
                    )}
                </div>

                {/* ESERCIZIO SPECIFICO S01: Recognition vs Recall Switch */}
                {activeLesson.runtimeExerciseKind ===
                  "s01-recognition-recall-switch" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    {s01Phase === "observe" && (
                      <div>
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Fase 1 (Studio / Riconoscimento): Osserva queste 5 parole{" "}
                          {!calmModeNoTimers && "(per circa 15 secondi)"}, poi nascondile:
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {S01_TARGET_WORDS.map((w) => (
                            <span
                              key={w}
                              className="rounded-xl bg-[#FFF8EC] px-4 py-2 font-display text-base font-extrabold text-[#2513A4]"
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setS01Phase("recall");
                            setS01Input("");
                          }}
                          className="mt-4 rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                        >
                          Nascondi la lista e prova il richiamo senza guardare →
                        </button>
                      </div>
                    )}

                    {s01Phase === "recall" && (
                      <div>
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Fase 2 (Recupero cieco / Blind Recall): Lista nascosta! Scrivi le parole che ricordi separate da virgola o spazio:
                        </div>
                        <input
                          type="text"
                          value={s01Input}
                          onChange={(e) => setS01Input(e.target.value)}
                          placeholder="Scrivi qui le 5 parole senza guardare..."
                          className="mt-2 w-full rounded-xl border border-white/30 bg-[#2513A4] px-3.5 py-2.5 text-sm text-white"
                        />
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setS01Phase("compared");
                              markPracticeCompleted(
                                activeLesson.id,
                                `Richiamo S01 tentato: ${s01Input}`
                              );
                            }}
                            className="rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                          >
                            Confronta con la lista originale
                          </button>
                          <button
                            type="button"
                            onClick={() => setS01Phase("observe")}
                            className="rounded-full bg-white/15 px-3 py-2 text-xs text-white"
                          >
                            Rivedi lista (Riconoscimento)
                          </button>
                        </div>
                      </div>
                    )}

                    {s01Phase === "compared" && (
                      <div>
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Confronto completato:
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {S01_TARGET_WORDS.map((w) => {
                            const hit = s01Input.toLowerCase().includes(w);
                            return (
                              <span
                                key={w}
                                className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
                                  hit
                                    ? "bg-emerald-400/25 text-emerald-200 border border-emerald-300/40"
                                    : "bg-rose-400/25 text-rose-200 border border-rose-300/40"
                                }`}
                              >
                                {w} {hit ? "✓ recuperata" : "✗ da consolidare"}
                              </span>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => setS01Phase("observe")}
                          className="mt-3 text-xs underline text-white/80"
                        >
                          Riprova esercizio S01
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO S02: Target Question Builder */}
                {activeLesson.runtimeExerciseKind ===
                  "s02-target-question-builder" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    <div className="text-xs text-white/85">
                      Trasforma l&apos;obiettivo vago <strong>«ripassare i pianeti»</strong> in 3 target verificabili:
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs">
                        <span className="font-bold text-[#E9FF60]">
                          1. Domanda sull&apos;ordine:
                        </span>
                        <input
                          type="text"
                          value={s02QOrder}
                          onChange={(e) => setS02QOrder(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/25 bg-[#2513A4] px-3 py-2 text-xs text-white"
                        />
                      </label>
                      <label className="block text-xs">
                        <span className="font-bold text-[#E9FF60]">
                          2. Domanda sulle caratteristiche:
                        </span>
                        <input
                          type="text"
                          value={s02QFeature}
                          onChange={(e) => setS02QFeature(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-white/25 bg-[#2513A4] px-3 py-2 text-xs text-white"
                        />
                      </label>
                      <label className="block text-xs">
                        <span className="font-bold text-[#E9FF60]">
                          3. Domanda di confronto (scrivila tu):
                        </span>
                        <input
                          type="text"
                          value={s02QCompare}
                          onChange={(e) => setS02QCompare(e.target.value)}
                          placeholder="Es. Qual è la differenza principale tra pianeti rocciosi e giganti gassosi?"
                          className="mt-1 w-full rounded-xl border border-white/25 bg-[#2513A4] px-3 py-2 text-xs text-white"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        markPracticeCompleted(
                          activeLesson.id,
                          `3 target creati: ${s02QOrder} | ${s02QFeature} | ${s02QCompare}`
                        )
                      }
                      className="rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                    >
                      Conferma i 3 Target Verificabili ✓
                    </button>
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO S03 & L01-L07: In-Scene Locus Builder & Label-Hidden Order Check */}
                {(activeLesson.runtimeExerciseKind ===
                  "s03-five-locus-scene-builder" ||
                  activeLesson.runtimeExerciseKind === "loci-scene-lab") && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Costruzione Loci nella Scena Aperta ({selectedSurfaceIds.length}{" "}
                          selezionati · target{" "}
                          {activeLesson.id === "L06" ? "10 loci" : "5 loci"})
                        </div>
                        <p className="text-xs text-white/75">
                          Seleziona punti non ambigui, poi chiudi le etichette e toccali nell&apos;ordine scelto, oppure apri direttamente la Stanza 3D interattiva.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenSceneForLesson(activeLesson.id)}
                        className="rounded-full bg-[#6CA6FF] px-3.5 py-1.5 text-xs font-extrabold text-[#170B6E]"
                      >
                        Apri Stanza 3D Interattiva (In-Scene) ↗
                      </button>
                    </div>

                    {!s03LabelsHidden ? (
                      <div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {S03_DEMO_SURFACES.map((surf) => {
                            const idx = selectedSurfaceIds.indexOf(surf.id);
                            const isSelected = idx !== -1;
                            return (
                              <button
                                key={surf.id}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedSurfaceIds((prev) =>
                                      prev.filter((id) => id !== surf.id)
                                    );
                                  } else {
                                    setSelectedSurfaceIds((prev) => [
                                      ...prev,
                                      surf.id,
                                    ]);
                                  }
                                }}
                                className={`rounded-xl border p-2.5 text-left text-xs transition ${
                                  isSelected
                                    ? "border-[#E9FF60] bg-[#E9FF60]/20 text-white"
                                    : "border-white/15 bg-[#2513A4] text-white/75"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold">
                                    {isSelected ? `Locus #${idx + 1}` : "Non scelto"}
                                  </span>
                                </div>
                                <div className="mt-1 font-semibold text-white">
                                  {surf.label}
                                </div>
                                <div className="text-[10px] text-white/60">
                                  {surf.zone}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={selectedSurfaceIds.length < 5}
                          onClick={() => {
                            setS03LabelsHidden(true);
                            setS03OrderAttemptIds([]);
                            setS03OrderVerified(null);
                          }}
                          className="mt-3 rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4] disabled:opacity-40"
                        >
                          Chiudi le etichette e verifica l&apos;ordine ({selectedSurfaceIds.length} loci) →
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Etichette ordine nascoste! Tocca i {selectedSurfaceIds.length} loci scelti seguendo esattamente il tuo ordine (selezionati finora:{" "}
                          {s03OrderAttemptIds.length}/{selectedSurfaceIds.length}):
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {S03_DEMO_SURFACES.filter((s) =>
                            selectedSurfaceIds.includes(s.id)
                          ).map((surf) => {
                            const chosenStep =
                              s03OrderAttemptIds.indexOf(surf.id) + 1;
                            return (
                              <button
                                key={surf.id}
                                type="button"
                                onClick={() => {
                                  if (chosenStep > 0) return;
                                  const nextAttempt = [
                                    ...s03OrderAttemptIds,
                                    surf.id,
                                  ];
                                  setS03OrderAttemptIds(nextAttempt);
                                  if (
                                    nextAttempt.length ===
                                    selectedSurfaceIds.length
                                  ) {
                                    const ok = nextAttempt.every(
                                      (id, i) => id === selectedSurfaceIds[i]
                                    );
                                    setS03OrderVerified(ok);
                                    if (ok) {
                                      markPracticeCompleted(
                                        activeLesson.id,
                                        `Ordine di ${selectedSurfaceIds.length} loci verificato senza etichette`
                                      );
                                    }
                                  }
                                }}
                                className={`rounded-xl border px-3.5 py-2 text-xs font-bold ${
                                  chosenStep > 0
                                    ? "border-[#E9FF60] bg-[#E9FF60] text-[#2513A4]"
                                    : "border-white/30 bg-[#2513A4] text-white"
                                }`}
                              >
                                {chosenStep > 0 ? `${chosenStep}. ` : "? · "}
                                {surf.label}
                              </button>
                            );
                          })}
                        </div>
                        {s03OrderVerified !== null && (
                          <div
                            className={`text-xs font-bold ${
                              s03OrderVerified
                                ? "text-[#E9FF60]"
                                : "text-rose-300"
                            }`}
                          >
                            {s03OrderVerified
                              ? `Perfetto! ${selectedSurfaceIds.length}/${selectedSurfaceIds.length} loci ricostruiti in ordine senza etichette.`
                              : "Ordine invertito su almeno un punto: riapri le etichette o riprova la sequenza."}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setS03LabelsHidden(false);
                            setS03OrderAttemptIds([]);
                          }}
                          className="text-xs underline text-white/80"
                        >
                          Mostra di nuovo le etichette dei loci
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO S04: Action-Association Builder */}
                {activeLesson.runtimeExerciseKind ===
                  "s04-action-association-builder" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    <div className="text-xs font-bold text-[#E9FF60]">
                      Associa i 5 elementi di S01 ai 5 loci di S03 con una frase d&apos;azione chiara (scrivi tu almeno la quinta):
                    </div>
                    <div className="space-y-2">
                      {S01_TARGET_WORDS.map((word, idx) => {
                        const surf = S03_DEMO_SURFACES[idx];
                        return (
                          <div
                            key={word}
                            className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5"
                          >
                            <div className="text-xs font-bold text-[#E9FF60]">
                              Locus {idx + 1}: {surf?.label} → Bersaglio: «{word}»
                            </div>
                            <input
                              type="text"
                              value={s04Cues[idx] ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setS04Cues((prev) => {
                                  const copy = [...prev];
                                  copy[idx] = val;
                                  return copy;
                                });
                              }}
                              placeholder={`Scrivi un'azione che colleghi «${word}» a ${surf?.label}...`}
                              className="mt-1 w-full rounded-lg border border-white/25 bg-black/20 px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          markPracticeCompleted(
                            activeLesson.id,
                            "5 associazioni d'azione create per i 5 loci"
                          );
                          onCreateOnboardingRouteFromAcademy(
                            S01_TARGET_WORDS.map((w, i) => ({
                              locusLabel:
                                S03_DEMO_SURFACES[i]?.label ?? `Locus ${i + 1}`,
                              itemWord: w,
                              actionCue:
                                s04Cues[i]?.trim() ||
                                `${w} interagisce con ${S03_DEMO_SURFACES[i]?.label}`,
                            }))
                          );
                          setS04SavedToRoutes(true);
                        }}
                        className="rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                      >
                        Salva le 5 associazioni nel tuo Percorso LOCO ✓
                      </button>
                      {s04SavedToRoutes && (
                        <span className="text-xs font-bold text-[#E9FF60]">
                          Percorso salvato! Ora puoi testarlo in S05.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO S05: Blind Recall con tracciamento indizi */}
                {activeLesson.runtimeExerciseKind ===
                  "s05-blind-recall-simulation" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-[#E9FF60]">
                        Blind Recall sui 5 punti (Punto {Math.min(s05Index + 1, 5)} di 5) — Risposta nascosta
                      </div>
                      <button
                        type="button"
                        onClick={onStartBlindRecallFromAcademy}
                        className="rounded-full bg-[#6CA6FF] px-3 py-1 text-[11px] font-extrabold text-[#170B6E]"
                      >
                        Apri Motore Blind Recall Completo (Recappete) ↗
                      </button>
                    </div>

                    {s05Index < 5 ? (
                      <div className="rounded-xl border border-white/20 bg-[#2513A4] p-3.5 space-y-2.5">
                        <div className="text-sm font-bold text-white">
                          Locus #{s05Index + 1}:{" "}
                          <span className="text-[#E9FF60]">
                            {S03_DEMO_SURFACES[s05Index]?.label}
                          </span>{" "}
                          — Quale elemento avevi collocato qui?
                        </div>
                        {s05HintUsedOnCurrent && (
                          <div className="rounded-lg bg-amber-400/20 border border-amber-300/40 px-3 py-1.5 text-xs text-amber-100">
                            Indizio registrato (tentativo assistito):{" "}
                            {s04Cues[s05Index]?.slice(0, 42) ||
                              `Inizia per "${S01_TARGET_WORDS[s05Index]?.[0]}"`}
                            ...
                          </div>
                        )}
                        <input
                          type="text"
                          value={s05Answer}
                          onChange={(e) => setS05Answer(e.target.value)}
                          placeholder="Scrivi l'elemento prima di scoprire la soluzione..."
                          className="w-full rounded-xl border border-white/25 bg-black/25 px-3 py-2 text-xs text-white"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const expected = S01_TARGET_WORDS[s05Index] ?? "";
                              const ok =
                                s05Answer.trim().toLowerCase() === expected;
                              const nextLog = [
                                ...s05Log,
                                {
                                  locus:
                                    S03_DEMO_SURFACES[s05Index]?.label ?? "",
                                  expected,
                                  given: s05Answer.trim() || "(vuoto)",
                                  correct: ok,
                                  assisted: s05HintUsedOnCurrent,
                                },
                              ];
                              setS05Log(nextLog);
                              setS05Answer("");
                              setS05HintUsedOnCurrent(false);
                              setS05Index(s05Index + 1);
                              if (s05Index + 1 >= 5) {
                                markPracticeCompleted(
                                  activeLesson.id,
                                  "Blind Recall su 5 loci completato con tracciamento indizi"
                                );
                              }
                            }}
                            className="rounded-full bg-[#E9FF60] px-4 py-1.5 text-xs font-extrabold text-[#2513A4]"
                          >
                            Invia tentativo e verifica
                          </button>
                          <button
                            type="button"
                            onClick={() => setS05HintUsedOnCurrent(true)}
                            className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white"
                          >
                            Chiedi indizio (non assegna grado massimo)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-[#E9FF60]">
                          Riepilogo Blind Recall (5/5 tentativi registrati):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {s05Log.map((entry, idx) => (
                            <div
                              key={idx}
                              className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5 text-xs"
                            >
                              <div className="font-bold text-white">
                                {entry.locus}
                              </div>
                              <div className="text-[#E9FF60]">
                                Atteso: {entry.expected}
                              </div>
                              <div className="text-white/80">
                                Tuo: {entry.given}
                              </div>
                              <div className="mt-1 text-[10px]">
                                {entry.correct
                                  ? entry.assisted
                                    ? "✓ Corretto (Con indizio)"
                                    : "✓ Autonomo"
                                  : "✗ Da ripassare"}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setS05Index(0);
                            setS05Log([]);
                          }}
                          className="text-xs underline text-white/80"
                        >
                          Ripeti Blind Recall da capo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO S06: Coda Ripassi & Consolidamento */}
                {activeLesson.runtimeExerciseKind ===
                  "s06-due-queue-scheduler" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    <div className="text-xs text-white/90">
                      Elementi attualmente in scadenza nella tua <strong>Coda Ripassi (gratuita)</strong>:{" "}
                      <span className="font-display text-base font-extrabold text-[#E9FF60]">
                        {dueReviewsCount} target dovuti
                      </span>{" "}
                      su {routes.length} percorsi attivi.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          markPracticeCompleted(
                            activeLesson.id,
                            "Coda ripassi consultata e sessione futura pianificata"
                          );
                        }}
                        className="rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                      >
                        Pianifica verifica distribuita (+24h) e segna pratica svolta ✓
                      </button>
                      <button
                        type="button"
                        onClick={onStartBlindRecallFromAcademy}
                        className="rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white"
                      >
                        Apri Coda Ripassi in Recappete ↗
                      </button>
                    </div>
                  </div>
                )}

                {/* ESERCIZIO SPECIFICO MAJOR SYSTEM: N01-N05 & Q01-Q04 */}
                {activeLesson.runtimeExerciseKind === "major-phonetic-drill" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-bold text-[#E9FF60]">
                        Laboratorio Fonetico Bidirezionale (`major-it-v1`)
                      </div>
                      <button
                        type="button"
                        onClick={() => setMajorHideReferenceTable((v) => !v)}
                        className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-white"
                      >
                        {majorHideReferenceTable
                          ? "Mostra mini-legenda 0–9"
                          : "Nascondi legenda per test autonomo"}
                      </button>
                    </div>

                    {!majorHideReferenceTable && (
                      <div className="rounded-xl bg-[#2513A4] p-2.5 text-[11px] text-white/85">
                        <strong>0</strong>=S/Z/SC dolce (<em>scena</em>=02) ·{" "}
                        <strong>1</strong>=T/D · <strong>2</strong>=N/GN ·{" "}
                        <strong>3</strong>=M · <strong>4</strong>=R ·{" "}
                        <strong>5</strong>=L/GL · <strong>6</strong>=C/G dolce (
                        <em>ciao</em>=6, <em>micio</em>=36) · <strong>7</strong>
                        =C/G dura (<em>casa</em>=70, <em>mago</em>=37) ·{" "}
                        <strong>8</strong>=F/V · <strong>9</strong>=P/B
                      </div>
                    )}

                    {/* Trasduttore fonetico live */}
                    <div className="rounded-xl border border-white/15 bg-[#2513A4] p-3">
                      <label className="block text-xs font-bold text-white">
                        Testa qualsiasi parola con il trasduttore fonetico `major-it-v1`:
                      </label>
                      <div className="mt-1.5 flex items-center gap-3">
                        <input
                          type="text"
                          value={majorWordInput}
                          onChange={(e) => setMajorWordInput(e.target.value)}
                          placeholder="Es. scena, micio, mago, toro, riva..."
                          className="rounded-lg border border-white/25 bg-black/25 px-3 py-1.5 text-xs text-white"
                        />
                        <span className="text-xs text-white/80">
                          Cifre codificate:{" "}
                          <strong className="font-display text-lg text-[#E9FF60]">
                            {encodeItalianWordToMajorDigits(majorWordInput) || "—"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* 4 prove bidirezionali */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <label className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5">
                        <div className="font-bold text-[#E9FF60]">
                          Forward: scrivi una parola valida per 14 (T/D + R):
                        </div>
                        <input
                          type="text"
                          value={majorForward14}
                          onChange={(e) => setMajorForward14(e.target.value)}
                          placeholder="Es. toro"
                          className="mt-1 w-full rounded bg-black/25 px-2.5 py-1 text-white"
                        />
                      </label>
                      <label className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5">
                        <div className="font-bold text-[#E9FF60]">
                          Forward: scrivi una parola valida per 32 (M + N):
                        </div>
                        <input
                          type="text"
                          value={majorForward32}
                          onChange={(e) => setMajorForward32(e.target.value)}
                          placeholder="Es. mano"
                          className="mt-1 w-full rounded bg-black/25 px-2.5 py-1 text-white"
                        />
                      </label>
                      <label className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5">
                        <div className="font-bold text-[#E9FF60]">
                          Reverse: a quale numero corrisponde «micio» (C dolce)?
                        </div>
                        <input
                          type="text"
                          value={majorReverseMicio}
                          onChange={(e) => setMajorReverseMicio(e.target.value)}
                          placeholder="Cifre..."
                          className="mt-1 w-full rounded bg-black/25 px-2.5 py-1 text-white"
                        />
                      </label>
                      <label className="rounded-xl border border-white/15 bg-[#2513A4] p-2.5">
                        <div className="font-bold text-[#E9FF60]">
                          Reverse: a quale numero corrisponde «mago» (G dura)?
                        </div>
                        <input
                          type="text"
                          value={majorReverseMago}
                          onChange={(e) => setMajorReverseMago(e.target.value)}
                          placeholder="Cifre..."
                          className="mt-1 w-full rounded bg-black/25 px-2.5 py-1 text-white"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setMajorDrillChecked(true);
                          markPracticeCompleted(
                            activeLesson.id,
                            "Drill fonetico major-it-v1 completato"
                          );
                        }}
                        className="rounded-full bg-[#E9FF60] px-4 py-2 text-xs font-extrabold text-[#2513A4]"
                      >
                        Controlla conversioni fonetiche ✓
                      </button>
                      {majorDrillChecked && (
                        <span className="text-xs text-white/90">
                          14:{" "}
                          {encodeItalianWordToMajorDigits(majorForward14) === "14"
                            ? "✓ valida"
                            : "usa es. 'toro'"}{" "}
                          · 32:{" "}
                          {encodeItalianWordToMajorDigits(majorForward32) === "32"
                            ? "✓ valida"
                            : "usa es. 'mano'"}{" "}
                          · micio:{" "}
                          {majorReverseMicio.trim() === "36"
                            ? "✓ 36"
                            : "atteso 36"}{" "}
                          · mago:{" "}
                          {majorReverseMago.trim() === "37"
                            ? "✓ 37"
                            : "atteso 37"}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* ESERCIZIO SIMULATO PER A01-A04 / ALTRI CORSI: Area di lavoro accessibile */}
                {activeLesson.id === "A01" && (
                  <div className="rounded-2xl border border-white/20 bg-white/5 p-4 space-y-3">
                    <div className="text-xs font-bold text-[#E9FF60]">
                      Revisione critica di schede estratte da documento demo (individua l&apos;errore):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                      <div className="rounded-xl border border-rose-300/40 bg-[#2513A4] p-3">
                        <div className="font-bold text-white">
                          Proposta AI #1: «La fotosintesi avviene solo di notte.»
                        </div>
                        <div className="text-white/70 mt-1">
                          Fonte paragrafo 2: «La fase luminosa richiede luce solare.»
                        </div>
                        <button
                          type="button"
                          onClick={() => setA01RejectedFalseCard(true)}
                          className={`mt-2 rounded-full px-3 py-1 font-bold ${
                            a01RejectedFalseCard
                              ? "bg-rose-400 text-[#2513A4]"
                              : "bg-white/15 text-white"
                          }`}
                        >
                          {a01RejectedFalseCard
                            ? "✗ Rifiutata come errore fattuale"
                            : "Rifiuta proposta errata"}
                        </button>
                      </div>
                      <div className="rounded-xl border border-emerald-300/40 bg-[#2513A4] p-3">
                        <div className="font-bold text-white">
                          Proposta AI #2: «Quale ruolo svolge la clorofilla nella fase luminosa?»
                        </div>
                        <div className="text-white/70 mt-1">
                          Fonte paragrafo 2 verificata e citabile.
                        </div>
                        <button
                          type="button"
                          onClick={() => setA01ApprovedVerifiedCard(true)}
                          className={`mt-2 rounded-full px-3 py-1 font-bold ${
                            a01ApprovedVerifiedCard
                              ? "bg-[#E9FF60] text-[#2513A4]"
                              : "bg-white/15 text-white"
                          }`}
                        >
                          {a01ApprovedVerifiedCard
                            ? "✓ Approvata con fonte verificata"
                            : "Approva target verificato"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quaderno pratico testuale / accessibile sempre disponibile per ogni lezione */}
                <div className="rounded-2xl border border-white/15 bg-[#2E1BC4]/70 p-4 space-y-2.5">
                  <label className="block text-xs font-bold text-[#E9FF60]">
                    Svolgimento scritto / Alternativa testuale accessibile ({activeLesson.id}):
                  </label>
                  <textarea
                    rows={3}
                    value={practiceNotes}
                    onChange={(e) => setPracticeNotes(e.target.value)}
                    placeholder="Scrivi qui la tua catena, i tuoi target, i tuoi loci o la tua diagnosi per completare l'esercizio in modalità testuale..."
                    className="w-full rounded-xl border border-white/25 bg-[#2513A4] p-3 text-xs text-white placeholder:text-white/50"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        markPracticeCompleted(
                          activeLesson.id,
                          practiceNotes.trim() ||
                            `Esercizio ${activeLesson.id} completato`
                        )
                      }
                      className="rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25"
                    >
                      Segna esercizio pratico completato (`practice_done`) ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBlockTab("checkpoint")}
                      className="rounded-full bg-[#E9FF60] px-5 py-2 text-xs font-extrabold text-[#2513A4]"
                    >
                      Vai alla Verifica a Risposta Nascosta →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: VERIFICA A RISPOSTA NASCOSTA (CHECKPOINT) */}
            {activeBlockTab === "checkpoint" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border-2 border-[#E9FF60] bg-[#2E1BC4] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#E9FF60]">
                      Richiama e controlla · Soluzione nascosta fino al tentativo
                    </span>
                    <span className="text-[11px] text-white/75">
                      Tentativi effettuati: {activeProgress.checkpointAttempts} · Indizi usati:{" "}
                      {activeProgress.checkpointHintsUsed + checkpointHintsUsed}
                    </span>
                  </div>

                  <p className="font-display text-lg md:text-xl font-extrabold text-white">
                    {activeLesson.checkpoint.question}
                  </p>

                  {/* Opzioni rapide se presenti (A/B, Sì/No, 6/7) */}
                  {activeLesson.checkpointOptions && (
                    <div className="flex flex-wrap gap-2.5">
                      {activeLesson.checkpointOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setCheckpointUserAnswer(opt.value)}
                          className={`rounded-xl border px-4 py-2.5 text-xs font-extrabold transition ${
                            checkpointUserAnswer.toLowerCase() ===
                            opt.value.toLowerCase()
                              ? "border-[#E9FF60] bg-[#E9FF60] text-[#2513A4]"
                              : "border-white/25 bg-[#2513A4] text-white hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input testuale sempre disponibile */}
                  <div>
                    <label className="block text-xs text-white/80 mb-1">
                      La tua risposta (scrivi o seleziona un&apos;opzione qui sopra prima di scoprire la chiave):
                    </label>
                    <input
                      type="text"
                      value={checkpointUserAnswer}
                      onChange={(e) => setCheckpointUserAnswer(e.target.value)}
                      placeholder="Scrivi la tua risposta senza guardare la soluzione..."
                      className="w-full rounded-xl border border-white/30 bg-[#2513A4] px-4 py-2.5 text-sm text-white placeholder:text-white/50"
                    />
                  </div>

                  {/* Indizio graduato se richiesto */}
                  {checkpointHintsUsed > 0 && (
                    <div className="rounded-xl border border-amber-300/50 bg-amber-500/15 p-3 text-xs text-amber-100">
                      <strong>Indizio graduato #{checkpointHintsUsed} (registrato):</strong>{" "}
                      {activeLesson.progressiveHint}
                    </div>
                  )}

                  {/* Rivelazione anticipata (se l'utente decide di guardare prima di rispondere) */}
                  {checkpointViewedAnswerBefore && (
                    <div className="rounded-xl border border-rose-300/50 bg-rose-950/60 p-3 text-xs text-rose-100">
                      <strong>Soluzione svelata prima del tentativo (`viewedAnswerBeforeAttempt = true`):</strong>{" "}
                      Chiave: «{activeLesson.checkpoint.expectedAnswer}». Questo tentativo è registrato come studio assistito e non assegna il superamento autonomo.
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleVerifyCheckpoint(false)}
                      className="rounded-full bg-[#E9FF60] px-5 py-2.5 font-display text-sm font-extrabold text-[#2513A4] hover:brightness-105"
                    >
                      Verifica risposta
                    </button>

                    {activeProgress.provisionallyPassedAt &&
                      activeProgress.status !== "mastered_after_delay" && (
                        <button
                          type="button"
                          onClick={() => handleVerifyCheckpoint(true)}
                          className="rounded-full bg-[#6CA6FF] px-4 py-2.5 text-xs font-extrabold text-[#170B6E]"
                        >
                          Conferma Richiamo Ritardato Autonomo → `mastered`
                        </button>
                      )}

                    <button
                      type="button"
                      onClick={() => setCheckpointHintsUsed((c) => c + 1)}
                      className="rounded-full border border-white/30 bg-white/10 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Chiedi indizio (registrato)
                    </button>

                    {!checkpointSubmittedResult && !checkpointViewedAnswerBefore && (
                      <button
                        type="button"
                        onClick={() => setCheckpointViewedAnswerBefore(true)}
                        className="text-xs text-white/70 underline hover:text-white"
                      >
                        Mostra soluzione (non vale come richiamo autonomo)
                      </button>
                    )}
                  </div>
                </div>

                {/* Feedback post-tentativo (mostra chiave, rubrica ed errore tipico SOLO dopo il tentativo) */}
                {checkpointSubmittedResult && (
                  <div
                    className={`rounded-2xl border-2 p-5 space-y-2 ${
                      checkpointSubmittedResult.autonomousSuccess
                        ? "border-[#E9FF60] bg-emerald-950/50"
                        : "border-amber-300 bg-amber-950/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-lg font-extrabold text-[#E9FF60]">
                        {checkpointSubmittedResult.autonomousSuccess
                          ? "✓ Richiamo Autonomo Riuscito!"
                          : checkpointSubmittedResult.isCorrect
                            ? "✓ Risposta corretta (con assistenza/indizio registrato)"
                            : "✗ Risposta da correggere"}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-white">
                        Nuovo stato:{" "}
                        {STATUS_LABELS[checkpointSubmittedResult.resultingStatus].label}
                      </span>
                    </div>
                    <p className="text-sm text-white/95">
                      {checkpointSubmittedResult.feedback}
                    </p>
                    <div className="pt-2 text-xs text-white/80 space-y-1 border-t border-white/15">
                      <div>
                        <strong>Chiave ufficiale:</strong>{" "}
                        {activeLesson.checkpoint.expectedAnswer}
                      </div>
                      <div>
                        <strong>Padronanza osservabile:</strong>{" "}
                        {activeLesson.masteryCriterion}
                      </div>
                      <div>
                        <strong>Errore tipico:</strong> {activeLesson.commonMistake}
                      </div>
                    </div>

                    {!checkpointSubmittedResult.autonomousSuccess && (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckpointUserAnswer("");
                          setCheckpointHintsUsed(0);
                          setCheckpointViewedAnswerBefore(false);
                          setCheckpointSubmittedResult(null);
                        }}
                        className="mt-2 rounded-full bg-[#E9FF60] px-4 py-1.5 text-xs font-extrabold text-[#2513A4]"
                      >
                        Riprova ora a risposta nascosta e senza indizi
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
