"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  INITIAL_CHALLENGES,
  INITIAL_COURSES,
  INITIAL_REVIEW_HISTORY,
  INITIAL_ROUTES,
  MAJOR_SYSTEM_TABLE,
  METRIC_DEFINITIONS,
  ALL_MEMORY_METRIC_KEYS,
  computeWebAppProfileMetrics,
  evaluateLocusRecall,
  type LearningIntervention,
  type ReviewHistoryEntry,
  type WebAppChallenge,
  type WebAppCourse,
  type WebAppLocus,
  type WebAppRoute,
} from "./loco-webapp-data";
import type { SchedulerGrade } from "@/server/src/models";
import { Room3DViewer } from "./room-3d-viewer";

type PrimaryTab = "home" | "recappete" | "corsi" | "profilo" | "login";

interface CircularProgressProps {
  percent: number;
  size?: number;
}

function CircularProgress({ percent, size = 68 }: CircularProgressProps) {
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#D0C4F6"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FFD014"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[15px] font-bold text-[#181818]">{clamped}%</span>
    </div>
  );
}

export function LocoWebApp() {
  // Navigation & Core State
  const [activeTab, setActiveTab] = useState<PrimaryTab>("home");
  const [routes, setRoutes] = useState<WebAppRoute[]>(INITIAL_ROUTES);
  const [courses, setCourses] = useState<WebAppCourse[]>(INITIAL_COURSES);
  const [challenges, setChallenges] = useState<WebAppChallenge[]>(INITIAL_CHALLENGES);
  const [reviewHistory, setReviewHistory] =
    useState<ReviewHistoryEntry[]>(INITIAL_REVIEW_HISTORY);

  // Active sub-views
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [selectedLocusId, setSelectedLocusId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [activeLessonModal, setActiveLessonModal] = useState<{
    courseId: number;
    lessonId: string;
  } | null>(null);

  // Blind Recall SRS Modal State
  const sessionStartRef = useRef<number>(0);
  const [nowReferenceMs, setNowReferenceMs] = useState<number>(() => Date.now());
  const [reviewSession, setReviewSession] = useState<{
    routeId: string;
    locusIndex: number;
    userAttemptText: string;
    hintCount: number;
    viewedAnswerBeforeAttempt: boolean;
    answerRevealed: boolean;
    algorithmVersion: "fsrs-7" | "simple-v1";
    lastResultBanner: string | null;
  } | null>(null);

  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, [reviewSession?.routeId, reviewSession?.locusIndex]);

  // Recappete filters
  const [searchQuery, setSearchQuery] = useState("");
  const [showDraftsOnly, setShowDraftsOnly] = useState(false);
  const [envFilter, setEnvFilter] = useState<"ALL" | "3D SCAN" | "STREET VIEW" | "DUE">("ALL");

  // Courses sub-tab (Figma Corsi + Blueprint v2 Palestra & Arena)
  const [coursesSubView, setCoursesSubView] = useState<"corsi" | "palestra" | "arena">("corsi");

  // Major System Bidirectional Trainer State
  const [majorTrials, setMajorTrials] = useState<
    { direction: "forward" | "reverse"; correct: boolean; latencyMs: number; stimulusKey?: string }[]
  >([
    { direction: "forward", correct: true, latencyMs: 2800, stimulusKey: "major-32" },
    { direction: "forward", correct: true, latencyMs: 3100, stimulusKey: "major-14" },
    { direction: "reverse", correct: true, latencyMs: 2900, stimulusKey: "major-52" },
    { direction: "reverse", correct: false, latencyMs: 5400, stimulusKey: "major-84" },
  ]);
  const [majorDirection, setMajorDirection] = useState<"forward" | "reverse">("forward");
  const [majorPromptIdx, setMajorPromptIdx] = useState(0);
  const [majorInput, setMajorInput] = useState("");
  const [majorFeedback, setMajorFeedback] = useState<string | null>(null);

  // 52-Card Deck Trainer State
  const [cardSequence, setCardSequence] = useState<string[]>([
    "A♠",
    "7♥",
    "K♦",
    "3♣",
    "10♠",
  ]);
  const [cardPhase, setCardPhase] = useState<"memorize" | "recall">("memorize");
  const [cardRecallGuess, setCardRecallGuess] = useState("");
  const [cardFeedback, setCardFeedback] = useState<string | null>(null);

  // Arena Challenge Runner State
  const [activeChallengeRun, setActiveChallengeRun] = useState<{
    challengeId: string;
    step: number;
    answers: string[];
    currentInput: string;
    startedAtMs: number;
  } | null>(null);
  const [completedChallengeVersionIds, setCompletedChallengeVersionIds] = useState<string[]>([]);

  // Profile State (Safe non-PII demo defaults per AGENTS.md guardrails)
  const [profileSubTab, setProfileSubTab] = useState<"profilo" | "metriche">("profilo");
  const [avatarVariant, setAvatarVariant] = useState<"goose" | "beanie">("goose");
  const [profileForm, setProfileForm] = useState({
    firstName: "Vanessa",
    lastName: "Rossi",
    nickname: "vanessa_loco",
    email: "demo@example.com",
    location: "Torino, Italia",
    address: "Corso Duca degli Abruzzi 24",
    city: "Torino",
    zip: "10129",
    country: "Italia",
    cardHolder: "Vanessa Rossi",
    cardMasked: "5545 •••• •••• 9013",
    cardExpiry: "08/28",
  });
  const [profileSavedToast, setProfileSavedToast] = useState<string | null>(null);

  // Login Form State
  const [loginNickname, setLoginNickname] = useState("vanessa_loco");
  const [loginPassword, setLoginPassword] = useState("••••••••");

  // MAPPETE 6-Step Route Creation Wizard Modal State
  const [mappeteModal, setMappeteModal] = useState<{
    open: boolean;
    step: "intro" | "posizione" | "tracciato" | "anagrafica" | "fine";
    environment: "STREET VIEW" | "3D SCAN";
    locationQuery: string;
    searched: boolean;
    inspectStreetPhoto: boolean;
    pins: { x: number; y: number; label: string; question: string; answer: string }[];
    title: string;
    description: string;
    topic: string;
    sourceNotes: string;
    createdRouteId: string | null;
    confirmExitDraft: boolean;
  }>({
    open: false,
    step: "intro",
    environment: "STREET VIEW",
    locationQuery: "Politecnico di Torino",
    searched: false,
    inspectStreetPhoto: false,
    pins: [
      {
        x: 36,
        y: 35,
        label: "Ingresso Politecnico",
        question: "Primo concetto chiave del percorso?",
        answer: "Definizione fondamentale verificata.",
      },
      {
        x: 61,
        y: 51,
        label: "Aula Magna",
        question: "Secondo concetto chiave del percorso?",
        answer: "Esempio applicativo principale.",
      },
    ],
    title: "",
    description: "",
    topic: "CHIMICA",
    sourceNotes: "",
    createdRouteId: null,
    confirmExitDraft: false,
  });

  // Compute live 18 Memory Metrics & Adaptive Interventions
  const { metrics, interventions: computedInterventions } = useMemo(
    () => computeWebAppProfileMetrics(reviewHistory, majorTrials),
    [reviewHistory, majorTrials]
  );
  const [interventionStatuses, setInterventionStatuses] = useState<
    Record<string, "proposed" | "accepted" | "completed" | "dismissed" | "expired">
  >({});

  const activeInterventions: LearningIntervention[] = useMemo(
    () =>
      computedInterventions.map((item) => ({
        ...item,
        status: interventionStatuses[item.id] ?? item.status,
      })),
    [computedInterventions, interventionStatuses]
  );

  const readyRoutes = useMemo(() => routes.filter((r) => r.status === "ready"), [routes]);
  const draftRoutes = useMemo(() => routes.filter((r) => r.status === "draft"), [routes]);

  const filteredRecapRoutes = useMemo(() => {
    const base = showDraftsOnly ? draftRoutes : readyRoutes;
    return base.filter((r) => {
      if (envFilter === "3D SCAN" && r.environment !== "3D SCAN") return false;
      if (envFilter === "STREET VIEW" && r.environment !== "STREET VIEW") return false;
      if (envFilter === "DUE") {
        const hasDue = r.loci.some((l) => new Date(l.dueAt).getTime() <= nowReferenceMs);
        if (!hasDue) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q)
      );
    });
  }, [showDraftsOnly, draftRoutes, readyRoutes, envFilter, searchQuery, nowReferenceMs]);

  const editingRoute = useMemo(
    () => routes.find((r) => r.id === editingRouteId) ?? null,
    [routes, editingRouteId]
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  // Handlers for In-Scene Locus Authoring
  const openRouteInScene = (routeId: string) => {
    const target = routes.find((r) => r.id === routeId);
    setEditingRouteId(routeId);
    setSelectedLocusId(target?.loci[0]?.id ?? null);
  };

  const handleAddLocusAtPoint = (
    routeId: string,
    payload: {
      surface: string;
      label: string;
      x: number;
      y: number;
      point3d: { x: number; y: number; z: number };
      question: string;
      answer: string;
      association: string;
      confirmationState: "proposed" | "confirmed";
    }
  ) => {
    const newLocusId = `loc-${Date.now()}`;
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        const nextPos = r.loci.length + 1;
        const newLocus: WebAppLocus = {
          id: newLocusId,
          position: nextPos,
          label: payload.label,
          surface: payload.surface,
          question: payload.question,
          answer: payload.answer,
          association: payload.association,
          confirmationState: payload.confirmationState,
          x: payload.x,
          y: payload.y,
          point3d: payload.point3d,
          repetitionCount: 0,
          intervalDays: 0,
          easeFactor: 2.5,
          stability: 1.0,
          difficulty: 5.0,
          streak: 0,
          lapsesCount: 0,
          dueAt: new Date().toISOString(),
        };
        return {
          ...r,
          status: "ready",
          loci: [...r.loci, newLocus],
        };
      })
    );
    setSelectedLocusId(newLocusId);
  };

  const handleUpdateLocus = (
    routeId: string,
    locusId: string,
    patch: Partial<
      Pick<
        WebAppLocus,
        "label" | "question" | "answer" | "association" | "confirmationState" | "position"
      >
    >
  ) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          loci: r.loci.map((l) => (l.id === locusId ? { ...l, ...patch } : l)),
        };
      })
    );
  };

  const handleReorderLocus = (routeId: string, locusId: string, direction: "up" | "down") => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== routeId) return r;
        const idx = r.loci.findIndex((l) => l.id === locusId);
        if (idx === -1) return r;
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= r.loci.length) return r;
        const copy = [...r.loci];
        const temp = copy[idx];
        copy[idx] = copy[swapIdx];
        copy[swapIdx] = temp;
        const reindexed = copy.map((item, i) => ({ ...item, position: i + 1 }));
        return { ...r, loci: reindexed };
      })
    );
  };

  // Start Blind Recall Session
  const startBlindRecallSession = (routeId: string) => {
    const target = routes.find((r) => r.id === routeId);
    if (!target || target.loci.length === 0) {
      openRouteInScene(routeId);
      return;
    }
    setReviewSession({
      routeId,
      locusIndex: 0,
      userAttemptText: "",
      hintCount: 0,
      viewedAnswerBeforeAttempt: false,
      answerRevealed: false,
      algorithmVersion: "fsrs-7",
      lastResultBanner: null,
    });
  };

  // Grade Blind Recall Attempt using real server/src/srs.ts
  const submitBlindRecallGrade = (userRating: SchedulerGrade) => {
    if (!reviewSession) return;
    const route = routes.find((r) => r.id === reviewSession.routeId);
    if (!route) return;
    const locus = route.loci[reviewSession.locusIndex];
    if (!locus) return;

    const latencyMs = Math.max(800, Date.now() - sessionStartRef.current);
    const result = evaluateLocusRecall(
      locus,
      userRating,
      reviewSession.hintCount,
      reviewSession.viewedAnswerBeforeAttempt,
      reviewSession.algorithmVersion
    );

    const computedIntervalDays = Math.max(
      0.01,
      Number(((result.schedule.dueAtMs - Date.now()) / 86_400_000).toFixed(1))
    );
    const wasCorrect = result.verdict === "correct" || result.verdict === "partial";
    const wasUnassisted = result.verdict === "correct";

    const newHistoryEntry: ReviewHistoryEntry = {
      id: `rev-${Date.now()}`,
      locusId: locus.id,
      routeId: route.id,
      correct: wasCorrect,
      unassisted: wasUnassisted,
      hintCount: reviewSession.hintCount,
      viewedAnswerBeforeAttempt: reviewSession.viewedAnswerBeforeAttempt,
      responseLatencyMs: latencyMs,
      effectiveGrade: result.effectiveGrade,
      intervalDaysAfter: computedIntervalDays,
      createdAt: new Date().toISOString(),
    };
    setReviewHistory((prev) => [...prev, newHistoryEntry]);
    setNowReferenceMs(Date.now());

    // Update locus schedule and route progress
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id !== route.id) return r;
        const updatedLoci = r.loci.map((l) =>
          l.id === locus.id
            ? {
                ...l,
                repetitionCount: result.schedule.repetitions,
                intervalDays: computedIntervalDays,
                stability: result.schedule.stability ?? l.stability,
                difficulty: result.schedule.difficulty ?? l.difficulty,
                streak: result.schedule.streak,
                lapsesCount: result.schedule.lapses,
                dueAt: new Date(result.schedule.dueAtMs).toISOString(),
                lastReviewedAt: new Date().toISOString(),
                confirmationState: "confirmed" as const,
              }
            : l
        );
        const nextProgress = Math.min(
          100,
          Math.max(r.progress, Math.round(((reviewSession.locusIndex + 1) / r.loci.length) * 100))
        );
        return { ...r, loci: updatedLoci, progress: nextProgress };
      })
    );

    const guardrailNote = reviewSession.viewedAnswerBeforeAttempt
      ? " (Risposta vista prima del tentativo: voto limitato a 'Again', non accreditato come recupero autonomo)"
      : reviewSession.hintCount > 0
        ? ` (${reviewSession.hintCount} indizi usati: voto massimo limitato a '${result.effectiveGrade}')`
        : " (Recupero autonomo verificato!)";

    if (reviewSession.locusIndex + 1 < route.loci.length) {
      setReviewSession({
        ...reviewSession,
        locusIndex: reviewSession.locusIndex + 1,
        userAttemptText: "",
        hintCount: 0,
        viewedAnswerBeforeAttempt: false,
        answerRevealed: false,
        lastResultBanner: `Locus #${locus.position} aggiornato (${reviewSession.algorithmVersion.toUpperCase()}): prossimo ripasso tra ${computedIntervalDays.toFixed(1)} giorni${guardrailNote}.`,
      });
    } else {
      setReviewSession(null);
    }
  };

  // Export GDPR JSON (/v1/me/export format)
  const handleGdprExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      schemaVersion: "loco-gdpr-export-v2",
      profile: {
        nickname: profileForm.nickname,
        email: profileForm.email,
        location: profileForm.location,
        plan: "POCO LOCO",
      },
      routes,
      reviewHistory,
      metrics,
      interventions: activeInterventions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loco-gdpr-export-${profileForm.nickname}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setProfileSavedToast("Esportazione GDPR JSON completata con successo!");
  };

  // MAPPETE Wizard Save Handler
  const handleFinishMappeteWizard = (asDraft: boolean) => {
    const newId = `route-${Date.now()}`;
    const generatedLoci: WebAppLocus[] = mappeteModal.pins.map((p, idx) => ({
      id: `${newId}-loc-${idx + 1}`,
      position: idx + 1,
      label: p.label,
      surface: p.label,
      question: p.question,
      answer: p.answer,
      association: `Immagine vivida ancorata a ${p.label}`,
      confirmationState: "confirmed",
      x: p.x,
      y: p.y,
      point3d: {
        x: Number((((p.x - 50) / 50) * 2.8).toFixed(2)),
        y: 1.2,
        z: Number((((p.y - 50) / 50) * 3.2).toFixed(2)),
      },
      repetitionCount: 0,
      intervalDays: 0,
      easeFactor: 2.5,
      stability: 1.0,
      difficulty: 5.0,
      streak: 0,
      lapsesCount: 0,
      dueAt: new Date().toISOString(),
    }));

    const newRoute: WebAppRoute = {
      id: newId,
      title: mappeteModal.title.trim() || `Percorso ${routes.length + 1}`,
      description:
        mappeteModal.description.trim() ||
        `Percorso mnemonico creato su ${mappeteModal.locationQuery}`,
      topic: mappeteModal.topic || "CHIMICA",
      environment: mappeteModal.environment,
      status: asDraft ? "draft" : "ready",
      progress: asDraft ? 10 : 25,
      thumbnail:
        mappeteModal.environment === "3D SCAN"
          ? "/assets/figma-curated/route-thumb-scan.webp"
          : "/assets/figma-curated/route-thumb-streetview.webp",
      locationLabel: mappeteModal.locationQuery || "Politecnico di Torino",
      sceneVersion: 1,
      loci: generatedLoci,
    };

    setRoutes((prev) => [newRoute, ...prev]);

    if (asDraft) {
      setMappeteModal((prev) => ({
        ...prev,
        open: false,
        confirmExitDraft: false,
      }));
      setActiveTab("recappete");
      setShowDraftsOnly(true);
    } else {
      setMappeteModal((prev) => ({
        ...prev,
        step: "fine",
        createdRouteId: newId,
      }));
    }
  };

  const totalConfirmedLoci = useMemo(
    () =>
      routes.reduce(
        (acc, r) => acc + r.loci.filter((l) => l.confirmationState === "confirmed").length,
        0
      ),
    [routes]
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#181818] flex flex-col md:flex-row">
      {/* LEFT SIDEBAR (Exact 77px Lavender #D0C4F6 bar from Figma Desktop Screens) */}
      <aside
        aria-label="Menu principale LOCO"
        className="
          z-30 flex w-full items-center justify-between bg-[#D0C4F6] px-4 py-2.5
          md:sticky md:top-0 md:h-screen md:w-[77px] md:shrink-0 md:flex-col md:justify-between md:px-0 md:py-6
        "
      >
        {/* Top LO/CO Logo */}
        <div className="flex items-center gap-3 md:flex-col">
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("home");
            }}
            title="LOCO Home"
            className="transition hover:opacity-85"
          >
            <img
              src="/assets/figma-curated/logo-loco.svg"
              alt="LOCO"
              className="h-9 w-auto md:h-11"
            />
          </button>
        </div>

        {/* Center Navigation Icons (Home, Recappete, Big + Create, Corsi, Profilo) */}
        <nav className="flex items-center gap-3 md:flex-col md:gap-5">
          {/* Home */}
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("home");
            }}
            title="Home"
            aria-label="Home"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              activeTab === "home" && !editingRouteId
                ? "bg-[#FFD014] ring-2 ring-[#181818]/15"
                : "bg-[#613BE0] hover:opacity-90"
            }`}
          >
            <img
              src="/assets/figma-curated/icon-nav-home.svg"
              alt=""
              className={`h-9 w-9 ${activeTab === "home" && !editingRouteId ? "brightness-95" : ""}`}
            />
          </button>

          {/* Recappete */}
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("recappete");
            }}
            title="Recappete (I tuoi percorsi)"
            aria-label="Recappete"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-90"
          >
            <img
              src={
                activeTab === "recappete"
                  ? "/assets/figma-curated/icon-nav-recap-active.svg"
                  : "/assets/figma-curated/icon-nav-recap.svg"
              }
              alt=""
              className="h-9 w-9"
            />
          </button>

          {/* Center MAPPETE + Button inside White Cutout Circle (exact Figma 75px white circle + 61px purple circle) */}
          <div className="
            relative flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white shadow-sm
            md:my-2 md:h-[72px] md:w-[72px] md:translate-x-2
          ">
            <button
              type="button"
              onClick={() =>
                setMappeteModal((prev) => ({
                  ...prev,
                  open: true,
                  step: "intro",
                  confirmExitDraft: false,
                  createdRouteId: null,
                }))
              }
              title="Mappete: Crea nuovo percorso"
              aria-label="Crea nuovo percorso"
              className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#613BE0] text-white transition hover:scale-105 md:h-[60px] md:w-[60px]"
            >
              <img
                src="/assets/figma-curated/icon-nav-create.svg"
                alt=""
                className="h-full w-full"
              />
            </button>
          </div>

          {/* Corsi */}
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("corsi");
            }}
            title="Corsi & Palestra Mnemonica"
            aria-label="Corsi"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-90"
          >
            <img
              src={
                activeTab === "corsi"
                  ? "/assets/figma-curated/icon-nav-courses-active.svg"
                  : "/assets/figma-curated/icon-nav-courses.svg"
              }
              alt=""
              className="h-9 w-9"
            />
          </button>

          {/* Profilo */}
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("profilo");
            }}
            title="Il mio profilo & 18 Metriche"
            aria-label="Profilo"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              activeTab === "profilo" ? "ring-2 ring-[#FFD014]" : "hover:opacity-90"
            }`}
          >
            <img
              src="/assets/figma-curated/icon-nav-profile.svg"
              alt=""
              className="h-9 w-9"
            />
          </button>
        </nav>

        {/* Bottom Notification Bell (opens Adaptive Coach / Metrics in Profilo) */}
        <div className="flex items-center gap-2 md:flex-col">
          <button
            type="button"
            onClick={() => {
              setEditingRouteId(null);
              setSelectedCourseId(null);
              setActiveTab("profilo");
              setProfileSubTab("metriche");
            }}
            title="Notifiche & Interventi Adattivi"
            aria-label="Notifiche"
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:opacity-90"
          >
            <img src="/assets/figma-curated/icon-nav-bell.svg" alt="" className="h-9 w-9" />
            {activeInterventions.filter((i) => i.status === "proposed").length > 0 && (
              <span className="
                absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center
                rounded-full bg-[#FFD014] text-[10px] font-bold text-[#181818] ring-1 ring-[#181818]
              ">
                {activeInterventions.filter((i) => i.status === "proposed").length}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-5 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-[1160px]">
          {/* If an In-Scene 3D / Street-View Route is open, render the Environment-First Viewer */}
          {editingRoute ? (
            <Room3DViewer
              route={editingRoute}
              selectedLocusId={selectedLocusId}
              onSelectLocus={(id) => setSelectedLocusId(id)}
              onAddLocusAtPoint={(payload) => handleAddLocusAtPoint(editingRoute.id, payload)}
              onUpdateLocus={(locId, patch) =>
                handleUpdateLocus(editingRoute.id, locId, patch)
              }
              onReorderLocus={(locId, dir) => handleReorderLocus(editingRoute.id, locId, dir)}
              onStartBlindRecall={() => startBlindRecallSession(editingRoute.id)}
              onBack={() => setEditingRouteId(null)}
            />
          ) : activeTab === "home" ? (
            /* ============================================================
               SCREEN 1: HOME (Exact Figma Home.png 2-Column Layout)
               ============================================================ */
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Left Column (I tuoi percorsi + Banner Crea + I tuoi corsi) */}
              <div className="flex flex-col justify-between gap-8 lg:col-span-7 lg:border-r lg:border-[#181818] lg:pr-9">
                {/* I tuoi percorsi */}
                <section>
                  <div className="mb-5 flex items-center justify-between">
                    <h1 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                      I tuoi percorsi
                    </h1>
                    <button
                      type="button"
                      onClick={() => setActiveTab("recappete")}
                      className="text-xs font-bold text-[#613BE0] hover:underline"
                    >
                      Vedi tutti ({readyRoutes.length}) →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                    {readyRoutes.slice(0, 4).map((route) => (
                      <div
                        key={route.id}
                        onClick={() => openRouteInScene(route.id)}
                        className="group flex cursor-pointer items-center justify-between gap-4 rounded-[20px] p-2 transition hover:bg-[#D0C4F6]/25"
                      >
                        <div className="min-w-0">
                          <h2 className="loco-display truncate text-[20px] font-bold text-[#181818] group-hover:text-[#613BE0]">
                            {route.title}
                          </h2>
                          <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-[#181818]/80">
                            {route.description}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase text-[#613BE0]">
                              {route.environment} • {route.loci.length} loci
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startBlindRecallSession(route.id);
                              }}
                              className="rounded-full bg-[#613BE0] px-2.5 py-0.5 text-[11px] font-bold text-white hover:opacity-90"
                            >
                              ▷ Ripassa
                            </button>
                          </div>
                        </div>
                        <CircularProgress percent={route.progress} size={68} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Lavender CTA Card with Desk Illustration (Exact Figma Home.png center-left banner) */}
                <section className="relative mt-2 flex flex-col justify-between rounded-[15px] bg-[#D0C4F6] p-6 sm:flex-row sm:items-center">
                  <div className="z-10 max-w-[290px]">
                    <p className="text-[16px] leading-snug text-[#181818]">
                      Non trovi quello che ti serve?
                      <br />
                      Crea un nuovo percorso per memorizzare!
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal((prev) => ({
                          ...prev,
                          open: true,
                          step: "intro",
                          confirmExitDraft: false,
                        }))
                      }
                      className="mt-4 rounded-[15px] bg-[#613BE0] px-7 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                    >
                      Crea percorsi
                    </button>
                  </div>
                  <img
                    src="/assets/figma-curated/illustration-home-desk.svg"
                    alt=""
                    className="mt-4 h-[135px] w-auto self-end sm:-my-5 sm:mt-0 sm:h-[155px]"
                  />
                </section>

                {/* I tuoi corsi */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                      I tuoi corsi
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("corsi")}
                      className="text-xs font-bold text-[#613BE0] hover:underline"
                    >
                      Vai ai corsi e palestra →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    {courses.map((course) => {
                      const doneCount = course.lessons.filter((l) => l.completed).length;
                      return (
                        <div
                          key={course.id}
                          onClick={() => {
                            setActiveTab("corsi");
                            setCoursesSubView("corsi");
                            setSelectedCourseId(course.id);
                          }}
                          className="cursor-pointer rounded-[18px] p-2 transition hover:bg-[#D0C4F6]/25"
                        >
                          <p className="text-[16px] text-[#181818]">{course.numberLabel}</p>
                          <h3 className="loco-display text-[20px] font-bold leading-tight text-[#181818]">
                            {course.title}
                          </h3>
                          <div className="mt-3 flex items-center gap-3">
                            {course.lessons.map((lesson) => (
                              <span
                                key={lesson.id}
                                className={`h-[30px] w-[30px] rounded-full border border-[#613BE0] ${
                                  lesson.completed ? "bg-[#FFD014]" : "bg-white"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-2.5 text-[14px] text-[#181818]">
                            Lezioni svolte &nbsp; <strong>{doneCount}/3</strong>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Right Column (Bentornata Vanessa! + Risorse usate + Il tuo piano) */}
              <div className="flex flex-col justify-between gap-7 lg:col-span-5">
                {/* Bentornata Vanessa! */}
                <section className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="loco-display text-[36px] font-bold leading-[1.05] text-[#181818]">
                      Bentornata
                      <br />
                      {profileForm.firstName}!
                    </h2>
                    <p className="mt-2 text-[16px] text-[#181818]">{profileForm.nickname}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("profilo");
                          setProfileSubTab("metriche");
                        }}
                        className="rounded-full bg-[#D0C4F6] px-3 py-1 text-xs font-bold text-[#613BE0] hover:bg-[#613BE0] hover:text-white"
                      >
                        Memoria Spaziale:{" "}
                        {metrics.spatial_memory?.rawValue !== null &&
                        metrics.spatial_memory?.rawValue !== undefined
                          ? `${Math.round(metrics.spatial_memory.rawValue * 100)}%`
                          : "—"}
                      </button>
                    </div>
                  </div>
                  <img
                    src="/assets/figma-curated/avatar-goose-beanie.webp"
                    alt="Avatar Vanessa"
                    className="h-[145px] w-[145px] shrink-0 rounded-full object-cover"
                  />
                </section>

                {/* Risorse usate */}
                <section>
                  <h3 className="loco-display mb-3 text-[24px] font-bold text-[#181818]">
                    Risorse usate
                  </h3>
                  <div className="grid grid-cols-3 gap-3.5">
                    {/* Track salvati */}
                    <div className="flex flex-col justify-between rounded-[15px] bg-[#D0C4F6] p-3.5 text-center">
                      <span className="text-[15px] font-medium text-[#181818]">Track salvati</span>
                      <span className="loco-display my-2 text-[34px] font-bold leading-none text-[#181818]">
                        {
                          routes.filter(
                            (r) => r.environment === "STREET VIEW" && r.status === "ready"
                          ).length
                        }
                        \5
                      </span>
                      <div className="h-[18px] w-full overflow-hidden rounded-full bg-white p-0.5">
                        <div className="flex h-full w-[45%] items-center justify-center rounded-full bg-[#FFD014] text-[10px] font-bold text-[#181818]">
                          40%
                        </div>
                      </div>
                    </div>

                    {/* Scan stanze */}
                    <div className="flex flex-col justify-between rounded-[15px] bg-[#D0C4F6] p-3.5 text-center">
                      <span className="text-[15px] font-medium text-[#181818]">Scan stanze</span>
                      <span className="loco-display my-2 text-[34px] font-bold leading-none text-[#181818]">
                        {
                          routes.filter(
                            (r) => r.environment === "3D SCAN" && r.status === "ready"
                          ).length
                        }
                        \5
                      </span>
                      <div className="h-[18px] w-full overflow-hidden rounded-full bg-white p-0.5">
                        <div className="flex h-full w-[45%] items-center justify-center rounded-full bg-[#FFD014] text-[10px] font-bold text-[#181818]">
                          40%
                        </div>
                      </div>
                    </div>

                    {/* Loci inseriti */}
                    <div className="flex flex-col justify-between rounded-[15px] bg-[#D0C4F6] p-3.5 text-center">
                      <span className="text-[15px] font-medium text-[#181818]">Loci inseriti</span>
                      <span className="loco-display my-2 text-[32px] font-bold leading-none text-[#181818]">
                        molti
                      </span>
                      <span className="text-xs font-bold text-[#613BE0]">
                        ({totalConfirmedLoci} attivi)
                      </span>
                    </div>
                  </div>
                </section>

                {/* Il tuo piano */}
                <section>
                  <h3 className="loco-display mb-3 text-[24px] font-bold text-[#181818]">
                    Il tuo piano
                  </h3>
                  <div className="relative flex items-center justify-between overflow-hidden rounded-[15px] bg-[#D0C4F6] p-5">
                    <div className="z-10">
                      <h4 className="loco-display text-[24px] font-bold text-[#181818]">
                        POCO LOCO
                      </h4>
                      <p className="mt-1 max-w-[180px] text-[15px] leading-snug text-[#181818]">
                        Scopri gli altri abbonamenti!
                      </p>
                      <Link
                        href="/prezzi"
                        className="mt-4 inline-block rounded-[15px] bg-[#613BE0] px-6 py-2 text-[15px] font-bold text-white transition hover:opacity-95"
                      >
                        Cambia piano
                      </Link>
                    </div>
                    <img
                      src="/assets/figma-curated/illustration-plan-poco-loco.svg"
                      alt="Piano Poco Loco"
                      className="h-[150px] w-auto object-contain"
                    />
                  </div>
                </section>
              </div>
            </div>
          ) : activeTab === "recappete" ? (
            /* ============================================================
               SCREEN 2: RECAPPETE (Exact Figma Reccapete.png Layout)
               ============================================================ */
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                  Recappete
                </h1>
                <p className="mt-2 max-w-[520px] text-[16px] leading-snug text-[#181818]">
                  Cerca tra i tuoi percorsi creati e ripassa i tuoi contenuti utilizzando le
                  tecniche mnemoniche acquisite nei corsi.
                </p>
              </div>

              {/* Search Bar + Filter + Bozze ( 1 ) */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative flex w-full max-w-[410px] items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Inserisci parole chiave"
                      className="h-[36px] w-full rounded-[15px] border border-[#613BE0] bg-white pl-4 pr-12 text-[15px] text-[#181818] outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Cerca"
                      className="absolute right-0 top-0 flex h-[36px] w-[42px] items-center justify-center rounded-[15px] bg-[#613BE0] text-white"
                    >
                      🔍
                    </button>
                  </div>

                  {/* Filter pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(["ALL", "DUE", "3D SCAN", "STREET VIEW"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setEnvFilter(f)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                          envFilter === f
                            ? "bg-[#613BE0] text-white"
                            : "bg-[#D0C4F6]/60 text-[#181818] hover:bg-[#D0C4F6]"
                        }`}
                      >
                        {f === "ALL"
                          ? "Tutti"
                          : f === "DUE"
                            ? "Da ripassare ora (SRS)"
                            : f}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDraftsOnly((v) => !v)}
                  className={`rounded-[15px] px-6 py-1.5 text-[16px] font-bold transition ${
                    showDraftsOnly
                      ? "bg-[#FFD014] text-[#181818] ring-2 ring-[#181818]"
                      : "bg-[#613BE0] text-white hover:opacity-95"
                  }`}
                >
                  Bozze ( {draftRoutes.length} )
                </button>
              </div>

              {/* Routes List (Lavender Horizontal Cards + Outside Right Progress Ring) */}
              <div className="mt-2 flex flex-col gap-5">
                {filteredRecapRoutes.length === 0 ? (
                  <div className="rounded-[25px] bg-[#D0C4F6]/50 p-8 text-center">
                    <p className="loco-display text-2xl font-bold text-[#181818]">
                      Nessun percorso trovato con questi filtri.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowDraftsOnly(false);
                        setEnvFilter("ALL");
                      }}
                      className="mt-3 rounded-full bg-[#613BE0] px-5 py-2 text-xs font-bold text-white"
                    >
                      Mostra tutti i percorsi
                    </button>
                  </div>
                ) : (
                  filteredRecapRoutes.map((route) => {
                    const dueCount = route.loci.filter(
                      (l) => new Date(l.dueAt).getTime() <= nowReferenceMs
                    ).length;
                    return (
                      <div
                        key={route.id}
                        className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center"
                      >
                        {/* Lavender Card */}
                        <div className="
                          flex flex-1 flex-col justify-between gap-4 rounded-[25px] bg-[#D0C4F6] p-4
                          sm:flex-row sm:items-center sm:pr-6
                        ">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <img
                              src={route.thumbnail}
                              alt={route.title}
                              onClick={() => openRouteInScene(route.id)}
                              className="h-[115px] w-full cursor-pointer rounded-[15px] object-cover sm:w-[210px]"
                            />
                            <div className="flex flex-col justify-between">
                              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
                                <h2
                                  onClick={() => openRouteInScene(route.id)}
                                  className="loco-display cursor-pointer text-[24px] font-bold leading-none text-[#181818] hover:text-[#613BE0]"
                                >
                                  {route.title}
                                </h2>
                                <span className="text-[14px] font-bold uppercase text-[#181818]">
                                  {route.environment}
                                </span>
                                <span className="text-[14px] font-bold text-[#181818]">
                                  {route.loci.length} loci
                                </span>
                                {dueCount > 0 && (
                                  <span className="rounded-full bg-[#FFD014] px-2.5 py-0.5 text-xs font-bold text-[#181818]">
                                    {dueCount} da ripassare
                                  </span>
                                )}
                              </div>
                              <p className="mt-2 max-w-[440px] text-[15px] leading-snug text-[#181818]/85">
                                {route.description}
                              </p>
                              <span className="mt-2 text-[14px] font-bold uppercase text-[#181818]">
                                {route.topic}
                              </span>
                            </div>
                          </div>

                          {/* Right Actions inside Lavender Card: Pencil (In-Scene Editor) + Ripassa (Blind Recall) */}
                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => openRouteInScene(route.id)}
                              title="Apri ambiente 3D / Mappa e modifica Loci in scena"
                              aria-label={`Modifica ${route.title} in scena`}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#613BE0] text-white transition hover:scale-105"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => startBlindRecallSession(route.id)}
                              className="inline-flex items-center gap-2 rounded-[15px] bg-[#613BE0] px-5 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                            >
                              <span>▷</span> {route.status === "draft" ? "Completa" : "Ripassa"}
                            </button>
                          </div>
                        </div>

                        {/* Outside Circular Progress Ring on the Right */}
                        <div className="hidden lg:flex lg:pl-2">
                          <CircularProgress percent={route.progress} size={68} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === "corsi" ? (
            /* ============================================================
               SCREEN 3 & 4: CORSI, CORSO SINGOLO + PALESTRA & ARENA V2
               ============================================================ */
            <div className="flex flex-col gap-6">
              {/* Sub-navigation bar to keep Figma Corsi untouched while adapting Palestra & Arena */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  {selectedCourse && coursesSubView === "corsi" ? (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedCourseId(null)}
                        aria-label="Torna ai corsi"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#613BE0] text-white"
                      >
                        ←
                      </button>
                      <h1 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                        {selectedCourse.numberLabel}: {selectedCourse.title}
                      </h1>
                    </div>
                  ) : (
                    <>
                      <h1 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                        Corsi
                      </h1>
                      <p className="mt-2 max-w-[460px] text-[16px] leading-snug text-[#181818]">
                        Segui i nostri corsi per imparare nuove tecniche di memorizzazione e
                        allenare la tua mente!
                      </p>
                    </>
                  )}
                </div>

                <div className="inline-flex rounded-full bg-[#D0C4F6] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCoursesSubView("corsi");
                      setSelectedCourseId(null);
                    }}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      coursesSubView === "corsi"
                        ? "bg-[#613BE0] text-white"
                        : "text-[#181818] hover:bg-white/50"
                    }`}
                  >
                    Videocorsi (3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoursesSubView("palestra")}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      coursesSubView === "palestra"
                        ? "bg-[#613BE0] text-white"
                        : "text-[#181818] hover:bg-white/50"
                    }`}
                  >
                    Palestra Fonetica & Carte
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoursesSubView("arena")}
                    className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                      coursesSubView === "arena"
                        ? "bg-[#613BE0] text-white"
                        : "text-[#181818] hover:bg-white/50"
                    }`}
                  >
                    Arena Sfide Classificate
                  </button>
                </div>
              </div>

              {coursesSubView === "corsi" && !selectedCourse && (
                /* Exact Figma Corsi.png 3-Column View */
                <div className="mt-2 grid grid-cols-1 gap-8 md:grid-cols-3">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col justify-between rounded-[24px] p-2"
                    >
                      <div>
                        <p className="text-[16px] text-[#181818]">{course.numberLabel}</p>
                        <h2 className="loco-display text-[24px] font-bold text-[#181818]">
                          {course.title}
                        </h2>
                        <p className="mt-2 text-[16px] leading-snug text-[#181818]/85">
                          {course.description}
                        </p>
                      </div>

                      <div className="my-6 flex h-[280px] items-center justify-center">
                        <img
                          src={course.illustration}
                          alt={course.title}
                          className="max-h-full w-auto object-contain"
                        />
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => setSelectedCourseId(course.id)}
                          className="rounded-[15px] bg-[#613BE0] px-10 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                        >
                          Inizia
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {coursesSubView === "corsi" && selectedCourse && (
                /* Exact Figma `secondo livello corso - alias corso singolo.png` View */
                <div className="mt-4 grid grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-2">
                  {selectedCourse.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
                    >
                      <img
                        src={lesson.illustration}
                        alt={lesson.title}
                        className="h-[210px] w-[210px] shrink-0 object-contain"
                      />
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] text-[#181818]">{lesson.numberLabel}</span>
                          {lesson.completed && (
                            <span className="rounded-full bg-[#FFD014] px-2.5 py-0.5 text-[11px] font-bold text-[#181818]">
                              Completata
                            </span>
                          )}
                        </div>
                        <h2 className="loco-display mt-1 text-[24px] font-bold leading-tight text-[#181818]">
                          {lesson.title}
                        </h2>
                        <p className="mt-2 line-clamp-3 text-xs text-[#181818]/75">
                          {lesson.summary}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveLessonModal({
                              courseId: selectedCourse.id,
                              lessonId: lesson.id,
                            })
                          }
                          className="mt-4 rounded-[15px] bg-[#613BE0] px-7 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                        >
                          Guarda ora
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {coursesSubView === "palestra" && (
                /* Blueprint v2: Bidirectional Major System (0-9) + 52-Card Deck Trainer */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Major System Reference + Bidirectional Drill */}
                  <div className="rounded-[25px] bg-[#D0C4F6] p-6 lg:col-span-7">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="rounded-full bg-[#FFD014] px-3 py-1 text-xs font-bold text-[#181818]">
                          Corso 3 • Sistema Fonetico di Leibniz
                        </span>
                        <h2 className="loco-display mt-2 text-[28px] font-bold text-[#181818]">
                          Allenamento Bidirezionale Major System
                        </h2>
                      </div>
                      <div className="inline-flex rounded-full bg-white p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setMajorDirection("forward");
                            setMajorFeedback(null);
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            majorDirection === "forward"
                              ? "bg-[#613BE0] text-white"
                              : "text-[#181818]"
                          }`}
                        >
                          Numero → Parola (Forward)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMajorDirection("reverse");
                            setMajorFeedback(null);
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            majorDirection === "reverse"
                              ? "bg-[#613BE0] text-white"
                              : "text-[#181818]"
                          }`}
                        >
                          Parola → Numero (Reverse)
                        </button>
                      </div>
                    </div>

                    {/* Interactive Trial Box */}
                    {(() => {
                      const currentRow =
                        MAJOR_SYSTEM_TABLE[majorPromptIdx % MAJOR_SYSTEM_TABLE.length];
                      return (
                        <div className="mt-4 rounded-[20px] bg-white p-5">
                          <p className="text-xs font-bold uppercase text-[#613BE0]">
                            Stimolo ({majorDirection.toUpperCase()})
                          </p>
                          <p className="loco-display mt-1 text-2xl font-bold text-[#181818]">
                            {majorDirection === "forward"
                              ? `Quale suono consonantico o parola corrisponde alla cifra "${currentRow.digit}"?`
                              : `Quale cifra (0-9) codifica il suono "${currentRow.sounds}" (es. ${currentRow.exampleWord.split(" ")[0]})?`}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={majorInput}
                              onChange={(e) => setMajorInput(e.target.value)}
                              placeholder={
                                majorDirection === "forward"
                                  ? "Es. T, D oppure Dado"
                                  : "Inserisci cifra 0-9"
                              }
                              className="flex-1 rounded-[15px] border border-[#613BE0] px-4 py-2 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const clean = majorInput.trim().toLowerCase();
                                const isOk =
                                  majorDirection === "forward"
                                    ? currentRow.sounds
                                        .toLowerCase()
                                        .split(",")
                                        .some((s) => clean.includes(s.trim())) ||
                                      clean.includes(
                                        currentRow.exampleWord.split(" ")[0].toLowerCase()
                                      )
                                    : clean === currentRow.digit;
                                setMajorTrials((prev) => [
                                  ...prev,
                                  {
                                    direction: majorDirection,
                                    correct: isOk,
                                    latencyMs: 2600,
                                    stimulusKey: `major-${currentRow.digit}`,
                                  },
                                ]);
                                setMajorFeedback(
                                  isOk
                                    ? `✓ Corretto! ${currentRow.digit} = ${currentRow.sounds} (${currentRow.exampleWord}). Registrato nelle metriche FAR/BCR.`
                                    : `✗ Risposta attesa: ${currentRow.digit} ⇄ ${currentRow.sounds} (${currentRow.exampleWord}).`
                                );
                                setMajorInput("");
                                setMajorPromptIdx((i) => i + 1);
                              }}
                              className="rounded-[15px] bg-[#613BE0] px-6 py-2 text-sm font-bold text-white"
                            >
                              Verifica
                            </button>
                          </div>
                          {majorFeedback && (
                            <p className="mt-2 text-xs font-bold text-[#613BE0]">{majorFeedback}</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Complete 0-9 Phonetic Conversion Table */}
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      {MAJOR_SYSTEM_TABLE.map((row) => (
                        <div
                          key={row.digit}
                          className="rounded-[14px] bg-white/90 p-2.5 text-center shadow-xs"
                        >
                          <span className="loco-display text-2xl font-bold text-[#613BE0]">
                            {row.digit}
                          </span>
                          <span className="block text-xs font-bold text-[#181818]">
                            {row.sounds}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-[#181818]/70">
                            {row.exampleWord}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 52-Card Deck Speed Sequence Trainer */}
                  <div className="flex flex-col justify-between rounded-[25px] bg-[#D0C4F6] p-6 lg:col-span-5">
                    <div>
                      <span className="rounded-full bg-[#613BE0] px-3 py-1 text-xs font-bold text-white">
                        Corso 2 • Linked Method & Mazzo 52 Carte
                      </span>
                      <h2 className="loco-display mt-2 text-[28px] font-bold text-[#181818]">
                        Catena Rapida 5 Carte
                      </h2>
                      <p className="mt-1 text-sm text-[#181818]/80">
                        Concatena le 5 carte in una micro-storia paradossale (Linked Method), poi
                        nascondile e richiamale nell&apos;ordine esatto.
                      </p>

                      <div className="my-5 flex flex-wrap justify-center gap-2.5">
                        {cardSequence.map((card, i) => (
                          <div
                            key={`${card}-${i}`}
                            className="flex h-20 w-14 flex-col items-center justify-center rounded-[14px] border-2 border-[#181818] bg-white text-lg font-bold shadow-xs"
                          >
                            {cardPhase === "memorize" ? card : `?`}
                            <span className="mt-1 text-[10px] text-[#613BE0]">#{i + 1}</span>
                          </div>
                        ))}
                      </div>

                      {cardPhase === "memorize" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCardPhase("recall");
                              setCardFeedback(null);
                            }}
                            className="flex-1 rounded-[15px] bg-[#613BE0] py-2.5 text-sm font-bold text-white"
                          >
                            Nascondi e Richiama (Blind)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const pool = [
                                "A♠",
                                "2♥",
                                "3♦",
                                "4♣",
                                "5♠",
                                "6♥",
                                "7♦",
                                "8♣",
                                "9♠",
                                "10♥",
                                "J♦",
                                "Q♣",
                                "K♠",
                              ];
                              const shuffled = [...pool]
                                .sort(() => Math.random() - 0.5)
                                .slice(0, 5);
                              setCardSequence(shuffled);
                              setCardFeedback(null);
                            }}
                            className="rounded-[15px] bg-white px-4 py-2.5 text-xs font-bold text-[#181818]"
                          >
                            Mescola
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={cardRecallGuess}
                            onChange={(e) => setCardRecallGuess(e.target.value)}
                            placeholder="Scrivi le carte separate da spazio (es. A♠ 7♥ K♦ 3♣ 10♠)"
                            className="w-full rounded-[15px] border border-[#613BE0] bg-white px-3.5 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const expected = cardSequence.join(" ").toLowerCase();
                                const ok = cardRecallGuess.trim().toLowerCase() === expected;
                                setCardFeedback(
                                  ok
                                    ? "✓ Sequenza perfetta! 5/5 carte richiamate nell'ordine esatto."
                                    : `Sequenza originale: ${cardSequence.join(" ")}`
                                );
                                setCardPhase("memorize");
                                setCardRecallGuess("");
                              }}
                              className="flex-1 rounded-[15px] bg-[#613BE0] py-2 text-sm font-bold text-white"
                            >
                              Verifica Sequenza
                            </button>
                            <button
                              type="button"
                              onClick={() => setCardPhase("memorize")}
                              className="rounded-[15px] bg-white px-4 py-2 text-xs font-bold text-[#181818]"
                            >
                              Mostra
                            </button>
                          </div>
                        </div>
                      )}

                      {cardFeedback && (
                        <p className="mt-3 rounded-[12px] bg-white/90 p-2.5 text-xs font-bold text-[#613BE0]">
                          {cardFeedback}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {coursesSubView === "arena" && (
                /* Blueprint v2: Deterministic Ranked Challenges & Leaderboards */
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="flex flex-col gap-4 lg:col-span-7">
                    {challenges.map((chal) => {
                      const alreadyRanked = completedChallengeVersionIds.includes(chal.versionId);
                      return (
                        <div
                          key={chal.id}
                          className="rounded-[25px] bg-[#D0C4F6] p-6"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-[#613BE0] px-3 py-1 text-xs font-bold text-white">
                              Versione immutabile: {chal.versionId}
                            </span>
                            <span className="rounded-full bg-[#FFD014] px-3 py-1 text-xs font-bold text-[#181818]">
                              {chal.targetItems} prove • Cap {chal.timeCapMs / 1000}s
                            </span>
                          </div>
                          <h2 className="loco-display mt-2 text-[26px] font-bold text-[#181818]">
                            {chal.title}
                          </h2>
                          <p className="text-sm text-[#181818]/80">{chal.subtitle}</p>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-xs font-bold text-[#613BE0]">
                              {alreadyRanked
                                ? "✓ Tentativo classificato già registrato per questa versione"
                                : "Pronto per il tentativo ufficiale classificato"}
                            </span>
                            <button
                              type="button"
                              disabled={alreadyRanked}
                              onClick={() =>
                                setActiveChallengeRun({
                                  challengeId: chal.id,
                                  step: 0,
                                  answers: [],
                                  currentInput: "",
                                  startedAtMs: Date.now(),
                                })
                              }
                              className={`rounded-[15px] px-6 py-2 text-sm font-bold transition ${
                                alreadyRanked
                                  ? "cursor-not-allowed bg-white/60 text-[#181818]/50"
                                  : "bg-[#613BE0] text-white hover:opacity-95"
                              }`}
                            >
                              {alreadyRanked ? "Già completata" : "Avvia Sfida Classificata"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Active Challenge Runner Box */}
                    {activeChallengeRun &&
                      (() => {
                        const chal = challenges.find(
                          (c) => c.id === activeChallengeRun.challengeId
                        );
                        if (!chal) return null;
                        const promptObj = chal.prompts[activeChallengeRun.step];
                        return (
                          <div className="rounded-[25px] border-2 border-[#613BE0] bg-white p-6 shadow-md">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase text-[#613BE0]">
                                Prova {activeChallengeRun.step + 1} di {chal.prompts.length}
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveChallengeRun(null)}
                                className="text-xs font-bold text-[#181818]/60 hover:underline"
                              >
                                Annulla
                              </button>
                            </div>
                            <p className="loco-display mt-2 text-2xl font-bold text-[#181818]">
                              {promptObj.prompt}
                            </p>
                            <div className="mt-4 flex gap-2">
                              <input
                                type="text"
                                value={activeChallengeRun.currentInput}
                                onChange={(e) =>
                                  setActiveChallengeRun({
                                    ...activeChallengeRun,
                                    currentInput: e.target.value,
                                  })
                                }
                                placeholder="Risposta rapida senza indizi..."
                                className="flex-1 rounded-[15px] border border-[#613BE0] px-4 py-2 text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const nextAnswers = [
                                    ...activeChallengeRun.answers,
                                    activeChallengeRun.currentInput.trim(),
                                  ];
                                  if (activeChallengeRun.step + 1 < chal.prompts.length) {
                                    setActiveChallengeRun({
                                      ...activeChallengeRun,
                                      step: activeChallengeRun.step + 1,
                                      answers: nextAnswers,
                                      currentInput: "",
                                    });
                                  } else {
                                    // Deterministic server-equivalent score calculation
                                    const durationMs = Math.max(
                                      2000,
                                      Date.now() - activeChallengeRun.startedAtMs
                                    );
                                    const correctCount = chal.prompts.reduce((acc, p, idx) => {
                                      const ans = (nextAnswers[idx] ?? "").toLowerCase();
                                      return (
                                        acc +
                                        (ans.includes(p.expected.toLowerCase()) ? 1 : 0)
                                      );
                                    }, 0);
                                    const accuracy = correctCount / chal.prompts.length;
                                    const speedBonus = Math.max(
                                      0,
                                      Math.round((1 - durationMs / chal.timeCapMs) * 200)
                                    );
                                    const score = Math.round(accuracy * 800 + speedBonus);

                                    setChallenges((prev) =>
                                      prev.map((c) =>
                                        c.id === chal.id
                                          ? {
                                              ...c,
                                              leaderboard: [
                                                ...c.leaderboard,
                                                {
                                                  userId: "user-vanessa",
                                                  handle: profileForm.nickname,
                                                  displayName: `${profileForm.firstName} (Tu)`,
                                                  isFriend: true,
                                                  accuracy,
                                                  durationMs,
                                                  score,
                                                  submittedAt: new Date().toISOString(),
                                                },
                                              ].sort((a, b) => b.score - a.score),
                                            }
                                          : c
                                      )
                                    );
                                    setCompletedChallengeVersionIds((prev) => [
                                      ...prev,
                                      chal.versionId,
                                    ]);
                                    setActiveChallengeRun(null);
                                  }
                                }}
                                className="rounded-[15px] bg-[#613BE0] px-6 py-2 text-sm font-bold text-white"
                              >
                                {activeChallengeRun.step + 1 < chal.prompts.length
                                  ? "Avanti"
                                  : "Concludi e Classifica"}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                  </div>

                  {/* Leaderboard Column */}
                  <div className="rounded-[25px] bg-[#D0C4F6] p-6 lg:col-span-5">
                    <h2 className="loco-display text-[26px] font-bold text-[#181818]">
                      Classifica Verificata Server
                    </h2>
                    <p className="mt-1 text-xs text-[#181818]/75">
                      Ordinamento deterministico per Punteggio → Accuratezza → Latenza.
                    </p>
                    <div className="mt-4 flex flex-col gap-3">
                      {challenges[0].leaderboard.map((entry, idx) => (
                        <div
                          key={`${entry.userId}-${idx}`}
                          className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="
                              flex h-7 w-7 items-center justify-center rounded-full
                              bg-[#FFD014] text-xs font-bold text-[#181818]
                            ">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-[#181818]">
                                {entry.displayName}
                              </p>
                              <p className="text-[11px] text-[#181818]/65">
                                @{entry.handle} • Acc {(entry.accuracy * 100).toFixed(0)}% •{" "}
                                {(entry.durationMs / 1000).toFixed(1)}s
                              </p>
                            </div>
                          </div>
                          <span className="loco-display text-xl font-bold text-[#613BE0]">
                            {entry.score} pt
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "profilo" ? (
            /* ============================================================
               SCREEN 5: PROFILO (Exact Figma Profilo.png + 18 Memory Metrics)
               ============================================================ */
            <div className="flex flex-col gap-6">
              {/* Top Row: Title + Sub-Tab Switcher + Log out button */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="loco-display text-[36px] font-bold leading-none text-[#181818]">
                    Il mio profilo
                  </h1>
                  <div className="inline-flex rounded-full bg-[#D0C4F6] p-1">
                    <button
                      type="button"
                      onClick={() => setProfileSubTab("profilo")}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        profileSubTab === "profilo"
                          ? "bg-[#613BE0] text-white"
                          : "text-[#181818]"
                      }`}
                    >
                      Anagrafica & Piano
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileSubTab("metriche")}
                      className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                        profileSubTab === "metriche"
                          ? "bg-[#613BE0] text-white"
                          : "text-[#181818]"
                      }`}
                    >
                      18 Metriche Memoria & Coach ({activeInterventions.length})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleGdprExport}
                    className="rounded-[15px] border border-[#613BE0] bg-white px-4 py-2 text-xs font-bold text-[#613BE0] hover:bg-[#D0C4F6]/30"
                  >
                    Esporta Dati GDPR (.json)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="rounded-[15px] bg-[#613BE0] px-7 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                  >
                    Log out
                  </button>
                </div>
              </div>

              {profileSavedToast && (
                <div className="rounded-[15px] bg-[#FFD014] px-4 py-2 text-xs font-bold text-[#181818]">
                  {profileSavedToast}
                </div>
              )}

              {profileSubTab === "profilo" ? (
                /* Exact Figma Profilo.png 2-Column Layout */
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  {/* Left Column: Goose Avatar + 5 Pill Inputs + Modifica */}
                  <div className="flex flex-col items-center lg:col-span-5 lg:border-r lg:border-[#181818] lg:pr-9">
                    <div className="relative flex items-center justify-center gap-5">
                      <button
                        type="button"
                        onClick={() =>
                          setAvatarVariant((v) => (v === "goose" ? "beanie" : "goose"))
                        }
                        aria-label="Avatar precedente"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#613BE0] text-white"
                      >
                        ←
                      </button>
                      <img
                        src={
                          avatarVariant === "goose"
                            ? "/assets/figma-curated/avatar-goose.svg"
                            : "/assets/figma-curated/avatar-goose-beanie.webp"
                        }
                        alt="Avatar profilo"
                        className="h-[148px] w-[148px] rounded-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAvatarVariant((v) => (v === "goose" ? "beanie" : "goose"))
                        }
                        aria-label="Avatar successivo"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#613BE0] text-white"
                      >
                        →
                      </button>
                    </div>

                    <div className="mt-5 flex w-full max-w-[360px] flex-col gap-3">
                      <label className="text-[14px] text-[#181818]">
                        Nome
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, firstName: e.target.value })
                          }
                          className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                        />
                      </label>
                      <label className="text-[14px] text-[#181818]">
                        Cognome
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, lastName: e.target.value })
                          }
                          className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                        />
                      </label>
                      <label className="text-[14px] text-[#181818]">
                        Loconame (nickname)
                        <input
                          type="text"
                          value={profileForm.nickname}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, nickname: e.target.value })
                          }
                          className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                        />
                      </label>
                      <label className="text-[14px] text-[#181818]">
                        E-mail
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, email: e.target.value })
                          }
                          className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                        />
                      </label>
                      <label className="text-[14px] text-[#181818]">
                        Posizione
                        <input
                          type="text"
                          value={profileForm.location}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, location: e.target.value })
                          }
                          className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                        />
                      </label>

                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            setProfileSavedToast("Dati profilo aggiornati correttamente.")
                          }
                          className="rounded-[15px] bg-[#613BE0] px-10 py-2 text-[16px] font-bold text-white"
                        >
                          Modifica
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Il tuo piano + Indirizzo di spedizione + Dati carta di addebito */}
                  <div className="flex flex-col justify-between gap-6 lg:col-span-7">
                    <div>
                      <h2 className="loco-display mb-3 text-[24px] font-bold text-[#181818]">
                        Il tuo piano
                      </h2>
                      <div className="flex items-center justify-between rounded-[15px] bg-[#D0C4F6] p-5">
                        <div>
                          <h3 className="loco-display text-[24px] font-bold text-[#181818]">
                            POCO LOCO
                          </h3>
                          <p className="mt-1 max-w-[200px] text-[15px] text-[#181818]">
                            Scopri gli altri abbonamenti!
                          </p>
                          <Link
                            href="/prezzi"
                            className="mt-4 inline-block rounded-[15px] bg-[#613BE0] px-6 py-2 text-[15px] font-bold text-white"
                          >
                            Cambia piano
                          </Link>
                        </div>
                        <img
                          src="/assets/figma-curated/illustration-plan-poco-loco.svg"
                          alt="Poco Loco"
                          className="h-[140px] w-auto object-contain"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {/* Indirizzo di spedizione */}
                      <div className="flex flex-col gap-3">
                        <h3 className="loco-display text-[22px] font-bold text-[#181818]">
                          Indirizzo di spedizione
                        </h3>
                        <label className="text-[14px] text-[#181818]">
                          Indirizzo
                          <input
                            type="text"
                            value={profileForm.address}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, address: e.target.value })
                            }
                            className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[14px]"
                          />
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <label className="col-span-2 text-[14px] text-[#181818]">
                            Città
                            <input
                              type="text"
                              value={profileForm.city}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, city: e.target.value })
                              }
                              className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-3 text-[14px]"
                            />
                          </label>
                          <label className="text-[14px] text-[#181818]">
                            CAP
                            <input
                              type="text"
                              value={profileForm.zip}
                              onChange={(e) =>
                                setProfileForm({ ...profileForm, zip: e.target.value })
                              }
                              className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-3 text-[14px]"
                            />
                          </label>
                        </div>
                        <label className="text-[14px] text-[#181818]">
                          Stato
                          <input
                            type="text"
                            value={profileForm.country}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, country: e.target.value })
                            }
                            className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[14px]"
                          />
                        </label>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setProfileSavedToast("Indirizzo di spedizione salvato.")
                            }
                            className="mt-1 rounded-[15px] bg-[#613BE0] px-8 py-2 text-[15px] font-bold text-white"
                          >
                            Modifica
                          </button>
                        </div>
                      </div>

                      {/* Dati carta di addebito (Safe masked demo placeholder) */}
                      <div className="flex flex-col gap-3">
                        <h3 className="loco-display text-[22px] font-bold text-[#181818]">
                          Dati carta di addebito
                        </h3>
                        <label className="text-[14px] text-[#181818]">
                          Titolare della carta
                          <input
                            type="text"
                            value={profileForm.cardHolder}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, cardHolder: e.target.value })
                            }
                            className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[14px]"
                          />
                        </label>
                        <label className="text-[14px] text-[#181818]">
                          Numero della carta (Demo mascherata)
                          <input
                            type="text"
                            value={profileForm.cardMasked}
                            readOnly
                            className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] bg-[#D0C4F6]/20 px-4 text-[14px]"
                          />
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="text-[14px] text-[#181818]">
                            Data di scadenza
                            <input
                              type="text"
                              value={profileForm.cardExpiry}
                              readOnly
                              className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] bg-[#D0C4F6]/20 px-3 text-[14px]"
                            />
                          </label>
                          <label className="text-[14px] text-[#181818]">
                            CVV
                            <input
                              type="password"
                              value="•••"
                              readOnly
                              className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] bg-[#D0C4F6]/20 px-3 text-[14px]"
                            />
                          </label>
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setProfileSavedToast("Metodo di pagamento demo verificato.")
                            }
                            className="mt-1 rounded-[15px] bg-[#613BE0] px-8 py-2 text-[15px] font-bold text-white"
                          >
                            Modifica
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Blueprint v2: 18 Memory Metrics & Explainable Adaptive Recommendations */
                <div className="flex flex-col gap-6">
                  {/* Explainable Adaptive Interventions Banner */}
                  <div className="rounded-[25px] bg-[#D0C4F6] p-6">
                    <h2 className="loco-display text-[26px] font-bold text-[#181818]">
                      Coach Adattivo Spiegabile (Interventi su Evidenza Empirica)
                    </h2>
                    <p className="mt-1 text-sm text-[#181818]/80">
                      Ogni raccomandazione mostra le metriche sorgente, la dimensione del campione (
                      <code>n</code>) e il motivo didattico.
                    </p>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      {activeInterventions.map((intv) => (
                        <div
                          key={intv.id}
                          className="flex flex-col justify-between rounded-[18px] bg-white p-4 shadow-xs"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full bg-[#FFD014] px-3 py-0.5 text-xs font-bold text-[#181818]">
                                Confidenza {intv.confidenceLevel} • {intv.status.toUpperCase()}
                              </span>
                              <span className="text-xs font-bold text-[#613BE0]">
                                {intv.rationaleCode}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-bold text-[#181818]">
                              {intv.explanation}
                            </p>
                            <p className="mt-1 text-xs text-[#181818]/75">
                              Azione consigliata: <strong>{intv.recommendedAction}</strong>
                            </p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setInterventionStatuses((prev) => ({
                                  ...prev,
                                  [intv.id]: "accepted",
                                }))
                              }
                              className="rounded-full bg-[#613BE0] px-3.5 py-1 text-xs font-bold text-white"
                            >
                              Accetta
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setInterventionStatuses((prev) => ({
                                  ...prev,
                                  [intv.id]: "completed",
                                }))
                              }
                              className="rounded-full bg-[#D0C4F6] px-3.5 py-1 text-xs font-bold text-[#181818]"
                            >
                              Completato
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setInterventionStatuses((prev) => ({
                                  ...prev,
                                  [intv.id]: "dismissed",
                                }))
                              }
                              className="rounded-full border border-[#181818]/25 px-3.5 py-1 text-xs font-bold text-[#181818]/70"
                            >
                              Rifiuta
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All 18 Memory Metrics Grid */}
                  <div>
                    <h2 className="loco-display mb-3 text-[26px] font-bold text-[#181818]">
                      Le 18 Metriche della Memoria (Finestra 28 giorni • {reviewHistory.length} ripassi)
                    </h2>
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {ALL_MEMORY_METRIC_KEYS.map((key) => {
                        const snap = metrics[key];
                        const def = METRIC_DEFINITIONS[key];
                        return (
                          <div
                            key={key}
                            className="flex flex-col justify-between rounded-[20px] border border-[#613BE0]/30 bg-white p-4 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="rounded-full bg-[#D0C4F6] px-2.5 py-0.5 text-xs font-bold text-[#613BE0]">
                                  {def.dashboardSection}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                    snap.confidenceLevel === "insufficient"
                                      ? "bg-black/10 text-[#181818]/70"
                                      : "bg-[#FFD014] text-[#181818]"
                                  }`}
                                >
                                  n={snap.sampleSize} • {snap.confidenceLevel}
                                </span>
                              </div>
                              <h3 className="loco-display mt-2 text-lg font-bold text-[#181818]">
                                {def.displayName}
                              </h3>
                              <p className="mt-0.5 text-xs text-[#181818]/75">{def.description}</p>
                            </div>
                            <div className="mt-3 flex items-baseline justify-between border-t border-black/10 pt-2">
                              <span className="text-[11px] text-[#181818]/60">
                                Min n={snap.minSampleSize}
                              </span>
                              <span className="loco-display text-2xl font-bold text-[#613BE0]">
                                {snap.rawValue === null
                                  ? "Campione insuff."
                                  : def.unit === "ratio"
                                    ? `${Math.round(snap.rawValue * 100)}%`
                                    : `${snap.rawValue} ${def.unit}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ============================================================
               SCREEN 6: LOGIN (Exact Figma Login.png Layout)
               ============================================================ */
            <div className="grid min-h-[75vh] grid-cols-1 items-center gap-10 lg:grid-cols-12">
              <div className="flex justify-center lg:col-span-7">
                <img
                  src="/assets/figma-curated/illustration-login.webp"
                  alt="LOCO Login Illustration"
                  className="max-h-[470px] w-auto object-contain"
                />
              </div>
              <div className="flex flex-col items-center lg:col-span-5">
                <div className="w-full max-w-[360px]">
                  <h1 className="loco-display text-center text-[36px] font-bold text-[#181818]">
                    Log in
                  </h1>
                  <div className="mt-6 flex flex-col gap-4">
                    <label className="text-[16px] text-[#181818]">
                      Nickname
                      <input
                        type="text"
                        value={loginNickname}
                        onChange={(e) => setLoginNickname(e.target.value)}
                        className="mt-1 h-[38px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                      />
                    </label>
                    <label className="text-[16px] text-[#181818]">
                      Password
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="mt-1 h-[38px] w-full rounded-[15px] border border-[#613BE0] px-4 text-[15px]"
                      />
                    </label>
                    <p className="text-xs text-[#181818]/75">Hai dimenticato la password?</p>
                    <div className="mt-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileForm((p) => ({
                            ...p,
                            nickname: loginNickname || p.nickname,
                          }));
                          setActiveTab("home");
                        }}
                        className="rounded-[15px] bg-[#613BE0] px-12 py-2 text-[16px] font-bold text-white transition hover:opacity-95"
                      >
                        Login
                      </button>
                    </div>
                    <p className="mt-6 text-center text-[15px] text-[#181818]">
                      Nuovo su LOCO?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("home")}
                        className="font-bold text-[#613BE0] underline"
                      >
                        Registrati!
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =================================================================
          BLIND RECALL & FSRS-7 REVIEW MODAL (Core Learning Invariant)
          ================================================================= */}
      {reviewSession &&
        (() => {
          const route = routes.find((r) => r.id === reviewSession.routeId);
          const locus = route?.loci[reviewSession.locusIndex];
          if (!route || !locus) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]/65 p-4">
              <div className="relative w-full max-w-[780px] rounded-[25px] bg-white p-6 shadow-2xl md:p-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#613BE0] px-3.5 py-1 text-xs font-bold text-white">
                      Blind Recall • Locus {reviewSession.locusIndex + 1} di {route.loci.length}
                    </span>
                    <span className="rounded-full bg-[#D0C4F6] px-3 py-1 text-xs font-bold text-[#181818]">
                      Ancora: {locus.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Versione algoritmo SRS"
                      value={reviewSession.algorithmVersion}
                      onChange={(e) =>
                        setReviewSession({
                          ...reviewSession,
                          algorithmVersion: e.target.value as "fsrs-7" | "simple-v1",
                        })
                      }
                      className="rounded-full border border-[#613BE0] px-3 py-1 text-xs font-bold text-[#613BE0]"
                    >
                      <option value="fsrs-7">Scheduler FSRS-7</option>
                      <option value="simple-v1">Scheduler Simple-v1</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setReviewSession(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#613BE0] text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {reviewSession.lastResultBanner && (
                  <div className="mt-3 rounded-[14px] bg-[#D0C4F6]/60 px-4 py-2 text-xs font-bold text-[#613BE0]">
                    {reviewSession.lastResultBanner}
                  </div>
                )}

                <h2 className="loco-display mt-4 text-[28px] font-bold leading-tight text-[#181818]">
                  {locus.question}
                </h2>
                <p className="mt-1 text-xs text-[#181818]/70">
                  La risposta e l&apos;associazione rimangono nascoste finché non effettui un
                  tentativo genuino di recupero.
                </p>

                <textarea
                  rows={2}
                  value={reviewSession.userAttemptText}
                  onChange={(e) =>
                    setReviewSession({ ...reviewSession, userAttemptText: e.target.value })
                  }
                  placeholder="Scrivi o pronuncia a mente la risposta prima di svelarla..."
                  className="mt-3 w-full rounded-[15px] border border-[#613BE0] p-3 text-sm"
                />

                {/* Hint & Reveal Controls */}
                {!reviewSession.answerRevealed ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setReviewSession({
                            ...reviewSession,
                            hintCount: reviewSession.hintCount + 1,
                          })
                        }
                        className="rounded-full bg-[#D0C4F6] px-4 py-2 text-xs font-bold text-[#181818] hover:bg-[#FFD014]"
                      >
                        💡 Chiedi Indizio ({reviewSession.hintCount})
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReviewSession({
                            ...reviewSession,
                            viewedAnswerBeforeAttempt: true,
                            answerRevealed: true,
                          })
                        }
                        className="rounded-full border border-[#181818]/30 px-4 py-2 text-xs font-bold text-[#181818]/75"
                      >
                        👁️ Svela senza tentativo (Penalità Again)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setReviewSession({
                          ...reviewSession,
                          answerRevealed: true,
                        })
                      }
                      className="rounded-[15px] bg-[#613BE0] px-7 py-2.5 text-sm font-bold text-white shadow-sm"
                    >
                      Ho risposto → Verifica Nozione
                    </button>
                  </div>
                ) : null}

                {/* Progressive Hints Display */}
                {reviewSession.hintCount > 0 && !reviewSession.answerRevealed && (
                  <div className="mt-3 rounded-[15px] bg-[#FFD014]/35 p-3 text-xs font-semibold text-[#181818]">
                    {reviewSession.hintCount === 1
                      ? `Indizio 1 (Ancora & Iniziali): Superficie "${locus.surface}" — Inizia con "${locus.answer.slice(0, 14)}..."`
                      : `Indizio 2 (Immagine PAV): ${locus.association}`}
                  </div>
                )}

                {/* Answer & Association Revealed after Attempt */}
                {reviewSession.answerRevealed && (
                  <div className="mt-4 rounded-[20px] bg-[#D0C4F6] p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-[14px] bg-white p-3.5">
                        <span className="text-[11px] font-bold uppercase text-[#613BE0]">
                          Nozione Verificata (Risposta Corretta)
                        </span>
                        <p className="mt-1 text-sm font-bold text-[#181818]">{locus.answer}</p>
                      </div>
                      <div className="rounded-[14px] bg-white p-3.5">
                        <span className="text-[11px] font-bold uppercase text-[#613BE0]">
                          Associazione Immaginaria nel Locus
                        </span>
                        <p className="mt-1 text-sm text-[#181818]">{locus.association}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs font-bold text-[#181818]">
                      Valuta la qualità del tuo recupero (Guardrail SRS attivi:{" "}
                      {reviewSession.viewedAnswerBeforeAttempt
                        ? "Risposta svelata prima del tentativo → bloccato su Again"
                        : reviewSession.hintCount > 0
                          ? `${reviewSession.hintCount} indizi usati → grado massimo limitato`
                          : "Recupero autonomo completo"}
                      ):
                    </p>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                      <button
                        type="button"
                        onClick={() => submitBlindRecallGrade("again")}
                        className="rounded-[14px] bg-white py-2.5 text-xs font-bold text-[#181818] hover:bg-[#FFD014]"
                      >
                        1. Again (Dimenticato)
                      </button>
                      <button
                        type="button"
                        onClick={() => submitBlindRecallGrade("hard")}
                        className="rounded-[14px] bg-white py-2.5 text-xs font-bold text-[#181818] hover:bg-[#FFD014]"
                      >
                        2. Hard (Faticoso)
                      </button>
                      <button
                        type="button"
                        onClick={() => submitBlindRecallGrade("good")}
                        className="rounded-[14px] bg-[#613BE0] py-2.5 text-xs font-bold text-white hover:opacity-95"
                      >
                        3. Good (Corretto)
                      </button>
                      <button
                        type="button"
                        onClick={() => submitBlindRecallGrade("easy")}
                        className="rounded-[14px] bg-[#FFD014] py-2.5 text-xs font-bold text-[#181818] hover:opacity-95"
                      >
                        4. Easy (Immediato)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* =================================================================
          LESSON INTERACTIVE MODAL ("Guarda ora" from Corso Singolo)
          ================================================================= */}
      {activeLessonModal &&
        (() => {
          const course = courses.find((c) => c.id === activeLessonModal.courseId);
          const lesson = course?.lessons.find((l) => l.id === activeLessonModal.lessonId);
          if (!course || !lesson) return null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]/65 p-4">
              <div className="relative w-full max-w-[680px] rounded-[25px] bg-white p-6 shadow-2xl md:p-8">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#D0C4F6] px-3.5 py-1 text-xs font-bold text-[#613BE0]">
                    {course.numberLabel} • {lesson.numberLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveLessonModal(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#613BE0] text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
                  <img
                    src={lesson.illustration}
                    alt={lesson.title}
                    className="h-[160px] w-[160px] object-contain"
                  />
                  <div>
                    <h2 className="loco-display text-[28px] font-bold leading-tight text-[#181818]">
                      {lesson.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#181818]/85">
                      {lesson.summary}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-[18px] bg-[#D0C4F6] p-4">
                  <p className="text-xs font-bold uppercase text-[#613BE0]">
                    Laboratorio Pratico Immediato
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#181818]">{lesson.exercise}</p>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCourses((prev) =>
                        prev.map((c) =>
                          c.id === course.id
                            ? {
                                ...c,
                                lessons: c.lessons.map((l) =>
                                  l.id === lesson.id ? { ...l, completed: true } : l
                                ),
                              }
                            : c
                        )
                      );
                      setActiveLessonModal(null);
                    }}
                    className="rounded-[15px] bg-[#613BE0] px-7 py-2.5 text-sm font-bold text-white"
                  >
                    ✓ Segna lezione come completata
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* =================================================================
          MAPPETE 6-STEP ROUTE CREATION WIZARD MODAL (Exact Figma MAPPETE*.png)
          ================================================================= */}
      {mappeteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181818]/60 p-4">
          <div className="relative flex min-h-[540px] w-full max-w-[820px] flex-col justify-between overflow-hidden rounded-[20px] bg-white p-6 shadow-2xl md:p-10">
            {/* Top-right Purple X Close Button inside White Cutout Circle (Exact Figma MAPPETE) */}
            <button
              type="button"
              onClick={() => {
                if (mappeteModal.step === "fine" || mappeteModal.step === "intro") {
                  setMappeteModal((prev) => ({
                    ...prev,
                    open: false,
                    confirmExitDraft: false,
                  }));
                } else {
                  setMappeteModal((prev) => ({ ...prev, confirmExitDraft: true }));
                }
              }}
              aria-label="Chiudi creazione percorso"
              className="absolute right-4 top-4 z-20 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#613BE0] text-2xl font-bold text-white shadow-md transition hover:scale-105"
            >
              ✕
            </button>

            {/* Step 0: Intro ("Crea il tuo percorso!" — MAPPETE.png) */}
            {mappeteModal.step === "intro" && (
              <div className="my-auto flex flex-col items-center text-center">
                <h2 className="loco-display text-[36px] font-bold text-[#181818]">
                  Crea il tuo percorso!
                </h2>
                <p className="mt-2 max-w-[360px] text-[16px] text-[#181818]">
                  Quale ambiente vuoi utilizzare per memorizzare i tuoi concetti?
                </p>

                <div className="mt-8 grid w-full max-w-[540px] grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Mappa */}
                  <div className="flex flex-col items-center justify-between rounded-[15px] bg-[#D0C4F6] p-6">
                    <div>
                      <h3 className="loco-display text-[24px] font-bold text-[#181818]">Mappa</h3>
                      <p className="mt-2 text-[15px] leading-snug text-[#181818]">
                        Scegli un posto a te familiare o esplora nuovi luoghi e imposta il tuo
                        percorso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal((prev) => ({
                          ...prev,
                          environment: "STREET VIEW",
                          step: "posizione",
                        }))
                      }
                      className="mt-6 rounded-[15px] bg-[#613BE0] px-10 py-2 text-[16px] font-bold text-white"
                    >
                      Crea
                    </button>
                  </div>

                  {/* Stanza 3D */}
                  <div className="flex flex-col items-center justify-between rounded-[15px] bg-[#D0C4F6] p-6">
                    <div>
                      <h3 className="loco-display text-[24px] font-bold text-[#181818]">
                        Stanza 3D
                      </h3>
                      <p className="mt-2 text-[15px] leading-snug text-[#181818]">
                        Fai uno scan 3D di una stanza e utilizza i tuoi spazi per creare un
                        percorso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal((prev) => ({
                          ...prev,
                          environment: "3D SCAN",
                          step: "posizione",
                        }))
                      }
                      className="mt-6 rounded-[15px] bg-[#613BE0] px-8 py-2 text-[16px] font-bold text-white"
                    >
                      Scansiona
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Posizione ("Da dove vuoi partire?" — MAPPETE 1.png & MAPPETE 2.png) */}
            {mappeteModal.step === "posizione" && (
              <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="relative z-10 flex flex-col gap-3 md:col-span-5">
                  <h2 className="loco-display text-[34px] font-bold leading-tight text-[#181818]">
                    Da dove vuoi partire?
                  </h2>
                  <p className="text-[15px] leading-snug text-[#181818]">
                    Cerca il luogo in cui vuoi iniziare il tuo percorso!
                  </p>
                  <input
                    type="text"
                    value={mappeteModal.locationQuery}
                    onChange={(e) =>
                      setMappeteModal({ ...mappeteModal, locationQuery: e.target.value })
                    }
                    placeholder="Inserisci luogo (es. Politecnico di Torino)"
                    className="mt-2 h-[38px] w-full rounded-[15px] border border-[#613BE0] bg-white px-4 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    {!mappeteModal.searched ? (
                      <button
                        type="button"
                        onClick={() => setMappeteModal({ ...mappeteModal, searched: true })}
                        className="rounded-[15px] bg-[#613BE0] px-9 py-2 text-[16px] font-bold text-white"
                      >
                        Cerca
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setMappeteModal({ ...mappeteModal, step: "tracciato" })
                        }
                        className="rounded-[15px] bg-[#613BE0] px-9 py-2 text-[16px] font-bold text-white"
                      >
                        Avanti
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7">
                  <div className="relative h-[300px] w-full overflow-hidden rounded-[20px] border border-[#181818]/15">
                    <img
                      src={
                        mappeteModal.searched
                          ? "/assets/figma-curated/map-politecnico-3d.webp"
                          : "/assets/figma-curated/map-politecnico-2d.webp"
                      }
                      alt="Mappa posizione"
                      className="h-full w-full object-cover"
                    />
                    {mappeteModal.searched && (
                      <div className="absolute left-[38%] top-[36%] -translate-x-1/2 -translate-y-1/2">
                        <img
                          src="/assets/figma-curated/marker-locus-cloud.svg"
                          alt="Pin partenza"
                          className="h-12 w-12"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Tracciato ("Definisci le tue tappe!" — MAPPETE 3.png & MAPPETE 4.png) */}
            {mappeteModal.step === "tracciato" && (
              <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="flex flex-col gap-3 md:col-span-5">
                  <h2 className="loco-display text-[32px] font-bold leading-tight text-[#181818]">
                    {mappeteModal.inspectStreetPhoto
                      ? "Aggiungi un loci!"
                      : "Definisci le tue tappe!"}
                  </h2>
                  <p className="text-[15px] leading-snug text-[#181818]">
                    {mappeteModal.inspectStreetPhoto
                      ? "Scegli un posto preciso e definisci dove posizionare il tuo loci."
                      : "Imposta un punto di arrivo sulla mappa e clicca sui punti in cui vuoi inserire i loci."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal((prev) => ({
                          ...prev,
                          inspectStreetPhoto: !prev.inspectStreetPhoto,
                        }))
                      }
                      className="rounded-full bg-[#D0C4F6] px-4 py-1.5 text-xs font-bold text-[#613BE0]"
                    >
                      {mappeteModal.inspectStreetPhoto
                        ? "← Torna alla mappa del tracciato"
                        : "🔍 Ispeziona foto luogo (Ingresso)"}
                    </button>
                  </div>
                  <p className="text-xs font-bold text-[#613BE0]">
                    Loci fissati sul tracciato: {mappeteModal.pins.length}
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal({
                          ...mappeteModal,
                          inspectStreetPhoto: false,
                          step: "anagrafica",
                        })
                      }
                      className="rounded-[15px] bg-[#613BE0] px-9 py-2 text-[16px] font-bold text-white"
                    >
                      Avanti
                    </button>
                  </div>
                </div>

                <div className="md:col-span-7">
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.round(((e.clientX - rect.left) / rect.width) * 80 + 10);
                      const y = Math.round(((e.clientY - rect.top) / rect.height) * 80 + 10);
                      const nextIdx = mappeteModal.pins.length + 1;
                      setMappeteModal((prev) => ({
                        ...prev,
                        pins: [
                          ...prev.pins,
                          {
                            x,
                            y,
                            label: `Locus ${nextIdx} (${prev.locationQuery})`,
                            question: `Qual è il concetto #${nextIdx} ancorato qui?`,
                            answer: `Concetto verificato #${nextIdx}.`,
                          },
                        ],
                      }));
                    }}
                    className="relative h-[300px] w-full cursor-crosshair overflow-hidden rounded-[20px] border border-[#181818]/15"
                  >
                    <img
                      src={
                        mappeteModal.inspectStreetPhoto
                          ? "/assets/figma-curated/photo-politecnico-ingresso.webp"
                          : "/assets/figma-curated/map-politecnico-3d.webp"
                      }
                      alt="Tracciato Loci"
                      className="h-full w-full object-cover"
                    />
                    {mappeteModal.pins.map((p, idx) => (
                      <div
                        key={`${p.x}-${p.y}-${idx}`}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                      >
                        <img
                          src="/assets/figma-curated/marker-locus-cloud.svg"
                          alt=""
                          className="h-11 w-11 drop-shadow"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Anagrafica ("Personalizza il tuo percorso!" — MAPPETE 5.png) */}
            {mappeteModal.step === "anagrafica" && (
              <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="flex flex-col items-center md:col-span-5">
                  <h2 className="loco-display mb-4 text-[30px] font-bold leading-tight text-[#181818]">
                    Personalizza il tuo percorso!
                  </h2>
                  <div className="w-full max-w-[230px] rounded-[20px] bg-[#D0C4F6] p-3.5 text-center">
                    <span className="loco-display text-lg font-bold text-[#181818]">
                      {mappeteModal.title || `${routes.length + 1}° percorso`}
                    </span>
                    <img
                      src="/assets/figma-curated/map-politecnico-3d.webp"
                      alt=""
                      className="my-2.5 h-[120px] w-full rounded-[14px] object-cover"
                    />
                    <div className="flex justify-around text-xs font-bold text-[#181818]">
                      <span>{mappeteModal.environment}</span>
                      <span>{mappeteModal.pins.length} loci</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:col-span-7">
                  <label className="text-sm text-[#181818]">
                    Nome del percorso
                    <input
                      type="text"
                      value={mappeteModal.title}
                      onChange={(e) =>
                        setMappeteModal({ ...mappeteModal, title: e.target.value })
                      }
                      placeholder="Es. Tavola periodica / Diritto Privato"
                      className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] px-4 text-sm"
                    />
                  </label>
                  <label className="text-sm text-[#181818]">
                    Descrizione del percorso
                    <textarea
                      rows={2}
                      value={mappeteModal.description}
                      onChange={(e) =>
                        setMappeteModal({ ...mappeteModal, description: e.target.value })
                      }
                      placeholder="Sintesi dei concetti da memorizzare..."
                      className="mt-1 w-full rounded-[15px] border border-[#613BE0] p-3 text-sm"
                    />
                  </label>
                  <label className="text-sm text-[#181818]">
                    Argomento
                    <select
                      value={mappeteModal.topic}
                      onChange={(e) =>
                        setMappeteModal({ ...mappeteModal, topic: e.target.value })
                      }
                      className="mt-1 h-[36px] w-full rounded-[15px] border border-[#613BE0] bg-white px-4 text-sm font-bold"
                    >
                      <option value="CHIMICA">CHIMICA</option>
                      <option value="DISCORSO">DISCORSO</option>
                      <option value="STORIA">STORIA</option>
                      <option value="CAPITALI">CAPITALI</option>
                      <option value="LISTA SPESA">LISTA SPESA</option>
                    </select>
                  </label>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleFinishMappeteWizard(false)}
                      className="rounded-[15px] bg-[#613BE0] px-10 py-2 text-[16px] font-bold text-white"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Fine ("Percorso salvato!" — MAPPETE 6.png) */}
            {mappeteModal.step === "fine" && (
              <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-12">
                <div className="flex flex-col items-start gap-3 md:col-span-6">
                  <h2 className="loco-display text-[36px] font-bold text-[#181818]">
                    Percorso salvato!
                  </h2>
                  <p className="text-[16px] leading-snug text-[#181818]">
                    Adesso sei pronto per inserire i tuoi concetti all&apos;interno dei loci
                    stabiliti e iniziare a memorizzare!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = mappeteModal.createdRouteId ?? routes[0].id;
                      setMappeteModal((prev) => ({
                        ...prev,
                        open: false,
                        confirmExitDraft: false,
                      }));
                      openRouteInScene(targetId);
                    }}
                    className="mt-4 rounded-[15px] bg-[#613BE0] px-8 py-2.5 text-[16px] font-bold text-white"
                  >
                    Inizia l&apos;esperienza
                  </button>
                </div>
                <div className="flex justify-center md:col-span-6">
                  <img
                    src="/assets/figma-curated/illustration-finish-runner.svg"
                    alt="Percorso salvato"
                    className="max-h-[260px] w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Bottom 4-Step Progress Bar (Posizione — Tracciato — Anagrafica — Fine) */}
            {mappeteModal.step !== "intro" && (
              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
                {(
                  [
                    { key: "posizione", label: "Posizione" },
                    { key: "tracciato", label: "Tracciato" },
                    { key: "anagrafica", label: "Anagrafica" },
                    { key: "fine", label: "Fine" },
                  ] as const
                ).map((item, idx) => {
                  const order = ["posizione", "tracciato", "anagrafica", "fine"];
                  const currentIdx = order.indexOf(mappeteModal.step);
                  const isCurrent = item.key === mappeteModal.step;
                  const isDone = idx <= currentIdx;
                  return (
                    <div key={item.key} className="flex flex-1 flex-col items-center">
                      <span className="mb-1.5 text-xs font-bold text-[#181818]">{item.label}</span>
                      <div className="flex w-full items-center justify-center">
                        <span
                          className={`h-6 w-6 rounded-full border-4 ${
                            isCurrent
                              ? "border-[#FFD014] bg-[#613BE0]"
                              : isDone
                                ? "border-[#613BE0] bg-[#613BE0]"
                                : "border-[#D0C4F6] bg-[#D0C4F6]"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Nested Draft Save Confirmation Dialog (Exact Figma MAPPETE-1.png / MAPPETE-2.png) */}
            {mappeteModal.confirmExitDraft && (
              <div className="
                absolute inset-0 z-30 flex items-center justify-center
                bg-[#181818]/55 p-4 backdrop-blur-[1px]
              ">
                <div className="w-full max-w-[430px] rounded-[20px] bg-white p-7 text-center shadow-2xl">
                  <h3 className="loco-display text-[24px] font-bold leading-tight text-[#181818]">
                    Vuoi salvare il tuo percorso
                    <br />
                    nelle bozze?
                  </h3>
                  <p className="mt-3 text-[15px] leading-snug text-[#181818]/85">
                    Se esci adesso non perderai le modifiche che hai effettuato e potrai riprendere
                    in un secondo momento!
                  </p>
                  <div className="mt-6 flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleFinishMappeteWizard(true)}
                      className="rounded-[15px] bg-[#613BE0] px-8 py-2 text-[16px] font-bold text-white"
                    >
                      Salva
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMappeteModal((prev) => ({
                          ...prev,
                          open: false,
                          confirmExitDraft: false,
                        }))
                      }
                      className="rounded-[15px] bg-[#613BE0] px-8 py-2 text-[16px] font-bold text-white"
                    >
                      Esci
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
