import rawCurriculumV5 from "./loco-academy-v5-curriculum.json" with { type: "json" };
import {
  ACADEMY_V5_MISSIONS,
  ACADEMY_V5_SCHEMA_VERSION,
  ERROR_DIAGNOSIS_CATALOG,
  MAJOR_IT_V1_VERIFIED_LEXICON_V2,
  RAW_PLAYER_CONTENT_V2,
  FLAGSHIP_FIXTURES_V5,
  encodeItalianWordToMajorDigitsV2,
  normalizeAnswerToken,
  evaluateMemoryExperimentF01,
  evaluateChainRepairA03,
  evaluateFloorplanRouteP02,
  evaluateCustomLociP03,
  evaluateItalianMajorPhonemeN03,
  evaluateMnemonicBudgetS03,
  evaluateFaceNameE01,
  evaluateOrderedCardsC03,
  type AssessmentMode,
  type AttemptEvidence,
  type ErrorDiagnosisCategory,
  type LessonGradingReliability,
  type V2LessonMissionSpec,
  type VerificationAuthority,
} from "./loco-academy-engine-v5.ts";

// Compatibility aliases
export const ACADEMY_V2_MISSIONS = ACADEMY_V5_MISSIONS;
export const ACADEMY_V2_SCHEMA_VERSION = ACADEMY_V5_SCHEMA_VERSION;

export {
  ACADEMY_V5_MISSIONS,
  ACADEMY_V5_SCHEMA_VERSION,
  ERROR_DIAGNOSIS_CATALOG,
  RAW_PLAYER_CONTENT_V2,
  FLAGSHIP_FIXTURES_V5,
  normalizeAnswerToken,
  evaluateMemoryExperimentF01,
  evaluateChainRepairA03,
  evaluateFloorplanRouteP02,
  evaluateCustomLociP03,
  evaluateItalianMajorPhonemeN03,
  evaluateMnemonicBudgetS03,
  evaluateFaceNameE01,
  evaluateOrderedCardsC03,
  type AssessmentMode,
  type AttemptEvidence,
  type ErrorDiagnosisCategory,
  type LessonGradingReliability,
  type V2LessonMissionSpec,
  type VerificationAuthority,
};

export type LessonTier = "free" | "plus" | "pro";

export type LessonStatus =
  | "available"
  | "reading"
  | "practice_done"
  | "provisionally_passed"
  | "mastered_after_delay"
  | "needs_review";

export type PathNodeVisualState =
  | "completed"
  | "available"
  | "in_progress"
  | "locked"
  | "premium"
  | "needs_review"
  | "checkpoint";

export type AcademyTheme =
  | "onboarding"
  | "loci"
  | "linked"
  | "numbers"
  | "study"
  | "real-life"
  | "palaces-advanced"
  | "training"
  | "ai-studio";

export type RuntimeExerciseKind =
  | "s01-recognition-recall-switch"
  | "s02-target-question-builder"
  | "s03-five-locus-scene-builder"
  | "s04-action-association-builder"
  | "s05-blind-recall-simulation"
  | "s06-due-queue-scheduler"
  | "loci-scene-lab"
  | "linked-chain-builder"
  | "major-phonetic-drill"
  | "study-comprehension-lab"
  | "real-life-application"
  | "guided-simulation-fallback";

export type InteractiveStepType =
  | "hook"
  | "explanation"
  | "expert_walkthrough"
  | "demonstration"
  | "guided_practice"
  | "independent_challenge"
  | "diagnostic_feedback"
  | "reflection_and_next"
  | "multiple_choice"
  | "matching_pairs"
  | "sequence_ordering"
  | "memory_flash"
  | "fill_in_blank"
  | "free_recall"
  | "image_association"
  | "loci_placement"
  | "mnemonic_builder"
  | "error_correction"
  | "number_encoding"
  | "reverse_decoding";

export interface LessonStepSpec {
  stepId: string;
  stepIndex: number;
  type: InteractiveStepType;
  stageLabel: string;
  title: string;
  bodyText: string;
  expandableFullText?: string;
  illustrationAsset: string;
  scientificNote?: string;
  options?: { id: string; label: string; isCorrect: boolean; explanation: string }[];
  pairs?: { id: string; left: string; right: string }[];
  sequenceItems?: string[];
  flashItems?: string[];
  flashDurationSeconds?: number;
  blankSentence?: { before: string; after: string; expectedWord: string; wordBank: string[] };
  freeRecallPrompt?: {
    question: string;
    expectedAnswer: string;
    acceptedKeywords: string[];
    progressiveHint: string;
  };
  lociPlacementSpec?: {
    roomObjects: { id: string; label: string; asset: string; zone: string }[];
    itemsToPlace: { item: string; defaultAction: string }[];
  };
  mnemonicBuilderSpec?: {
    targetConcept: string;
    suggestedObjects: string[];
    suggestedActions: string[];
    suggestedLoci: string[];
  };
  numberEncodingSpec?: {
    targetNumber: string;
    phoneticHint: string;
    exampleValidWords: string[];
  };
  reverseDecodingSpec?: {
    stimulusWord: string;
    expectedDigits: string;
    phoneticBreakdown: string;
  };
  explanationOnSuccess: string;
  explanationOnMistake: string;
}

export interface LessonEditorial {
  id: string;
  title: string;
  contentVersion: string;
  courseId: string;
  courseName: string;
  position: number;
  planTier: LessonTier;
  requiredInOnboarding: boolean;
  prerequisites: string[];
  locale: "it-IT";
  estimatedMinutes: number | null;
  reading: string;
  workedExample: string;
  exercise: {
    prompt: string;
    mode: string;
  };
  checkpoint: {
    question: string;
    expectedAnswer: string;
  };
  masteryCriterion: string;
  commonMistake: string;
  rawMarkdown?: string;
}

export interface EnrichedAcademyLesson extends LessonEditorial {
  theme: AcademyTheme;
  courseNumber: number;
  unitNumber: number;
  unitTitle: string;
  runtimeExerciseKind: RuntimeExerciseKind;
  requiresSimulatedFallbackNotice: boolean;
  fallbackNoticeText: string | null;
  checkpointAcceptedKeywords: string[];
  checkpointOptions?: { label: string; value: string }[];
  progressiveHint: string;
  steps: LessonStepSpec[];
  v2Mission: V2LessonMissionSpec;
  v2LearningObjective: string;
  v2SkillType: string;
  v2ExpertWalkthrough: string;
  v2CommonMistakes: string[];
  gradingReliability: LessonGradingReliability;
}

export interface UnitCheckpointQuestion {
  id: string;
  question: string;
  options: { label: string; value: string; isCorrect: boolean }[];
  explanation: string;
}

export interface AcademyCourse {
  courseId: string;
  courseNumber: number;
  unitNumber: number;
  unitTitle: string;
  title: string;
  subtitle: string;
  theme: AcademyTheme;
  planTier: LessonTier;
  entrySuggestion: string;
  unlockPolicy: string;
  mascotAsset: string;
  lessonIds: string[];
  lessons: EnrichedAcademyLesson[];
  checkpointQuestions: UnitCheckpointQuestion[];
}

export interface AcademyLessonProgress {
  lessonId: string;
  contentVersion: string;
  status: LessonStatus;
  openedAt: string | null;
  readCompletedAt: string | null;
  skippedReadingToTest: boolean;
  practiceCompletedAt: string | null;
  practiceSummary: string | null;
  currentStepIndex: number;
  completedStepIds: string[];
  checkpointAttempts: number;
  checkpointHintsUsed: number;
  viewedAnswerBeforeAttempt: boolean;
  lastAttemptAnswer: string | null;
  lastAttemptCorrect: boolean | null;
  lastAttemptAt: string | null;
  provisionallyPassedAt: string | null;
  masteredAfterDelayAt: string | null;
  nextReviewDueAt: string | null;
  legacyMigratedFrom: string[];
  attemptHistory?: AttemptEvidence[];
  lastVerifiedBy?: VerificationAuthority | null;
  lastErrorCategory?: ErrorDiagnosisCategory | null;
  lastRepairAction?: string | null;
}

export type AcademyProgressMap = Record<string, AcademyLessonProgress>;

export interface AcademyMistakeItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  stepId: string;
  prompt: string;
  expectedAnswer: string;
  explanation: string;
  createdAt: string;
}

export interface AcademyGamificationState {
  totalXp: number;
  dailyGoalXp: number;
  todayXp: number;
  lastActivityDate: string; // YYYY-MM-DD
  streakDays: number;
  awardedXpEventIds: string[];
  completedUnitCheckpoints: string[];
  mistakeQueue: AcademyMistakeItem[];
  forwardEncodingCorrectCount: number;
  forwardEncodingTotalCount: number;
  reverseDecodingCorrectCount: number;
  reverseDecodingTotalCount: number;
  reviewsCompletedCount: number;
  unlockedBadgeIds: string[];
}

