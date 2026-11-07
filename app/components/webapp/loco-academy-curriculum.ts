import rawCurriculum from "./loco-academy-lessons.json" with { type: "json" };

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
 * I 12 tipi di esercizi riutilizzabili del Lesson Engine (Sezione 4)
 * più gli step narrativi brevi (`hook`, `explanation`, `demonstration`).
 */
export type InteractiveStepType =
  | "hook"
  | "explanation"
  | "demonstration"
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
  // Configurazioni specifiche per i 12 tipi di esercizio
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

export const MAJOR_IT_V1_VERIFIED_LEXICON: Record<string, string> = {
  scena: "02",
  sci: "0",
  scia: "0",
  scimmia: "03",
  sasso: "00",
  sole: "05",
  zaino: "02",
  zero: "04",
  toro: "14",
  tenda: "121",
  dado: "11",
  dito: "11",
  tuffo: "18",
  nave: "28",
  nido: "21",
  gnomo: "23",
  ragno: "42",
  bagno: "92",
  noce: "26",
  mano: "32",
  mela: "35",
  mare: "34",
  micio: "36",
  mago: "37",
  moneta: "321",
  riva: "48",
  rana: "42",
  remo: "43",
  rosa: "40",
  re: "4",
  luna: "52",
  leone: "52",
  foglia: "85",
  aglio: "5",
  figlio: "85",
  limone: "532",
  libro: "594",
  ciao: "6",
  cielo: "65",
  cena: "62",
  gelato: "651",
  gioco: "67",
  ciliegia: "656",
  orologio: "456",
  casa: "70",
  cane: "72",
  gatto: "71",
  cuore: "74",
  chiave: "78",
  ghiaccio: "76",
  schermo: "0743",
  casco: "707",
  faro: "84",
  vela: "85",
  fuoco: "87",
  violino: "852",
  pane: "92",
  ponte: "921",
  banca: "927",
  barca: "947",
  bussola: "905",
  banana: "922",
  bicicletta: "96751",
};

