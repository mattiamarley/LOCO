import rawCurriculum from "./loco-academy-lessons.json" with { type: "json" };
import {
  ACADEMY_V2_MISSIONS,
  ACADEMY_V2_SCHEMA_VERSION,
  ERROR_DIAGNOSIS_CATALOG,
  MAJOR_IT_V1_VERIFIED_LEXICON_V2,
  RAW_PLAYER_CONTENT_V2,
  encodeItalianWordToMajorDigitsV2,
  type AssessmentMode,
  type AttemptEvidence,
  type ErrorDiagnosisCategory,
  type LessonGradingReliability,
  type V2LessonMissionSpec,
  type VerificationAuthority,
} from "./loco-academy-engine-v2.ts";

export {
  ACADEMY_V2_MISSIONS,
  ACADEMY_V2_SCHEMA_VERSION,
  ERROR_DIAGNOSIS_CATALOG,
  RAW_PLAYER_CONTENT_V2,
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

/**
 * Gli 8 stage canonici di LOCO Academy 2.0 (`06_PROMPT_ARGON_FINAL.md`)
 * più i 12 tipi di esercizi di compatibilità.
 */
export type InteractiveStepType =
  | "hook"
  | "explanation"
  | "expert_walkthrough"
  | "demonstration"
  | "guided_practice"
  | "independent_challenge"
  | "diagnostic_feedback"
  | "reflection_and_next"
  | "multiple_choice" // A. Multiple Choice
  | "matching_pairs" // B. Matching Pairs
  | "sequence_ordering" // C. Sequence Ordering
  | "memory_flash" // D. Memory Flash
  | "fill_in_blank" // E. Fill in the Blank
  | "free_recall" // F. Free Recall (risposta nascosta)
  | "image_association" // G. Image Association
  | "loci_placement" // H. Loci Placement (in-scene)
  | "mnemonic_builder" // I. Mnemonic Builder (concetto + immagine + azione + luogo)
  | "error_correction" // J. Error Correction
  | "number_encoding" // K. Number Encoding (Major forward: numero -> parola)
  | "reverse_decoding"; // L. Reverse Decoding (Major reverse: parola -> numero)

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
  // Configurazioni specifiche per i 12 tipi di esercizio + v2 stages
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
  // LOCO Academy 2.0 fields (`04_LESSONS_PLAYER_CONTENT.json` + `05_GAME_ENGINE_SPEC.md`)
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
  // Stato persistente dello step corrente per uscire e riprendere a metà lezione
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
  // LOCO Academy 2.0 AttemptEvidence audit trail (`05_GAME_ENGINE_SPEC.md`)
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
  awardedXpEventIds: string[]; // Impedisce XP duplicati al refresh o riapertura
  completedUnitCheckpoints: string[]; // es. ["course-0", "course-1"]
  mistakeQueue: AcademyMistakeItem[];
  forwardEncodingCorrectCount: number;
  forwardEncodingTotalCount: number;
  reverseDecodingCorrectCount: number;
  reverseDecodingTotalCount: number;
  reviewsCompletedCount: number;
  unlockedBadgeIds: string[];
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
    description: "Muovi i primi passi tra riconoscimento, richiamo attivo e primi loci.",
  },
  {
    level: 2,
    title: "Costruttore",
    minXp: 50,
    maxXp: 149,
    mascotAsset: "/assets/figma-curated/academy-mascot-tablet.svg",
    description: "Costruisci percorsi stabili, catene Linked e associazioni d'azione chiare.",
  },
  {
    level: 3,
    title: "Architetto",
    minXp: 150,
    maxXp: 299,
    mascotAsset: "/assets/figma-curated/academy-mascot-elephant.svg",
    description: "Progetti palazzi strutturati, domini la conversione fonetica e il ripasso distribuito.",
  },
  {
    level: 4,
    title: "Mnemonista",
    minXp: 300,
    maxXp: 499,
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
    description: "Padroneggi codifica e decodifica rapida, diagnostica degli errori e trasferimento.",
  },
  {
    level: 5,
    title: "Maestro dei Loci",
    minXp: 500,
    maxXp: null,
    mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg",
    description: "Massima autonomia tra studio profondo, palazzi complessi e verifica nel tempo.",
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
    title: "Primo ricordo",
    description: "Completa la tua prima lezione interattiva (S01) con prova di recupero a risposta nascosta.",
    asset: "/assets/figma-curated/academy-item-lightbulb.svg",
  },
  {
    id: "badge-first-palace",
    title: "Primo palazzo completato",
    description: "Completa tutte le 6 tappe dell'Unità 1 (S01–S06) costruendo il tuo primo percorso di 5 loci.",
    asset: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  {
    id: "badge-10-loci",
    title: "10 loci creati",
    description: "Completa la costruzione guidata del percorso da 10 loci (L06) o posiziona 10 loci nei tuoi palazzi.",
    asset: "/assets/figma-curated/academy-item-bookshelf.svg",
  },
  {
    id: "badge-5-reviews",
    title: "5 ripassi effettuati",
    description: "Svolgi almeno 5 sessioni di ripasso attivo (Errori o Coda Ripassi) consolidando i ricordi.",
    asset: "/assets/figma-curated/academy-item-clock.svg",
  },
  {
    id: "badge-numbers-master",
    title: "Numeri senza segreti",
    description: "Supera con successo prove Major System sia in codifica (Numero→Parola) sia in decodifica (Parola→Numero).",
    asset: "/assets/figma-curated/academy-head-headphones.svg",
  },
  {
    id: "badge-memory-architect",
    title: "Architetto della memoria",
    description: "Supera almeno un Checkpoint di fine unità e completa 5 lezioni della LOCO Academy.",
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
    editorialName: rawCurriculum.tierNaming.free,
    shortBadge: "LOCOMPRO DOPO · Free",
    description:
      "32 lezioni di base e applicative: percorso iniziale completo, Metodo dei Loci, Linked Method, Conversione Fonetica, metodo di studio, ripasso essenziale, XP e badge.",
    isPaidHypothesis: false,
    featuresList: [
      "32 microlezioni interattive (Unità 1–6)",
      "Costruzione del primo palazzo e associazioni personali",
      "Motore Blind Recall e coda ripassi essenziale senza blocchi",
      "Progressione XP, livelli LOCO, streak e 6 badge verificabili",
    ],
  },
  plus: {
    code: "plus",
    editorialName: rawCurriculum.tierNaming.plus,
    shortBadge: "POCO LOCO · Plus",
    description:
      "Tutte le 32 lezioni Free + 20 lezioni avanzate (Unità 7–11): palazzi da 25 loci, sistema 00–99 e PAO, strategia esami, spazi avanzati e Palestra dei Campioni.",
    isPaidHypothesis: true,
    featuresList: [
      "Tutte le 32 lezioni Free + 20 lezioni avanzate (Unità 7–11)",
      "Architettura di palazzi da 25+ loci e sottopercorsi per capitoli",
      "Maestria numerica: dizionario 00–99, Peg System e PAO",
      "Stratega degli esami e Palestra dei Campioni con diagnostica avanzata",
    ],
  },
  pro: {
    code: "pro",
    editorialName: rawCurriculum.tierNaming.pro,
    shortBadge: "PRO LOCO · Pro",
    description:
      "Tutte le 52 lezioni precedenti + 4 laboratori AI Memory Studio (Unità 12): verifica critica delle fonti estratte, modifica indizi, tutor socratico e audit delle raccomandazioni.",
    isPaidHypothesis: true,
    featuresList: [
      "Tutte le 52 lezioni Free & POCO LOCO + 4 laboratori AI Memory Studio",
      "Laboratorio di verifica critica su target estratti da documenti",
      "Personalizzazione assistita degli indizi e Tutor Socratico graduato",
      "Nota trasparenza: i laboratori mock sono giocabili; le API AI live richiederanno quote dedicate",
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
    primaryLessonId: "S01",
    mappedLessonIds: ["S01", "L01"],
    migrationNote: "Redirect editoriale a S01 (Conoscere non è ricordare) + L01",
  },
  "c1-l2": {
    legacyId: "c1-l2",
    legacyTitle: "Introduzione alla tecnica dei Loci",
    legacyCourseId: 1,
    primaryLessonId: "S03",
    mappedLessonIds: ["S03", "L02"],
    migrationNote: "Mappato a S03 (Il tuo primo percorso) + L02",
  },
  "c1-l3": {
    legacyId: "c1-l3",
    legacyTitle: "Come utilizzare la tecnica dei Loci",
    legacyCourseId: 1,
    primaryLessonId: "S04",
    mappedLessonIds: ["S04", "L04", "L06"],
    migrationNote: "Mappato a S04 (Fai succedere qualcosa) + L04 + L06",
  },
  "c2-l1": {
    legacyId: "c2-l1",
    legacyTitle: "Introduzione al Linked Method",
    legacyCourseId: 2,
    primaryLessonId: "K01",
    mappedLessonIds: ["K01"],
    migrationNote: "Mappato a K01 (La prima immagine chiama la seconda)",
  },
  "c2-l2": {
    legacyId: "c2-l2",
    legacyTitle: "Come creare storie",
    legacyCourseId: 2,
    primaryLessonId: "K02",
    mappedLessonIds: ["K02"],
    migrationNote: "Mappato a K02 (Storie brevi, legami forti)",
  },
  "c2-l3": {
    legacyId: "c2-l3",
    legacyTitle: "Come utilizzare il Linked Method",
    legacyCourseId: 2,
    primaryLessonId: "K03",
    mappedLessonIds: ["K03"],
    migrationNote: "Mappato a K03 (Loci o storie? Scegli con criterio)",
  },
  "c3-l1": {
    legacyId: "c3-l1",
    legacyTitle: "Introduzione alla conversione fonetica",
    legacyCourseId: 3,
    primaryLessonId: "N01",
    mappedLessonIds: ["N01"],
    migrationNote: "Mappato a N01 (Perché un numero può diventare un'immagine)",
  },
  "c3-l2": {
    legacyId: "c3-l2",
    legacyTitle: "Come imparare l'alfabeto numerico",
    legacyCourseId: 3,
    primaryLessonId: "N02",
    mappedLessonIds: ["N02"],
    migrationNote: "Mappato a N02 (Le dieci famiglie di suoni · major-it-v1)",
  },
  "c3-l3": {
    legacyId: "c3-l3",
    legacyTitle: "Come utilizzare la conversione",
    legacyCourseId: 3,
    primaryLessonId: "N03",
    mappedLessonIds: ["N03", "N04"],
    migrationNote: "Mappato a N03 (Dai numeri alle parole) + N04 (Dalle parole ai numeri)",
  },
};

const COURSE_METADATA: Record<
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
  "course-0": {
    unitNumber: 1,
    unitTitle: "UNITÀ 1 — Risveglia la memoria",
    subtitle: "Il tuo primo ricordo: 6 tappe interattive mentre costruisci il primo percorso di 5 loci",
    theme: "onboarding",
    planTier: "free",
    entrySuggestion: "Prima apertura",
    unlockPolicy: "Percorso iniziale guidato",
    mascotAsset: "/assets/figma-curated/academy-scene-relax-night.svg",
  },
  "course-1": {
    unitNumber: 2,
    unitTitle: "UNITÀ 2 — Il tuo primo palazzo",
    subtitle: "Tecnica dei Loci: scelta dell'ambiente, distinzione dei punti, ordine e percorso da 10",
    theme: "loci",
    planTier: "free",
    entrySuggestion: "Dopo S06",
    unlockPolicy: "Sblocco progressivo o libero da catalogo",
    mascotAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
  },
  "course-2": {
    unitNumber: 3,
    unitTitle: "UNITÀ 3 — Storie che non dimentichi",
    subtitle: "Linked Method: catene associative brevi, legami forti e riparazione di un anello mancante",
    theme: "linked",
    planTier: "free",
    entrySuggestion: "Prima lista lunga",
    unlockPolicy: "Libero dopo S04",
    mascotAsset: "/assets/figma-curated/academy-mascot-cat.svg",
  },
  "course-3": {
    unitNumber: 4,
    unitTitle: "UNITÀ 4 — Numeri che diventano immagini",
    subtitle: "Conversione fonetica major-it-v1: dalle 10 famiglie di suoni alle date storiche verificabili",
    theme: "numbers",
    planTier: "free",
    entrySuggestion: "Obiettivo: date e cifre",
    unlockPolicy: "Allenamento fonetico bidirezionale",
    mascotAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
  },
  "course-4": {
    unitNumber: 5,
    unitTitle: "UNITÀ 5 — Dalla memoria alla conoscenza",
    subtitle: "Comprensione, chunking, domande che insegnano, feedback diagnostico e ripasso distribuito",
    theme: "study",
    planTier: "free",
    entrySuggestion: "Primo progetto di studio",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-library.svg",
  },
  "course-5": {
    unitNumber: 6,
    unitTitle: "UNITÀ 6 — LOCO nella vita reale",
    subtitle: "Discorsi senza fogli, vocaboli stranieri con parola-ponte, commissioni e nomi/volti",
    theme: "real-life",
    planTier: "free",
    entrySuggestion: "Scegliere un uso concreto",
    unlockPolicy: "Sempre disponibile gratuitamente",
    mascotAsset: "/assets/figma-curated/academy-scene-runner.svg",
  },
  "course-6": {
    unitNumber: 7,
    unitTitle: "UNITÀ 7 — Architetto dei palazzi",
    subtitle: "Palazzi da 25 loci, riuso ordinato, sottopercorsi per capitoli e diagnostica delle confusioni",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Dopo percorso da 10 loci",
    unlockPolicy: "POCO LOCO · Anteprima e lezioni giocabili",
    mascotAsset: "/assets/figma-curated/academy-mascot-elephant.svg",
  },
  "course-7": {
    unitNumber: 8,
    unitTitle: "UNITÀ 8 — Maestria numerica: Peg e PAO",
    subtitle: "Dizionario 00–99, Peg System, Person-Action-Object e gestione delle interferenze",
    theme: "numbers",
    planTier: "plus",
    entrySuggestion: "Dopo Major System di base",
    unlockPolicy: "POCO LOCO · Allenamento numerico avanzato",
    mascotAsset: "/assets/figma-curated/academy-head-headphones.svg",
  },
  "course-8": {
    unitNumber: 9,
    unitTitle: "UNITÀ 9 — Stratega dello studio",
    subtitle: "Dal capitolo alle domande verificabili, esame orale/scritto, triage e trasferimento",
    theme: "study",
    planTier: "plus",
    entrySuggestion: "Quando prepari un esame reale",
    unlockPolicy: "POCO LOCO · Strategia d'esame",
    mascotAsset: "/assets/figma-curated/academy-mascot-tablet.svg",
  },
  "course-9": {
    unitNumber: 10,
    unitTitle: "UNITÀ 10 — Spazi del mondo",
    subtitle: "Luoghi familiari vs online, Street View, foto/3D della stanza e manutenzione dei percorsi",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Creazione di palazzo avanzato",
    unlockPolicy: "POCO LOCO · Demo locale senza API Maps live",
    mascotAsset: "/assets/figma-curated/academy-scene-explorer.svg",
  },
  "course-10": {
    unitNumber: 11,
    unitTitle: "UNITÀ 11 — Palestra dei campioni",
    subtitle: "Allenamento deliberato, velocità vs precisione, carte/sequenze e auto-coaching su evidenze",
    theme: "training",
    planTier: "plus",
    entrySuggestion: "Dopo più sessioni di studio",
    unlockPolicy: "POCO LOCO · Metriche con campione dichiarato",
    mascotAsset: "/assets/figma-curated/academy-mascot-lion.svg",
  },
  "course-11": {
    unitNumber: 12,
    unitTitle: "UNITÀ 12 — AI Memory Studio",
    subtitle: "Verifica critica delle fonti estratte, modifica indizi AI, tutor socratico e lettura suggerimenti",
    theme: "ai-studio",
    planTier: "pro",
    entrySuggestion: "Uso critico e controllato dell'AI",
    unlockPolicy: "PRO LOCO · Laboratori mock giocabili",
    mascotAsset: "/assets/figma-curated/academy-scene-zen-room.svg",
  },
};