export interface AdaptiveAcademyRecommendation {
  id: string;
  observedSignal: string;
  recommendedLessonIds: string[];
  explanation: string;
  sampleSize: number;
  isSufficientSample: boolean;
}

export const LOCO_ACADEMY_STORAGE_KEY = "loco-academy-progress-v1";
export const LOCO_ACADEMY_GAMIFICATION_KEY = "loco-academy-gamification-v1";
export const MAJOR_IT_V1_VERSION = "major-it-v1";

export const XP_REWARDS = {
  LESSON_COMPLETED: 10,
  PERFECT_FIRST_TRY_BONUS: 5,
  CHECKPOINT_PASSED: 20,
  REVIEW_COMPLETED: 5,
} as const;

export interface LocoLevelDefinition {
  level: number;
  title: string;
  minXp: number;
  maxXp: number | null;
  mascotAsset: string;
  description: string;
}

export const LOCO_LEVELS: LocoLevelDefinition[] = [
  {
    level: 1,
    title: "Esploratore",
    minXp: 0,
    maxXp: 49,
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
    description: "Muovi i primi passi tra osservazione, indizi solidi e primi loci.",
  },
  {
    level: 2,
    title: "Costruttore",
    minXp: 50,
    maxXp: 149,
    mascotAsset: "/assets/figma-curated/academy-mascot-tablet.svg",
    description: "Costruisci percorsi stabili, catene d'azione e prime stanze ordinate.",
  },
  {
    level: 3,
    title: "Architetto",
    minXp: 150,
    maxXp: 299,
    mascotAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
    description: "Progetti palazzi multi-stanza, domini la conversione fonetica e il richiamo cieco.",
  },
  {
    level: 4,
    title: "Mnemonista",
    minXp: 300,
    maxXp: 499,
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
    description: "Padroneggi codifica e decodifica rapida, diagnosi degli errori e trasferimento allo studio.",
  },
  {
    level: 5,
    title: "Maestro dei Loci",
    minXp: 500,
    maxXp: null,
    mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg",
    description: "Massima autonomia tra studio profondo, palazzi complessi, carte e specializzazioni.",
  },
];

export interface AcademyBadgeDefinition {
  id: string;
  title: string;
  description: string;
  asset: string;
}

