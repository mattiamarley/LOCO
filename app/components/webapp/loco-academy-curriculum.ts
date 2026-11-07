import rawCurriculum from "./loco-academy-lessons.json" with { type: "json" };

export type LessonTier = "free" | "plus" | "pro";

export type LessonStatus =
  | "available"
  | "reading"
  | "practice_done"
  | "provisionally_passed"
  | "mastered_after_delay"
  | "needs_review";

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
  runtimeExerciseKind: RuntimeExerciseKind;
  requiresSimulatedFallbackNotice: boolean;
  fallbackNoticeText: string | null;
  checkpointAcceptedKeywords: string[];
  checkpointOptions?: { label: string; value: string }[];
  progressiveHint: string;
}

export interface AcademyCourse {
  courseId: string;
  courseNumber: number;
  title: string;
  subtitle: string;
  theme: AcademyTheme;
  planTier: LessonTier;
  entrySuggestion: string;
  unlockPolicy: string;
  lessonIds: string[];
  lessons: EnrichedAcademyLesson[];
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

export const LOCO_ACADEMY_STORAGE_KEY = "loco-academy-progress-v1";
export const MAJOR_IT_V1_VERSION = "major-it-v1";

export const TIER_NAMING: Record<
  LessonTier,
  {
    code: LessonTier;
    editorialName: string;
    shortBadge: string;
    description: string;
    isPaidHypothesis: boolean;
  }
> = {
  free: {
    code: "free",
    editorialName: rawCurriculum.tierNaming.free,
    shortBadge: "LOCOMPRO DOPO · Free",
    description:
      "Onboarding, fondamenti, metodo dei loci, conversione fonetica, studio attivo, Blind Recall e coda ripassi sempre gratuiti.",
    isPaidHypothesis: false,
  },
  plus: {
    code: "plus",
    editorialName: rawCurriculum.tierNaming.plus,
    shortBadge: "POCO LOCO · Plus",
    description:
      "Specializzazioni avanzate (palazzi complessi, 00–99/PAO, esami, ambienti estesi, palestra). Anteprima ed esercizi simulati consultabili.",
    isPaidHypothesis: true,
  },
  pro: {
    code: "pro",
    editorialName: rawCurriculum.tierNaming.pro,
    shortBadge: "PRO LOCO · Pro",
    description:
      "Laboratori AI Memory Studio (import controllato, indizi personalizzati, tutor socratico, diagnostica). Esercizi mock gratuiti; integrazione AI live soggetta a quote future.",
    isPaidHypothesis: true,
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

/**
 * Convenzione fonetica italiana versionata `major-it-v1` (LOCO Academy Corso 3):
 * 0 = /s/, /z/, /ʃ/ (s, z, «sc» dolce di scena)
 * 1 = /t/, /d/
 * 2 = /n/, /ɲ/ (n, «gn»)
 * 3 = /m/
 * 4 = /r/
 * 5 = /l/, /ʎ/ (l, «gl» palatale)
 * 6 = /tʃ/, /dʒ/ (c/g dolci di ciao, gelato) — SENZA SC!
 * 7 = /k/, /g/ duro (c/g dura di casa, mago, k, q)
 * 8 = /f/, /v/
 * 9 = /p/, /b/
 */
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

/**
 * Dizionario fonetico italiano verificato per `major-it-v1`.
 * Garantisce valutazione deterministica su digrafi, trigrafi e parole del curriculum.
 */
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
};

/**
 * Trasduttore fonetico italiano `major-it-v1`.
 * Converte una parola italiana nella sequenza di cifre corrispondente ai suoi fonemi consonantici,
 * rispettando digrafi (`sc` dolce = 0, `gn` = 2, `gl` palatale = 5, `ch/gh` = 7, `ci/gi` dolce = 6)
 * e trattando le consonanti doppie geminate come una singola occorrenza fonetica.
 */
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

    // Vocali e lettere mute/semivocali
    if ("aeioujwyh".includes(ch)) {
      i += 1;
      continue;
    }

    // Trigrafo SCH + E/I -> /sk/ = 07
    if (ch === "s" && next === "c" && next2 === "h") {
      digits.push("0", "7");
      i += 3;
      continue;
    }

    // Digrafo SC + E/I -> /ʃ/ = 0 (convenzione major-it-v1!)
    if (ch === "s" && next === "c" && (next2 === "e" || next2 === "i")) {
      digits.push("0");
      i += 2;
      continue;
    }

    // Digrafo GN -> /ɲ/ = 2
    if (ch === "g" && next === "n") {
      digits.push("2");
      i += 2;
      continue;
    }

    // Digrafo GL + I -> /ʎ/ = 5 (es. foglia, figlio, aglio)
    if (ch === "g" && next === "l" && next2 === "i") {
      digits.push("5");
      i += 2;
      continue;
    }

    // Digrafo CQ -> /kkw/ geminato = 7
    if (ch === "c" && next === "q") {
      digits.push("7");
      i += 2;
      continue;
    }

    // Consonanti doppie geminate (tt, dd, nn, mm, rr, ll, ff, vv, pp, bb, ss, zz, cc, gg)
    if (next === ch && !"aeiou".includes(ch)) {
      if (ch === "c" || ch === "g") {
        // cc/gg seguito da h -> duro 7; seguito da e/i -> dolce 6; altrimenti duro 7
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
      // Avanza di 1 così il singolo carattere viene valutato una sola volta
      i += 1;
      continue;
    }

    // C e G contestuali
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

/**
 * Mappatura ufficiale dei 9 ID legacy (`c1-l1`..`c3-l3`) verso i 56 moduli di LOCO Academy
 * (Sezione D5 di `LOCO_ACADEMY_CURRICULUM.md`).
 */
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
    subtitle: string;
    theme: AcademyTheme;
    planTier: LessonTier;
    entrySuggestion: string;
    unlockPolicy: string;
  }
> = {
  "course-0": {
    subtitle: "Il primo ricordo: 6 microlezioni pratiche mentre costruisci il tuo primo percorso",
    theme: "onboarding",
    planTier: "free",
    entrySuggestion: "Prima apertura",
    unlockPolicy: "Sequenziale, skippabile con 'Salta la lettura, prova ora'",
  },
  "course-1": {
    subtitle: "Costruisci il tuo palazzo: scelta dell'ambiente, distinzione dei loci, ordine e percorso da 10",
    theme: "loci",
    planTier: "free",
    entrySuggestion: "Dopo S06",
    unlockPolicy: "Libero; L06 richiede costruzione guidata in scena",
  },
  "course-2": {
    subtitle: "Catene associative sequenziali: quando usare storie brevi e come riparare un anello mancante",
    theme: "linked",
    planTier: "free",
    entrySuggestion: "Prima lista lunga",
    unlockPolicy: "Libero dopo la prima immagine S04",
  },
  "course-3": {
    subtitle: "Sistema fonetico italiano major-it-v1: dalle 10 famiglie di suoni alle date storiche verificabili",
    theme: "numbers",
    planTier: "free",
    entrySuggestion: "Obiettivo: date e cifre",
    unlockPolicy: "Disponibile dopo S04 con esercizi fonetici bidirezionali",
  },
  "course-4": {
    subtitle: "Comprensione, chunking, domande verificabili, feedback diagnostico, ripasso distribuito e interleaving",
    theme: "study",
    planTier: "free",
    entrySuggestion: "Primo progetto di studio",
    unlockPolicy: "Disponibile subito per strutturare lo studio reale",
  },
  "course-5": {
    subtitle: "Applicazioni quotidiane: discorsi senza fogli, vocaboli stranieri, commissioni e nomi/volti",
    theme: "real-life",
    planTier: "free",
    entrySuggestion: "Scegliere un uso concreto",
    unlockPolicy: "Suggerito secondo l'obiettivo personale",
  },
  "course-6": {
    subtitle: "Progettazione su scala: palazzi da 25 loci, riuso ordinato, sottopercorsi e diagnostica delle confusioni",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Dopo un percorso stabile da 10 loci",
    unlockPolicy: "POCO LOCO · Anteprima ed esercizi simulati accessibili",
  },
  "course-7": {
    subtitle: "Sistemi numerici avanzati: dizionario 00–99, Peg System, PAO e gestione delle interferenze",
    theme: "numbers",
    planTier: "plus",
    entrySuggestion: "Dopo Major System di base (N01–N05)",
    unlockPolicy: "POCO LOCO · Allenamento numerico verificato",
  },
  "course-8": {
    subtitle: "Preparazione esami: scomposizione capitoli, orale/scritto/problemi, triage pre-esame e transfer",
    theme: "study",
    planTier: "plus",
    entrySuggestion: "Quando si studia un capitolo o esame reale",
    unlockPolicy: "POCO LOCO · Richiede target verificati",
  },
  "course-9": {
    subtitle: "Ambienti fisici, fotografici, Street View e 3D: stabilità delle ancore e alternative testuali",
    theme: "palaces-advanced",
    planTier: "plus",
    entrySuggestion: "Creazione di palazzo avanzato",
    unlockPolicy: "POCO LOCO · Demo disponibile senza API Maps/3D attive",
  },
  "course-10": {
    subtitle: "Allenamento deliberato: precisione vs velocità, carte/sequenze e auto-coaching basato su evidenze",
    theme: "training",
    planTier: "plus",
    entrySuggestion: "Dopo più sessioni di studio e ripasso",
    unlockPolicy: "POCO LOCO · Metriche con campione minimo dichiarato",
  },
  "course-11": {
    subtitle: "Uso critico dell'AI: verifica fonti da PDF, modifica indizi, tutor socratico graduato e audit dei consigli",
    theme: "ai-studio",
    planTier: "pro",
    entrySuggestion: "Quando si usano strumenti assistiti",
    unlockPolicy: "PRO LOCO · Esercizi mock gratuiti; workflow AI live non attivo",
  },
};

function resolveRuntimeExerciseKind(lessonId: string): {
  kind: RuntimeExerciseKind;
  requiresSimulatedFallbackNotice: boolean;
  fallbackNoticeText: string | null;
} {
  if (lessonId === "S01") {
    return {
      kind: "s01-recognition-recall-switch",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId === "S02") {
    return {
      kind: "s02-target-question-builder",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId === "S03") {
    return {
      kind: "s03-five-locus-scene-builder",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId === "S04") {
    return {
      kind: "s04-action-association-builder",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId === "S05") {
    return {
      kind: "s05-blind-recall-simulation",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId === "S06") {
    return {
      kind: "s06-due-queue-scheduler",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId.startsWith("L")) {
    return {
      kind: "loci-scene-lab",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId.startsWith("K")) {
    return {
      kind: "linked-chain-builder",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId.startsWith("N") || lessonId.startsWith("Q")) {
    return {
      kind: "major-phonetic-drill",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId.startsWith("T") || lessonId.startsWith("R")) {
    return {
      kind: "study-comprehension-lab",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
  }
  if (lessonId.startsWith("X")) {
    return {
      kind: "real-life-application",
      requiresSimulatedFallbackNotice: false,
      fallbackNoticeText: null,
    };
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

  // Check if multiple choice A / B is present in question
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

  // Extract meaningful words (>= 3 chars) from expectedAnswer
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

export const RAW_ACADEMY_LESSONS: LessonEditorial[] =
  rawCurriculum.lessons as LessonEditorial[];

export const ENRICHED_ACADEMY_LESSONS: EnrichedAcademyLesson[] =
  RAW_ACADEMY_LESSONS.map((lesson) => {
    const courseMeta = COURSE_METADATA[lesson.courseId] ?? {
      subtitle: lesson.courseName,
      theme: "study" as AcademyTheme,
      planTier: lesson.planTier,
      entrySuggestion: "Libero",
      unlockPolicy: "Libero",
    };
    const courseNum = Number(lesson.courseId.replace("course-", "")) || 0;
    const runtimeSpec = resolveRuntimeExerciseKind(lesson.id);
    const cpMeta = buildCheckpointMetadata(lesson);

    return {
      ...lesson,
      theme: courseMeta.theme,
      courseNumber: courseNum,
      runtimeExerciseKind: runtimeSpec.kind,
      requiresSimulatedFallbackNotice: runtimeSpec.requiresSimulatedFallbackNotice,
      fallbackNoticeText: runtimeSpec.fallbackNoticeText,
      checkpointAcceptedKeywords: cpMeta.acceptedKeywords,
      checkpointOptions: cpMeta.options,
      progressiveHint: cpMeta.progressiveHint,
    };
  });

export const ACADEMY_LESSONS_BY_ID: Record<string, EnrichedAcademyLesson> =
  Object.fromEntries(ENRICHED_ACADEMY_LESSONS.map((l) => [l.id, l]));

export const ACADEMY_COURSES: AcademyCourse[] = rawCurriculum.courses.map((c) => {
  const meta = COURSE_METADATA[c.courseId] ?? {
    subtitle: c.title,
    theme: "study" as AcademyTheme,
    planTier: "free" as LessonTier,
    entrySuggestion: "Libero",
    unlockPolicy: "Libero",
  };
  const lessons = c.lessonIds
    .map((id) => ACADEMY_LESSONS_BY_ID[id])
    .filter((l): l is EnrichedAcademyLesson => Boolean(l));

  return {
    courseId: c.courseId,
    courseNumber: c.courseNumber,
    title: c.title,
    subtitle: meta.subtitle,
    theme: meta.theme,
    planTier: meta.planTier,
    entrySuggestion: meta.entrySuggestion,
    unlockPolicy: meta.unlockPolicy,
    lessonIds: c.lessonIds,
    lessons,
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

/**
 * Migra i progressi legacy (`c1-l1`..`c3-l3` con flag `completed: boolean`)
 * senza annullare i progressi esistenti e SENZA promuovere `completed=true` a `mastered_after_delay`
 * o `provisionally_passed`: un clic legacy viene registrato solo come `reading` (`readCompletedAt`).
 */
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

      // Regola non negoziabile: un `completed=true` legacy equivale solo a lettura aperta/letta, MAI a padronanza
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

/**
 * Verifica se la risposta dell'utente alla domanda di checkpoint soddisfa la chiave editoriale.
 */
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

  // Per scelte A/B o Sì/No richiediamo corrispondenza esatta
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

  // Per risposte aperte brevi, controlliamo la presenza dei concetti chiave
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

/**
 * Registra un tentativo di verifica (checkpoint) applicando le regole rigorose del contratto didattico:
 * - Se `viewedAnswerBeforeAttempt` è true, il tentativo NON può mai promuovere a `provisionally_passed` o `mastered_after_delay`.
 * - Se `hintsUsed > 0`, il tentativo è registrato come assistito e richiede una prova autonoma senza indizi per la padronanza.
 * - Solo un secondo successo autonomo (ritardato / successivo a `provisionally_passed`) promuove a `mastered_after_delay`.
 */
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
    // Rivelazione prima del tentativo: mai accreditata come superamento autonomo
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
      // Pianifica il consolidamento successivo a +7 giorni
      const nextDate = new Date(Date.parse(nowIso) + 7 * 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    } else {
      nextStatus = "provisionally_passed";
      provisionallyPassedAt = provisionallyPassedAt ?? nowIso;
      // Pianifica verifica ritardata a +24 ore
      const nextDate = new Date(Date.parse(nowIso) + 24 * 60 * 60 * 1000);
      nextReviewDueAt = nextDate.toISOString();
    }
  } else if (evalResult.isCorrect && params.hintsUsedInAttempt > 0) {
    // Corretto ma con indizio: registrato, ma richiede tentativo autonomo
    if (
      current.status === "available" ||
      current.status === "reading"
    ) {
      nextStatus = current.practiceCompletedAt ? "practice_done" : "reading";
    }
  } else {
    // Risposta errata
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
 * Se la `contentVersion` di una lezione cambia, preserva lo storico ma richiede una verifica aggiornata (`needs_review`).
 */
export function reconcileAcademyProgressVersion(
  record: AcademyLessonProgress,
  lesson: Pick<LessonEditorial, "contentVersion">
): AcademyLessonProgress {
  if (record.contentVersion === lesson.contentVersion) {
    return record;
  }
  const demotedStatus: LessonStatus =
    record.status === "mastered_after_delay" ||
    record.status === "provisionally_passed"
      ? "needs_review"
      : record.status;

  return {
    ...record,
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

/**
 * Motore di routing didattico adattivo (Sezione D3 di `LOCO_ACADEMY_CURRICULUM.md`).
 * Suggerisce lezioni mirate solo in base a errori realmente osservati e dichiara sempre il campione.
 */
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