function resolveRuntimeExerciseKind(lessonId: string): {
  kind: RuntimeExerciseKind;
  requiresSimulatedFallbackNotice: boolean;
  fallbackNoticeText: string | null;
} {
  if (lessonId === "S01") {
    return { kind: "s01-recognition-recall-switch", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "S02") {
    return { kind: "s02-target-question-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "S03") {
    return { kind: "s03-five-locus-scene-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "S04") {
    return { kind: "s04-action-association-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "S05") {
    return { kind: "s05-blind-recall-simulation", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId === "S06") {
    return { kind: "s06-due-queue-scheduler", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("L")) {
    return { kind: "loci-scene-lab", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("K")) {
    return { kind: "linked-chain-builder", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("N") || lessonId.startsWith("Q")) {
    return { kind: "major-phonetic-drill", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("T") || lessonId.startsWith("R")) {
    return { kind: "study-comprehension-lab", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("X")) {
    return { kind: "real-life-application", requiresSimulatedFallbackNotice: false, fallbackNoticeText: null };
  }
  if (lessonId.startsWith("W")) {
    return {
      kind: "guided-simulation-fallback",
      requiresSimulatedFallbackNotice: true,
      fallbackNoticeText:
        "Modalità Demo / Alternativa Manuale: l'integrazione live con Google Street View API e scansione 3D non è attiva in questo ambiente. L'esercizio utilizza la scena 3D locale e la modalità testuale accessibile.",
    };
  }
  if (lessonId.startsWith("A")) {
    return {
      kind: "guided-simulation-fallback",
      requiresSimulatedFallbackNotice: true,
      fallbackNoticeText:
        "Laboratorio Mock AI Memory Studio: l'estrazione automatica da PDF e il coach LLM live non sono attivi senza API/quote configurate. Puoi svolgere l'intero esercizio di revisione critica su schede e indizi simulati.",
    };
  }
  return {
    kind: "guided-simulation-fallback",
    requiresSimulatedFallbackNotice: true,
    fallbackNoticeText:
      "Esercizio guidato in modalità locale/manuale: svolgi la prova pratica e verifica la risposta nascosta senza dipendere da servizi esterni.",
  };
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

  const q = lesson.checkpoint.question;
  if (expectedClean === "a" || expectedClean === "b") {
    const matchA = q.match(/A\s*«([^»]+)»/i);
    const matchB = q.match(/B\s*«([^»]+)»/i);
    return {
      acceptedKeywords: [expectedClean],
      options: [
        { label: matchA ? `A — «${matchA[1]}»` : "Opzione A", value: "A" },
        { label: matchB ? `B — «${matchB[1]}»` : "Opzione B", value: "B" },
      ],
      progressiveHint: `Rileggi il criterio chiave: evita l'errore tipico (${lesson.commonMistake})`,
    };
  }

  if (expectedClean === "no" || expectedClean === "sì" || expectedClean === "si") {
    return {
      acceptedKeywords: expectedClean === "no" ? ["no", "falso", "non"] : ["sì", "si", "vero", "certo"],
      options: [
        { label: "Sì", value: "sì" },
        { label: "No", value: "no" },
      ],
      progressiveHint: `Pensa alla distinzione spiegata nella lezione: attenzione a non ${lesson.commonMistake}`,
    };
  }

  if (expectedClean === "6") {
    return {
      acceptedKeywords: ["6", "sei"],
      options: [
        { label: "6 (C/G dolce: ciao, gelato)", value: "6" },
        { label: "7 (C/G dura: casa, mago)", value: "7" },
      ],
      progressiveHint: "Ascolta il suono iniziale di «ciao»: è un suono palatale dolce (/tʃ/) o gutturale duro (/k/)?",
    };
  }

  if (expectedClean.startsWith("no, 37")) {
    return {
      acceptedKeywords: ["37", "no, 37", "no 37", "trentasette"],
      options: [
        { label: "Sì, corrisponde a 36", value: "36" },
        { label: "No, corrisponde a 37 (M=3, G dura=7)", value: "no, 37" },
      ],
      progressiveHint: "Pronuncia «mago» ad alta voce: la G davanti alla O è dura (/g/) o dolce (/dʒ/)?",
    };
  }

  const stopWords = new Set([
    "che",
    "del",
    "della",
    "delle",
    "dei",
    "degli",
    "con",
    "per",
    "una",
    "uno",
    "gli",
    "nel",
    "nella",
    "sul",
    "sulla",
    "sono",
    "come",
    "più",
    "piu",
    "suo",
    "sua",
    "non",
  ]);
  const tokens = expectedClean
    .split(/[^a-z0-9àèéìòù]+/i)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  return {
    acceptedKeywords: tokens.length > 0 ? tokens : [expectedClean],
    progressiveHint: `Concentrati su: ${lesson.masteryCriterion} (evita: ${lesson.commonMistake})`,
  };
}

/**
 * Scompone la spiegazione in un estratto breve (40–85 parole) + testo completo espandibile,
 * così da evitare muri di testo nelle schermate pur preservando il 100% del testo editoriale.
 */
function splitShortAndFullReading(reading: string): { shortText: string; fullText: string } {
  const sentences = reading.match(/[^.!?]+[.!?]+/g) ?? [reading];
  const shortSentences = sentences.slice(0, 2).join(" ").trim();
  return {
    shortText: shortSentences || reading,
    fullText: reading,
  };
}

const DEFAULT_ROOM_OBJECTS = [
  { id: "loc-porta", label: "Porta d'ingresso", asset: "/assets/figma-curated/academy-item-lightbulb.svg", zone: "Ingresso Nord" },
  { id: "loc-lampada", label: "Lampada da tavolo", asset: "/assets/figma-curated/academy-item-lamp.svg", zone: "Scrivania" },
  { id: "loc-sgabello", label: "Sgabello giallo", asset: "/assets/figma-curated/academy-item-stool.svg", zone: "Centro stanza" },
  { id: "loc-libreria", label: "Libreria a parete", asset: "/assets/figma-curated/academy-item-bookshelf.svg", zone: "Parete Est" },
  { id: "loc-acquario", label: "Boccia con pesce", asset: "/assets/figma-curated/academy-item-fishbowl.svg", zone: "Mensola Sud" },
];

interface RawPlayerLessonStep {
  stepId?: string;
  type: string;
  title?: string;
  studentText?: string;
  body?: string;
  bullets?: string[];
  prompt?: string;
  interactive?: Record<string, unknown>;
}

interface RawPlayerLesson {
  id: string;
  legacyId?: string;
  courseId: string;
  courseName: string;
  title: string;
  previousTitle?: string;
  tier: string;
  estimatedMinutes?: number;
  prerequisites?: string[];
  contentVersion?: string;
  lessonKind?: string;
  learningTarget?: string;
  learningObjective?: string;
  masteryCriterion?: string;
  masteryGate?: string;
  pitfall?: string;
  commonMistake?: string;
  commonMistakes?: string[];
  skillType?: string;
  expertExplanation?: string;
  steps: RawPlayerLessonStep[];
  game?: Record<string, unknown>;
}

const V2_LESSONS_BY_ID: Record<string, RawPlayerLesson> = Object.fromEntries(
  (RAW_PLAYER_CONTENT_V2.lessons as unknown as RawPlayerLesson[]).map((l) => [l.id, l])
);

const STAGE_LABELS_IT: Record<string, string> = {
  hook: "STAGE 1 · SFIDA INIZIALE (HOOK)",
  explanation: "STAGE 2 · IL PRINCIPIO SCIENTIFICO",
  expert_walkthrough: "STAGE 3 · RAGIONAMENTO DELL'ESPERTO",
  demonstration: "STAGE 4 · DIMOSTRAZIONE CONCRETA",
  guided_practice: "STAGE 5 · PRATICA GUIDATA (SET A)",
  independent_challenge: "STAGE 6 · PROVA VERA AUTONOMA (SET B)",
  diagnostic_feedback: "STAGE 7 · DIAGNOSI E RIPARAZIONE",
  reflection_and_next: "STAGE 8 · CONSOLIDAMENTO E PASSO SUCCESSIVO",
};

const STAGE_ILLUSTRATIONS: Record<string, string> = {
  hook: "/assets/figma-curated/academy-scene-relax-night.svg",
  explanation: "/assets/figma-curated/academy-mascot-zen-book.svg",
  expert_walkthrough: "/assets/figma-curated/academy-mascot-tablet.svg",
  demonstration: "/assets/figma-curated/academy-scene-study-desk.svg",
  guided_practice: "/assets/figma-curated/academy-item-lamp.svg",
  independent_challenge: "/assets/figma-curated/academy-mascot-goose.svg",
  diagnostic_feedback: "/assets/figma-curated/academy-mascot-lion.svg",
  reflection_and_next: "/assets/figma-curated/academy-scene-explorer.svg",
};

/**
 * LESSON ENGINE 2.0: costruisce gli 8 stage canonici di ciascuna delle 56 lezioni
 * a partire da `04_LESSONS_PLAYER_CONTENT.json` (`RAW_PLAYER_CONTENT_V2`) e
 * dalla missione dedicata in `ACADEMY_V2_MISSIONS` (`05_GAME_ENGINE_SPEC.md`).
 * Nessun template generico identico viene usato per le 56 lezioni.
 */
export function buildInteractiveStepsForLesson(
  lesson: LessonEditorial,
  cpMeta: { acceptedKeywords: string[]; options?: { label: string; value: string }[]; progressiveHint: string },
  fallbackNoticeText?: string | null
): LessonStepSpec[] {
  const v2Raw = V2_LESSONS_BY_ID[lesson.id];
  const mission = ACADEMY_V2_MISSIONS[lesson.id];

  if (v2Raw && Array.isArray(v2Raw.steps) && v2Raw.steps.length === 8) {
    return v2Raw.steps.map((rawStep, idx) => {
      const stepType = rawStep.type as InteractiveStepType;
      const rawBody =
        typeof rawStep.body === "string"
          ? rawStep.body
          : Array.isArray(rawStep.bullets)
            ? rawStep.bullets.map((b: string) => `• ${b}`).join("\n")
            : typeof rawStep.prompt === "string"
              ? rawStep.prompt
              : lesson.reading;

      const { shortText, fullText } = splitShortAndFullReading(rawBody);
      const isExplanation = stepType === "explanation";

      return {
        stepId: rawStep.stepId || `${lesson.id}-step-${idx + 1}`,
        stepIndex: idx,
        type: stepType,
        stageLabel:
          STAGE_LABELS_IT[rawStep.type] ??
          `STAGE ${idx + 1} · ${rawStep.type.toUpperCase()}`,
        title: rawStep.title || `${lesson.id} · ${lesson.title}`,
        bodyText: isExplanation ? shortText : rawBody,
        expandableFullText:
          isExplanation && fullText.length > shortText.length ? fullText : undefined,
        illustrationAsset:
          STAGE_ILLUSTRATIONS[rawStep.type] ??
          "/assets/figma-curated/academy-mascot-goose.svg",
        scientificNote:
          stepType === "demonstration" && fallbackNoticeText
            ? fallbackNoticeText
            : stepType === "diagnostic_feedback" && Array.isArray(rawStep.bullets)
              ? rawStep.bullets.join(" · ")
              : undefined,
        options:
          stepType === "demonstration" && mission
            ? mission.demonstrationOptions.map((o) => ({
                id: o.id,
                label: o.label,
                isCorrect: o.isCorrect,
                explanation: mission.demonstrationModelReveal,
              }))
            : undefined,
        freeRecallPrompt:
          stepType === "independent_challenge"
            ? {
                question: mission?.independentPrompt ?? lesson.checkpoint.question,
                expectedAnswer: lesson.checkpoint.expectedAnswer,
                acceptedKeywords: cpMeta.acceptedKeywords,
                progressiveHint:
                  mission?.progressiveHints[0] ?? cpMeta.progressiveHint,
              }
            : undefined,
        explanationOnSuccess:
          mission?.demonstrationModelReveal ?? lesson.masteryCriterion,
        explanationOnMistake: `Evita l'errore tipico: ${lesson.commonMistake}`,
      };
    });
  }

  // Fallback di sicurezza se un ID non fosse nel file v2
  const { shortText, fullText } = splitShortAndFullReading(lesson.reading);
  return [
    {
      stepId: `${lesson.id}-step-1`,
      stepIndex: 0,
      type: "hook",
      stageLabel: STAGE_LABELS_IT.hook,
      title: `${lesson.id} · ${lesson.title}`,
      bodyText: lesson.reading,
      illustrationAsset: STAGE_ILLUSTRATIONS.hook,
      explanationOnSuccess: lesson.masteryCriterion,
      explanationOnMistake: lesson.commonMistake,
    },
    {
      stepId: `${lesson.id}-step-2`,
      stepIndex: 1,
      type: "explanation",
      stageLabel: STAGE_LABELS_IT.explanation,
      title: "Perché funziona",
      bodyText: shortText,
      expandableFullText: fullText,
      illustrationAsset: STAGE_ILLUSTRATIONS.explanation,
      explanationOnSuccess: lesson.masteryCriterion,
      explanationOnMistake: lesson.commonMistake,
    },
  ];
}

export const RAW_ACADEMY_LESSONS: LessonEditorial[] = (
  rawCurriculum.lessons as LessonEditorial[]
).map((v1Lesson) => {
  const v2 = V2_LESSONS_BY_ID[v1Lesson.id];
  if (!v2) return v1Lesson;

  const stepByType = Object.fromEntries(v2.steps.map((s) => [s.type, s]));
  const explanationText =
    typeof stepByType.explanation?.body === "string"
      ? stepByType.explanation.body
      : v1Lesson.reading;
  const walkthroughText =
    typeof stepByType.expert_walkthrough?.body === "string"
      ? stepByType.expert_walkthrough.body
      : "";
  const demoText =
    typeof stepByType.demonstration?.body === "string"
      ? stepByType.demonstration.body
      : v1Lesson.workedExample;
  const guidedPrompt =
    typeof stepByType.guided_practice?.prompt === "string"
      ? stepByType.guided_practice.prompt
      : v1Lesson.exercise.prompt;
  const challengePrompt =
    typeof stepByType.independent_challenge?.prompt === "string"
      ? stepByType.independent_challenge.prompt
      : v1Lesson.checkpoint.question;
  const commonMistakesJoined =
    Array.isArray(v2.commonMistakes) && v2.commonMistakes.length > 0
      ? v2.commonMistakes.join(" · ")
      : v1Lesson.commonMistake;

  return {
    ...v1Lesson,
    title: v2.title || v1Lesson.title,
    contentVersion: v2.contentVersion || ACADEMY_V2_SCHEMA_VERSION,
    planTier: (v2.tier as LessonTier) || v1Lesson.planTier,
    prerequisites: Array.isArray(v2.prerequisites)
      ? v2.prerequisites
      : v1Lesson.prerequisites,
    estimatedMinutes:
      typeof v2.estimatedMinutes === "number"
        ? v2.estimatedMinutes
        : v1Lesson.estimatedMinutes,
    reading: explanationText,
    workedExample: walkthroughText
      ? `${walkthroughText}\n\n${demoText}`
      : demoText,
    exercise: {
      prompt: guidedPrompt,
      mode: v2.skillType || v1Lesson.exercise.mode,
    },
    checkpoint: {
      question: challengePrompt,
      expectedAnswer: v1Lesson.checkpoint.expectedAnswer,
    },
    masteryCriterion: v2.masteryGate || v1Lesson.masteryCriterion,
    commonMistake: commonMistakesJoined,
  };
});

export const ENRICHED_ACADEMY_LESSONS: EnrichedAcademyLesson[] =
  RAW_ACADEMY_LESSONS.map((lesson) => {
    const v2 = V2_LESSONS_BY_ID[lesson.id];
    const mission = ACADEMY_V2_MISSIONS[lesson.id];
    const courseMeta = COURSE_METADATA[lesson.courseId] ?? {
      unitNumber: 1,
      unitTitle: lesson.courseName,
      subtitle: lesson.courseName,
      theme: "study" as AcademyTheme,
      planTier: lesson.planTier,
      entrySuggestion: "Libero",
      unlockPolicy: "Libero",
      mascotAsset: "/assets/figma-curated/academy-mascot-goose.svg",
    };
    const courseNum = Number(lesson.courseId.replace("course-", "")) || 0;
    const runtimeSpec = resolveRuntimeExerciseKind(lesson.id);
    const cpMeta = buildCheckpointMetadata(lesson);
    const steps = buildInteractiveStepsForLesson(
      lesson,
      cpMeta,
      runtimeSpec.fallbackNoticeText
    );
    const stepByType = v2
      ? Object.fromEntries(v2.steps.map((s) => [s.type, s]))
      : {};

    return {
      ...lesson,
      theme: courseMeta.theme,
      courseNumber: courseNum,
      unitNumber: courseMeta.unitNumber,
      unitTitle: courseMeta.unitTitle,
      runtimeExerciseKind: runtimeSpec.kind,
      requiresSimulatedFallbackNotice: runtimeSpec.requiresSimulatedFallbackNotice,
      fallbackNoticeText: runtimeSpec.fallbackNoticeText,
      checkpointAcceptedKeywords: cpMeta.acceptedKeywords,
      checkpointOptions: cpMeta.options,
      progressiveHint:
        mission?.progressiveHints[0] ?? cpMeta.progressiveHint,
      steps,
      v2Mission: mission,
      v2LearningObjective: v2?.learningObjective ?? lesson.masteryCriterion,
      v2SkillType: v2?.skillType ?? lesson.exercise.mode,
      v2ExpertWalkthrough:
        typeof stepByType.expert_walkthrough?.body === "string"
          ? stepByType.expert_walkthrough.body
          : lesson.workedExample,
      v2CommonMistakes: Array.isArray(v2?.commonMistakes)
        ? v2.commonMistakes
        : [lesson.commonMistake],
      gradingReliability:
        mission?.gradingReliability ?? "deterministic_verified",
    };
  });

export const ACADEMY_LESSONS_BY_ID: Record<string, EnrichedAcademyLesson> =
  Object.fromEntries(ENRICHED_ACADEMY_LESSONS.map((l) => [l.id, l]));

export const ACADEMY_COURSES: AcademyCourse[] = rawCurriculum.courses.map((c) => {
  const meta = COURSE_METADATA[c.courseId] ?? {
    unitNumber: c.courseNumber + 1,
    unitTitle: `UNITÀ ${c.courseNumber + 1} — ${c.title}`,
    subtitle: c.title,
    theme: "study" as AcademyTheme,
    planTier: "free" as LessonTier,
    entrySuggestion: "Libero",
    unlockPolicy: "Libero",
    mascotAsset: "/assets/figma-curated/academy-mascot-goose.svg",
  };
  const lessons = c.lessonIds
    .map((id) => ACADEMY_LESSONS_BY_ID[id])
    .filter((l): l is EnrichedAcademyLesson => Boolean(l));

  // Build 3 unit checkpoint challenge questions from the unit's lessons
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
        label: `Errore tipico: ${l.commonMistake}`,
        value: "mistake",
        isCorrect: false,
      },
      {
        label: "Rileggere passivamente senza fare un tentativo autonomo.",
        value: "passive",
        isCorrect: false,
      },
    ],
    explanation: `Criterio di padronanza (${l.id}): ${l.masteryCriterion}`,
  }));

  return {
    courseId: c.courseId,
    courseNumber: c.courseNumber,
    unitNumber: meta.unitNumber,
    unitTitle: meta.unitTitle,
    title: c.title,
    subtitle: meta.subtitle,
    theme: meta.theme,
    planTier: meta.planTier,
    entrySuggestion: meta.entrySuggestion,
    unlockPolicy: meta.unlockPolicy,
    mascotAsset: meta.mascotAsset,
    lessonIds: c.lessonIds,
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

/**
 * Calcola il livello LOCO attuale (Esploratore -> Maestro dei Loci) in base agli XP totali.
 */
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

/**
 * Assegna XP in modo idempotente tramite `eventId` univoco:
 * ricaricare la pagina o riaprire una schermata già premiata NON duplica mai gli XP.
 */
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

/**
 * Valuta quali badge verificabili sono stati sbloccati in base ai progressi reali.
 */
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

  if (isPassed("S01")) {
    badges.add("badge-first-memory");
  }

  if (["S01", "S02", "S03", "S04", "S05", "S06"].every(isPassed)) {
    badges.add("badge-first-palace");
  }

  if (isPassed("L06") || totalLociInRoutes >= 10) {
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

/**
 * Determina lo stato visuale del nodo sul Learning Path (Sezione 2).
 */
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

  if (
    expectedClean === "a" ||
    expectedClean === "b" ||
    expectedClean === "no" ||
    expectedClean === "sì" ||
    expectedClean === "6"
  ) {
    const isMatch = lesson.checkpointAcceptedKeywords.includes(cleaned);
    return {
      isCorrect: isMatch,
      feedback: isMatch
        ? `Risposta corretta! Chiave: ${lesson.checkpoint.expectedAnswer}`
        : `Non ancora. Chiave attesa: ${lesson.checkpoint.expectedAnswer} — Errore tipico: ${lesson.commonMistake}`,
    };
  }

  const matchedKeywords = lesson.checkpointAcceptedKeywords.filter((kw) =>
    cleaned.includes(kw)
  );
  const threshold = Math.max(
    1,
    Math.ceil(lesson.checkpointAcceptedKeywords.length * 0.45)
  );
  const isCorrect = matchedKeywords.length >= threshold;

  return {
    isCorrect,
    feedback: isCorrect
      ? `Risposta coerente con la chiave («${lesson.checkpoint.expectedAnswer}»).`
      : `Risposta parziale o imprecisa. Chiave di riferimento: «${lesson.checkpoint.expectedAnswer}». Attenzione a non ${lesson.commonMistake}`,
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

/**
 * Registra un tentativo completo di LOCO Academy 2.0 (`AttemptEvidence`, `05_GAME_ENGINE_SPEC.md`).
 * Applica rigorosamente le regole di valutazione onesta:
 * - `!submittedBeforeReveal` -> mai `provisionally_passed` o `mastered_after_delay`
 * - `hintsUsed > 0` -> richiamo assistito (`practice_done`), mai mastery autonoma
 * - `verifiedBy === "learner_self_check"` (rubrica aperta senza recall deterministico) -> `practice_done` (`skill_practiced`), mai `provisionally_passed` automatico
 * - `verifiedBy === "deterministic"` + `autonomousMasteryEligible` -> `provisionally_passed` (o `mastered_after_delay` se follow-up a distanza)
 */
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
        : current.practiceCompletedAt
          ? "practice_done"
          : "reading";
  } else if (evidence.verifiedBy === "learner_self_check") {
    // Open rubric tasks: self-check grants `practice_done` (`skill_practiced`) when valid, NEVER automatic mastery!
    if (evidence.scoreRatio >= 1) {
      practiceCompletedAt = practiceCompletedAt ?? nowIso;
      if (
        current.status !== "provisionally_passed" &&
        current.status !== "mastered_after_delay"
      ) {
        nextStatus = "practice_done";
      }
      const nextDate = new Date(Date.parse(nowIso) + 48 * 60 * 60 * 1000);
      nextReviewDueAt = nextReviewDueAt ?? nextDate.toISOString();
    } else {
      nextStatus = "needs_review";
    }
  } else if (autonomousSuccess) {
    practiceCompletedAt = practiceCompletedAt ?? nowIso;
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
  } else if (evidence.correct === true && evidence.hintsUsed > 0) {
    // Assisted recall -> `practice_done`, never autonomous mastery
    practiceCompletedAt = practiceCompletedAt ?? nowIso;
    if (
      current.status === "available" ||
      current.status === "reading" ||
      current.status === "needs_review"
    ) {
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
    normalized.status === "mastered_after_delay" ||
    normalized.status === "provisionally_passed"
      ? "needs_review"
      : normalized.status;

  return {
    ...normalized,
    contentVersion: lesson.contentVersion,
    status: demotedStatus,
  };
}

export interface AdaptiveAcademyRecommendation {
  id: string;
  observedSignal: string;
  recommendedLessonIds: string[];
  explanation: string;
  sampleSize: number;
  isSufficientSample: boolean;
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
      recommendedLessonIds: ["S01", "S03", "S05"],
      explanation:
        "Non ci sono ancora dati sufficienti per una diagnosi personalizzata affidabile. Completa un breve ciclo iniziale S01–S06 per raccogliere tentativi reali.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: false,
    });
    return recommendations;
  }

  if (diagnostics.viewedAnswerBeforeAttemptCount >= 1) {
    recommendations.push({
      id: "rec-recognition-vs-recall",
      observedSignal: `Risposta scoperta prima del tentativo in ${diagnostics.viewedAnswerBeforeAttemptCount} su ${diagnostics.totalTrialsCount} prove`,
      recommendedLessonIds: ["S01", "S05"],
      explanation:
        "Stai confondendo familiarità (riconoscimento) e recupero attivo. Ripassa S01 e S05 per allenare il tentativo a risposta nascosta.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.locusOrderSwapCount >= 1) {
    recommendations.push({
      id: "rec-locus-order-swap",
      observedSignal: `Inversione dell'ordine dei loci osservata (${diagnostics.locusOrderSwapCount} volte)`,
      recommendedLessonIds: ["L02", "L03", "L07"],
      explanation:
        "Quando due punti del palazzo si scambiano, non serve generare più immagini: rinforza la distinzione visiva e la regola di percorrenza in L02, L03 e L07.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.locusRecognizedButAnswerMissingCount >= 2) {
    recommendations.push({
      id: "rec-weak-cue-link",
      observedSignal: `Locus ricordato ma risposta assente in ${diagnostics.locusRecognizedButAnswerMissingCount} prove`,
      recommendedLessonIds: ["L05", "T04"],
      explanation:
        "Il punto spaziale tiene, ma l'immagine non contiene una chiave che riporti alla parola esatta. Lavora su indizi interpretabili in L05 e sul feedback in T04.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.majorSoftHardConfusionCount >= 1) {
    recommendations.push({
      id: "rec-major-6-7",
      observedSignal: `Confusione fonetica 6/7 (C/G dolci vs dure) in ${diagnostics.majorSoftHardConfusionCount} prove`,
      recommendedLessonIds: ["N02", "N04"],
      explanation:
        "Distinguere grafia e suono per C/G dolci (6: ciao, micio) e C/G dure (7: casa, mago) richiede l'allenamento bidirezionale di N02 e N04.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  if (diagnostics.immediatePassDelayedFailCount >= 1) {
    recommendations.push({
      id: "rec-spacing-drop",
      observedSignal: `Calo tra prova immediata e verifica a distanza (${diagnostics.immediatePassDelayedFailCount} target)`,
      recommendedLessonIds: ["S06", "T05"],
      explanation:
        "Una riuscita immediata non garantisce la tenuta dopo giorni. Dai priorità alle prove distribuite con S06 e T05.",
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
      recommendedLessonIds: ["S05", "T04", "A03"],
      explanation:
        "Gli indizi sbloccano lo studio ma riducono l'autonomia del richiamo. Rivedi come graduare gli aiuti in S05, T04 e nel laboratorio A03.",
      sampleSize: diagnostics.totalTrialsCount,
      isSufficientSample: true,
    });
  }

  return recommendations;
}