export const ACADEMY_BADGES: AcademyBadgeDefinition[] = [
  {
    id: "badge-first-memory",
    title: "Primo ricordo autentico",
    description: "Completa la tua prima lezione interattiva (F01) con prova di recupero a stimolo nascosto.",
    asset: "/assets/figma-curated/academy-item-lightbulb.svg",
  },
  {
    id: "badge-first-palace",
    title: "Primo palazzo completato",
    description: "Completa le lezioni dell'Unità Fondamenta o costruisci la tua prima stanza da 8 loci (P03).",
    asset: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  {
    id: "badge-10-loci",
    title: "10 loci creati",
    description: "Completa la costruzione del percorso o memorizza 10 stazioni ordinate.",
    asset: "/assets/figma-curated/academy-item-bookshelf.svg",
  },
  {
    id: "badge-5-reviews",
    title: "5 ripassi effettuati",
    description: "Svolgi almeno 5 sessioni di ripasso attivo a risposta nascosta consolidando i ricordi.",
    asset: "/assets/figma-curated/academy-item-clock.svg",
  },
  {
    id: "badge-numbers-master",
    title: "Numeri senza segreti",
    description: "Supera prove Major System major-it-v1 sia in codifica (Numero→Parola) sia in decodifica (Parola→Numero).",
    asset: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  {
    id: "badge-memory-architect",
    title: "Architetto della memoria",
    description: "Supera almeno un Checkpoint di fine unità e completa 5 lezioni di LOCO Academy.",
    asset: "/assets/figma-curated/academy-mascot-lion.svg",
  },
];

export const TIER_NAMING: Record<
  LessonTier,
  {
    code: LessonTier;
    editorialName: string;
    shortBadge: string;
    description: string;
    isPaidHypothesis: boolean;
    featuresList: string[];
  }
> = {
  free: {
    code: "free",
    editorialName: "LOCOMPRO DOPO",
    shortBadge: "LOCOMPRO DOPO · Free",
    description:
      "37 lezioni di base e applicative (Unità 1–6): Fondamenta della memoria, L'arte dell'associazione, Palazzi della memoria, Conversione fonetica e cifre, LOCO nella vita reale, Dalla memoria allo studio.",
    isPaidHypothesis: false,
    featuresList: [
      "37 microlezioni interattive (Unità 1–6)",
      "Costruzione dei palazzi e associazioni d'azione dinamiche",
      "Conversione fonetica major-it-v1 bidirezionale",
      "Motore Blind Recall a risposta nascosta e coda ripassi",
      "Progressione XP, livelli LOCO, streak e 6 badge verificabili",
    ],
  },
  plus: {
    code: "plus",
    editorialName: "POCO LOCO",
    shortBadge: "POCO LOCO · Plus",
    description:
      "Tutte le 37 lezioni Free + 11 lezioni avanzate di specializzazione (Unità 7–8): La lingua delle carte e Specializzazioni (PAO, binario, citazioni, capitali, ortografia e protocolli).",
    isPaidHypothesis: true,
    featuresList: [
      "Tutte le 37 lezioni Free + 11 lezioni di specializzazione (Unità 7–8)",
      "La lingua delle carte: codifica di semi e figure e sequenze ordinate",
      "Specializzazioni avanzate: sistema Person-Action-Object (PAO) e numeri binari",
      "Protocolli per citazioni letterali, coppie arbitrarie e diagnosi degli errori",
    ],
  },
  pro: {
    code: "pro",
    editorialName: "PRO LOCO",
    shortBadge: "PRO LOCO · Pro",
    description:
      "Accesso completo ad ogni laboratorio presente e futuro di LOCO Academy.",
    isPaidHypothesis: true,
    featuresList: [
      "Tutte le lezioni Free e POCO LOCO",
      "Strumenti avanzati di revisione critica e personalizzazione",
      "Supporto per progetti di studio complessi e percorsi estesi",
    ],
  },
};

export interface MajorItV1Row {
  digit: number;
  phonemes: string;
  sounds: string;
  anchorWord: string;
  anchorDigits: string;
  exampleWords: { word: string; digits: string; note?: string }[];
  mnemonicHint: string;
}

export const MAJOR_IT_V1_TABLE: MajorItV1Row[] = [
  {
    digit: 0,
    phonemes: "/s/, /z/, /ʃ/",
    sounds: "S, Z, SC dolce (scena)",
    anchorWord: "Sasso",
    anchorDigits: "00",
    exampleWords: [
      { word: "scena", digits: "02", note: "SC dolce /ʃ/ = 0, N = 2" },
      { word: "sole", digits: "05", note: "S = 0, L = 5" },
      { word: "zaino", digits: "02", note: "Z = 0, N = 2" },
    ],
    mnemonicHint: "0 sibila o fruscia come S, Z e SC di scena",
  },
  {
    digit: 1,
    phonemes: "/t/, /d/",
    sounds: "T, D",
    anchorWord: "Toro",
    anchorDigits: "14",
    exampleWords: [
      { word: "toro", digits: "14", note: "T = 1, R = 4" },
      { word: "dado", digits: "11", note: "D = 1, D = 1" },
      { word: "dito", digits: "11", note: "D = 1, T = 1" },
    ],
    mnemonicHint: "1 ha una sola asta verticale come T",
  },
  {
    digit: 2,
    phonemes: "/n/, /ɲ/",
    sounds: "N, GN (gnomo)",
    anchorWord: "Nave",
    anchorDigits: "28",
    exampleWords: [
      { word: "nido", digits: "21", note: "N = 2, D = 1" },
      { word: "gnomo", digits: "23", note: "GN /ɲ/ = 2, M = 3" },
      { word: "noce", digits: "26", note: "N = 2, C dolce = 6" },
    ],
    mnemonicHint: "n minuscola ha 2 gambe (include il suono palatale GN)",
  },
  {
    digit: 3,
    phonemes: "/m/",
    sounds: "M",
    anchorWord: "Mano",
    anchorDigits: "32",
    exampleWords: [
      { word: "mano", digits: "32", note: "M = 3, N = 2" },
      { word: "micio", digits: "36", note: "M = 3, C dolce /tʃ/ = 6" },
      { word: "mago", digits: "37", note: "M = 3, G dura /g/ = 7" },
    ],
    mnemonicHint: "m minuscola ha 3 gambe",
  },
  {
    digit: 4,
    phonemes: "/r/",
    sounds: "R",
    anchorWord: "Riva",
    anchorDigits: "48",
    exampleWords: [
      { word: "riva", digits: "48", note: "R = 4, V = 8" },
      { word: "rana", digits: "42", note: "R = 4, N = 2" },
      { word: "remo", digits: "43", note: "R = 4, M = 3" },
    ],
    mnemonicHint: "QuattRo vibra sulla R",
  },
  {
    digit: 5,
    phonemes: "/l/, /ʎ/",
    sounds: "L, GL palatale (foglia)",
    anchorWord: "Luna",
    anchorDigits: "52",
    exampleWords: [
      { word: "luna", digits: "52", note: "L = 5, N = 2" },
      { word: "foglia", digits: "85", note: "F = 8, GL /ʎ/ = 5" },
      { word: "limone", digits: "532", note: "L = 5, M = 3, N = 2" },
    ],
    mnemonicHint: "L romana = 50 (5 dita della mano aperta)",
  },
  {
    digit: 6,
    phonemes: "/tʃ/, /dʒ/",
    sounds: "C/G dolce (ciao, gelato)",
    anchorWord: "Ciliegia",
    anchorDigits: "656",
    exampleWords: [
      { word: "ciao", digits: "6", note: "C dolce /tʃ/ = 6, vocali neutre" },
      { word: "micio", digits: "36", note: "M = 3, C dolce = 6" },
      { word: "gelato", digits: "651", note: "G dolce = 6, L = 5, T = 1" },
    ],
    mnemonicHint: "G/C dolce arrotondata come il 6 (SC dolce sta invece sullo 0)",
  },
  {
    digit: 7,
    phonemes: "/k/, /g/",
    sounds: "C/G dura (casa, mago), K, Q",
    anchorWord: "Casa",
    anchorDigits: "70",
    exampleWords: [
      { word: "casa", digits: "70", note: "C dura /k/ = 7, S = 0" },
      { word: "mago", digits: "37", note: "M = 3, G dura /g/ = 7" },
      { word: "cane", digits: "72", note: "C dura /k/ = 7, N = 2" },
    ],
    mnemonicHint: "K spigolosa come due 7 uniti; suono gutturale duro",
  },
  {
    digit: 8,
    phonemes: "/f/, /v/",
    sounds: "F, V",
    anchorWord: "Faro",
    anchorDigits: "84",
    exampleWords: [
      { word: "tuffo", digits: "18", note: "T = 1, FF geminata = una sola occorrenza 8" },
      { word: "riva", digits: "48", note: "R = 4, V = 8" },
      { word: "vela", digits: "85", note: "V = 8, L = 5" },
    ],
    mnemonicHint: "f corsiva ha due anelli come l'8",
  },
  {
    digit: 9,
    phonemes: "/p/, /b/",
    sounds: "P, B",
    anchorWord: "Pane",
    anchorDigits: "92",
    exampleWords: [
      { word: "pane", digits: "92", note: "P = 9, N = 2" },
      { word: "ponte", digits: "921", note: "P = 9, N = 2, T = 1" },
      { word: "barca", digits: "947", note: "B = 9, R = 4, C dura = 7" },
    ],
    mnemonicHint: "P specchiata assomiglia al 9",
  },
];

export const MAJOR_IT_V1_VERIFIED_LEXICON: Record<string, string> =
  MAJOR_IT_V1_VERIFIED_LEXICON_V2;

export function encodeItalianWordToMajorDigits(rawWord: string): string {
  return encodeItalianWordToMajorDigitsV2(rawWord);
}

export interface LegacyLessonMapping {
  legacyId: string;
  legacyTitle: string;
  legacyCourseId: number;
  primaryLessonId: string;
  mappedLessonIds: string[];
  migrationNote: string;
}

export const LEGACY_LESSON_MAP: Record<string, LegacyLessonMapping> = {
  "c1-l1": {
    legacyId: "c1-l1",
    legacyTitle: "Approccio alle tecniche mnemoniche",
    legacyCourseId: 1,
    primaryLessonId: "F01",
    mappedLessonIds: ["F01", "P01"],
    migrationNote: "Mappato a F01 (Lo sai davvero?) e P01",
  },
  "c1-l2": {
    legacyId: "c1-l2",
    legacyTitle: "Introduzione alla tecnica dei Loci",
    legacyCourseId: 1,
    primaryLessonId: "P02",
    mappedLessonIds: ["P02", "P03"],
    migrationNote: "Mappato a P02 (Dalla porta, gira sempre uguale) e P03",
  },
  "c1-l3": {
    legacyId: "c1-l3",
    legacyTitle: "Come utilizzare la tecnica dei Loci",
    legacyCourseId: 1,
    primaryLessonId: "P04",
    mappedLessonIds: ["P04", "P05"],
    migrationNote: "Mappato a P04 (Il limone entra in libreria) e P05",
  },
  "c2-l1": {
    legacyId: "c2-l1",
    legacyTitle: "Introduzione al Linked Method",
    legacyCourseId: 2,
    primaryLessonId: "A01",
    mappedLessonIds: ["A01"],
    migrationNote: "Mappato a A01 (Non appoggiare: fai esplodere)",
  },
  "c2-l2": {
    legacyId: "c2-l2",
    legacyTitle: "Come creare storie",
    legacyCourseId: 2,
    primaryLessonId: "A02",
    mappedLessonIds: ["A02"],
    migrationNote: "Mappato a A02 (La catena che si racconta da sola)",
  },
  "c2-l3": {
    legacyId: "c2-l3",
    legacyTitle: "Come utilizzare il Linked Method",
    legacyCourseId: 2,
    primaryLessonId: "A03",
    mappedLessonIds: ["A03", "A06"],
    migrationNote: "Mappato a A03 (Dove si spezza il film?) e A06",
  },
  "c3-l1": {
    legacyId: "c3-l1",
    legacyTitle: "Introduzione alla conversione fonetica",
    legacyCourseId: 3,
    primaryLessonId: "N01",
    mappedLessonIds: ["N01"],
    migrationNote: "Mappato a N01 (Le cifre non hanno una faccia)",
  },
  "c3-l2": {
    legacyId: "c3-l2",
    legacyTitle: "Come imparare l'alfabeto numerico",
    legacyCourseId: 3,
    primaryLessonId: "N02",
    mappedLessonIds: ["N02"],
    migrationNote: "Mappato a N02 (Il dizionario segreto dei suoni)",
  },
  "c3-l3": {
    legacyId: "c3-l3",
    legacyTitle: "Come utilizzare la conversione",
    legacyCourseId: 3,
    primaryLessonId: "N03",
    mappedLessonIds: ["N03", "N04"],
    migrationNote: "Mappato a N03 (Una lettera non è sempre un suono) e N04",
  },
};

export const PATH_TO_COURSE_ID: Record<string, string> = {
  Fondamenta: "course-fondamenta",
  Associazioni: "course-associazioni",
  Palazzi: "course-palazzi",
  Numeri: "course-numeri",
  "Vita reale": "course-vita-reale",
  Studio: "course-studio",
  Carte: "course-carte",
  Specializzazioni: "course-specializzazioni",
};

export const COURSE_METADATA: Record<
  string,
  {
    unitNumber: number;
    unitTitle: string;
    subtitle: string;
    theme: AcademyTheme;
    planTier: LessonTier;
    entrySuggestion: string;
    unlockPolicy: string;
    mascotAsset: string;
  }
> = {
  "course-fondamenta": {
    unitNumber: 1,
    unitTitle: "UNITÀ 1 — Fondamenta della memoria",
    subtitle: "Imparare a guardare, costruire indizi efficaci e riconoscere il recupero autentico",
    theme: "onboarding",
    planTier: "free",
    entrySuggestion: "Inizia da qui",
    unlockPolicy: "Percorso iniziale sempre disponibile",
    mascotAsset: "/assets/figma-curated/academy-scene-relax-night.svg",
  },
  "course-associazioni": {
    unitNumber: 2,
    unitTitle: "UNITÀ 2 — L'arte dell'associazione",
    subtitle: "Azioni visive dinamiche, catene Linked che si raccontano da sole e riparazione di anelli deboli",
    theme: "linked",
    planTier: "free",
    entrySuggestion: "Dopo F04",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-mascot-cat.svg",
  },
  "course-palazzi": {
    unitNumber: 3,
    unitTitle: "UNITÀ 3 — Palazzi della memoria",
    subtitle: "Progettare luoghi con un percorso stabile, rotte coerenti dalla porta e recupero senza mappa",
    theme: "loci",
    planTier: "free",
    entrySuggestion: "Dopo F04",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  "course-numeri": {
    unitNumber: 4,
    unitTitle: "UNITÀ 4 — Conversione fonetica e cifre",
    subtitle: "Dal codice major-it-v1 al lessico personale 00–99 e memorizzazione di date storiche",
    theme: "numbers",
    planTier: "free",
    entrySuggestion: "Dopo F03",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-vita-reale": {
    unitNumber: 5,
    unitTitle: "UNITÀ 5 — LOCO nella vita reale",
    subtitle: "Nomi, volti, percorsi stradali, intenzioni future, vocaboli stranieri e discorsi",
    theme: "real-life",
    planTier: "free",
    entrySuggestion: "Dopo F02 e F03",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-studio": {
    unitNumber: 6,
    unitTitle: "UNITÀ 6 — Dalla memoria alla comprensione",
    subtitle: "Dalle idee alle domande, budget delle immagini mentali, mappe strutturate e ripasso",
    theme: "study",
    planTier: "free",
    entrySuggestion: "Dopo F01",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-carte": {
    unitNumber: 7,
    unitTitle: "UNITÀ 7 — La lingua delle carte",
    subtitle: "Specializzazione opzionale: lessico di carte e prime sequenze ordinate",
    theme: "training",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Accesso a tutte le lezioni delle carte",
    mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg",
  },
  "course-specializzazioni": {
    unitNumber: 8,
    unitTitle: "UNITÀ 8 — Specializzazioni e protocolli",
    subtitle: "PAO, binario, citazioni, capitali, ortografia e protocolli avanzati",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Specializzazioni avanzate",
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  // Legacy Aliases
  "course-0": {
    unitNumber: 1,
    unitTitle: "UNITÀ 1 — Fondamenta della memoria",
    subtitle: "Imparare a guardare, costruire indizi efficaci e riconoscere il recupero autentico",
    theme: "onboarding",
    planTier: "free",
    entrySuggestion: "Inizia da qui",
    unlockPolicy: "Percorso iniziale sempre disponibile",
    mascotAsset: "/assets/figma-curated/academy-scene-relax-night.svg",
  },
  "course-1": {
    unitNumber: 3,
    unitTitle: "UNITÀ 3 — Palazzi della memoria",
    subtitle: "Progettare luoghi con un percorso stabile, rotte coerenti dalla porta e recupero senza mappa",
    theme: "loci",
    planTier: "free",
    entrySuggestion: "Dopo F04",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  "course-2": {
    unitNumber: 2,
    unitTitle: "UNITÀ 2 — L'arte dell'associazione",
    subtitle: "Azioni visive dinamiche, catene Linked che si raccontano da sole e riparazione di anelli deboli",
    theme: "linked",
    planTier: "free",
    entrySuggestion: "Dopo F04",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-mascot-cat.svg",
  },
  "course-3": {
    unitNumber: 4,
    unitTitle: "UNITÀ 4 — Conversione fonetica e cifre",
    subtitle: "Dal codice major-it-v1 al lessico personale 00–99 e memorizzazione di date storiche",
    theme: "numbers",
    planTier: "free",
    entrySuggestion: "Dopo F03",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-4": {
    unitNumber: 6,
    unitTitle: "UNITÀ 6 — Dalla memoria alla comprensione",
    subtitle: "Dalle idee alle domande, budget delle immagini mentali, mappe strutturate e ripasso",
    theme: "study",
    planTier: "free",
    entrySuggestion: "Dopo F01",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-5": {
    unitNumber: 5,
    unitTitle: "UNITÀ 5 — LOCO nella vita reale",
    subtitle: "Nomi, volti, percorsi stradali, intenzioni future, vocaboli stranieri e discorsi",
    theme: "real-life",
    planTier: "free",
    entrySuggestion: "Dopo F02 e F03",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-6": {
    unitNumber: 8,
    unitTitle: "UNITÀ 8 — Specializzazioni e protocolli",
    subtitle: "PAO, binario, citazioni, capitali, ortografia e protocolli avanzati",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Specializzazioni avanzate",
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  "course-7": {
    unitNumber: 8,
    unitTitle: "UNITÀ 8 — Specializzazioni e protocolli",
    subtitle: "PAO, binario, citazioni, capitali, ortografia e protocolli avanzati",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Specializzazioni avanzate",
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-8": {
    unitNumber: 6,
    unitTitle: "UNITÀ 6 — Dalla memoria alla comprensione",
    subtitle: "Dalle idee alle domande, budget delle immagini mentali, mappe strutturate e ripasso",
    theme: "study",
    planTier: "free",
    entrySuggestion: "Dopo F01",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-9": {
    unitNumber: 3,
    unitTitle: "UNITÀ 3 — Palazzi della memoria",
    subtitle: "Progettare luoghi con un percorso stabile, rotte coerenti dalla porta e recupero senza mappa",
    theme: "loci",
    planTier: "free",
    entrySuggestion: "Dopo F04",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  "course-10": {
    unitNumber: 7,
    unitTitle: "UNITÀ 7 — La lingua delle carte",
    subtitle: "Specializzazione opzionale: lessico di carte e prime sequenze ordinate",
    theme: "training",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Accesso a tutte le lezioni delle carte",
    mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg",
  },
  "course-11": {
    unitNumber: 8,
    unitTitle: "UNITÀ 8 — Specializzazioni e protocolli",
    subtitle: "PAO, binario, citazioni, capitali, ortografia e protocolli avanzati",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Specializzazione opzionale",
    unlockPolicy: "POCO LOCO · Specializzazioni avanzate",
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
  },
};

function resolveRuntimeExerciseKind(lessonId: string): {
  kind: RuntimeExerciseKind;
  requiresSimulatedFallbackNotice: boolean;
  fallbackNoticeText: string | null;
} {
  if (lessonId === "F01") {
    return { kind: "s01-recognition-recall-switch", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "F04") {
    return { kind: "s02-target-question-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "P02" || lessonId === "P03") {
    return { kind: "s03-five-locus-scene-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "A01" || lessonId === "A03") {
    return { kind: "s04-action-association-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("P")) {
    return { kind: "loci-scene-lab", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("A")) {
    return { kind: "linked-chain-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("N")) {
    return { kind: "major-phonetic-drill", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("S")) {
    return { kind: "study-comprehension-lab", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("E")) {
    return { kind: "real-life-application", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  return {
    kind: "guided-simulation-fallback",
    requiresSimulatedFallbackNotice: false,
    fallbackNoticeText: null,
  };
}

function resolveExpectedAnswerForLesson(id: string, challengePrompt: string): string {
  if (id === "F01") return "pettine, zattera, tulipano, tamburo, calamita";
  if (id === "A03") return "cactus, campana";
  if (id === "P02") return "porta, lampada, libreria, finestra, scrivania, divano";
  if (id === "P03") return "ingresso, tappeto, scarpiera, attaccapanni, specchio, comodino, finestra, divano";
  if (id === "N03") return "coro=74, cera=64";
  if (id === "S03") return "Vela-7, R-14, 2037";
  if (id === "E01") return "Giorgia";
  if (id === "C03") return "A♠, 7♥, Q♦, 3♣, 10♠";

  const clean = challengePrompt.replace(/[«»]/g, "");
  const match = clean.match(/(?:è|era|corrisponde a|chiave|parola)\s+([A-Za-z0-9àèéìòù]+)/i);
  if (match) return match[1];
  return "risposta corretta verificata";
}

function buildCheckpointMetadata(lesson: LessonEditorial): {
  acceptedKeywords: string[];
  options?: { label: string; value: string }[];
  progressiveHint: string;
} {
  const expectedClean = lesson.checkpoint.expectedAnswer
    .trim()
    .replace(/\.$/, "")
    .toLowerCase();

  const stopWords = new Set([
    "che", "del", "della", "delle", "dei", "degli", "con", "per", "una", "uno",
    "gli", "nel", "nella", "sul", "sulla", "sono", "come", "più", "piu", "suo", "sua", "non"
  ]);

  const tokens = expectedClean
    .split(/[^a-z0-9àèéìòù♠♥♦♣]+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 2 && !stopWords.has(t));

  return {
    acceptedKeywords: tokens.length > 0 ? tokens : [expectedClean],
    options: [
      { label: `Chiave corretta: ${lesson.checkpoint.expectedAnswer}`, value: "correct" },
      { label: `Errore comune: ${lesson.commonMistake.slice(0, 75)}...`, value: "mistake" },
    ],
    progressiveHint: `Concentrati su: ${lesson.masteryCriterion.slice(0, 110)} (evita: ${lesson.commonMistake.slice(0, 80)})`,
  };
}

function splitShortAndFullReading(reading: string): { shortText: string; fullText: string } {
  const sentences = reading.match(/[^.!?]+[.!?]+/g) ?? [reading];
  const shortSentences = sentences.slice(0, 2).join(" ").trim();
  return {
    shortText: shortSentences || reading,
    fullText: reading,
  };
}

const STAGE_LABELS_MAP: Record<string, string> = {
  hook: "STAGE 1 · INGRESSO (HOOK)",
  guided_practice: "STAGE 2 · PROVA GUIDATA (FAI)",
  explanation: "STAGE 3 · PRINCIPIO CHIAVE (CAPISCI)",
  demonstration: "STAGE 4 · ESEMPIO GUIDATO (OSSERVA)",
  independent_challenge: "STAGE 5 · MISSIONE NUOVA (PROVA VERA)",
  diagnostic_feedback: "STAGE 6 · DIAGNOSI E RIPARAZIONE (RIPARA)",
};

const STAGE_ILLUSTRATIONS_MAP: Record<string, string> = {
  hook: "/assets/figma-curated/academy-scene-relax-night.svg",
  guided_practice: "/assets/figma-curated/academy-scene-study-desk.svg",
  explanation: "/assets/figma-curated/academy-mascot-zen-book.svg",
  demonstration: "/assets/figma-curated/academy-mascot-tablet.svg",
  independent_challenge: "/assets/figma-curated/academy-mascot-headphones.svg",
  diagnostic_feedback: "/assets/figma-curated/academy-scene-explorer.svg",
};

export function buildInteractiveStepsForLesson(
  lesson: LessonEditorial,
  cpMeta: { acceptedKeywords: string[]; options?: { label: string; value: string }[]; progressiveHint: string },
  fallbackNoticeText?: string | null
): LessonStepSpec[] {
  const v5LessonRaw = (rawCurriculumV5.lessons as Array<{
    id: string;
    screens: Array<{
      index: number;
      kind: string;
      label: string;
      text: string;
      role?: string;
    }>;
  }>).find((l) => l.id === lesson.id);

  const mission = ACADEMY_V5_MISSIONS[lesson.id];

  if (v5LessonRaw && Array.isArray(v5LessonRaw.screens) && v5LessonRaw.screens.length === 6) {
    return v5LessonRaw.screens.map((screen, idx) => {
      const mappedType: InteractiveStepType =
        screen.kind === "guided_interaction"
          ? "guided_practice"
          : screen.kind === "worked_example"
            ? "demonstration"
            : screen.kind === "error_feedback"
              ? "diagnostic_feedback"
              : (screen.kind as InteractiveStepType);

      const isExplanation = mappedType === "explanation";
      const { shortText, fullText } = splitShortAndFullReading(screen.text);

      return {
        stepId: `${lesson.id}-step-${screen.index}`,
        stepIndex: idx,
        type: mappedType,
        stageLabel: STAGE_LABELS_MAP[mappedType] ?? `STAGE ${idx + 1} · ${screen.label.toUpperCase()}`,
        title: `${lesson.id} · ${screen.label}`,
        bodyText: isExplanation ? shortText : screen.text,
        expandableFullText: isExplanation && fullText.length > shortText.length ? fullText : undefined,
        illustrationAsset: STAGE_ILLUSTRATIONS_MAP[mappedType] ?? "/assets/figma-curated/academy-mascot-goose.svg",
        scientificNote:
          mappedType === "demonstration" && fallbackNoticeText
            ? fallbackNoticeText
            : undefined,
        options:
          mappedType === "demonstration" && mission
            ? mission.demonstrationOptions.map((o) => ({
                id: o.id,
                label: o.label,
                isCorrect: o.isCorrect,
                explanation: mission.demonstrationModelReveal,
              }))
            : undefined,
        freeRecallPrompt:
          mappedType === "independent_challenge"
            ? {
                question: mission?.independentPrompt ?? lesson.checkpoint.question,
                expectedAnswer: lesson.checkpoint.expectedAnswer,
                acceptedKeywords: cpMeta.acceptedKeywords,
                progressiveHint: mission?.progressiveHints[0] ?? cpMeta.progressiveHint,
              }
            : undefined,
        explanationOnSuccess: mission?.demonstrationModelReveal ?? lesson.masteryCriterion,
        explanationOnMistake: `Evita l'errore comune: ${lesson.commonMistake}`,
      };
    });
  }

  // Fallback
  return [
    {
      stepId: `${lesson.id}-step-1`,
      stepIndex: 0,
      type: "hook",
      stageLabel: "STAGE 1 · INGRESSO (HOOK)",
      title: `${lesson.id} · ${lesson.title}`,
      bodyText: lesson.reading,
      illustrationAsset: STAGE_ILLUSTRATIONS_MAP.hook,
      explanationOnSuccess: lesson.masteryCriterion,
      explanationOnMistake: lesson.commonMistake,
    },
    {
      stepId: `${lesson.id}-step-2`,
      stepIndex: 1,
      type: "explanation",
      stageLabel: "STAGE 3 · PRINCIPIO CHIAVE (CAPISCI)",
      title: "Perché funziona",
      bodyText: lesson.reading,
      illustrationAsset: STAGE_ILLUSTRATIONS_MAP.explanation,
      explanationOnSuccess: lesson.masteryCriterion,
      explanationOnMistake: lesson.commonMistake,
    },
  ];
}

export const RAW_ACADEMY_LESSONS: LessonEditorial[] = (
  rawCurriculumV5.lessons as Array<{
    id: string;
    path: string;
    title: string;
    pattern: string;
    proposed_minigame: string;
    hook: string;
    explanation: string;
    worked_example: string;
    guided_interaction: string;
    independent_challenge: string;
    assessment_contract: string;
    error_feedback: string;
    outside_loco?: string;
    access: string;
    recommended_prerequisites: string[];
    screens: Array<{
      index: number;
      kind: string;
      label: string;
      text: string;
    }>;
  }>
).map((l, idx) => {
  const courseId = PATH_TO_COURSE_ID[l.path] || "course-fondamenta";
  const courseMeta = COURSE_METADATA[courseId];

  return {
    id: l.id,
    title: l.title,
    contentVersion: ACADEMY_V5_SCHEMA_VERSION,
    courseId,
    courseName: courseMeta ? courseMeta.unitTitle : l.path,
    position: idx + 1,
    planTier: (l.access === "base" ? "free" : "plus") as LessonTier,
    requiredInOnboarding: l.path === "Fondamenta",
    prerequisites: l.recommended_prerequisites || [],
    locale: "it-IT" as const,
    estimatedMinutes: 4,
    reading: l.explanation,
    workedExample: l.worked_example,
    exercise: {
      prompt: l.guided_interaction,
      mode: l.proposed_minigame,
    },
    checkpoint: {
      question: l.independent_challenge,
      expectedAnswer: resolveExpectedAnswerForLesson(l.id, l.independent_challenge),
    },
    masteryCriterion: l.assessment_contract,
    commonMistake: l.error_feedback,
  };
});

export const ENRICHED_ACADEMY_LESSONS: EnrichedAcademyLesson[] =
  RAW_ACADEMY_LESSONS.map((lesson) => {
    const courseMeta = COURSE_METADATA[lesson.courseId] ?? {
      unitNumber: 1,
      unitTitle: lesson.courseName,
      subtitle: lesson.courseName,
      theme: "onboarding" as AcademyTheme,
      planTier: lesson.planTier,
      entrySuggestion: "Inizia da qui",
      unlockPolicy: "Sempre disponibile",
      mascotAsset: "/assets/figma-curated/academy-scene-relax-night.svg",
    };
    const mission = ACADEMY_V5_MISSIONS[lesson.id];
    const runtimeSpec = resolveRuntimeExerciseKind(lesson.id);
    const cpMeta = buildCheckpointMetadata(lesson);
    const steps = buildInteractiveStepsForLesson(
      lesson,
      cpMeta,
      runtimeSpec.fallbackNoticeText
    );

    return {
      ...lesson,
      theme: courseMeta.theme,
      courseNumber: courseMeta.unitNumber,
      unitNumber: courseMeta.unitNumber,
      unitTitle: courseMeta.unitTitle,
      runtimeExerciseKind: runtimeSpec.kind,
      requiresSimulatedFallbackNotice: runtimeSpec.requiresSimulatedFallbackNotice,
      fallbackNoticeText: runtimeSpec.fallbackNoticeText,
      checkpointAcceptedKeywords: cpMeta.acceptedKeywords,
      checkpointOptions: cpMeta.options,
      progressiveHint: mission?.progressiveHints[0] ?? cpMeta.progressiveHint,
      steps,
      v2Mission: mission,
      v2LearningObjective: lesson.masteryCriterion,
      v2SkillType: lesson.exercise.mode,
      v2ExpertWalkthrough: lesson.workedExample,
      v2CommonMistakes: [lesson.commonMistake],
      gradingReliability: mission?.gradingReliability ?? "deterministic_verified",
    };
  });

export const ACADEMY_LESSONS_BY_ID: Record<string, EnrichedAcademyLesson> =
  Object.fromEntries(ENRICHED_ACADEMY_LESSONS.map((l) => [l.id, l]));

export const ACADEMY_COURSES: AcademyCourse[] = [
  { courseId: "course-fondamenta", courseNumber: 1, unitNumber: 1, unitTitle: "UNITÀ 1 — Fondamenta della memoria", title: "Fondamenta della memoria", subtitle: "Imparare a guardare, costruire indizi efficaci e riconoscere il recupero autentico", theme: "onboarding" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Inizia da qui", unlockPolicy: "Percorso iniziale sempre disponibile", mascotAsset: "/assets/figma-curated/academy-scene-relax-night.svg", lessonIds: ["F01", "F02", "F03", "F04", "F05"] },
  { courseId: "course-associazioni", courseNumber: 2, unitNumber: 2, unitTitle: "UNITÀ 2 — L'arte dell'associazione", title: "L'arte dell'associazione", subtitle: "Azioni visive dinamiche, catene Linked che si raccontano da sole e riparazione di anelli deboli", theme: "linked" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Dopo F04", unlockPolicy: "Sempre disponibile gratuitamente", mascotAsset: "/assets/figma-curated/academy-mascot-cat.svg", lessonIds: ["A01", "A02", "A03", "A04", "A05", "A06"] },
  { courseId: "course-palazzi", courseNumber: 3, unitNumber: 3, unitTitle: "UNITÀ 3 — Palazzi della memoria", title: "Palazzi della memoria", subtitle: "Progettare luoghi con un percorso stabile, rotte coerenti dalla porta e recupero senza mappa", theme: "loci" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Dopo F04", unlockPolicy: "Sempre disponibile gratuitamente", mascotAsset: "/assets/figma-curated/academy-scene-study-desk.svg", lessonIds: ["P01", "P02", "P03", "P04", "P05", "P06", "P07"] },
  { courseId: "course-numeri", courseNumber: 4, unitNumber: 4, unitTitle: "UNITÀ 4 — Conversione fonetica e cifre", title: "Conversione fonetica e cifre", subtitle: "Dal codice major-it-v1 al lessico personale 00–99 e memorizzazione di date storiche", theme: "numbers" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Dopo F03", unlockPolicy: "Sempre disponibile gratuitamente", mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg", lessonIds: ["N01", "N02", "N03", "N04", "N05", "N06", "N07"] },
  { courseId: "course-vita-reale", courseNumber: 5, unitNumber: 5, unitTitle: "UNITÀ 5 — LOCO nella vita reale", title: "LOCO nella vita reale", subtitle: "Nomi, volti, percorsi stradali, intenzioni future, vocaboli stranieri e discorsi", theme: "real-life" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Dopo F02 e F03", unlockPolicy: "Sempre disponibile gratuitamente", mascotAsset: "/assets/figma-curated/academy-scene-runner.svg", lessonIds: ["E01", "E02", "E03", "E04", "E05", "E06"] },
  { courseId: "course-studio", courseNumber: 6, unitNumber: 6, unitTitle: "UNITÀ 6 — Dalla memoria alla comprensione", title: "Dalla memoria alla comprensione", subtitle: "Dalle idee alle domande, budget delle immagini mentali, mappe strutturate e ripasso", theme: "study" as AcademyTheme, planTier: "free" as LessonTier, entrySuggestion: "Dopo F01", unlockPolicy: "Sempre disponibile gratuitamente", mascotAsset: "/assets/figma-curated/academy-scene-library.svg", lessonIds: ["S01", "S02", "S03", "S04", "S05", "S06"] },
  { courseId: "course-carte", courseNumber: 7, unitNumber: 7, unitTitle: "UNITÀ 7 — La lingua delle carte", title: "La lingua delle carte", subtitle: "Specializzazione opzionale: lessico di carte e prime sequenze ordinate", theme: "training" as AcademyTheme, planTier: "plus" as LessonTier, entrySuggestion: "Specializzazione opzionale", unlockPolicy: "POCO LOCO · Accesso a tutte le lezioni delle carte", mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg", lessonIds: ["C01", "C02", "C03", "C05", "C04"] },
  { courseId: "course-specializzazioni", courseNumber: 8, unitNumber: 8, unitTitle: "UNITÀ 8 — Specializzazioni e protocolli", title: "Specializzazioni e protocolli", subtitle: "PAO, binario, citazioni, capitali, ortografia e protocolli avanzati", theme: "palaces-advanced" as AcademyTheme, planTier: "plus" as LessonTier, entrySuggestion: "Specializzazione opzionale", unlockPolicy: "POCO LOCO · Specializzazioni avanzate", mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg", lessonIds: ["X01", "X02", "X03", "X04", "X05", "X06"] },
].map((c) => {
  const lessons = c.lessonIds
    .map((id) => ACADEMY_LESSONS_BY_ID[id])
    .filter((l): l is EnrichedAcademyLesson => Boolean(l));

  const checkpointQuestions: UnitCheckpointQuestion[] = lessons.slice(0, 3).map((l, idx) => ({
    id: `${c.courseId}-cp-q${idx + 1}`,
    question: `${l.id} · ${l.checkpoint.question}`,
    options: [
      {
        label: `Chiave corretta: ${l.checkpoint.expectedAnswer}`,
        value: "correct",
        isCorrect: true,
      },
      {
        label: `Errore comune: ${l.commonMistake.slice(0, 70)}...`,
        value: "mistake",
        isCorrect: false,
      },
      {
        label: "Riconoscimento passivo senza recupero autonomo",
        value: "passive",
        isCorrect: false,
      },
    ],
    explanation: `Criterio di padronanza (${l.id}): ${l.masteryCriterion}`,
  }));

  return {
    ...c,
    lessons,
    checkpointQuestions,
  };
});

export function createInitialLessonProgress(
  lesson: Pick<LessonEditorial, "id" | "contentVersion">
): AcademyLessonProgress {
  return {
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    status: "available",
    openedAt: null,
    readCompletedAt: null,
    skippedReadingToTest: false,
    practiceCompletedAt: null,
    practiceSummary: null,
    currentStepIndex: 0,
    completedStepIds: [],
    checkpointAttempts: 0,
    checkpointHintsUsed: 0,
    viewedAnswerBeforeAttempt: false,
    lastAttemptAnswer: null,
    lastAttemptCorrect: null,
    lastAttemptAt: null,
    provisionallyPassedAt: null,
    masteredAfterDelayAt: null,
    nextReviewDueAt: null,
    legacyMigratedFrom: [],
    attemptHistory: [],
    lastVerifiedBy: null,
    lastErrorCategory: null,
    lastRepairAction: null,
  };
}

export function createDefaultAcademyProgressMap(): AcademyProgressMap {
  const map: AcademyProgressMap = {};
  for (const lesson of ENRICHED_ACADEMY_LESSONS) {
    map[lesson.id] = createInitialLessonProgress(lesson);
  }
  return map;
}

export function createDefaultGamificationState(
  todayIsoDate: string = "2026-11-07"
): AcademyGamificationState {
  return {
    totalXp: 0,
    dailyGoalXp: 20,
    todayXp: 0,
    lastActivityDate: todayIsoDate,
    streakDays: 1,
    awardedXpEventIds: [],
    completedUnitCheckpoints: [],
    mistakeQueue: [],
    forwardEncodingCorrectCount: 0,
    forwardEncodingTotalCount: 0,
    reverseDecodingCorrectCount: 0,
    reverseDecodingTotalCount: 0,
    reviewsCompletedCount: 0,
    unlockedBadgeIds: [],
  };
}

export function resolveLocoLevel(totalXp: number): {
  current: LocoLevelDefinition;
  next: LocoLevelDefinition | null;
  progressPercent: number;
} {
  let current = LOCO_LEVELS[0];
  for (const lvl of LOCO_LEVELS) {
    if (totalXp >= lvl.minXp) {
      current = lvl;
    }
  }
  const nextIdx = LOCO_LEVELS.findIndex((l) => l.level === current.level) + 1;
  const next = nextIdx < LOCO_LEVELS.length ? LOCO_LEVELS[nextIdx] : null;
  if (!next) {
    return { current, next: null, progressPercent: 100 };
  }
  const span = next.minXp - current.minXp;
  const intoLevel = Math.max(0, totalXp - current.minXp);
  const progressPercent = Math.min(100, Math.round((intoLevel / span) * 100));
  return { current, next, progressPercent };
}

export function awardIdempotentXp(
  state: AcademyGamificationState,
  eventId: string,
  xpAmount: number,
  todayIsoDate: string = "2026-11-07"
): { updated: AcademyGamificationState; awardedNow: number } {
  if (state.awardedXpEventIds.includes(eventId) || xpAmount <= 0) {
    return { updated: state, awardedNow: 0 };
  }

  const isNewDay = state.lastActivityDate !== todayIsoDate;
  const nextTodayXp = isNewDay ? xpAmount : state.todayXp + xpAmount;
  const nextStreak = isNewDay ? state.streakDays + 1 : Math.max(1, state.streakDays);

  const updated: AcademyGamificationState = {
    ...state,
    totalXp: state.totalXp + xpAmount,
    todayXp: nextTodayXp,
    lastActivityDate: todayIsoDate,
    streakDays: nextStreak,
    awardedXpEventIds: [...state.awardedXpEventIds, eventId],
  };

  return { updated, awardedNow: xpAmount };
}

export function computeUnlockedBadgeIds(
  progressMap: AcademyProgressMap,
  gamification: AcademyGamificationState,
  totalLociInRoutes: number = 0
): string[] {
  const badges = new Set<string>(gamification.unlockedBadgeIds);

  const isPassed = (id: string) => {
    const st = progressMap[id]?.status;
    return st === "provisionally_passed" || st === "mastered_after_delay";
  };

  if (isPassed("F01")) {
    badges.add("badge-first-memory");
  }

  if (["F01", "F02", "F03", "F04", "F05"].every(isPassed) || isPassed("P03")) {
    badges.add("badge-first-palace");
  }

  if (isPassed("P06") || totalLociInRoutes >= 10) {
    badges.add("badge-10-loci");
  }

  if (gamification.reviewsCompletedCount >= 5) {
    badges.add("badge-5-reviews");
  }

  if (
    gamification.forwardEncodingCorrectCount >= 1 &&
    gamification.reverseDecodingCorrectCount >= 1
  ) {
    badges.add("badge-numbers-master");
  }

  const totalPassedCount = Object.values(progressMap).filter(
    (p) => p.status === "provisionally_passed" || p.status === "mastered_after_delay"
  ).length;
  if (gamification.completedUnitCheckpoints.length >= 1 && totalPassedCount >= 5) {
    badges.add("badge-memory-architect");
  }

  return Array.from(badges);
}

export function resolvePathNodeVisualState(
  lesson: EnrichedAcademyLesson,
  progressMap: AcademyProgressMap,
  activeUserTier: LessonTier = "free"
): { state: PathNodeVisualState; missingPrerequisites: string[] } {
  const prog = progressMap[lesson.id];
  const status = prog?.status ?? "available";

  if (status === "provisionally_passed" || status === "mastered_after_delay") {
    return { state: "completed", missingPrerequisites: [] };
  }
  if (status === "needs_review") {
    return { state: "needs_review", missingPrerequisites: [] };
  }

  // Check tier entitlement
  const tierOrder: Record<LessonTier, number> = { free: 0, plus: 1, pro: 2 };
  if (tierOrder[lesson.planTier] > tierOrder[activeUserTier]) {
    return { state: "premium", missingPrerequisites: [] };
  }

  if (
    (prog && prog.currentStepIndex > 0) ||
    status === "reading" ||
    status === "practice_done"
  ) {
    return { state: "in_progress", missingPrerequisites: [] };
  }

  const missingPrerequisites = lesson.prerequisites.filter((prereqId) => {
    const pStatus = progressMap[prereqId]?.status ?? "available";
    return (
      pStatus !== "provisionally_passed" &&
      pStatus !== "mastered_after_delay" &&
      pStatus !== "practice_done"
    );
  });

  if (missingPrerequisites.length > 0) {
    return { state: "locked", missingPrerequisites };
  }

  return { state: "available", missingPrerequisites: [] };
}

export function migrateLegacyCourseProgress(
  legacyCompletedLessonIds: string[],
  existingProgress?: AcademyProgressMap,
  nowIso: string = new Date().toISOString()
): AcademyProgressMap {
  const next: AcademyProgressMap = {
    ...createDefaultAcademyProgressMap(),
    ...(existingProgress ?? {}),
  };

  for (const legacyId of legacyCompletedLessonIds) {
    const mapping = LEGACY_LESSON_MAP[legacyId];
    if (!mapping) continue;

    for (const targetId of mapping.mappedLessonIds) {
      const lesson = ACADEMY_LESSONS_BY_ID[targetId];
      if (!lesson) continue;
      const current = next[targetId] ?? createInitialLessonProgress(lesson);
      const migratedSet = new Set([...current.legacyMigratedFrom, legacyId]);

      const nextStatus: LessonStatus =
        current.status === "available" ? "reading" : current.status;

      next[targetId] = {
        ...current,
        status: nextStatus,
        openedAt: current.openedAt ?? nowIso,
        readCompletedAt: current.readCompletedAt ?? nowIso,
        legacyMigratedFrom: Array.from(migratedSet),
      };
    }
  }

  return next;
}

export function evaluateLessonCheckpointAnswer(
  lesson: EnrichedAcademyLesson,
  userRawAnswer: string
): { isCorrect: boolean; feedback: string } {
  const cleaned = userRawAnswer.trim().toLowerCase().replace(/\.$/, "");
  if (!cleaned) {
    return {
      isCorrect: false,
      feedback: "Inserisci o seleziona una risposta prima di verificare.",
    };
  }

  const expectedClean = lesson.checkpoint.expectedAnswer
    .trim()
    .toLowerCase()
    .replace(/\.$/, "");

  if (cleaned === expectedClean) {
    return {
      isCorrect: true,
      feedback: `Risposta corretta! Chiave: ${lesson.checkpoint.expectedAnswer}`,
    };
  }

  const matchedKeywords = lesson.checkpointAcceptedKeywords.filter((kw) =>
    cleaned.includes(kw)
  );
  const threshold = Math.max(
    1,
    Math.ceil(lesson.checkpointAcceptedKeywords.length * 0.4)
  );
  const isCorrect = matchedKeywords.length >= threshold;

  return {
    isCorrect,
    feedback: isCorrect
      ? `Risposta coerente con la chiave («${lesson.checkpoint.expectedAnswer}»).`
      : `Risposta parziale o imprecisa. Chiave di riferimento: «${lesson.checkpoint.expectedAnswer}». Attenzione: ${lesson.commonMistake}`,
  };
}

export function recordAcademyCheckpointAttempt(
  current: AcademyLessonProgress,
  lesson: EnrichedAcademyLesson,
  params: {
    userAnswer: string;
    hintsUsedInAttempt: number;
    viewedAnswerBeforeAttempt: boolean;
    isDelayedFollowUp?: boolean;
    nowIso?: string;
  }
): {
  updated: AcademyLessonProgress;
  evaluation: { isCorrect: boolean; feedback: string; autonomousSuccess: boolean };
} {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const evalResult = evaluateLessonCheckpointAnswer(lesson, params.userAnswer);
  const autonomousSuccess =
    evalResult.isCorrect &&
    !params.viewedAnswerBeforeAttempt &&
    params.hintsUsedInAttempt === 0;

  let nextStatus: LessonStatus = current.status;
  let provisionallyPassedAt = current.provisionallyPassedAt;
  let masteredAfterDelayAt = current.masteredAfterDelayAt;
  let nextReviewDueAt = current.nextReviewDueAt;

  if (params.viewedAnswerBeforeAttempt) {
    nextStatus =
      current.status === "mastered_after_delay" ||
      current.status === "provisionally_passed"
        ? "needs_review"
        : current.practiceCompletedAt
          ? "practice_done"
          : "reading";
  } else if (autonomousSuccess) {
    const canPromoteToMastered =
      Boolean(current.provisionallyPassedAt) &&
      (params.isDelayedFollowUp === true || current.checkpointAttempts >= 1);

    if (canPromoteToMastered) {
      nextStatus = "mastered_after_delay";
      masteredAfterDelayAt = masteredAfterDelayAt ?? nowIso;
      const nextDate = new Date(Date.parse(nowIso) + 7 * 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    } else {
      nextStatus = "provisionally_passed";
      provisionallyPassedAt = provisionallyPassedAt ?? nowIso;
      const nextDate = new Date(Date.parse(nowIso) + 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    }
  } else if (evalResult.isCorrect && params.hintsUsedInAttempt > 0) {
    if (current.status === "available" || current.status === "reading") {
      nextStatus = current.practiceCompletedAt ? "practice_done" : "reading";
    }
  } else {
    nextStatus = "needs_review";
  }

  const updated: AcademyLessonProgress = {
    ...current,
    contentVersion: lesson.contentVersion,
    status: nextStatus,
    openedAt: current.openedAt ?? nowIso,
    checkpointAttempts: current.checkpointAttempts + 1,
    checkpointHintsUsed:
      current.checkpointHintsUsed + Math.max(0, params.hintsUsedInAttempt),
    viewedAnswerBeforeAttempt:
      current.viewedAnswerBeforeAttempt || params.viewedAnswerBeforeAttempt,
    lastAttemptAnswer: params.userAnswer,
    lastAttemptCorrect: evalResult.isCorrect,
    lastAttemptAt: nowIso,
    provisionallyPassedAt,
    masteredAfterDelayAt,
    nextReviewDueAt,
  };

  return {
    updated,
    evaluation: {
      ...evalResult,
      autonomousSuccess,
    },
  };
}

export function recordAcademyV2Attempt(
  current: AcademyLessonProgress,
  lesson: EnrichedAcademyLesson,
  evidence: AttemptEvidence,
  options?: {
    isDelayedFollowUp?: boolean;
    nowIso?: string;
  }
): {
  updated: AcademyLessonProgress;
  autonomousSuccess: boolean;
} {
  const nowIso = options?.nowIso ?? evidence.createdAt ?? new Date().toISOString();
  const autonomousSuccess =
    (evidence.verifiedBy === "deterministic" ||
      evidence.verifiedBy === "qualified_review") &&
    evidence.correct === true &&
    evidence.submittedBeforeReveal &&
    evidence.hintsUsed === 0 &&
    evidence.autonomousMasteryEligible;

  let nextStatus: LessonStatus = current.status;
  let provisionallyPassedAt = current.provisionallyPassedAt;
  let masteredAfterDelayAt = current.masteredAfterDelayAt;
  let nextReviewDueAt = current.nextReviewDueAt;
  let practiceCompletedAt = current.practiceCompletedAt;

  if (!evidence.submittedBeforeReveal) {
    nextStatus =
      current.status === "mastered_after_delay" ||
      current.status === "provisionally_passed"
        ? "needs_review"
        : practiceCompletedAt
          ? "practice_done"
          : "reading";
  } else if (autonomousSuccess) {
    const canPromoteToMastered =
      Boolean(current.provisionallyPassedAt) &&
      (options?.isDelayedFollowUp === true || current.checkpointAttempts >= 1);

    if (canPromoteToMastered) {
      nextStatus = "mastered_after_delay";
      masteredAfterDelayAt = masteredAfterDelayAt ?? nowIso;
      const nextDate = new Date(Date.parse(nowIso) + 7 * 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    } else {
      nextStatus = "provisionally_passed";
      provisionallyPassedAt = provisionallyPassedAt ?? nowIso;
      const nextDate = new Date(Date.parse(nowIso) + 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    }
  } else if (evidence.correct === true) {
    if (evidence.verifiedBy === "learner_self_check") {
      practiceCompletedAt = practiceCompletedAt ?? nowIso;
      nextStatus = "practice_done";
    } else if (evidence.hintsUsed > 0) {
      nextStatus = practiceCompletedAt ? "practice_done" : "reading";
    } else {
      nextStatus = "practice_done";
    }
  } else {
    nextStatus = "needs_review";
  }

  const history = Array.isArray(current.attemptHistory)
    ? [...current.attemptHistory, evidence]
    : [evidence];

  const updated: AcademyLessonProgress = {
    ...current,
    contentVersion: lesson.contentVersion,
    status: nextStatus,
    openedAt: current.openedAt ?? nowIso,
    practiceCompletedAt,
    practiceSummary: evidence.summaryHeadline,
    checkpointAttempts: current.checkpointAttempts + 1,
    checkpointHintsUsed:
      current.checkpointHintsUsed + Math.max(0, evidence.hintsUsed),
    viewedAnswerBeforeAttempt:
      current.viewedAnswerBeforeAttempt || !evidence.submittedBeforeReveal,
    lastAttemptAnswer:
      typeof evidence.submittedAnswer === "string"
        ? evidence.submittedAnswer
        : JSON.stringify(evidence.submittedAnswer),
    lastAttemptCorrect: evidence.correct,
    lastAttemptAt: nowIso,
    provisionallyPassedAt,
    masteredAfterDelayAt,
    nextReviewDueAt,
    attemptHistory: history,
    lastVerifiedBy: evidence.verifiedBy,
    lastErrorCategory: evidence.errorCategory,
    lastRepairAction: evidence.repairAction,
  };

  return {
    updated,
    autonomousSuccess,
  };
}

export function reconcileAcademyProgressVersion(
  record: AcademyLessonProgress,
  lesson: Pick<LessonEditorial, "contentVersion">
): AcademyLessonProgress {
  const normalized: AcademyLessonProgress = {
    ...record,
    currentStepIndex: typeof record.currentStepIndex === "number" ? record.currentStepIndex : 0,
    completedStepIds: Array.isArray(record.completedStepIds) ? record.completedStepIds : [],
    attemptHistory: Array.isArray(record.attemptHistory) ? record.attemptHistory : [],
    lastVerifiedBy: record.lastVerifiedBy ?? null,
    lastErrorCategory: record.lastErrorCategory ?? null,
    lastRepairAction: record.lastRepairAction ?? null,
  };

  if (normalized.contentVersion === lesson.contentVersion) {
    return normalized;
  }
  const demotedStatus: LessonStatus =
    normalized.status === "mastered_after_delay"
      ? "needs_review"
      : normalized.status;

  return {
    ...normalized,
    contentVersion: lesson.contentVersion,
    status: demotedStatus,
  };
}

export function computeAdaptiveAcademyRecommendations(diagnostics: {
  totalTrialsCount: number;
  viewedAnswerBeforeAttemptCount: number;
  locusOrderSwapCount: number;
  locusRecognizedButAnswerMissingCount: number;
  majorSoftHardConfusionCount: number;
  immediatePassDelayedFailCount: number;
  hintAssistedTrialsCount: number;
}): AdaptiveAcademyRecommendation[] {
  const recommendations: AdaptiveAcademyRecommendation[] = [];

  if (diagnostics.totalTrialsCount < 3) {
    recommendations.push({
      id: "rec-insufficient-sample",
      observedSignal: `Campione attuale ridotto (${diagnostics.totalTrialsCount} prove registrate)`,
      recommendedLessonIds: ["F01", "P01", "A01"],
      explanation:
        "Non ci sono ancora dati sufficienti per una diagnosi personalizzata affidabile. Completa un breve ciclo iniziale F01–F05 per raccogliere tentativi reali.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: false,
    });
    return recommendations;
  }

  if (diagnostics.viewedAnswerBeforeAttemptCount >= 1) {
    recommendations.push({
      id: "rec-recognition-vs-recall",
      observedSignal: `Risposta scoperta prima del tentativo in ${diagnostics.viewedAnswerBeforeAttemptCount} su ${diagnostics.totalTrialsCount} prove`,
      recommendedLessonIds: ["F01", "S01"],
      explanation:
        "Stai confondendo familiarità (riconoscimento) e recupero attivo. Ripassa F01 e S01 per allenare il tentativo a risposta nascosta.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.locusOrderSwapCount >= 1) {
    recommendations.push({
      id: "rec-locus-order-swap",
      observedSignal: `Inversione dell'ordine dei loci osservata (${diagnostics.locusOrderSwapCount} volte)`,
      recommendedLessonIds: ["P02", "P03", "P05"],
      explanation:
        "Quando due punti del palazzo si scambiano, non serve generare più immagini: rinforza la distinzione visiva e la regola di percorrenza in P02, P03 e P05.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.locusRecognizedButAnswerMissingCount >= 2) {
    recommendations.push({
      id: "rec-weak-cue-link",
      observedSignal: `Locus ricordato ma risposta assente in ${diagnostics.locusRecognizedButAnswerMissingCount} prove`,
      recommendedLessonIds: ["F04", "A01"],
      explanation:
        "Il punto spaziale tiene, ma l'immagine non contiene una chiave che riporti alla parola esatta. Lavora su indizi interpretabili in F04 e A01.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.majorSoftHardConfusionCount >= 1) {
    recommendations.push({
      id: "rec-major-6-7",
      observedSignal: `Confusione fonetica 6/7 (C/G dolci vs dure) in ${diagnostics.majorSoftHardConfusionCount} prove`,
      recommendedLessonIds: ["N02", "N03"],
      explanation:
        "Distinguere grafia e suono per C/G dolci (6: ciao, cera) e C/G dure (7: casa, coro) richiede l'allenamento fonetico di N02 e N03.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.immediatePassDelayedFailCount >= 1) {
    recommendations.push({
      id: "rec-spacing-drop",
      observedSignal: `Calo tra prova immediata e verifica a distanza (${diagnostics.immediatePassDelayedFailCount} target)`,
      recommendedLessonIds: ["S06", "E04"],
      explanation:
        "Una riuscita immediata non garantisce la tenuta dopo giorni. Dai priorità alle prove distribuite con S06 ed E04.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (
    diagnostics.hintAssistedTrialsCount >= 2 &&
    diagnostics.hintAssistedTrialsCount / diagnostics.totalTrialsCount >= 0.35
  ) {
    recommendations.push({
      id: "rec-hint-dependency",
      observedSignal: `Indizio richiesto in ${diagnostics.hintAssistedTrialsCount} prove su ${diagnostics.totalTrialsCount}`,
      recommendedLessonIds: ["F04", "A03"],
      explanation:
        "Gli indizi sbloccano lo studio ma riducono l'autonomia del richiamo. Rivedi come graduare gli aiuti in F04 e nella diagnosi di A03.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  return recommendations;
}