export function encodeItalianWordToMajorDigits(rawWord: string): string {
  const cleaned = rawWord
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  if (!cleaned) return "";

  if (MAJOR_IT_V1_VERIFIED_LEXICON[cleaned] !== undefined) {
    return MAJOR_IT_V1_VERIFIED_LEXICON[cleaned];
  }

  const digits: string[] = [];
  let i = 0;
  const n = cleaned.length;

  while (i < n) {
    const ch = cleaned[i];
    const next = i + 1 < n ? cleaned[i + 1] : "";
    const next2 = i + 2 < n ? cleaned[i + 2] : "";

    if ("aeioujwyh".includes(ch)) {
      i += 1;
      continue;
    }

    if (ch === "s" && next === "c" && next2 === "h") {
      digits.push("0", "7");
      i += 3;
      continue;
    }

    if (ch === "s" && next === "c" && (next2 === "e" || next2 === "i")) {
      digits.push("0");
      i += 2;
      continue;
    }

    if (ch === "g" && next === "n") {
      digits.push("2");
      i += 2;
      continue;
    }

    if (ch === "g" && next === "l" && next2 === "i") {
      digits.push("5");
      i += 2;
      continue;
    }

    if (ch === "c" && next === "q") {
      digits.push("7");
      i += 2;
      continue;
    }

    if (next === ch && !"aeiou".includes(ch)) {
      if (ch === "c" || ch === "g") {
        if (next2 === "h") {
          digits.push("7");
          i += 3;
          continue;
        }
        if (next2 === "e" || next2 === "i") {
          digits.push("6");
          i += 2;
          continue;
        }
        digits.push("7");
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (ch === "c" || ch === "g") {
      if (next === "h") {
        digits.push("7");
        i += 2;
        continue;
      }
      if (next === "e" || next === "i") {
        digits.push("6");
        i += 1;
        continue;
      }
      digits.push("7");
      i += 1;
      continue;
    }

    switch (ch) {
      case "s":
      case "z":
        digits.push("0");
        break;
      case "t":
      case "d":
        digits.push("1");
        break;
      case "n":
        digits.push("2");
        break;
      case "m":
        digits.push("3");
        break;
      case "r":
        digits.push("4");
        break;
      case "l":
        digits.push("5");
        break;
      case "k":
      case "q":
        digits.push("7");
        break;
      case "f":
      case "v":
        digits.push("8");
        break;
      case "p":
      case "b":
        digits.push("9");
        break;
      default:
        break;
    }
    i += 1;
  }

  return digits.join("");
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

/**
 * LESSON ENGINE: genera la sequenza giocabile di 6–9 schermate per ciascuna delle 56 lezioni.
 * Per S01 implementa la sequenza completa di riferimento (Sezione 12 del prompt).
 */
export function buildInteractiveStepsForLesson(
  lesson: LessonEditorial,
  cpMeta: { acceptedKeywords: string[]; options?: { label: string; value: string }[]; progressiveHint: string },
  fallbackNoticeText?: string | null
): LessonStepSpec[] {
  const { shortText, fullText } = splitShortAndFullReading(lesson.reading);

  // SEQUENZA DI RIFERIMENTO COMPLETA PER LA PRIMA LEZIONE (S01 — Sezione 12)
  if (lesson.id === "S01") {
    return [
      {
        stepId: "S01-step-1",
        stepIndex: 0,
        type: "hook",
        stageLabel: "STEP 1 · SFIDA INIZIALE",
        title: "Ti sfido a ricordare cinque oggetti senza ripeterli dieci volte.",
        bodyText:
          "Quando rileggi un appunto ti sembra tutto familiare. Ma cosa succede quando chiudi il foglio? Mettiamolo subito alla prova con un piccolo esperimento pratico.",
        illustrationAsset: "/assets/figma-curated/academy-scene-relax-night.svg",
        explanationOnSuccess: "Iniziamo l'esperimento!",
        explanationOnMistake: "",
      },
      {
        stepId: "S01-step-2",
        stepIndex: 1,
        type: "memory_flash",
        stageLabel: "STEP 2 & 3 · MEMORY FLASH",
        title: "Osserva questi 5 oggetti, poi nascondili e ricordali in ordine",
        bodyText:
          "Osserva la sequenza: banana, chiave, gatto, orologio, bicicletta (oltre alla lista classica limone, violino, ponte, bussola, moneta). Quando sei pronto, nascondi le carte e ricostruisci l'ordine!",
        illustrationAsset: "/assets/figma-curated/academy-item-clock.svg",
        flashItems: ["banana", "chiave", "gatto", "orologio", "bicicletta"],
        flashDurationSeconds: 10,
        explanationOnSuccess:
          "Hai completato il primo tentativo a lista nascosta! Ora vediamo perché la mente fa fatica con le liste astratte.",
        explanationOnMistake:
          "Nessun problema se qualche oggetto è sfuggito: serve proprio a mostrare la differenza tra vedere e recuperare.",
      },
      {
        stepId: "S01-step-3",
        stepIndex: 2,
        type: "explanation",
        stageLabel: "STEP 4 · IL PRINCIPIO SCIENTIFICO",
        title: "Riconoscere quando leggi non è recuperare dalla memoria",
        bodyText: shortText,
        expandableFullText: fullText,
        illustrationAsset: "/assets/figma-curated/academy-mascot-zen-book.svg",
        explanationOnSuccess: "Concetto chiave acquisito: il vero test avviene solo a risposta nascosta.",
        explanationOnMistake: "",
      },
      {
        stepId: "S01-step-4",
        stepIndex: 3,
        type: "demonstration",
        stageLabel: "STEP 5 & 6 · DIMOSTRAZIONE VISIVA",
        title: "Trasforma l'oggetto astratto in un'azione dentro una stanza",
        bodyText:
          "Invece di ripetere «banana, chiave, gatto...» nel vuoto, immagina una BANANA GIGANTE incastrata nella maniglia che apre la porta della tua stanza. Esempio LOCO: " +
          lesson.workedExample,
        illustrationAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
        explanationOnSuccess: "Un'azione concreta in un punto preciso (locus) crea un aggancio di recupero.",
        explanationOnMistake: "",
      },
      {
        stepId: "S01-step-5",
        stepIndex: 4,
        type: "mnemonic_builder",
        stageLabel: "STEP 7 · COSTRUISCI IL LEGAME",
        title: "Collega tu uno degli oggetti a un luogo della stanza",
        bodyText:
          "Scegli un oggetto, un verbo d'azione fisico e un punto della stanza per creare la tua associazione personale.",
        illustrationAsset: "/assets/figma-curated/academy-item-lamp.svg",
        mnemonicBuilderSpec: {
          targetConcept: "Chiave / Gatto / Orologio",
          suggestedObjects: ["Una chiave dorata gigante", "Il gatto nero con il becco", "Un orologio sveglia giallo"],
          suggestedActions: ["fa scattare e accende", "graffia rumorosamente", "suona facendo vibrare"],
          suggestedLoci: ["la Lampada sulla scrivania", "lo Sgabello giallo", "la Libreria a parete"],
        },
        explanationOnSuccess: "Associazione personale creata! Il legame funziona perché unisce oggetto, azione e luogo.",
        explanationOnMistake: "Scegli tutti e tre gli elementi (oggetto, azione, luogo) o scrivi la tua frase.",
      },
      {
        stepId: "S01-step-6",
        stepIndex: 5,
        type: "loci_placement",
        stageLabel: "STEP 8 · PROVA CON I LOCI (SENZA IMMAGINI)",
        title: "Recupera gli oggetti associati ai 5 punti della stanza",
        bodyText:
          "Ora ripercorri i 5 punti della stanza in ordine e richiama l'oggetto ancorato a ciascun locus senza guardare i suggerimenti.",
        scientificNote:
          "Nota metodologica: questo secondo tentativo è illustrativo del funzionamento di LOCO, non un esperimento controllato.",
        illustrationAsset: "/assets/figma-curated/academy-scene-zen-room.svg",
        lociPlacementSpec: {
          roomObjects: DEFAULT_ROOM_OBJECTS,
          itemsToPlace: [
            { item: "banana", defaultAction: "Una banana gigante blocca la Porta d'ingresso" },
            { item: "chiave", defaultAction: "Una chiave accende la Lampada da tavolo" },
            { item: "gatto", defaultAction: "Un gatto salta sullo Sgabello giallo" },
            { item: "orologio", defaultAction: "Un orologio ticchetta tra i libri della Libreria" },
            { item: "bicicletta", defaultAction: "Una bicicletta gira intorno alla Boccia con pesce" },
          ],
        },
        explanationOnSuccess: "Hai ripercorso i 5 punti della stanza recuperando la sequenza ordinata!",
        explanationOnMistake: "Associa ciascuno dei 5 oggetti al suo punto in ordine (1→5).",
      },
      {
        stepId: "S01-step-7",
        stepIndex: 6,
        type: "multiple_choice",
        stageLabel: "STEP 9 · VERIFICA FINALE",
        title: lesson.checkpoint.question,
        bodyText: `Verifica finale della lezione ${lesson.id} senza risposta visibile. Evita l'errore tipico: ${lesson.commonMistake}`,
        illustrationAsset: "/assets/figma-curated/academy-mascot-goose.svg",
        options: [
          {
            id: "opt-no",
            label: "No: capire mentre leggo è riconoscimento, non dimostra il recupero autonomo.",
            isCorrect: true,
            explanation: `Esatto! Chiave: ${lesson.checkpoint.expectedAnswer} ${lesson.masteryCriterion}`,
          },
          {
            id: "opt-si",
            label: "Sì: se la risposta mi sembra familiare quando la vedo, la so sicuramente ripetere.",
            isCorrect: false,
            explanation: `Attenzione: questo è proprio l'errore di familiarità (${lesson.commonMistake}).`,
          },
          {
            id: "opt-img",
            label: "Sì, basta che la pagina abbia un bel colore o un'immagine divertente.",
            isCorrect: false,
            explanation: "Un'immagine bella non sostituisce una prova di richiamo senza guardare.",
          },
        ],
        explanationOnSuccess: `Perfetto! ${lesson.masteryCriterion}`,
        explanationOnMistake: `Ripassa questo punto: non ${lesson.commonMistake}`,
      },
    ];
  }

  // GENERAZIONE STRUTTURATA E DIVERSIFICATA PER TUTTE LE ALTRE 55 LEZIONI
  const steps: LessonStepSpec[] = [];

  // STEP 1: HOOK
  steps.push({
    stepId: `${lesson.id}-step-1`,
    stepIndex: 0,
    type: "hook",
    stageLabel: "STEP 1 · HOOK",
    title: `${lesson.id} · ${lesson.title}`,
    bodyText: `Domanda di partenza: ${lesson.checkpoint.question.replace(/[«»]/g, "")} Scopriamolo in pochi passaggi interattivi.`,
    illustrationAsset:
      lesson.courseId === "course-3" || lesson.courseId === "course-7"
        ? "/assets/figma-curated/academy-mascot-headphones.svg"
        : lesson.courseId === "course-2"
          ? "/assets/figma-curated/academy-mascot-cat.svg"
          : "/assets/figma-curated/academy-mascot-tablet.svg",
    explanationOnSuccess: "Andiamo al principio chiave!",
    explanationOnMistake: "",
  });

  // STEP 2: SPIEGAZIONE BREVE + ESPANDIBILE
  steps.push({
    stepId: `${lesson.id}-step-2`,
    stepIndex: 1,
    type: "explanation",
    stageLabel: "STEP 2 · SPIEGAZIONE",
    title: "Il principio in parole semplici",
    bodyText: shortText,
    expandableFullText: fullText,
    illustrationAsset: "/assets/figma-curated/academy-mascot-zen-book.svg",
    explanationOnSuccess: "Passiamo a un esempio concreto.",
    explanationOnMistake: "",
  });

  // STEP 3: DIMOSTRAZIONE CONCRETA
  steps.push({
    stepId: `${lesson.id}-step-3`,
    stepIndex: 2,
    type: "demonstration",
    stageLabel: "STEP 3 · ESEMPIO LOCO",
    title: "Come funziona nella pratica",
    bodyText: lesson.workedExample,
    scientificNote: fallbackNoticeText
      ? fallbackNoticeText
      : `Errore comune da evitare: non ${lesson.commonMistake}`,
    illustrationAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
    explanationOnSuccess: "Ora tocca a te con una prova guidata!",
    explanationOnMistake: "",
  });

  // STEP 4: PROVA GUIDATA (specifica per dominio della lezione)
  if (lesson.courseId === "course-3" || lesson.courseId === "course-7") {
    // Major System / Numeri -> Matching Pairs + Number Encoding + Reverse Decoding
    steps.push({
      stepId: `${lesson.id}-step-4`,
      stepIndex: 3,
      type: "matching_pairs",
      stageLabel: "STEP 4 · PROVA GUIDATA (ABBINAMENTO FONETICO)",
      title: "Abbina ciascuna cifra alla sua famiglia di suoni (major-it-v1)",
      bodyText: "Ricorda: conta il suono consonantico pronunciato, non la semplice lettera scritta.",
      illustrationAsset: "/assets/figma-curated/academy-head-headphones.svg",
      pairs: [
        { id: "p0", left: "0", right: "S, Z, SC dolce (scena)" },
        { id: "p1", left: "1", right: "T, D (toro)" },
        { id: "p3", left: "3", right: "M (mano)" },
        { id: "p6", left: "6", right: "C/G dolce (ciao, micio)" },
        { id: "p7", left: "7", right: "C/G dura (casa, mago)" },
      ],
      explanationOnSuccess: "Ottimo! Hai distinto anche lo 0 (SC dolce) e la coppia 6 (dolce) vs 7 (dura).",
      explanationOnMistake: "Controlla bene il suono dolce (6: ciao) rispetto al suono duro (7: casa).",
    });

    steps.push({
      stepId: `${lesson.id}-step-5`,
      stepIndex: 4,
      type: "number_encoding",
      stageLabel: "STEP 5 · CODIFICA (NUMERO → PAROLA)",
      title: "Trasforma il numero 14 o 32 in una parola italiana valida",
      bodyText: lesson.exercise.prompt,
      illustrationAsset: "/assets/figma-curated/academy-mascot-headphones.svg",
      numberEncodingSpec: {
        targetNumber: lesson.id === "N01" ? "14" : "32",
        phoneticHint: lesson.id === "N01" ? "1 = T/D, 4 = R (es. toro)" : "3 = M, 2 = N (es. mano)",
        exampleValidWords: lesson.id === "N01" ? ["toro", "tiro", "doro"] : ["mano", "mina", "menu"],
      },
      explanationOnSuccess: "Codifica Numero → Parola verificata con il trasduttore fonetico major-it-v1!",
      explanationOnMistake: "Le consonanti della parola devono produrre esattamente le cifre richieste (le vocali non contano).",
    });

    steps.push({
      stepId: `${lesson.id}-step-6`,
      stepIndex: 5,
      type: "reverse_decoding",
      stageLabel: "STEP 6 · DECODIFICA INVERSA (PAROLA → NUMERO)",
      title: "Decodifica la parola nei suoi numeri",
      bodyText:
        lesson.id === "N04"
          ? "Pronuncia ad alta voce «mago» e scrivi le due cifre corrispondenti."
          : "Pronuncia ad alta voce «scena» e scrivi le due cifre corrispondenti.",
      illustrationAsset: "/assets/figma-curated/academy-item-lightbulb.svg",
      reverseDecodingSpec:
        lesson.id === "N04"
          ? {
              stimulusWord: "mago",
              expectedDigits: "37",
              phoneticBreakdown: "M = 3, G dura (/g/) = 7 → 37 (non 36!)",
            }
          : {
              stimulusWord: "scena",
              expectedDigits: "02",
              phoneticBreakdown: "SC dolce (/ʃ/) = 0, N = 2 → 02",
            },
      explanationOnSuccess: "Decodifica inversa perfetta! Competenza Reverse registrata separatamente.",
      explanationOnMistake: "Ascolta il suono consonantico: M=3, G dura=7 (mago=37); SC dolce=0, N=2 (scena=02).",
    });
  } else if (lesson.id === "S03" || lesson.courseId === "course-1" || lesson.courseId === "course-6" || lesson.courseId === "course-9") {
    // Loci / Palazzi -> Loci Placement + Sequence Ordering + Error Correction
    steps.push({
      stepId: `${lesson.id}-step-4`,
      stepIndex: 3,
      type: "loci_placement",
      stageLabel: "STEP 4 · PROVA NELLA SCENA",
      title: "Seleziona e ordina i loci distinti nella stanza",
      bodyText: lesson.exercise.prompt,
      illustrationAsset: "/assets/figma-curated/academy-scene-study-desk.svg",
      lociPlacementSpec: {
        roomObjects: DEFAULT_ROOM_OBJECTS,
        itemsToPlace: [
          { item: "Locus 1: Porta", defaultAction: "Punto di partenza fisso all'ingresso" },
          { item: "Locus 2: Lampada", defaultAction: "Punto luminoso sulla scrivania" },
          { item: "Locus 3: Sgabello", defaultAction: "Seduta gialla al centro" },
          { item: "Locus 4: Libreria", defaultAction: "Scaffale verticale a parete" },
          { item: "Locus 5: Acquario", defaultAction: "Boccia di vetro sul mobile" },
        ],
      },
      explanationOnSuccess: "5 loci distinti e non ambigui confermati nella scena!",
      explanationOnMistake: "Conferma tutti i 5 punti seguendo l'ordine del percorso.",
    });

    steps.push({
      stepId: `${lesson.id}-step-5`,
      stepIndex: 4,
      type: "sequence_ordering",
      stageLabel: "STEP 5 · ORDINE SENZA ETICHETTE",
      title: "Ricostruisci l'ordine esatto del percorso dal punto 1 al punto 5",
      bodyText: "Un palazzo funziona se l'ordine di percorrenza è stabile anche quando chiudi gli occhi.",
      illustrationAsset: "/assets/figma-curated/academy-mascot-elephant.svg",
      sequenceItems: [
        "1. Porta d'ingresso",
        "2. Lampada da tavolo",
        "3. Sgabello giallo",
        "4. Libreria a parete",
        "5. Boccia con pesce",
      ],
      explanationOnSuccess: "Sequenza spaziale 5/5 ricostruita nell'ordine esatto!",
      explanationOnMistake: "Controlla quale coppia di loci è stata invertita e ripeti il giro.",
    });

    steps.push({
      stepId: `${lesson.id}-step-6`,
      stepIndex: 5,
      type: "error_correction",
      stageLabel: "STEP 6 · CORREGGI L'ERRORE TIPICO",
      title: "Individua e correggi l'errore di progettazione del palazzo",
      bodyText: `Uno studente ha commesso questo errore: «${lesson.commonMistake}». Quale correzione applichi?`,
      illustrationAsset: "/assets/figma-curated/academy-item-lamp.svg",
      options: [
        {
          id: "fix-good",
          label: `Applico il criterio: ${lesson.masteryCriterion}`,
          isCorrect: true,
          explanation: "Perfetto: punti ben distinguibili, ordine fisso e un bersaglio chiaro per ancora.",
        },
        {
          id: "fix-bad",
          label: "Aggiungo altre 20 immagini decorative nello stesso angolo senza ordine.",
          isCorrect: false,
          explanation: "Sovrapporre immagini nello stesso punto aumenta l'interferenza.",
        },
      ],
      explanationOnSuccess: "Ottima diagnosi spaziale!",
      explanationOnMistake: `Ricorda il criterio di padronanza: ${lesson.masteryCriterion}`,
    });
  } else if (lesson.id === "S04" || lesson.courseId === "course-2" || lesson.courseId === "course-5") {
    // Associazioni / Linked Method / Vita reale -> Image Association + Mnemonic Builder + Sequence Ordering
    steps.push({
      stepId: `${lesson.id}-step-4`,
      stepIndex: 3,
      type: "image_association",
      stageLabel: "STEP 4 · SCEGLI L'IMMAGINE EFFICACE",
      title: "Quale associazione ti riporta davvero alla risposta?",
      bodyText:
        "Un'immagine strana ma scollegata dalla risposta è solo una decorazione. Scegli il legame che contiene un indizio interpretabile.",
      illustrationAsset: "/assets/figma-curated/academy-mascot-cat.svg",
      options: [
        {
          id: "img-functional",
          label: "Un'azione concreta in cui l'oggetto interagisce fisicamente con il locus o con l'elemento successivo.",
          isCorrect: true,
          explanation: "Esatto! L'azione fisica lega la risposta al punto di recupero.",
        },
        {
          id: "img-decorative",
          label: "Una nuvola astratta bellissima ma priva di collegamento con la parola da ricordare.",
          isCorrect: false,
          explanation: `Evita di ${lesson.commonMistake}`,
        },
      ],
      explanationOnSuccess: "Hai scelto un indizio funzionale e interpretabile!",
      explanationOnMistake: "Chiediti sempre: questa immagine mi fa venire in mente la parola esatta?",
    });

    steps.push({
      stepId: `${lesson.id}-step-5`,
      stepIndex: 4,
      type: "mnemonic_builder",
      stageLabel: "STEP 5 · COSTRUISCI L'ASSOCIAZIONE",
      title: "Componi la tua catena o associazione d'azione",
      bodyText: lesson.exercise.prompt,
      illustrationAsset: "/assets/figma-curated/academy-item-fishbowl.svg",
      mnemonicBuilderSpec: {
        targetConcept: lesson.title,
        suggestedObjects: ["Limone gigante", "Violino sonoro", "Ponte di pietra"],
        suggestedActions: ["blocca e spruzza", "suona vibrando contro", "collega fisicamente"],
        suggestedLoci: ["la maniglia della Porta", "l'Attaccapanni", "il Tavolo centrale"],
      },
      explanationOnSuccess: "Catena d'azione costruita con successo!",
      explanationOnMistake: "Seleziona gli elementi per comporre il legame.",
    });

    steps.push({
      stepId: `${lesson.id}-step-6`,
      stepIndex: 5,
      type: "sequence_ordering",
      stageLabel: "STEP 6 · RICHIAMO DELLA CATENA",
      title: "Rimetti in ordine gli anelli della sequenza senza guardare",
      bodyText: "Ogni immagine chiama la successiva: ricostruisci i 5 anelli nell'ordine corretto.",
      illustrationAsset: "/assets/figma-curated/academy-scene-runner.svg",
      sequenceItems: ["1. Limone", "2. Violino", "3. Ponte", "4. Bussola", "5. Moneta"],
      explanationOnSuccess: "Catena ricostruita dal primo all'ultimo anello!",
      explanationOnMistake: "Individua il primo legame interrotto e riprova.",
    });
  } else {
    // Studio / Esami / Palestra / AI Memory Studio -> Fill in Blank + Error Correction + Guided Matching
    steps.push({
      stepId: `${lesson.id}-step-4`,
      stepIndex: 3,
      type: "fill_in_blank",
      stageLabel: "STEP 4 · COMPLETA LA REGOLA CHIAVE",
      title: "Completa il principio operativo di questa lezione",
      bodyText: lesson.exercise.prompt,
      illustrationAsset: "/assets/figma-curated/academy-scene-library.svg",
      blankSentence: {
        before: "Per padroneggiare davvero questo passaggio bisogna evitare di",
        after: `e verificare invece: ${lesson.masteryCriterion}`,
        expectedWord: lesson.commonMistake.split(" ")[0] || "improvvisare",
        wordBank: [
          lesson.commonMistake.split(" ")[0] || "improvvisare",
          "dormire",
          "colorare",
        ],
      },
      explanationOnSuccess: `Esatto: evita di ${lesson.commonMistake}`,
      explanationOnMistake: "Rileggi l'errore tipico evidenziato nella dimostrazione.",
    });

    steps.push({
      stepId: `${lesson.id}-step-5`,
      stepIndex: 4,
      type: "error_correction",
      stageLabel: "STEP 5 · DIAGNOSI E CORREZIONE",
      title: "Quale comportamento applica correttamente il metodo LOCO?",
      bodyText: lesson.exercise.prompt,
      illustrationAsset: "/assets/figma-curated/academy-mascot-lion.svg",
      options: [
        {
          id: "ec-right",
          label: `Verificare la fonte e applicare: ${lesson.masteryCriterion}`,
          isCorrect: true,
          explanation: "Comportamento rigoroso e verificabile!",
        },
        {
          id: "ec-wrong",
          label: `Commettere l'errore tipico: ${lesson.commonMistake}`,
          isCorrect: false,
          explanation: "Questo approccio dà un'illusione di competenza ma non regge alla prova.",
        },
      ],
      explanationOnSuccess: "Diagnosi corretta!",
      explanationOnMistake: `Attenzione a non ${lesson.commonMistake}`,
    });
  }

  // STEP FINALE (STEP 6 o 7): FREE RECALL / CHECKPOINT UFFICIALE A RISPOSTA NASCOSTA
  steps.push({
    stepId: `${lesson.id}-step-checkpoint`,
    stepIndex: steps.length,
    type: cpMeta.options ? "multiple_choice" : "free_recall",
    stageLabel: `STEP ${steps.length + 1} · MINI CHALLENGE FINALE`,
    title: lesson.checkpoint.question,
    bodyText:
      "Rispondi senza aiuti per superare la verifica della lezione. La soluzione viene mostrata solo dopo il tuo tentativo.",
    illustrationAsset: "/assets/figma-curated/academy-mascot-goose.svg",
    options: cpMeta.options
      ? cpMeta.options.map((o) => {
          const isOk =
            o.value.toLowerCase() ===
            lesson.checkpoint.expectedAnswer.trim().replace(/\.$/, "").toLowerCase();
          return {
            id: `cp-${o.value}`,
            label: o.label,
            isCorrect: isOk,
            explanation: isOk
              ? `Risposta esatta! Chiave: ${lesson.checkpoint.expectedAnswer}`
              : `Risposta errata. Chiave: ${lesson.checkpoint.expectedAnswer} (Evita: ${lesson.commonMistake})`,
          };
        })
      : undefined,
    freeRecallPrompt: {
      question: lesson.checkpoint.question,
      expectedAnswer: lesson.checkpoint.expectedAnswer,
      acceptedKeywords: cpMeta.acceptedKeywords,
      progressiveHint: cpMeta.progressiveHint,
    },
    explanationOnSuccess: `Ottimo recupero! Chiave: ${lesson.checkpoint.expectedAnswer} — ${lesson.masteryCriterion}`,
    explanationOnMistake: `Chiave di riferimento: «${lesson.checkpoint.expectedAnswer}». Ripasseremo questo punto!`,
  });

  return steps;
}

export const RAW_ACADEMY_LESSONS: LessonEditorial[] =
  rawCurriculum.lessons as LessonEditorial[];

export const ENRICHED_ACADEMY_LESSONS: EnrichedAcademyLesson[] =
  RAW_ACADEMY_LESSONS.map((lesson) => {
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
      progressiveHint: cpMeta.progressiveHint,
      steps,
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

export function reconcileAcademyProgressVersion(
  record: AcademyLessonProgress,
  lesson: Pick<LessonEditorial, "contentVersion">
): AcademyLessonProgress {
  const normalized: AcademyLessonProgress = {
    ...record,
    currentStepIndex: typeof record.currentStepIndex === "number" ? record.currentStepIndex : 0,
    completedStepIds: Array.isArray(record.completedStepIds) ? record.completedStepIds : [],
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
