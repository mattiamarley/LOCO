/**
 * LOCO Academy 2.0 — Pedagogical Game & Assessment Engine
 *
 * Implements the 56 unique missions from `03_LESSONS_56_AUTHORING.json` and
 * `12_GAME_FIXTURES_AUTHORING.json` without exposing answer keys in the UI
 * before a valid submitted attempt.
 *
 * Non-negotiable scoring rules (`05_GAME_ENGINE_SPEC.md` & `06_PROMPT_ARGON_FINAL.md`):
 * 1. Answers remain hidden until a valid attempt is submitted (`blindBeforeReveal: true`).
 * 2. Every attempt records `submittedBeforeReveal`, `hintsUsed`, `datasetVersion`,
 *    `verifiedBy`, and `lessonVersion` ("2.0.0").
 * 3. Revealing the answer or using an answer-revealing hint prevents autonomous mastery.
 * 4. Completing a builder or clicking loci proves construction (`skill_practiced`),
 *    NEVER memory recall (`construction != correct recall`).
 * 5. Open-ended rubric tasks never grant automatic mastery from non-empty text
 *    (`verifiedBy: "learner_self_check"` grants practice/completion, not automatic mastery).
 */

import playerContentV2 from "./loco-academy-player-v2.json" with { type: "json" };

export const ACADEMY_V2_SCHEMA_VERSION = "2.0.0";
export const ACADEMY_V2_DEFAULT_DATASET_VERSION = "2.0.0-a";

export type AssessmentMode =
  | "deterministic_exact"
  | "deterministic_sequence"
  | "phonetic_major_v1"
  | "hybrid_deterministic_and_rubric"
  | "rubric_manual"
  | "rubric_reviewed";

export type VerificationAuthority =
  | "deterministic"
  | "learner_self_check"
  | "qualified_review";

export type ErrorDiagnosisCategory =
  | "attention_reading"
  | "wrong_target"
  | "weak_cue"
  | "ambiguous_locus"
  | "order_omission_inversion"
  | "phonetic_encoding"
  | "source_misconception"
  | "retention_decay";

export type LessonGradingReliability =
  | "deterministic_verified"
  | "hybrid_recall_and_rubric"
  | "rubric_guided_self_check";

export interface ErrorDiagnosisInfo {
  category: ErrorDiagnosisCategory;
  label: string;
  diagnosis: string;
  repairAction: string;
}

export const ERROR_DIAGNOSIS_CATALOG: Record<
  ErrorDiagnosisCategory,
  ErrorDiagnosisInfo
> = {
  attention_reading: {
    category: "attention_reading",
    label: "Attenzione e osservazione iniziale",
    diagnosis:
      "Il bersaglio o i dettagli dello stimolo non sono stati osservati con sufficiente precisione prima di codificare.",
    repairAction:
      "Fermati 5 secondi sul dato sorgente, nomina ad alta voce o per iscritto il dettaglio distintivo e solo dopo crea l'immagine.",
  },
  wrong_target: {
    category: "wrong_target",
    label: "Bersaglio non chiarito",
    diagnosis:
      "La scena richiama l'argomento generale o lo strumento, ma non la risposta specifica richiesta dalla domanda.",
    repairAction:
      "Riformula prima la domanda verificabile (cosa devo rispondere esattamente?) e inserisci nella scena la chiave della risposta.",
  },
  weak_cue: {
    category: "weak_cue",
    label: "Cue decorativo o non invertibile",
    diagnosis:
      "L'immagine è curiosa o estetica, ma quando rivedi il luogo non ti riconduce alla parola esatta.",
    repairAction:
      "Sostituisci l'immagine statica con un'azione fisica in cui l'oggetto bersaglio modifica il locus in modo inequivocabile.",
  },
  ambiguous_locus: {
    category: "ambiguous_locus",
    label: "Locus spaziale ambiguo (collisione)",
    diagnosis:
      "Due fermate del percorso si somigliano troppo (es. due sedie o due angoli uguali) e scambiano i ricordi.",
    repairAction:
      "Elimina i punti duplicati e scegli un solo oggetto unico per micro-zona, ben illuminato e con forma distinta.",
  },
  order_omission_inversion: {
    category: "order_omission_inversion",
    label: "Ordine: omissione o inversione nella catena/rotta",
    diagnosis:
      "Alcuni elementi sono stati ricordati ma fuori posizione, oppure un anello intermedio è saltato.",
    repairAction:
      "Ripara esclusivamente il legame tra l'ultimo elemento corretto e quello saltato/invertito, poi ripercorri in avanti e a ritroso.",
  },
  phonetic_encoding: {
    category: "phonetic_encoding",
    label: "Conversione fonetica Major imprecisa",
    diagnosis:
      "Hai contato la lettera scritta invece del suono reale (es. C/G dolce 6 vs dura 7, digramma SC=0, GN=2, GL=5, o zero iniziale perso).",
    repairAction:
      "Pronuncia la parola ad alta voce, separa i soli fonemi consonantici secondo `major-it-v1` e conserva sempre gli zeri iniziali come testo.",
  },
  source_misconception: {
    category: "source_misconception",
    label: "Modello causale o fatto sorgente impreciso",
    diagnosis:
      "Stai cercando di memorizzare una regola o un dato non compreso o non verificato nella fonte.",
    repairAction:
      "Verifica prima il dato nella fonte e chiarisci il perché causale; usa la mnemotecnica solo sui termini/numeri arbitrari.",
  },
  retention_decay: {
    category: "retention_decay",
    label: "Tenuta a distanza (illusione di stabilità immediata)",
    diagnosis:
      "Il ricordo funzionava subito dopo la codifica ma si è indebolito dopo l'intervallo o il distrattore.",
    repairAction:
      "Programma un tentativo a risposta nascosta a distanza (+24h / +3g) e rinforza solo gli item che hanno richiesto indizi.",
  },
};

export interface AttemptEvidence {
  lessonId: string;
  lessonVersion: string;
  gameId: string;
  datasetVersion: string;
  stageType:
    | "demonstration"
    | "guided_practice"
    | "independent_challenge"
    | "diagnostic_feedback";
  presentedStimulusId: string;
  submittedAnswer: unknown;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  correct: boolean | null; // null = open rubric self-check, not machine-verifiable
  verifiedBy: VerificationAuthority;
  autonomousMasteryEligible: boolean;
  scoreRatio: number; // 0..1
  summaryHeadline: string;
  diagnosticFeedback: string;
  errorCategory: ErrorDiagnosisCategory | null;
  repairAction: string | null;
  createdAt: string;
}

/**
 * Tipi di interazione per le sfide indipendenti e le pratiche guidate v2.
 */
export type V2ChallengeWidgetKind =
  | "ordered_flash_recall" // S01, L03, L06, K01 (esposizione -> nascondi -> input ordinato)
  | "unordered_flash_recall" // X03 (esposizione 9 commissioni -> nascondi -> input libero senza vincolo d'ordine)
  | "pairs_blind_recall" // S05, N05, X04 (studia coppie -> nascondi -> digita la risposta per ogni cue)
  | "loci_route_and_blind_order" // S03, L02, L07, P01, P03, Q02, W03, W04 (filtra/costruisci rotta -> nascondi etichette -> richiama a salto/ordine)
  | "builder_then_blind_recall" // S04, L04, K02, X02 (costruisci scena/ponte -> nascondi -> digita target dal solo locus/contesto)
  | "missing_link_diagnosis" // K04 (identifica elemento omesso + anello rotto + ripara + richiama 7 voci)
  | "phonetic_word_for_numbers" // N01, Q01 (inserisci parola valida major-it-v1 per ogni numero + verifica collisioni + richiamo cifre)
  | "phonetic_decode_words" // N02, N04 (decodifica lista di parole in stringhe di cifre con zero iniziale preservato)
  | "phonetic_year_blocks" // N03 (spezza anni 1749 e 1926 in 2 blocchi da 2 cifre con parole major-it-v1 + decodifica)
  | "pao_scene_codec" // Q03 (codifica e decodifica 12-24-37 con Person-Action-Object in ordine esatto)
  | "long_number_chunks" // Q04 (segmenta 640281, 729540, 183762 in coppie, associa e ricostruisci a memoria)
  | "multi_case_classification" // T04, T05, W02, A04 (classifica ogni caso nella categoria esatta)
  | "numeric_transfer_lab" // R04 (calcola densità A=2, B=0.8 e identifica quale galleggia="B")
  | "metrics_and_trials_lab" // U01, U02 (calcola accuratezze separate / scegli miglior compromesso velocità-precisione)
  | "cards_and_names_dual_lab" // U03 (studia 5 carte + 3 nomi-contesto -> nascondi -> ricostruisci ordine carte e nomi separatamente)
  | "source_fact_check_lab" // A01 (confronta fonte 78% vs AI 87% -> segnala errore, inserisci 78 e approvazione umana)
  | "structured_plus_rubric"; // S02, S06, L01, L05, K03, T01, T02, T03, T06, X01, P02, P04, R01, R02, R03, W01, U04, A02, A03

export interface StructuredCheckQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface V2LessonMissionSpec {
  lessonId: string;
  gameId: string;
  datasetVersion: string;
  assessmentMode: AssessmentMode;
  gradingReliability: LessonGradingReliability;
  defaultErrorCategory: ErrorDiagnosisCategory;
  // Stage 4: Demonstration interactive check
  demonstrationQuestion: string;
  demonstrationOptions: { id: string; label: string; isCorrect: boolean }[];
  demonstrationModelReveal: string;
  // Stage 5: Guided Practice (Set A — distinct from Set B!)
  guidedPracticePrompt: string;
  guidedPracticeTask: {
    kind: "flash_mini" | "structured_checks" | "major_mini";
    flashWords?: string[];
    majorTargets?: { numberOrWord: string; mode: "encode" | "decode"; expected: string }[];
    checks?: StructuredCheckQuestion[];
  };
  // Stage 6: Independent Challenge (Set B — newStimulus)
  widgetKind: V2ChallengeWidgetKind;
  independentPrompt: string;
  progressiveHints: string[];
  // Payload specifico per il widget della sfida indipendente (senza esporre la soluzione nella UI prima del tentativo)
  orderedFlashSpec?: {
    baselineWords?: string[]; // Solo S01 ha round 1 baseline + round 2 con loci
    targetWords: string[];
    lociLabels?: string[];
    hideAfterSeconds: number;
    minOrderedPassCount: number;
  };
  unorderedFlashSpec?: {
    targetWords: string[];
    hideAfterSeconds: number;
    minRecallCount: number;
  };
  pairsRecallSpec?: {
    studyPairs: { cue: string; target: string; contextHint: string }[];
    askReverseToo?: boolean;
    minCorrectCount: number;
  };
  lociRouteSpec?: {
    candidateStops?: { id: string; label: string; isAmbiguousDistractor: boolean; zone?: string }[];
    candidates?: { id: string; label: string; isValid: boolean; invalidReason?: string; zone?: string }[];
    expectedOrderedStopIds?: string[];
    randomAccessProbes?: { prompt: string; expectedAnswer: string }[];
    requiredValidCount?: number;
    spotCheckIndex?: number;
  };
  builderRecallSpec?: {
    itemsToBuild?: { locusOrContext: string; targetWord: string; actionPlaceholder?: string }[];
    assignments?: {
      locusOrAnchor: string;
      targetToRemember: string;
      suggestedVerbs?: string[];
      suggestedSensory?: string[];
    }[];
    minRecalledCount: number;
  };
  missingLinkSpec?: {
    memorizedChain: string[];
    corruptedRecall: string[];
    expectedOmittedWord: string;
    expectedBrokenAfterWord: string;
  };
  phoneticNumbersSpec?: {
    targetNumbers: string[];
    exampleWordsAfterSubmit: Record<string, string>;
    minValidCount: number;
  };
  phoneticDecodeSpec?: {
    words: string[];
    expectedDigits: string[];
    minCorrectCount: number;
  };
  phoneticBlocksSpec?: {
    fourDigitCodes: string[];
    exampleBlocksAfterSubmit: Record<string, [string, string]>;
  };
  paoCodecSpec?: {
    codebook: { digits: string; person: string; action: string; object: string }[];
    challengeSequence: [string, string, string];
    expectedPaoWords: [string, string, string];
  };
  paoSpec?: {
    codebook?: { digits: string; person: string; action: string; object: string }[];
    tableEntries?: { digits: string; person: string; action: string; object: string }[];
    challengeSequence?: [string, string, string];
    expectedPaoWords?: [string, string, string];
    targets?: { digits: string; person: string; action: string; object: string }[];
    sixDigitTargets?: string[];
  };
  longNumbersSpec?: {
    sequences: string[];
    expectedPairs: string[][];
  };
  longNumberSpec?: {
    sequences?: string[];
    expectedPairs?: string[][];
    numberChunks?: { sequence: string; expectedPairs: string[] }[];
    chunks?: string[];
    fullDigits?: string;
    lociLabels?: string[];
  };
  classificationSpec?: {
    cases: { id: string; stimulus: string; expectedCategory: string }[];
    categories: { id: string; label: string }[];
    followUpQuestion?: {
      id: string;
      prompt: string;
      options: { id: string; label: string }[];
      correctOptionId: string;
    };
  };
  numericTransferSpec?: {
    fluidDensityGcm3?: number;
    materialA?: { massG: number; volumeCm3: number; expectedDensity: number };
    materialB?: { massG: number; volumeCm3: number; expectedDensity: number };
    expectedFloats?: "A" | "B";
    expectedNumber?: number;
    expectedUnit?: string;
    problemText?: string;
    unitOptions?: string[];
    followUpChecks?: StructuredCheckQuestion[];
  };
  metricsTrialsSpec?: {
    mode: "u01_metrics" | "u02_trials";
    activeRecallWords?: string[];
    decisionChecks?: StructuredCheckQuestion[];
    trialsLog?: {
      trial?: number;
      id?: string;
      seconds?: number;
      speedSec?: number;
      correct?: number;
      omissions?: number;
      inversions?: number;
      errors?: number;
      note?: string;
    }[];
  };
  cardsAndNamesSpec?: {
    cards?: string[];
    namePairs?: { context: string; name: string }[];
    orderedCards?: string[];
    profiles?: { id?: string; name?: string; context?: string; person: string; role: string; detail: string }[];
  };
  sourceFactCheckSpec?: {
    sourceExcerpt: string;
    aiProposedClaim: string;
    expectedCorrectNumber: number;
    candidateCards?: { id: string; prompt: string; claim?: string; isAccepted?: boolean; expectedDecision: "approve" | "reject" }[];
    correctOptionIdForRejected?: string;
    correctionQuestion?: string;
    correctionOptions?: { id: string; label: string }[];
  };
  structuredPlusRubricSpec?: {
    stimulusText: string;
    requestedOutput: string;
    structuredChecks: StructuredCheckQuestion[];
    openPromptLabel: string;
    openPromptPlaceholder: string;
    rubricCriteria: string[];
    modelReferenceAfterSubmit: string;
  };
}

const DEFAULT_RUBRIC_CRITERIA = [
  "Il compito richiesto è stato affrontato in tutte le sue parti (nessuna sezione omessa).",
  "Il contenuto e il ragionamento causale sono tecnicamente corretti rispetto alla fonte.",
  "La risposta applica la regola a un caso nuovo e non copia semplicemente l'esempio guidato.",
  "Quando è richiesto un ricordo, il bersaglio è stato recuperato a risposta nascosta.",
];

export const ACADEMY_V2_MISSIONS: Record<string, V2LessonMissionSpec> = {
  /* =========================================================================
     CORSO 0 — Benvenuto in LOCO (S01–S06: Unità Iniziale Obbligatoria)
     ========================================================================= */
  S01: {
    lessonId: "S01",
    gameId: "S01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Perché vedere «Parigi» scritto accanto a «Capitale della Francia?» non basta a dimostrare che lo ricorderai domani?",
    demonstrationOptions: [
      {
        id: "rec-vs-ret",
        label:
          "Perché leggere la risposta attiva solo il riconoscimento visivo, non il recupero autonomo dalla memoria.",
        isCorrect: true,
      },
      {
        id: "too-short",
        label: "Perché Parigi è una parola troppo corta per essere memorizzata.",
        isCorrect: false,
      },
      {
        id: "no-image",
        label: "Perché senza una fotografia a colori non è possibile ricordare alcun fatto.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Quando la risposta è visibile provi una sensazione di familiarità (riconoscimento). Solo quando la risposta è nascosta e la generi tu stesso verifichi il recupero reale.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Osserva le 5 parole «limone, violino, ponte, bussola, moneta». Poi nascondi la lista e scrivile nell'ordine esatto senza suggerimenti.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["limone", "violino", "ponte", "bussola", "moneta"],
    },
    widgetKind: "ordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B indipendente): Prima esegui la baseline su «globo, candela, squalo, tromba, cactus, casco». Poi memorizza con i 6 loci preparati il nuovo set «faro, miele, aquila, tamburo, sciarpa, razzo», nascondi la lista e riporta almeno 4 oggetti in ordine esatto.",
    progressiveHints: [
      "Percorri mentalmente le 6 fermate nell'ordine fisso (1. Ingresso → 2. Specchio → 3. Tavolo → 4. Libreria → 5. Finestra → 6. Balcone) prima di scrivere.",
      "Concentrati sull'azione fisica che ogni oggetto compie sul proprio punto della stanza, senza cercare di ricordare la lista come suono astratto.",
    ],
    orderedFlashSpec: {
      baselineWords: ["globo", "candela", "squalo", "tromba", "cactus", "casco"],
      targetWords: ["faro", "miele", "aquila", "tamburo", "sciarpa", "razzo"],
      lociLabels: [
        "1. Porta d'ingresso",
        "2. Specchio corridoio",
        "3. Tavolo studio",
        "4. Libreria a parete",
        "5. Finestra",
        "6. Balcone",
      ],
      hideAfterSeconds: 12,
      minOrderedPassCount: 4,
    },
  },

  S02: {
    lessonId: "S02",
    gameId: "S02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Se devi studiare un paragrafo sulla fotosintesi, quale passo viene PRIMA di inventare un'immagine mnemonica?",
    demonstrationOptions: [
      {
        id: "extract-q",
        label:
          "Estrarre domande specifiche e verificabili (es. quali elementi entrano, che ruolo ha la luce, cosa produce).",
        isCorrect: true,
      },
      {
        id: "color-all",
        label: "Trasformare ogni singola parola della frase in un personaggio animato.",
        isCorrect: false,
      },
      {
        id: "reread-ten",
        label: "Rileggere il paragrafo dieci volte finché suona familiare.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un argomento («fotosintesi» o «maree») non è ancora un bersaglio verificabile. Prima separi fatto, spiegazione causale e contesto; poi crei cue solo per i dati che rischi di dimenticare.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Trasforma l'obiettivo vago «ripassare i pianeti» distinguendo una domanda sull'ordine, una sulle caratteristiche e una di confronto.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "s02-gp-1",
          prompt: "Quale di queste formulazioni sui pianeti è una domanda verificabile sull'ordine?",
          options: [
            {
              id: "ok",
              label: "Qual è la sequenza dei primi quattro pianeti rocciosi partendo dal Sole?",
            },
            { id: "vague", label: "I pianeti del sistema solare sono importanti." },
            { id: "random", label: "Che colore preferisci per disegnare Saturno?" },
          ],
          correctOptionId: "ok",
          explanation:
            "Chiede un target preciso e controllabile (i 4 pianeti interni in ordine di distanza dal Sole).",
        },
        {
          id: "s02-gp-2",
          prompt: "Quale domanda verifica invece una relazione causale o di confronto?",
          options: [
            {
              id: "ok",
              label:
                "Perché Venere ha una temperatura superficiale media più alta di Mercurio nonostante sia più lontano dal Sole?",
            },
            { id: "vague", label: "Ripassare il capitolo sui pianeti." },
            { id: "list", label: "Scrivere la parola pianeta cinque volte." },
          ],
          correctOptionId: "ok",
          explanation:
            "Richiede di spiegare il meccanismo (effetto serra dell'atmosfera densa di CO₂), non solo un nome.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Leggi il testo «L’acqua evapora quando le molecole passano dallo stato liquido a quello gassoso; il calore favorisce il processo». Classifica i bersagli e produci 1 domanda fattuale, 1 domanda causale e 1 variazione di contesto.",
    progressiveHints: [
      "La domanda fattuale chiede 'che cosa accade / quali stati sono coinvolti'; la domanda causale chiede 'perché il calore modifica la velocità del passaggio'.",
      "Per la variazione di contesto, applica lo stesso principio a una situazione quotidiana diversa (es. panni stesi al sole vs in una stanza fredda).",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "«L’acqua evapora quando le molecole passano dallo stato liquido a quello gassoso; il calore favorisce il processo».",
      requestedOutput:
        "Produci una domanda fattuale, una causale e una variazione di contesto; rubrica: specificità, correttezza, verificabilità.",
      structuredChecks: [
        {
          id: "s02-ic-1",
          prompt:
            "1. Quale tra questi è il bersaglio FATTUALE diretto ricavato dal testo?",
          options: [
            {
              id: "fact",
              label: "Quale passaggio di stato compiono le molecole d'acqua durante l'evaporazione (liquido → gassoso)?",
            },
            {
              id: "vague",
              label: "Parlami dell'acqua in generale.",
            },
            {
              id: "unrel",
              label: "Qual è la profondità media degli oceani?",
            },
          ],
          correctOptionId: "fact",
          explanation: "Identifica con precisione la definizione fattuale contenuta nella fonte.",
        },
        {
          id: "s02-ic-2",
          prompt:
            "2. Quale domanda richiede invece la RELAZIONE CAUSALE e il TRASFERIMENTO a un caso nuovo?",
          options: [
            {
              id: "causal",
              label:
                "Perché fornire calore accelera l'evaporazione e cosa cambia se lasciamo un piatto d'acqua al sole rispetto a uno in frigorifero?",
            },
            {
              id: "copy",
              label: "Ripetere a memoria le tredici parole della frase.",
            },
            {
              id: "cue",
              label: "Immaginare una nuvola gialla sopra il tavolo.",
            },
          ],
          correctOptionId: "causal",
          explanation: "Collega la causa energetica (calore) a una previsione verificabile in un contesto nuovo.",
        },
      ],
      openPromptLabel:
        "3. Scrivi ora con parole tue: (a) Domanda fattuale, (b) Domanda causale, (c) Domanda su contesto diverso:",
      openPromptPlaceholder:
        "a) Fattuale: Quali stati fisici...\nb) Causale: Perché il calore...\nc) Contesto nuovo: Cosa succede se...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Esempio di riferimento: (a) Fattuale: «Da quale stato a quale stato passano le molecole durante l'evaporazione?» (liquido → gassoso). (b) Causale: «Perché l'aumento di temperatura favorisce l'evaporazione?» (maggiore energia cinetica molecolare). (c) Variazione: «Perché una pozzanghera si asciuga più rapidamente sull'asfalto caldo che all'ombra?»",
    },
  },

  S03: {
    lessonId: "S03",
    gameId: "S03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Perché preparare e percorrere la rotta «a vuoto» (senza concetti) è fondamentale prima di caricare informazioni?",
    demonstrationOptions: [
      {
        id: "stable-order",
        label:
          "Perché garantisce che le fermate siano distinte e che l'ordine (1→5 e 5→1) sia già stabile nella tua mente.",
        isCorrect: true,
      },
      {
        id: "more-items",
        label: "Perché permette di mettere dieci oggetti diversi sullo stesso identico cuscino.",
        isCorrect: false,
      },
      {
        id: "no-order",
        label: "Perché nella tecnica dei loci l'ordine delle fermate cambia a ogni ripasso.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Se due fermate si confondono (es. due sedie identiche) o l'ordine è incerto a vuoto, qualsiasi concetto appoggiato lì andrà perso o invertito.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Seleziona 5 punti non ambigui nella stanza studio («Porta, Specchio, Armadio, Scrivania, Finestra»), poi verifica il richiamo nell'ordine scelto.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["porta", "specchio", "armadio", "scrivania", "finestra"],
    },
    widgetKind: "loci_route_and_blind_order",
    independentPrompt:
      "La prova vera (Set B): Nella stanza nuova trovi 5 ancore distinte («ingresso, specchio, lavandino, tappeto, terrazzo») e 4 distrattori ambigui («due sedie identiche, due cuscini uguali»). Scarta i distrattori, poi — a etichette nascoste — richiama la rotta in avanti, all'indietro e rispondi alle domande a salto.",
    progressiveHints: [
      "Scarta subito gli oggetti presenti in copia identica (le due sedie uguali e i due cuscini uguali): creano collisione spaziale.",
      "Segui il perimetro naturale dall'entrata verso l'esterno: 1. ingresso → 2. specchio → 3. lavandino → 4. tappeto → 5. terrazzo.",
    ],
    lociRouteSpec: {
      candidateStops: [
        { id: "ingresso", label: "Ingresso", isAmbiguousDistractor: false, zone: "Entrata" },
        { id: "sedia-a", label: "Sedia identica A", isAmbiguousDistractor: true, zone: "Centro" },
        { id: "specchio", label: "Specchio", isAmbiguousDistractor: false, zone: "Parete" },
        { id: "cuscino-1", label: "Cuscino uguale 1", isAmbiguousDistractor: true, zone: "Divano" },
        { id: "lavandino", label: "Lavandino", isAmbiguousDistractor: false, zone: "Bagno/Cucina" },
        { id: "sedia-b", label: "Sedia identica B", isAmbiguousDistractor: true, zone: "Centro" },
        { id: "tappeto", label: "Tappeto", isAmbiguousDistractor: false, zone: "Pavimento" },
        { id: "cuscino-2", label: "Cuscino uguale 2", isAmbiguousDistractor: true, zone: "Divano" },
        { id: "terrazzo", label: "Terrazzo", isAmbiguousDistractor: false, zone: "Esterno" },
      ],
      expectedOrderedStopIds: ["ingresso", "specchio", "lavandino", "tappeto", "terrazzo"],
      randomAccessProbes: [
        {
          prompt: "Accesso diretto senza etichette: qual è la fermata #4 della tua rotta?",
          expectedAnswer: "tappeto",
        },
        {
          prompt: "In senso inverso (da #5 verso #1), quale fermata viene subito PRIMA di «lavandino» (#3)?",
          expectedAnswer: "tappeto",
        },
        {
          prompt: "Qual è invece la fermata #2 della rotta?",
          expectedAnswer: "specchio",
        },
      ],
    },
  },

  S04: {
    lessonId: "S04",
    gameId: "S04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "weak_cue",
    demonstrationQuestion:
      "Quale di queste due scene sul locus «Porta» ti permette davvero di decodificare la parola «limone»?",
    demonstrationOptions: [
      {
        id: "functional",
        label:
          "Un limone gigante incastrato nella serratura che spruzza succo acido appena giri la maniglia.",
        isCorrect: true,
      },
      {
        id: "decorative",
        label: "Una porta dipinta di un bel colore chiaro in una stanza ordinata.",
        isCorrect: false,
      },
      {
        id: "abstract",
        label: "Ripetere mentalmente «porta uguale agrume» senza alcuna interazione.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un'associazione funziona quando il bersaglio («limone») compie un'azione fisica sul locus («serratura della porta»). Compilare il builder è solo preparazione: la prova vera è recuperare la parola vedendo solo il luogo.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Collega «limone → porta», «violino → scrivania», «bussola → finestra» con un'azione viva, poi verifica il richiamo dal luogo.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "s04-gp-1",
          prompt: "Per ricordare «bussola» sul locus «finestra», quale azione crea il legame più decodificabile?",
          options: [
            {
              id: "ok",
              label: "L'ago magnetico della bussola ruota vorticosamente e incrina il vetro della finestra puntando a Nord.",
            },
            { id: "weak", label: "Una finestra aperta su un paesaggio estivo." },
            { id: "generic", label: "Un oggetto rotondo appoggiato da qualche parte." },
          ],
          correctOptionId: "ok",
          explanation: "L'ago magnetico che incrina il vetro lega fisicamente la bussola alla finestra.",
        },
      ],
    },
    widgetKind: "builder_then_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Costruisci le scene d'azione per i 4 bersagli («fischietto → frigorifero», «bussola → tappeto», «cerniera → finestra», «lanterna → libreria»).Nota: completare il builder NON assegna il superamento! Dopo aver salvato le scene, queste verranno nascoste e dovrai digitare la parola esatta partendo dal solo luogo.",
    progressiveHints: [
      "Fai interagire fisicamente l'oggetto con la superficie del luogo (es. il fischietto che congela e suona aprendo lo sportello del frigorifero).",
      "Quando vedi solo il luogo (es. «finestra»), chiediti quale oggetto metallico stava aprendo o chiudendo il vetro a strappo.",
    ],
    builderRecallSpec: {
      itemsToBuild: [
        {
          locusOrContext: "Frigorifero",
          targetWord: "fischietto",
          actionPlaceholder: "Es. Il fischietto d'argento fischia vapore gelido quando apro il frigorifero...",
        },
        {
          locusOrContext: "Tappeto",
          targetWord: "bussola",
          actionPlaceholder: "Es. La bussola scava una freccia luminosa nelle fibre del tappeto...",
        },
        {
          locusOrContext: "Finestra",
          targetWord: "cerniera",
          actionPlaceholder: "Es. Una grossa cerniera lampo apre e chiude i due battenti della finestra...",
        },
        {
          locusOrContext: "Libreria",
          targetWord: "lanterna",
          actionPlaceholder: "Es. La lanterna accesa illumina e fa levitare i volumi della libreria...",
        },
      ],
      minRecalledCount: 3,
    },
  },

  S05: {
    lessonId: "S05",
    gameId: "S05-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "attention_reading",
    demonstrationQuestion:
      "Durante una sessione di Blind Recall, che cosa succede se clicchi «Mostra risposta» prima di aver provato a rispondere?",
    demonstrationOptions: [
      {
        id: "no-credit",
        label:
          "Il tentativo viene registrato come risposta vista prima della prova (`viewedAnswerBeforeAttempt`) e non vale come recupero autonomo.",
        isCorrect: true,
      },
      {
        id: "full-credit",
        label: "Ottieni comunque il punteggio massimo perché hai letto la parola giusta.",
        isCorrect: false,
      },
      {
        id: "delete-locus",
        label: "Il locus viene cancellato definitivamente dal palazzo.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "In LOCO l'onestà del tentativo è sacra: risposta nascosta fino alla consegna, indizi tracciati separatamente e nessuna padronanza autonoma se sbirci la soluzione.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Verifica come il sistema distingue un tentativo autonomo da uno assistito con indizio.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "s05-gp-1",
          prompt:
            "Vedi il locus «Porta» ma ricordi solo «qualcosa di giallo» invece di «limone». Come va classificato questo esito?",
          options: [
            {
              id: "partial",
              label: "Recupero parziale / impreciso: il locus tiene ma il cue va reso più specifico per riportare alla parola esatta «limone».",
            },
            { id: "perfect", label: "Padronanza completa al 100%." },
          ],
          correctOptionId: "partial",
          explanation: "Ricordare solo una qualità generica («giallo») segnala che il cue deve codificare meglio l'oggetto specifico.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Studia le 4 coppie luogo→bersaglio («insegna → balena», «finestra → bussola», «pianoforte → zucca», «fontana → satellite»). Quando avvii il Blind Recall le risposte spariscono completamente: digita la parola esatta per ciascun luogo (almeno 3 su 4 autonome senza sbirciare).",
    progressiveHints: [
      "Non confondere le coppie centrali: sulla finestra c'è uno strumento di orientamento, mentre sul pianoforte c'è un ortaggio arancione.",
      "Insegna luminosa → cetaceo gigante; Fontana → oggetto in orbita.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        {
          cue: "insegna",
          target: "balena",
          contextHint: "Una balena spruzza acqua sopra l'insegna luminosa.",
        },
        {
          cue: "finestra",
          target: "bussola",
          contextHint: "Una bussola magnetica punta al Nord contro il vetro della finestra.",
        },
        {
          cue: "pianoforte",
          target: "zucca",
          contextHint: "Una grossa zucca arancione rimbalza sui tasti del pianoforte.",
        },
        {
          cue: "fontana",
          target: "satellite",
          contextHint: "Un satellite con pannelli solari ruota nel getto della fontana.",
        },
      ],
      minCorrectCount: 3,
    },
  },

  S06: {
    lessonId: "S06",
    gameId: "S06-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "retention_decay",
    demonstrationQuestion:
      "Perché tre risposte corrette date a 30 secondi di distanza oggi NON dimostrano che ricorderai quei concetti tra una settimana?",
    demonstrationOptions: [
      {
        id: "spacing",
        label:
          "Perché il richiamo immediato misura la memoria di lavoro/recente; il consolidamento richiede il superamento di una prova dopo un intervallo reale.",
        isCorrect: true,
      },
      {
        id: "never-works",
        label: "Perché i palazzi della memoria durano al massimo cinque minuti.",
        isCorrect: false,
      },
      {
        id: "xp-only",
        label: "Perché contano solo gli XP accumulati in giornata.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "In LOCO il superamento immediato assegna `provisionally_passed` (padronanza provvisoria). Solo una verifica autonoma superata a distanza promuove il target a `mastered_after_delay`.",
    guidedPracticePrompt:
      "Set A (Pratica guidata): Distingui nella coda di ripasso gli elementi appena codificati da quelli già verificati a distanza.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "s06-gp-1",
          prompt: "Quale elemento ha la priorità più alta nella coda dei ripassi di domani?",
          options: [
            {
              id: "hinted",
              label: "Un target ricordato oggi soltanto dopo aver chiesto un suggerimento (`assisted`).",
            },
            {
              id: "mastered",
              label: "Un target già superato senza aiuti a 1 giorno, 3 giorni e 7 giorni di distanza.",
            },
          ],
          correctOptionId: "hinted",
          explanation: "Gli item che hanno richiesto indizi hanno una stabilità minore e vanno verificati prima.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Oggi hai studiato quattro item: «radice, marea, prisma, estuario». «radice» e «marea» sono stati recuperati senza aiuti oggi; «prisma» ed «estuario» hanno richiesto un hint. Classifica lo stato reale di ciascuno e pianifica la verifica differita (ricorda: simulare i giorni qui insegna la regola ma non assegna mastery differita reale!).",
    progressiveHints: [
      "Nessun item studiato solo oggi può essere marcato 'mastered_after_delay': al massimo è 'provisionally_passed' se autonomo, oppure 'assisted / needs_review' se ha usato hint.",
      "Nel piano di ripasso, assegna un intervallo più ravvicinato a «prisma» ed «estuario» (che hanno usato hint) rispetto a «radice» e «marea».",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Quattro item imparati oggi: «radice, marea, prisma, estuario». Esito di oggi: «radice» e «marea» risposte perfette autonome; «prisma» ed «estuario» corrette solo dopo hint.",
      requestedOutput:
        "Distingui padronanza provvisoria, review dovuto e verifiche a distanza; simula giorni virtuali senza attribuire mastery reale.",
      structuredChecks: [
        {
          id: "s06-ic-1",
          prompt: "1. Qual è lo stato corretto OGGI per «radice» e «marea» (corretti senza aiuti al primo tentativo)?",
          options: [
            {
              id: "prov",
              label: "Padronanza provvisoria (`provisionally_passed`) — in attesa di verifica a distanza (+24h/+3g).",
            },
            {
              id: "mast",
              label: "Padronanza permanente definitiva (`mastered_after_delay`) già oggi.",
            },
            { id: "fail", label: "Errore completo da azzerare." },
          ],
          correctOptionId: "prov",
          explanation: "Un successo autonomo immediato è provvisorio finché non supera la prova a distanza.",
        },
        {
          id: "s06-ic-2",
          prompt: "2. Qual è invece lo stato e la priorità per «prisma» ed «estuario» (risposti usando un hint)?",
          options: [
            {
              id: "assist",
              label: "Richiamo assistito (`assisted` / `needs_review`) — priorità alta nel prossimo ripasso a risposta nascosta senza indizi.",
            },
            {
              id: "same",
              label: "Identico a «radice» e «marea»: nessun bisogno di ripasso.",
            },
          ],
          correctOptionId: "assist",
          explanation: "L'uso di un hint impedisce il superamento autonomo e richiede una nuova prova cieca ravvicinata.",
        },
      ],
      openPromptLabel:
        "3. Spiega come organizzeresti il ripasso di domani per i 4 item e perché una simulazione immediata nell'app non sostituisce il tempo reale:",
      openPromptPlaceholder:
        "Domani testerò prima prisma ed estuario senza indizi perché... La simulazione oggi non equivale a...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento esperto: (1) «prisma» ed «estuario» vanno testati per primi domani a risposta nascosta e senza hint; (2) «radice» e «marea» fanno la verifica di tenuta a +24h/+3g; (3) simulare il calendario oggi mostra il funzionamento dello scheduler ma non misura il consolidamento biologico tra un giorno e l'altro.",
    },
  },

  /* =========================================================================
     CORSO 1 — Tecnica dei Loci (L01–L07)
     ========================================================================= */
  L01: {
    lessonId: "L01",
    gameId: "L01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Perché l'appartamento di tua nonna o il tragitto verso la fermata del tram battono un castello fantastico generato al computer?",
    demonstrationOptions: [
      {
        id: "familiar",
        label:
          "Perché conosci già a memoria la disposizione delle stanze senza alcuno sforzo cognitivo aggiuntivo.",
        isCorrect: true,
      },
      {
        id: "bigger",
        label: "Perché i castelli hanno troppe poche stanze.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La mappa spaziale deve essere già solida nella tua memoria: se devi sforzarti per ricordare il luogo stesso, stai raddoppiando il carico invece di ridurlo.",
    guidedPracticePrompt:
      "Set A: Confronta due ambienti e identifica quale permette di elencare subito 5 fermate senza esitazioni.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l01-gp-1",
          prompt: "Quale criterio rende un luogo adatto come primo palazzo LOCO?",
          options: [
            { id: "ok", label: "Familiarità immediata, punti distinti e direzione di percorrenza naturale." },
            { id: "bad", label: "Complessità artistica e corridoi tutti uguali." },
          ],
          correctOptionId: "ok",
          explanation: "La stabilità della mappa conta molto più dell'estetica.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Confronta «Percorso A: otto fotografie di castelli sconosciuti» e «Percorso B: otto ancore distinte di un tragitto quotidiano». Spiega la scelta e ricostruisci 8 fermate ordinate di un tuo percorso reale.",
    progressiveHints: [
      "Spiega perché le 8 foto di castelli sconosciuti creano interferenza visiva e richiedono di memorizzare prima le foto stesse.",
      "Elenca 8 fermate numerate (1..8) di un luogo che conosci davvero, tutte diverse tra loro.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Percorso A: otto fotografie di castelli sconosciuti. Percorso B: otto ancore distinte di un tragitto quotidiano.",
      requestedOutput: "Spiega la scelta e ricostruisci otto fermate di un percorso tuo.",
      structuredChecks: [
        {
          id: "l01-ic-1",
          prompt: "Quale percorso scegli per memorizzare subito 8 concetti d'esame e perché?",
          options: [
            {
              id: "b",
              label: "Percorso B (tragitto quotidiano), perché la sequenza spaziale è già consolidata e priva di ambiguità tra schermate.",
            },
            {
              id: "a",
              label: "Percorso A (8 foto di castelli sconosciuti), perché sono più scenografici.",
            },
          ],
          correctOptionId: "b",
          explanation: "I luoghi familiari offrono ancore immediate senza costo di apprendimento della mappa.",
        },
      ],
      openPromptLabel:
        "Scrivi ora la motivazione e le 8 fermate ordinate (1→8) del tuo percorso reale:",
      openPromptPlaceholder:
        "Scelgo B perché...\nLe mie 8 fermate: 1) Portone, 2) Edicola, 3)...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Scelta del Percorso B motivata dal basso carico cognitivo della mappa preesistente + elenco di 8 fermate reali, distinte e ordinate sequenzialmente senza duplicati.",
    },
  },

  L02: {
    lessonId: "L02",
    gameId: "L02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Che cosa succede se scegli «angolo bianco 1», «angolo bianco 2» e «angolo bianco 3» come tre loci consecutivi?",
    demonstrationOptions: [
      {
        id: "collision",
        label: "Si verifica una collisione spaziale: i ricordi si scambiano di posto perché le ancore non hanno tratti distintivi.",
        isCorrect: true,
      },
      {
        id: "faster",
        label: "Il richiamo diventa più veloce perché i punti sono identici.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Ogni locus deve avere una silhouette, una funzione o un materiale unico nella stanza.",
    guidedPracticePrompt:
      "Set A: Individua i punti duplicati in una rotta e sostituiscili con oggetti unici.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l02-gp-1",
          prompt: "In «porta, sedia 1, sedia 2, finestra», quali punti vanno sostituiti?",
          options: [
            { id: "ok", label: "Sedia 1 e sedia 2, tenendo una sola sedia o sostituendole con oggetti distinti (es. lampada da terra e libreria)." },
            { id: "no", label: "Porta e finestra." },
          ],
          correctOptionId: "ok",
          explanation: "Le due sedie creano ambiguità immediata.",
        },
      ],
    },
    widgetKind: "loci_route_and_blind_order",
    independentPrompt:
      "La prova vera (Set B): La rotta originale contiene «sedia rossa A, sedia rossa B, tavolo, sedia rossa C, lavello, finestra». Scarta le sedie rosse duplicate sostituendole con le ancore uniche della stanza («ingresso, lampada, tavolo, forno, lavello, finestra») e supera le domande a salto senza etichette.",
    progressiveHints: [
      "Elimina tutte le 'sedie rosse A/B/C' duplicate e seleziona le 6 fermate uniche in ordine.",
      "Memorizza la posizione esatta di 'forno' (#4) e 'lampada' (#2) prima di nascondere le etichette.",
    ],
    lociRouteSpec: {
      candidateStops: [
        { id: "sedia-rossa-a", label: "Sedia rossa A (ambigua)", isAmbiguousDistractor: true },
        { id: "ingresso", label: "Ingresso", isAmbiguousDistractor: false },
        { id: "sedia-rossa-b", label: "Sedia rossa B (ambigua)", isAmbiguousDistractor: true },
        { id: "lampada", label: "Lampada ad arco", isAmbiguousDistractor: false },
        { id: "tavolo", label: "Tavolo in legno", isAmbiguousDistractor: false },
        { id: "sedia-rossa-c", label: "Sedia rossa C (ambigua)", isAmbiguousDistractor: true },
        { id: "forno", label: "Forno a parete", isAmbiguousDistractor: false },
        { id: "lavello", label: "Lavello in acciaio", isAmbiguousDistractor: false },
        { id: "finestra", label: "Finestra panoramica", isAmbiguousDistractor: false },
      ],
      expectedOrderedStopIds: ["ingresso", "lampada", "tavolo", "forno", "lavello", "finestra"],
      randomAccessProbes: [
        { prompt: "Senza etichette: qual è la fermata #4 della rotta riparata?", expectedAnswer: "forno" },
        { prompt: "Qual è la fermata #2 della rotta riparata?", expectedAnswer: "lampada" },
        { prompt: "Qual è la fermata #5 della rotta riparata?", expectedAnswer: "lavello" },
      ],
    },
  },

  L03: {
    lessonId: "L03",
    gameId: "L03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Quale regola semplice evita di saltare un punto o passare due volte sullo stesso mobile mentre percorri una stanza?",
    demonstrationOptions: [
      {
        id: "perimeter",
        label: "Seguire una regola fissa di percorrenza (es. parete sinistra dalla porta in senso orario).",
        isCorrect: true,
      },
      {
        id: "random-jump",
        label: "Saltare a caso da una parete all'altra seguendo i colori.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "L'ordine non deve essere indovinato durante l'interrogazione: è fissato dalla geometria del percorso.",
    guidedPracticePrompt:
      "Set A: Ordina 5 tappe coerenti lungo il perimetro e verifica il richiamo.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["cancello", "viale", "portone", "scala", "terrazza"],
    },
    widgetKind: "ordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B): Il percorso rotto «portone→camera→portone→cucina→camera→balcone» contiene salti e ripetizioni. Osserva la rotta corretta priva di loop «portone, specchio, cucina, balcone, camera», nascondila e ricostruiscila nell'ordine esatto.",
    progressiveHints: [
      "Segui la progressione dall'esterno verso la zona notte: portone → specchio → cucina → balcone → camera.",
      "Verifica di non ripetere due volte 'portone' o 'camera'.",
    ],
    orderedFlashSpec: {
      targetWords: ["portone", "specchio", "cucina", "balcone", "camera"],
      hideAfterSeconds: 8,
      minOrderedPassCount: 5,
    },
  },

  L04: {
    lessonId: "L04",
    gameId: "L04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Se metti l'immagine di un barometro sull'armadio ma all'esame ti chiedono «Che cosa misura il barometro?», quale rischio corri?",
    demonstrationOptions: [
      {
        id: "name-only",
        label:
          "Di ricordare la parola «barometro» (che era già nella domanda!) ma non la risposta «pressione atmosferica».",
        isCorrect: true,
      },
      {
        id: "too-easy",
        label: "Nessun rischio: ricordare il nome dello strumento basta sempre.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Il cue deve codificare la RISPOSTA («pressione atmosferica»), non solo ripetere il soggetto della domanda.",
    guidedPracticePrompt:
      "Set A: Distingui tra un cue che codifica solo il nome dello strumento e uno che codifica la grandezza misurata.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l04-gp-1",
          prompt: "Per ricordare che l'igrometro misura l'«umidità», quale scena codifica la risposta?",
          options: [
            { id: "ok", label: "L'igrometro sulla mensola strizza una nuvola carica d'acqua e gocce d'umidità." },
            { id: "bad", label: "Una scatola chiusa senza alcun riferimento all'acqua o al vapore." },
          ],
          correctOptionId: "ok",
          explanation: "La nuvola che rilascia gocce d'umidità rende decodificabile la grandezza misurata.",
        },
      ],
    },
    widgetKind: "builder_then_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Fonte: «Il barometro misura la pressione atmosferica». Costruisci le scene per i 3 strumenti nei rispettivi loci codificando la grandezza misurata, poi a scene nascoste digita esattamente che cosa misura ciascuno.",
    progressiveHints: [
      "Per l'armadio (barometro), inserisci nella scena il peso dell'aria che schiaccia le ante: «pressione atmosferica».",
      "Ricorda: Armadio/Barometro → pressione atmosferica; Scrivania/Anemometro → velocità del vento; Finestra/ Termometro → temperatura.",
    ],
    builderRecallSpec: {
      itemsToBuild: [
        {
          locusOrContext: "Armadio (Barometro)",
          targetWord: "pressione atmosferica",
          actionPlaceholder: "Es. Una colonna d'aria pesante schiaccia con pressione atmosferica le ante dell'armadio...",
        },
        {
          locusOrContext: "Scrivania (Anemometro)",
          targetWord: "velocità del vento",
          actionPlaceholder: "Es. Le coppette girano furiosamente misurando la velocità del vento sulla scrivania...",
        },
        {
          locusOrContext: "Finestra (Igrometro)",
          targetWord: "umidità",
          actionPlaceholder: "Es. Il quadrante suda gocce di vapore indicando l'umidità sul vetro...",
        },
      ],
      minRecalledCount: 3,
    },
  },

  L05: {
    lessonId: "L05",
    gameId: "L05-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "weak_cue",
    demonstrationQuestion:
      "Perché un «semplice bicchiere blu» è un pessimo cue per ricordare la definizione di osmosi?",
    demonstrationOptions: [
      {
        id: "no-mechanism",
        label:
          "Perché non contiene né la membrana semipermeabile né il passaggio selettivo del solvente.",
        isCorrect: true,
      },
      {
        id: "wrong-color",
        label: "Perché il bicchiere dovrebbe essere verde.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un buon cue scientifico traduce in azione visibile gli elementi strutturali della definizione (membrana che fa passare l'acqua ma blocca le particelle più grandi).",
    guidedPracticePrompt:
      "Set A: Confronta due immagini candidate e scegli quella che preserva il meccanismo da ricordare.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l05-gp-1",
          prompt: "Per ricordare che un catalizzatore «abbassa l'energia di attivazione», quale cue è decodificabile?",
          options: [
            { id: "ok", label: "Un tunnel che abbassa la montagna (barriera di attivazione) permettendo ai corridori di passare subito." },
            { id: "bad", label: "Una provetta colorata ferma sul tavolo." },
          ],
          correctOptionId: "ok",
          explanation: "Il tunnel che abbassa la barriera rappresenta direttamente l'abbassamento dell'energia di attivazione.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Fatto: «L’osmosi è il movimento del solvente attraverso una membrana semipermeabile». Confronta Cue A («semplice bicchiere blu») e Cue B («membrana che lascia passare acqua ma trattiene palline»), poi progetta un tuo cue alternativo che conservi la definizione.",
    progressiveHints: [
      "Includi nel tuo cue due elementi chiari: (1) una barriera/filtro selettivo (membrana semipermeabile) e (2) il liquido (solvente) che passa mentre il soluto resta bloccato.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Fatto: «L’osmosi è movimento del solvente attraverso una membrana semipermeabile». Cue A: semplice bicchiere blu; Cue B: membrana che lascia passare acqua ma trattiene palline.",
      requestedOutput:
        "Valuta decodificabilità di A e B, poi crea un cue alternativo che conservi la definizione.",
      structuredChecks: [
        {
          id: "l05-ic-1",
          prompt: "Quale tra Cue A e Cue B permette di ricostruire la definizione di osmosi a distanza di giorni?",
          options: [
            {
              id: "cue-b",
              label: "Cue B, perché rappresenta visivamente sia il passaggio del solvente (acqua) sia la selettività della membrana semipermeabile.",
            },
            {
              id: "cue-a",
              label: "Cue A, perché è più semplice da disegnare.",
            },
          ],
          correctOptionId: "cue-b",
          explanation: "Cue A potrebbe indicare acqua, sete, vetro o colore blu; Cue B preserva la struttura della definizione.",
        },
      ],
      openPromptLabel:
        "Scrivi un cue alternativo originale per «osmosi» e spiega come ogni dettaglio rimanda a «movimento del solvente» e «membrana semipermeabile»:",
      openPromptPlaceholder:
        "Immagino sulla porta una rete finissima (membrana semipermeabile) attraverso cui scorre l'acqua (solvente) mentre i cristalli di sale vengono respinti...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Il cue deve includere esplicitamente (1) l'elemento filtrante selettivo → membrana semipermeabile e (2) il passaggio del liquido verso la zona più concentrata → movimento del solvente.",
    },
  },

  L06: {
    lessonId: "L06",
    gameId: "L06-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Quando passi da 5 a 10 loci, come eviti che il tratto centrale (posizioni 5–7) diventi confuso?",
    demonstrationOptions: [
      {
        id: "two-zones",
        label:
          "Dividendo il percorso in 2 sotto-zone da 5 loci (es. Zona 1: Ingresso/Soggiorno 1–5; Zona 2: Studio/Terrazzo 6–10) con un punto mediano chiaro.",
        isCorrect: true,
      },
      {
        id: "one-corner",
        label: "Mettendo tutti i 10 oggetti nello stesso cassetto.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Spezzare 10 loci in due blocchi da 5 con una soglia intermedia (il locus #6 come primo punto della seconda stanza) azzera la deriva centrale.",
    guidedPracticePrompt:
      "Set A: Ripassa la divisione in due zone da 5 prima di affrontare la lista da 10.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l06-gp-1",
          prompt: "In un palazzo da 10 loci diviso in 2 stanze da 5, quale posizione occupa il PRIMO locus della seconda stanza?",
          options: [
            { id: "six", label: "Il locus #6 (subito dopo il punto mediano #5)." },
            { id: "ten", label: "Il locus #10." },
          ],
          correctOptionId: "six",
          explanation: "La prima stanza copre 1–5; la seconda inizia esattamente dal #6.",
        },
      ],
    },
    widgetKind: "ordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B): Codifica nei 10 loci a due zone la sequenza «pianeta, imbarcazione, quercia, lanterna, calamita, origami, cigno, cono, bicicletta, faro». Nascondi la lista e recupera le 10 parole in ordine (almeno 8/10 in posizione esatta).",
    progressiveHints: [
      "Zona 1 (1–5): 1. pianeta, 2. imbarcazione, 3. quercia, 4. lanterna, 5. calamita (punto mediano).",
      "Zona 2 (6–10): 6. origami, 7. cigno, 8. cono, 9. bicicletta, 10. faro.",
    ],
    orderedFlashSpec: {
      targetWords: [
        "pianeta",
        "imbarcazione",
        "quercia",
        "lanterna",
        "calamita",
        "origami",
        "cigno",
        "cono",
        "bicicletta",
        "faro",
      ],
      lociLabels: [
        "1. Portone (Z1)",
        "2. Specchio (Z1)",
        "3. Divano (Z1)",
        "4. Camino (Z1)",
        "5. Tavolo (Z1 - Mediano)",
        "6. Soglia Studio (Z2)",
        "7. Scrivania (Z2)",
        "8. Libreria (Z2)",
        "9. Finestra (Z2)",
        "10. Balcone (Z2)",
      ],
      hideAfterSeconds: 25,
      minOrderedPassCount: 8,
    },
  },

  L07: {
    lessonId: "L07",
    gameId: "L07-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Qual è il vero vantaggio di un palazzo numerato rispetto a una filastrocca imparata tutta d'un fiato?",
    demonstrationOptions: [
      {
        id: "direct-access",
        label:
          "Puoi saltare direttamente al locus #7 o #4 («Porta segreta») senza dover recitare tutti i punti precedenti.",
        isCorrect: true,
      },
      {
        id: "no-effort",
        label: "Non serve sapere il numero delle fermate.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Conoscere il numero di ogni fermata trasforma la tua rotta in un indice ad accesso diretto.",
    guidedPracticePrompt:
      "Set A: Allenati a collegare direttamente il numero della fermata al suo contenuto.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "l07-gp-1",
          prompt: "Se sai che il locus #5 è il Tavolo e il #7 è la Scrivania, come raggiungi il #7?",
          options: [
            { id: "jump", label: "Visualizzando direttamente la Scrivania (#7) senza passare per #1, #2, #3, #4." },
            { id: "all", label: "Ricominciando sempre dal portone d'ingresso." },
          ],
          correctOptionId: "jump",
          explanation: "I punti d'ancoraggio numerati permettono l'accesso casuale diretto.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B — Porta Segreta): Studia il palazzo botanico a 9 fermate, poi — con la mappa nascosta — rispondi direttamente alle 5 posizioni interrogate a salto: #7, #2, #8, #4 e #9.",
    progressiveHints: [
      "Fissa le posizioni chiave: #2 è felce, #4 è sequoia, #7 è orchidea, #8 è ginepro, #9 è baobab.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "Posizione #7 (Scrivania)", target: "orchidea", contextHint: "(Riferimento: #1 muschio, #2 felce, #3 lichene, #4 sequoia, #5 ninfea, #6 bambù, #7 orchidea, #8 ginepro, #9 baobab)" },
        { cue: "Posizione #2 (Specchio)", target: "felce", contextHint: "Locus #2: una felce verde si srotola sulla cornice dello specchio." },
        { cue: "Posizione #8 (Libreria)", target: "ginepro", contextHint: "Locus #8: bacche profumate di ginepro tra gli scaffali della libreria." },
        { cue: "Posizione #4 (Camino)", target: "sequoia", contextHint: "Locus #4: il tronco gigante di una sequoia esce dal camino." },
        { cue: "Posizione #9 (Finestra)", target: "baobab", contextHint: "Locus #9: i rami di un baobab abbracciano la finestra." },
      ],
      minCorrectCount: 4,
    },
  },

  /* =========================================================================
     CORSO 2 — Linked Method: ricordi che si inseguono (K01–K04)
     ========================================================================= */
  K01: {
    lessonId: "K01",
    gameId: "K01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Nel Linked Method, come si collegano gli elementi A, B e C senza usare stanze?",
    demonstrationOptions: [
      {
        id: "pairwise",
        label: "A compie un'azione su B; poi B diventa il soggetto che compie un'azione su C (A→B, B→C).",
        isCorrect: true,
      },
      {
        id: "all-together",
        label: "Si mettono tutti gli oggetti fermi in un'unica foto panoramica.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Ogni anello contiene solo due protagonisti in collisione attiva: il secondo elemento del primo anello diventa l'innesco del successivo.",
    guidedPracticePrompt:
      "Set A: Collega in catena «chiave, libro, lampada, ombrello, torta» e ricostruisci l'ordine.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["chiave", "libro", "lampada", "ombrello", "torta"],
    },
    widgetKind: "ordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B): Crea cinque legami d'azione consecutivi per i 6 nuovi oggetti «corno, sapone, telescopio, valigia, ananas, tenda». Nascondi la lista e restituisci tutte le 6 parole nell'ordine esatto.",
    progressiveHints: [
      "1. Il corno suona dentro una bolla di sapone → 2. Il sapone scivola sulla lente del telescopio → 3. Il telescopio si chiude dentro la valigia...",
      "...4. La valigia si apre e lancia un ananas spinoso → 5. L'ananas squarcia il telo della tenda.",
    ],
    orderedFlashSpec: {
      targetWords: ["corno", "sapone", "telescopio", "valigia", "ananas", "tenda"],
      hideAfterSeconds: 20,
      minOrderedPassCount: 5,
    },
  },

  K02: {
    lessonId: "K02",
    gameId: "K02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "weak_cue",
    demonstrationQuestion:
      "Perché dire «la lampadina e la chitarra sono vicine sul tavolo» fa spezzare la catena al momento del richiamo?",
    demonstrationOptions: [
      {
        id: "passive",
        label:
          "Perché la semplice vicinanza statica non crea un nesso causale: vedendo la lampadina non hai alcun motivo per pensare alla chitarra.",
        isCorrect: true,
      },
      {
        id: "too-short",
        label: "Perché le parole iniziano con lettere diverse.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Per saldare un anello debole serve un impatto o una trasformazione fisica tra il primo e il secondo oggetto.",
    guidedPracticePrompt:
      "Set A: Individua l'anello passivo e sostituiscilo con un verbo d'azione.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "k02-gp-1",
          prompt: "Quale frase ripara il legame debole «lampadina — chitarra»?",
          options: [
            { id: "ok", label: "La lampadina incandescente pizzica le corde della chitarra facendole sprigionare scintille sonore." },
            { id: "weak", label: "C'è una lampadina e più in là c'è anche una chitarra." },
          ],
          correctOptionId: "ok",
          explanation: "L'interazione diretta tra lampadina e corde della chitarra salda l'anello.",
        },
      ],
    },
    widgetKind: "builder_then_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Nella catena «barca → pinguino → lampadina → chitarra → cuscino», il legame «lampadina → chitarra» è debole («sono vicini»). Scrivi l'azione che salda gli anelli, poi — a scena nascosta — recupera tutti gli anelli della catena.",
    progressiveHints: [
      "Salda in particolare «lampadina → chitarra» e «chitarra → cuscino» prima di avviare il richiamo cieco.",
    ],
    builderRecallSpec: {
      itemsToBuild: [
        {
          locusOrContext: "1° anello: dopo «barca» chi guida?",
          targetWord: "pinguino",
          actionPlaceholder: "Es. La barca è timonata da un pinguino coi remi...",
        },
        {
          locusOrContext: "2° anello: cosa stringe nel becco il «pinguino»?",
          targetWord: "lampadina",
          actionPlaceholder: "Es. Il pinguino accende col becco una lampadina accecante...",
        },
        {
          locusOrContext: "3° anello (RIPARATO): cosa colpisce la «lampadina»?",
          targetWord: "chitarra",
          actionPlaceholder: "Es. La lampadina esplode pizzicando le corde della chitarra...",
        },
        {
          locusOrContext: "4° anello: dove si conficca la «chitarra»?",
          targetWord: "cuscino",
          actionPlaceholder: "Es. Il manico della chitarra squarcia un cuscino di piume...",
        },
      ],
      minRecalledCount: 4,
    },
  },

  K03: {
    lessonId: "K03",
    gameId: "K03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Quando il Linked Method è preferibile a un Palazzo dei Loci, e quando invece serve il Palazzo?",
    demonstrationOptions: [
      {
        id: "match",
        label:
          "Il Link è rapido per liste brevi (4–7 voci) in sequenza; il Palazzo è superiore per liste lunghe o quando serve interrogare le voci fuori ordine.",
        isCorrect: true,
      },
      {
        id: "always-link",
        label: "Il Link va usato anche per 200 definizioni d'esame interrogate a salto.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Se un anello del Link salta rischi di perdere i successivi; nel Palazzo ogni locus è indipendente e permette accesso casuale.",
    guidedPracticePrompt:
      "Set A: Assegna la strategia giusta a 3 compiti diversi.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "k03-gp-1",
          prompt: "Devi ricordare al volo 5 attrezzi da prendere in garage adesso. Cosa usi?",
          options: [
            { id: "link", label: "Linked Method (catena rapida di 5 oggetti in azione)." },
            { id: "palace25", label: "Costruire da zero un palazzo da 25 stanze." },
          ],
          correctOptionId: "link",
          explanation: "Per una lista breve e temporanea il Link ha costo di preparazione quasi nullo.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Hai tre incarichi: (1) ricordare 4 cose da portare subito, (2) 15 definizioni da interrogare fuori ordine, (3) 7 fasi di un processo cronologico. Scegli e giustifica la strategia per ciascuno e proponi un quarto caso tuo.",
    progressiveHints: [
      "Per le 15 definizioni interrogate fuori ordine serve l'accesso diretto (Loci); per le 7 fasi di un processo serve prima comprendere il nesso causale + catena/rotta.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Tre incarichi: (1) ricordare 4 cose da portare, (2) 15 definizioni da interrogare fuori ordine, (3) 7 fasi di un processo cronologico.",
      requestedOutput:
        "Scegli e giustifica Link, Loci, mappa causale o combinazione; trasferisci a un quarto caso.",
      structuredChecks: [
        {
          id: "k03-ic-1",
          prompt: "1. Quale abbinamento tecnica-incarico è metodologicamente corretto?",
          options: [
            {
              id: "correct",
              label:
                "1) Link rapido per le 4 cose; 2) Palazzo dei Loci numerato per le 15 definizioni fuori ordine; 3) Comprensione causale + rotta/catena per le 7 fasi cronologiche.",
            },
            {
              id: "wrong",
              label: "Usare solo il Link per le 15 definizioni fuori ordine e nessuna comprensione per il processo.",
            },
          ],
          correctOptionId: "correct",
          explanation: "L'accesso fuori ordine richiede ancore indipendenti (Loci), mentre i processi richiedono comprensione della sequenza causale.",
        },
      ],
      openPromptLabel:
        "2. Giustifica con parole tue le tre scelte e aggiungi un 4° caso reale di studio o lavoro:",
      openPromptPlaceholder:
        "1) 4 cose -> Link perché...\n2) 15 definizioni -> Loci perché...\n3) 7 fasi -> Mappa causale + ...\n4) Quarto caso personale:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) 4 oggetti → Link per rapidità; (2) 15 definizioni fuori ordine → Loci per isolamento degli errori e accesso casuale; (3) 7 fasi → comprensione causale + ancore ordinate; (4) Quarto caso coerente.",
    },
  },

  K04: {
    lessonId: "K04",
    gameId: "K04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Se in una catena di 7 parole ti blocchi sempre tra la 3ª e la 5ª parola, cosa devi fare?",
    demonstrationOptions: [
      {
        id: "surgical",
        label:
          "Individuare esattamente l'elemento omesso (4ª parola) e rinforzare solo il ponte d'azione tra la 3ª e la 4ª parola.",
        isCorrect: true,
      },
      {
        id: "restart-all",
        label: "Buttare via tutte le 7 parole e ricominciare da capo ogni volta.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La riparazione chirurgica dell'anello rotto consolida proprio il punto vulnerabile senza sprecare i legami già solidi.",
    guidedPracticePrompt:
      "Set A: Individua dove si è spezzata una catena di prova.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "k04-gp-1",
          prompt: "Catena originale: « A → B → C → D ». Richiamo ottenuto: « A → B → D ». Qual è l'anello da riparare?",
          options: [
            { id: "bc", label: "Il ponte tra B e C (elemento omesso: C; rottura dopo: B)." },
            { id: "ab", label: "Il ponte tra A e B." },
          ],
          correctOptionId: "bc",
          explanation: "L'ultimo elemento recuperato prima del buco è B, che non ha innescato C.",
        },
      ],
    },
    widgetKind: "missing_link_diagnosis",
    independentPrompt:
      "La prova vera (Set B): Set memorizzato: «martello, sirena, sedia, mongolfiera, mappa, asino, violino». Durante il recupero ottieni: «martello, sirena, sedia, mappa, asino, violino». Individua l'omissione, indica dopo quale parola si è spezzato il legame, scrivi la nuova azione di riparazione e ricostruisci le 7 parole.",
    progressiveHints: [
      "Confronta le due liste elemento per elemento dopo «sedia»: quale oggetto volante manca prima di «mappa»?",
      "L'elemento omesso è «mongolfiera» e il legame si è rotto subito dopo «sedia».",
    ],
    missingLinkSpec: {
      memorizedChain: [
        "martello",
        "sirena",
        "sedia",
        "mongolfiera",
        "mappa",
        "asino",
        "violino",
      ],
      corruptedRecall: ["martello", "sirena", "sedia", "mappa", "asino", "violino"],
      expectedOmittedWord: "mongolfiera",
      expectedBrokenAfterWord: "sedia",
    },
  },

  /* =========================================================================
     CORSO 3 — Conversione fonetica: numeri da ricordare (N01–N05)
     ========================================================================= */
  N01: {
    lessonId: "N01",
    gameId: "N01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "phonetic_major_v1",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Nella convenzione italiana `major-it-v1` di LOCO, come funziona la conversione di un numero in parola?",
    demonstrationOptions: [
      {
        id: "consonants",
        label:
          "Ogni cifra (0–9) corrisponde a specifici suoni consonantici; le vocali non valgono cifre e servono come collante per formare parole concrete.",
        isCorrect: true,
      },
      {
        id: "vowels",
        label: "Contano il numero totale di lettere dell'alfabeto incluse le vocali.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "1=T/D, 2=N/GN, 3=M, 4=R, 5=L/GL, 6=C/G dolce, 7=C/G dura, 8=F/V, 9=P/B, 0=S/Z/SC dolce. Esempio: 14 → T+R → «toro».",
    guidedPracticePrompt:
      "Set A: Converti 14 (T+R) e 32 (M+N) in parole concrete («toro», «mano»).",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "14", mode: "encode", expected: "14" },
        { numberOrWord: "32", mode: "encode", expected: "32" },
      ],
    },
    widgetKind: "phonetic_word_for_numbers",
    independentPrompt:
      "La prova vera (Set B): Per ciascuno dei 5 numeri mai usati nella dimostrazione («48, 92, 70, 52, 37»), scrivi una parola italiana concreta valida secondo `major-it-v1`, poi — a parole nascoste — recupera le 5 coppie di cifre.",
    progressiveHints: [
      "4=R, 8=F/V (es. 48 → riva/rupe? Attenzione: P=9, V=8 → riva=48). 9=P/B, 2=N (es. 92 → pane/pino).",
      "7=C/G dura, 0=S/Z (es. 70 → casa). 5=L, 2=N (es. 52 → luna/leone). 3=M, 7=C/G dura (es. 37 → mago).",
    ],
    phoneticNumbersSpec: {
      targetNumbers: ["48", "92", "70", "52", "37"],
      exampleWordsAfterSubmit: {
        "48": "riva",
        "92": "pane",
        "70": "casa",
        "52": "luna",
        "37": "mago",
      },
      minValidCount: 4,
    },
  },

  N02: {
    lessonId: "N02",
    gameId: "N02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "phonetic_major_v1",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Nella convenzione `major-it-v1`, perché «casa» vale 70 mentre «ciao» vale 6 e «scena» vale 02?",
    demonstrationOptions: [
      {
        id: "sound",
        label:
          "Perché conta il SUONO: C dura /k/ in «casa» è 7, C dolce /tʃ/ in «ciao» è 6, e il digramma SC dolce /ʃ/ in «scena» è un unico suono 0 (seguito da N=2 → 02).",
        isCorrect: true,
      },
      {
        id: "letters",
        label: "Perché la lettera C cambia valore a seconda del giorno.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Non farti ingannare dalla grafia: GN=/ɲ/=2 (`gnomo`→23), GLI=/ʎ/=5 (`foglia`→85), doppie consonanti = un solo suono (`tuffo`→18), CCH=/k/=7 (`zucchero`→074). Conserva sempre gli zeri iniziali (`02`, `0`, `074`).",
    guidedPracticePrompt:
      "Set A: Decodifica «toro» (14), «mano» (32) e «scia» (0).",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "toro", mode: "decode", expected: "14" },
        { numberOrWord: "scia", mode: "decode", expected: "0" },
      ],
    },
    widgetKind: "phonetic_decode_words",
    independentPrompt:
      "La prova vera (Set B): Converti in cifre (`major-it-v1`) le 10 parole «casa, ciao, scena, gnomo, foglia, tuffo, mago, micio, sci, zucchero». Attenzione a C/G dolci (6) vs dure (7), ai digrammi (SC=0, GN=2, GL=5), alle doppie e agli zeri iniziali!",
    progressiveHints: [
      "Ricorda: SC dolce (/ʃ/) vale 0, quindi «scena» = 02 e «sci» = 0. Non omettere mai lo zero iniziale!",
      "«gnomo»: GN=2, M=3 → 23. «foglia»: F=8, GL=5 → 85. «tuffo»: T=1, FF=8 → 18. «zucchero»: Z=0, CCH=7, R=4 → 074.",
    ],
    phoneticDecodeSpec: {
      words: [
        "casa",
        "ciao",
        "scena",
        "gnomo",
        "foglia",
        "tuffo",
        "mago",
        "micio",
        "sci",
        "zucchero",
      ],
      expectedDigits: ["70", "6", "02", "23", "85", "18", "37", "36", "0", "074"],
      minCorrectCount: 8,
    },
  },

  N03: {
    lessonId: "N03",
    gameId: "N03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "phonetic_major_v1",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Come conviene codificare un codice o un anno di 4 cifre (es. 1432) senza cercare un'unica parola lunghissima?",
    demonstrationOptions: [
      {
        id: "two-blocks",
        label:
          "Dividendolo in due blocchi da 2 cifre (14 + 32) e facendo interagire le due immagini nell'ordine sinistra→destra (es. un «toro» [14] che stringe una «mano» [32]).",
        isCorrect: true,
      },
      {
        id: "four-words",
        label: "Inventando quattro frasi separate senza ordine.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La regola fissa «la prima immagine agisce sulla seconda» mantiene intatto l'ordine delle due coppie di cifre.",
    guidedPracticePrompt:
      "Set A: Spezza il codice 5292 in due coppie (52 + 92).",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "52", mode: "encode", expected: "52" },
        { numberOrWord: "92", mode: "encode", expected: "92" },
      ],
    },
    widgetKind: "phonetic_year_blocks",
    independentPrompt:
      "La prova vera (Set B): Usa i codici a 4 cifre «1749» e «1926» (trattati come puri codici numerici, senza inventare eventi storici). Per ciascuno, inserisci due parole italiane da 2 cifre validate da `major-it-v1` (es. 17 + 49 e 19 + 26) e poi decodifica i due codici a memoria.",
    progressiveHints: [
      "Per 1749: blocco 1 = «17» (T/D + C/G dura, es. 'teca' o 'diga'), blocco 2 = «49» (R + P/B, es. 'rupe' o 'rabbia').",
      "Per 1926: blocco 1 = «19» (T/D + P/B, es. 'tubo' o 'tappo'), blocco 2 = «26» (N/GN + C/G dolce, es. 'noce').",
    ],
    phoneticBlocksSpec: {
      fourDigitCodes: ["1749", "1926"],
      exampleBlocksAfterSubmit: {
        "1749": ["teca", "rupe"],
        "1926": ["tubo", "noce"],
      },
    },
  },

  N04: {
    lessonId: "N04",
    gameId: "N04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "phonetic_major_v1",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Perché è indispensabile allenare anche la direzione inversa (Parola → Numero) e non solo Numero → Parola?",
    demonstrationOptions: [
      {
        id: "decode",
        label:
          "Perché durante l'interrogazione ritrovi nella mente l'immagine (es. «mago») e devi saperla ritradurre istantaneamente nelle cifre esatte («37»).",
        isCorrect: true,
      },
      {
        id: "same",
        label: "Non serve: chi sa codificare sa sempre decodificare senza errori.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Molti errori nascono in fase di decodifica (es. leggere «mago» come 36 invece di 37 confondendo G dura e G dolce).",
    guidedPracticePrompt:
      "Set A: Decodifica rapidamente «micio» (36) vs «mago» (37).",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "micio", mode: "decode", expected: "36" },
        { numberOrWord: "mago", mode: "decode", expected: "37" },
      ],
    },
    widgetKind: "phonetic_decode_words",
    independentPrompt:
      "La prova vera (Set B): Decodifica da parola a numero tutte le 12 voci: «riva, raso, pane, luna, mago, scena, gnomo, foglia, tuffo, casa, tiro, fumo». Obiettivo di padronanza: almeno 10 su 12 corrette senza suggerimenti.",
    progressiveHints: [
      "Controlla le prime 6: riva (R=4, V=8 → 48), raso (R=4, S=0 → 40), pane (92), luna (52), mago (37), scena (02).",
      "Controlla le seconde 6: gnomo (23), foglia (85), tuffo (18), casa (70), tiro (T=1, R=4 → 14), fumo (F=8, M=3 → 83).",
    ],
    phoneticDecodeSpec: {
      words: [
        "riva",
        "raso",
        "pane",
        "luna",
        "mago",
        "scena",
        "gnomo",
        "foglia",
        "tuffo",
        "casa",
        "tiro",
        "fumo",
      ],
      expectedDigits: [
        "48",
        "40",
        "92",
        "52",
        "37",
        "02",
        "23",
        "85",
        "18",
        "70",
        "14",
        "83",
      ],
      minCorrectCount: 10,
    },
  },

  N05: {
    lessonId: "N05",
    gameId: "N05-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "source_misconception",
    demonstrationQuestion:
      "Quando memorizzi una data storica (es. 1848), perché la sola codifica numerica non basta per un esame di storia?",
    demonstrationOptions: [
      {
        id: "event-link",
        label:
          "Perché devi legare il codice dell'anno all'evento storico verificato e saper spiegare che cosa avvenne.",
        isCorrect: true,
      },
      {
        id: "digits-only",
        label: "Basta ripetere 1848 senza sapere a quale fatto appartiene.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un anno isolato è muto: l'ancora deve unire l'evento storico verificato, i blocchi fonetici dell'anno e il significato storico.",
    guidedPracticePrompt:
      "Set A: Verifica il legame bidirezionale tra evento e anno.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "n05-gp-1",
          prompt: "Quale coppia «Evento storico — Anno» è storicamente verificata?",
          options: [
            { id: "ok", label: "Proclamazione del Regno d'Italia — 1861 (18=tuffo/nave, 61=gita/scudo)." },
            { id: "bad", label: "Primo uomo sulla Luna — 1492." },
          ],
          correctOptionId: "ok",
          explanation: "La proclamazione dell'Unità d'Italia risale al 1861.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Studia le 4 date storiche verificate («Statuto Albertino → 1848», «Unità d’Italia proclamata → 1861», «Caduta del muro di Berlino → 1989», «Primo uomo sulla Luna → 1969»). Poi, a date nascoste, digita l'anno esatto per ciascun evento e completa il controllo sul significato.",
    progressiveHints: [
      "1848: finisce con 48 (riva). 1861: finisce con 61 (gita). 1989: finisce con 89 (fiaba). 1969: finisce con 69 (cippo/coppa).",
    ],
    pairsRecallSpec: {
      studyPairs: [
        {
          cue: "Statuto Albertino",
          target: "1848",
          contextHint: "Concessione della carta costituzionale sabauda nel 1848 (18 + 48).",
        },
        {
          cue: "Unità d’Italia proclamata",
          target: "1861",
          contextHint: "Proclamazione del Regno d'Italia nel 1861 (18 + 61).",
        },
        {
          cue: "Caduta del muro di Berlino",
          target: "1989",
          contextHint: "Apertura dei varchi del Muro di Berlino nel novembre 1989 (19 + 89).",
        },
        {
          cue: "Primo uomo sulla Luna",
          target: "1969",
          contextHint: "Allunaggio della missione Apollo 11 nel luglio 1969 (19 + 69).",
        },
      ],
      askReverseToo: true,
      minCorrectCount: 4,
    },
  },

  /* =========================================================================
     CORSO 4 — Studiare davvero: dalla memoria alla conoscenza (T01–T06)
     ========================================================================= */
  T01: {
    lessonId: "T01",
    gameId: "T01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "source_misconception",
    demonstrationQuestion:
      "Qual è la differenza pratica tra un «fatto arbitrario» (pure fact) e una «relazione causale» (sequential/causal fact)?",
    demonstrationOptions: [
      {
        id: "pure-vs-causal",
        label:
          "Il fatto arbitrario (es. nome di una capitale) va codificato con un cue; la relazione causale (es. perché il ghiaccio galleggia) va prima compresa nel suo meccanismo fisico.",
        isCorrect: true,
      },
      {
        id: "no-diff",
        label: "Non c'è differenza: basta imparare tutto come suoni senza senso.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La mnemotecnica eccelle sui dati puntuali ma non sostituisce mai la comprensione di un fenomeno.",
    guidedPracticePrompt:
      "Set A: Distingui in uno studio tra fatto puntuale, spiegazione causale e dato da verificare.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t01-gp-1",
          prompt: "«Lisbona è la capitale del Portogallo» vs «Perché il ghiaccio ha densità minore dell'acqua liquida»: quale richiede comprensione causale?",
          options: [
            { id: "ice", label: "Il galleggiamento del ghiaccio (struttura cristallina dei legami a idrogeno e minore densità)." },
            { id: "lisbon", label: "Il nome di Lisbona." },
          ],
          correctOptionId: "ice",
          explanation: "Il galleggiamento dipende da una relazione fisica deducibile; il nome della capitale è un dato convenzionale.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Dati: (1) perché il ghiaccio galleggia, (2) capitale del Portogallo, (3) legge di Ohm, (4) data di un evento locale non fornita. Separa informazioni deducibili/causali, conoscenza fattuale di base e fatti che richiedono verifica della fonte, motivando ciascuna.",
    progressiveHints: [
      "1) Ghiaccio e 3) Legge di Ohm coinvolgono relazioni fisiche; 2) Capitale del Portogallo è un fatto puntuale; 4) Data non fornita richiede consultazione di una fonte verificata (mai inventarla!).",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Dati da classificare: (1) perché il ghiaccio galleggia; (2) capitale del Portogallo; (3) legge di Ohm; (4) data di un evento locale non fornita.",
      requestedOutput:
        "Separa informazioni deducibili, conoscenza di base e fatti che richiedono verifica; motivazione per ciascuna.",
      structuredChecks: [
        {
          id: "t01-ic-1",
          prompt: "Qual è la classificazione corretta dei 4 elementi?",
          options: [
            {
              id: "ok",
              label:
                "Ghiaccio e Legge di Ohm = relazioni causali/modelli da comprendere; Capitale del Portogallo = fatto puntuale (Lisbona); Data locale non fornita = dato da verificare nella fonte prima di memorizzare.",
            },
            {
              id: "bad",
              label: "Inventare con un'immagine la data non fornita e decorare il ghiaccio senza capire la densità.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Non si costruisce mai una mnemotecnica su un dato mancante o non compreso.",
        },
      ],
      openPromptLabel:
        "Motiva per iscritto come tratteresti ciascuno dei 4 punti nel tuo studio:",
      openPromptPlaceholder:
        "1) Ghiaccio galleggia: relazione causale (densità)...\n2) Capitale Portogallo: fatto puro (Lisbona)...\n3) Legge di Ohm: relazione V=R*I...\n4) Data mancante: verifico prima la fonte...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) Ghiaccio: comprendere l'aumento di volume e calo di densità; (2) Portogallo→Lisbona: cue associativo; (3) Legge di Ohm: comprendere proporzionalità tra tensione, corrente e resistenza + formula; (4) Data assente: ricerca e verifica della fonte.",
    },
  },

  T02: {
    lessonId: "T02",
    gameId: "T02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Perché raggruppare 9 strumenti per «ciò che misurano» (chunking semantico) aiuta ma richiede attenzione ai dettagli?",
    demonstrationOptions: [
      {
        id: "chunking",
        label:
          "Perché riduce 9 voci isolate a poche categorie logiche, ma devi comunque distinguere i membri interni di ogni gruppo (es. barometro vs altimetro).",
        isCorrect: true,
      },
      {
        id: "forget-details",
        label: "Perché basta ricordare il nome della categoria e dimenticare gli strumenti.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Il chunking organizza i rami, ma ogni foglia deve restare recuperabile senza confondersi con le sorelle.",
    guidedPracticePrompt:
      "Set A: Raggruppa per grandezza fisica e poi verifica di non omettere nessun membro.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t02-gp-1",
          prompt: "Quali strumenti del set misurano il TEMPO?",
          options: [
            { id: "time", label: "Cronometro, orologio, timer." },
            { id: "temp", label: "Termometro, igrometro, barometro." },
          ],
          correctOptionId: "time",
          explanation: "Cronometro, orologio e timer appartengono tutti al gruppo del tempo.",
        },
      ],
    },
    widgetKind: "unordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B): Osserva i 9 strumenti «termometro, cronometro, barometro, altimetro, orologio, igrometro, sonda di temperatura, timer, manometro». Raggruppali mentalmente per grandezza misurata (Temperatura: 2, Tempo: 3, Pressione/Quota: 3, Umidità: 1), nascondi la lista e recupera almeno 8 dei 9 strumenti.",
    progressiveHints: [
      "Usa i 4 gruppi: Temperatura (termometro, sonda di temperatura), Tempo (cronometro, orologio, timer), Pressione/Quota (barometro, manometro, altimetro), Umidità (igrometro).",
    ],
    unorderedFlashSpec: {
      targetWords: [
        "termometro",
        "cronometro",
        "barometro",
        "altimetro",
        "orologio",
        "igrometro",
        "sonda di temperatura",
        "timer",
        "manometro",
      ],
      hideAfterSeconds: 25,
      minRecallCount: 7,
    },
  },

  T03: {
    lessonId: "T03",
    gameId: "T03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Quale tipo di domanda smaschera subito l'«illusione di competenza» dopo aver letto un paragrafo?",
    demonstrationOptions: [
      {
        id: "why-predict",
        label:
          "Una domanda che chiede il «perché» causale e una previsione su cosa accadrebbe se cambiasse una condizione.",
        isCorrect: true,
      },
      {
        id: "yes-no",
        label: "Chiedersi «Ho già letto questa frase?»",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Saper ripetere un titolo non significa saper spiegare il meccanismo o fare una previsione.",
    guidedPracticePrompt:
      "Set A: Distingui tra domanda di fatto, di spiegazione e di previsione.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t03-gp-1",
          prompt: "Dal testo sulle placche tettoniche, quale domanda è una PREVISIONE applicativa?",
          options: [
            { id: "pred", label: "Se due placche restano bloccate a lungo lungo un margine convergente, quale fenomeno possiamo prevedere quando l'attrito cede?" },
            { id: "fact", label: "Come si scrive la parola placca?" },
          ],
          correctOptionId: "pred",
          explanation: "Chiede di applicare il modello a una condizione dinamica.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Testo: «Le placche terrestri si muovono lentamente. In alcuni margini una scivola sotto l’altra e può causare terremoti». Crea 2 domande di fatto, 1 di spiegazione causale e 1 di previsione su un caso differente.",
    progressiveHints: [
      "Le 2 domande di fatto riguardano il movimento lento e lo scivolamento (subduzione); la spiegazione riguarda l'accumulo/rilascio di energia; la previsione riguarda un margine stabile vs attivo.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "«Le placche terrestri si muovono lentamente. In alcuni margini una scivola sotto l’altra e può causare terremoti».",
      requestedOutput:
        "Crea 2 domande di fatto, 1 spiegazione e 1 previsione su un caso differente.",
      structuredChecks: [
        {
          id: "t03-ic-1",
          prompt: "Quale combinazione copre esattamente i 4 livelli richiesti?",
          options: [
            {
              id: "ok",
              label:
                "2 domande sui dati del testo (velocità e movimento ai margini) + 1 sul perché lo scivolamento genera sismi + 1 previsione su una regione lontana dai margini di placca.",
            },
            {
              id: "bad",
              label: "4 domande identiche che chiedono solo di ripetere la prima frase.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Copre fatti, meccanismo causale e trasferimento predittivo.",
        },
      ],
      openPromptLabel:
        "Scrivi ora le tue 4 domande (Fatto 1, Fatto 2, Spiegazione, Previsione):",
      openPromptPlaceholder:
        "Fatto 1:...\nFatto 2:...\nSpiegazione:...\nPrevisione su caso diverso:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Fatto 1: «Con quale rapidità si muovono le placche?» Fatto 2: «Cosa accade quando una placca scivola sotto un'altra?» Spiegazione: «Perché lo scorrimento contrastato tra due placche genera onde sismiche?» Previsione: «Cosa prevedi per la frequenza sismica al centro stabile di una placca rispetto al suo margine di subduzione?»",
    },
  },

  T04: {
    lessonId: "T04",
    gameId: "T04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Perché dire genericamente «non me lo ricordavo» non ti aiuta a correggere il tuo studio?",
    demonstrationOptions: [
      {
        id: "specific-fix",
        label:
          "Perché un'omissione, un'inversione d'ordine, un'interferenza tra termini simili e una misconception scientifica richiedono quattro interventi opposti.",
        isCorrect: true,
      },
      {
        id: "same-fix",
        label: "Perché l'unica soluzione possibile è rileggere tutto da capo.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Omissione → rinforza l'ancora; Inversione → chiarisci la direzione tra i due punti; Interferenza → differenzia il cue; Misconception → ristudia il modello causale.",
    guidedPracticePrompt:
      "Set A: Distingui tra inversione d'ordine e misconception concettuale.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t04-gp-1",
          prompt: "Uno studente ricorda tutte le voci ma scambia il punto #3 col #4. Che tipo di errore è?",
          options: [
            { id: "inv", label: "Inversione (errore d'ordine spaziale/sequenziale)." },
            { id: "misc", label: "Misconception scientifica." },
          ],
          correctOptionId: "inv",
          explanation: "I contenuti ci sono ma le due posizioni adiacenti si sono scambiate.",
        },
      ],
    },
    widgetKind: "multi_case_classification",
    independentPrompt:
      "La prova vera (Set B): Classifica esattamente ciascuno dei 4 tentativi fittizi nella propria categoria diagnostica («omissione», «inversione», «interferenza», «misconception»).",
    progressiveHints: [
      "«elemento dimenticato» = omissione; «due posizioni scambiate» = inversione; «termine simile sostituito» = interferenza; «causa scientifica errata» = misconception.",
    ],
    classificationSpec: {
      categories: [
        { id: "omissione", label: "Omissione (buco di recupero)" },
        { id: "inversione", label: "Inversione (scambio d'ordine)" },
        { id: "interferenza", label: "Interferenza (collisione tra simili)" },
        { id: "misconception", label: "Misconception (errore sul modello/causa)" },
      ],
      cases: [
        {
          id: "c1",
          stimulus: "1. «elemento dimenticato» (il locus viene visitato ma il bersaglio resta vuoto)",
          expectedCategory: "omissione",
        },
        {
          id: "c2",
          stimulus: "2. «due posizioni scambiate» (il 3° e il 4° elemento vengono detti al contrario)",
          expectedCategory: "inversione",
        },
        {
          id: "c3",
          stimulus: "3. «termine simile sostituito» (dici 'barometro' al posto di 'manometro')",
          expectedCategory: "interferenza",
        },
        {
          id: "c4",
          stimulus: "4. «causa scientifica errata» (spieghi il galleggiamento con una regola fisica sbagliata)",
          expectedCategory: "misconception",
        },
      ],
    },
  },

  T05: {
    lessonId: "T05",
    gameId: "T05-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "retention_decay",
    demonstrationQuestion:
      "Qual è la differenza tra un item superato oggi senza aiuti e uno superato anche a distanza di due giorni?",
    demonstrationOptions: [
      {
        id: "prov-vs-del",
        label:
          "Il primo è in stato `provisional` (provvisorio); il secondo ha dimostrato `delayed_success` (tenuta a distanza).",
        isCorrect: true,
      },
      {
        id: "identical",
        label: "Sono identici: basta una risposta giusta oggi per non ripassare mai più.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Lo scheduler LOCO distingue rigorosamente: `provisional`, `assisted`, `incorrect` e `delayed_success`.",
    guidedPracticePrompt:
      "Set A: Verifica come gli indizi influenzano lo stato di un tentativo.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t05-gp-1",
          prompt: "Se rispondi correttamente solo dopo aver aperto un suggerimento, qual è lo stato?",
          options: [
            { id: "ass", label: "`assisted` (richiamo assistito, non autonomo)." },
            { id: "del", label: "`delayed_success`." },
          ],
          correctOptionId: "ass",
          explanation: "L'aiuto riduce l'autonomia del tentativo e richiede una verifica senza hint.",
        },
      ],
    },
    widgetKind: "multi_case_classification",
    independentPrompt:
      "La prova vera (Set B): Assegna a ciascuno dei 4 item tracciati lo stato esatto del motore di valutazione (`provisional`, `assisted`, `incorrect`, `delayed_success`).",
    progressiveHints: [
      "«corretto oggi autonomo» = provisional; «corretto oggi dopo hint» = assisted; «errato oggi» = incorrect; «corretto oggi e tra due giorni» = delayed_success.",
    ],
    classificationSpec: {
      categories: [
        { id: "provisional", label: "provisional (padronanza provvisoria oggi)" },
        { id: "assisted", label: "assisted (corretto con aiuto)" },
        { id: "incorrect", label: "incorrect (da riparare)" },
        { id: "delayed_success", label: "delayed_success (confermato a distanza)" },
      ],
      cases: [
        {
          id: "s1",
          stimulus: "Item A: «corretto oggi autonomo» (primo successo senza indizi nella sessione odierna)",
          expectedCategory: "provisional",
        },
        {
          id: "s2",
          stimulus: "Item B: «corretto oggi dopo hint» (risposta trovata dopo aver usato il suggerimento)",
          expectedCategory: "assisted",
        },
        {
          id: "s3",
          stimulus: "Item C: «errato oggi» (risposta sbagliata o sbirciata prima del tentativo)",
          expectedCategory: "incorrect",
        },
        {
          id: "s4",
          stimulus: "Item D: «corretto oggi e tra due giorni» (superato autonomamente sia oggi sia nella verifica differita)",
          expectedCategory: "delayed_success",
        },
      ],
    },
  },

  T06: {
    lessonId: "T06",
    gameId: "T06-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Perché un vero esperto di memoria non usa la stessa identica tecnica per un numero di 4 cifre, una legge fisica e un vocabolo straniero?",
    demonstrationOptions: [
      {
        id: "tool-fit",
        label:
          "Perché ogni formato di informazione ha la sua tecnica ottimale: Major per i numeri, comprensione causale per la fisica, Loci/Link per le sequenze, parola-ponte per i vocaboli.",
        isCorrect: true,
      },
      {
        id: "one-tool",
        label: "Perché bisogna tirare a indovinare.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La competenza strategica consiste nello scegliere l'attrezzo giusto prima di iniziare a codificare.",
    guidedPracticePrompt:
      "Set A: Abbina rapidamente il problema alla famiglia di tecniche più adatta.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "t06-gp-1",
          prompt: "Per ricordare il numero «6042», quale tecnica è specifica?",
          options: [
            { id: "maj", label: "Conversione fonetica Major in due blocchi (60 + 42, es. 'cassa' + 'rana')." },
            { id: "none", label: "Rileggere il numero a bassa voce." },
          ],
          correctOptionId: "maj",
          explanation: "Il Major System traduce le coppie di cifre in immagini concrete.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Hai 4 problemi nuovi senza etichette: (1) memorizzare il numero 6042; (2) spiegare perché un metallo si dilata col calore; (3) ricordare l'ordine di 7 attività; (4) tradurre e usare un termine straniero. Scegli la strategia per ciascuno e risolvi concretamente tutti e 4 i casi.",
    progressiveHints: [
      "Per 6042 usa `major-it-v1` (60 = C/G dolce + S/Z, es. 'cesoia'/'gesso'; 42 = R + N, es. 'rana'). Per la dilatazione del metallo spiega l'agitazione termica degli atomi.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Problemi nuovi: (1) memorizzare il numero 6042; (2) spiegare perché un metallo si dilata; (3) ricordare ordine di 7 attività; (4) tradurre un termine straniero.",
      requestedOutput:
        "Scegli tecnica e rispondi a un esempio per categoria senza etichette di suggerimento.",
      structuredChecks: [
        {
          id: "t06-ic-1",
          prompt: "Quale mappa strategica risolve correttamente tutti e 4 i problemi?",
          options: [
            {
              id: "ok",
              label:
                "1) 6042 → Major System (60+42); 2) Dilatazione metallo → Comprensione causale (energia cinetica atomica); 3) 7 attività in ordine → Palazzo dei Loci o Catena Link; 4) Termine straniero → Parola-ponte fonetica + frase d'uso.",
            },
            {
              id: "bad",
              label: "Usare il Major System per spiegare la dilatazione dei metalli e nessuna tecnica per il numero 6042.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Ogni compito riceve il metodo progettato per la sua struttura cognitiva.",
        },
      ],
      openPromptLabel:
        "Scrivi la tua soluzione concreta per tutti e 4 i punti (es. le due parole Major per 6042, la spiegazione della dilatazione, ecc.):",
      openPromptPlaceholder:
        "1) 6042 -> 60 (gesso) + 42 (rana)...\n2) Metallo si dilata perché...\n3) 7 attività -> ...\n4) Termine straniero -> ...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) 6042 = 60 ('gesso'/'cesto') + 42 ('rana'); (2) Il calore aumenta l'ampiezza delle vibrazioni reticolari aumentando la distanza media tra gli atomi; (3) 7 loci domestici o catena attiva; (4) Parola-ponte + significato + frase.",
    },
  },

  /* =========================================================================
     CORSO 5 — LOCO nella vita reale (X01–X04)
     ========================================================================= */
  X01: {
    lessonId: "X01",
    gameId: "X01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Perché gli oratori classici mettevano nei loci un'immagine per ogni IDEA-CHIAVE anziché imparare il discorso parola per parola?",
    demonstrationOptions: [
      {
        id: "key-ideas",
        label:
          "Perché ricordare le tappe concettuali in ordine mantiene il discorso naturale, flessibile e immune dal blocco se cambi una parola.",
        isCorrect: true,
      },
      {
        id: "robotic",
        label: "Perché volevano parlare come un testo letto ad alta voce.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un locus per sezione (Problema → Conseguenze → Misura → Intervento → Limite → Conclusione) ti guida senza fogli e senza rigidità.",
    guidedPracticePrompt:
      "Set A: Trasforma una scaletta in 6 fermate spaziali.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "x01-gp-1",
          prompt: "Qual è il modo migliore per ancorare la tappa «Misura dei dati» in un discorso sulle isole di calore?",
          options: [
            { id: "ok", label: "Un grande termometro urbano piantato sul 3° locus che confronta la temperatura dell'asfalto con quella del parco." },
            { id: "bad", label: "Scrivere un paragrafo di 80 parole sul muro." },
          ],
          correctOptionId: "ok",
          explanation: "Un'immagine-chiave sintetica innesca l'argomento lasciando naturale l'esposizione verbale.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Prepara una mini-presentazione in 6 punti sulle isole di calore urbane: (1) problema, (2) conseguenze, (3) misura, (4) intervento, (5) limite, (6) conclusione. Assegna 6 ancore e scrivi la traccia del tuo intervento coprendo tutte le 6 idee in ordine.",
    progressiveHints: [
      "Associa ciascuno dei 6 punti a una fermata ordinata (1..6) e verifica di non saltare né 'misura' (#3) né 'limite' (#5).",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Mini presentazione in 6 tappe: (1) problema delle isole di calore, (2) conseguenze, (3) misura, (4) intervento, (5) limite e (6) conclusione.",
      requestedOutput:
        "Crea sei ancore e scrivi un intervento sintetico completo; controlla che tutte le 6 idee siano coperte in ordine.",
      structuredChecks: [
        {
          id: "x01-ic-1",
          prompt: "Quale sequenza rispetta esattamente le 6 ancore della presentazione?",
          options: [
            {
              id: "ok",
              label: "1. Problema → 2. Conseguenze → 3. Misura → 4. Intervento → 5. Limite → 6. Conclusione.",
            },
            {
              id: "skip",
              label: "Passare direttamente dal Problema alla Conclusione saltando dati e limiti.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Le 6 fermate garantiscono completezza argomentativa dall'apertura alla chiusura.",
        },
      ],
      openPromptLabel:
        "Elenca le tue 6 ancore (Locus + Immagine) e scrivi il breve discorso che le attraversa tutte e 6:",
      openPromptPlaceholder:
        "Ancora 1 (Problema): ...\nAncora 2 (Conseguenze): ...\n...\nTraccia del discorso: ...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: 6 loci distinti associati a (1) asfalto rovente, (2) stress termico/consumi, (3) sensori/termometri tra centro e periferia, (4) alberature e tetti freddi, (5) costi e tempi di manutenzione, (6) sintesi operativa.",
    },
  },

  X02: {
    lessonId: "X02",
    gameId: "X02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "weak_cue",
    demonstrationQuestion:
      "Quando usi una «parola-ponte» fonetica (Substitute Word) per ricordare un vocabolo inglese, quale passo evita di confondere il ponte con il significato vero?",
    demonstrationOptions: [
      {
        id: "meaning-and-use",
        label:
          "Far interagire l'immagine del suono-ponte con l'oggetto del SIGNIFICATO reale e poi usare subito il vocabolo in una frase.",
        isCorrect: true,
      },
      {
        id: "sound-only",
        label: "Ricordare solo la parola italiana che suona simile senza traduzione.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Il ponte fonetico aggancia la pronuncia, la scena aggancia il significato italiano e la frase fissa l'uso corretto.",
    guidedPracticePrompt:
      "Set A: Collega suono, significato e frase d'uso.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "x02-gp-1",
          prompt: "Per l'inglese «kettle» (bollitore), quale scena unisce suono e significato?",
          options: [
            { id: "ok", label: "Un gatto («cat» / suono 'ket-') che fa fischiare un BOLLITORE pieno d'acqua bollente." },
            { id: "bad", label: "Pensare a una sedia senza vapore." },
          ],
          correctOptionId: "ok",
          explanation: "Lega il suono iniziale al significato esatto «bollitore».",
        },
      ],
    },
    widgetKind: "builder_then_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Per i 4 vocaboli inglesi verificati «bridge (ponte), kettle (bollitore), cloud (nuvola), drawer (cassetto)», scrivi il tuo cue + frase d'uso; poi, a schede nascoste, recupera il vocabolo inglese esatto a partire dal significato italiano.",
    progressiveHints: [
      "bridge = ponte; kettle = bollitore; cloud = nuvola; drawer = cassetto.",
    ],
    builderRecallSpec: {
      itemsToBuild: [
        {
          locusOrContext: "Significato: «ponte» (vocabolo inglese: bridge)",
          targetWord: "bridge",
          actionPlaceholder: "Cue fonetico + frase (es. We crossed the stone bridge)...",
        },
        {
          locusOrContext: "Significato: «bollitore» (vocabolo inglese: kettle)",
          targetWord: "kettle",
          actionPlaceholder: "Cue fonetico + frase (es. Put the kettle on for tea)...",
        },
        {
          locusOrContext: "Significato: «nuvola» (vocabolo inglese: cloud)",
          targetWord: "cloud",
          actionPlaceholder: "Cue fonetico + frase (es. A dark cloud covered the sun)...",
        },
        {
          locusOrContext: "Significato: «cassetto» (vocabolo inglese: drawer)",
          targetWord: "drawer",
          actionPlaceholder: "Cue fonetico + frase (es. The keys are in the top drawer)...",
        },
      ],
      minRecalledCount: 3,
    },
  },

  X03: {
    lessonId: "X03",
    gameId: "X03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Per una lista della spesa di 9 commissioni, conta di più l'ordine rigido o non dimenticare nessun articolo?",
    demonstrationOptions: [
      {
        id: "coverage",
        label:
          "Conta la copertura completa (zero omissioni): puoi raggruppare per reparto o usare piccoli loci/catene per non lasciare indietro nulla.",
        isCorrect: true,
      },
      {
        id: "strict-order",
        label: "Se compri il pane prima delle uova la spesa è annullata.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Valutiamo la completezza del richiamo (quanti dei 9 articoli ricordi) senza penalizzare l'ordine di inserimento.",
    guidedPracticePrompt:
      "Set A: Memorizza 4 commissioni rapide e richiamale tutte.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["latte", "mele", "detersivo", "lampadina"],
    },
    widgetKind: "unordered_flash_recall",
    independentPrompt:
      "La prova vera (Set B): Osserva le 9 commissioni «dentifricio, uova, arance, pasta, quaderno, olio, pane, batterie, sapone». Codificale per gruppi o su un percorso, nascondi la lista e recupera almeno 8 articoli su 9 (in qualsiasi ordine).",
    progressiveHints: [
      "Dividi in 3 mini-gruppi: Igiene (dentifricio, sapone), Alimentari (uova, arance, pasta, olio, pane = 5 voci), Cartoleria/Elettronica (quaderno, batterie).",
    ],
    unorderedFlashSpec: {
      targetWords: [
        "dentifricio",
        "uova",
        "arance",
        "pasta",
        "quaderno",
        "olio",
        "pane",
        "batterie",
        "sapone",
      ],
      hideAfterSeconds: 30,
      minRecallCount: 8,
    },
  },

  X04: {
    lessonId: "X04",
    gameId: "X04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "attention_reading",
    demonstrationQuestion:
      "Qual è la prima causa per cui «dimentichiamo subito il nome» di una persona appena presentata?",
    demonstrationOptions: [
      {
        id: "attention",
        label:
          "Non abbiamo davvero ascoltato il nome all'inizio (mancanza di Original Awareness) né lo abbiamo collegato al contesto dell'incontro.",
        isCorrect: true,
      },
      {
        id: "memory-full",
        label: "Il cervello ha esaurito lo spazio per i nomi propri.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Ascolta il nome, ripetilo con naturalezza e ancoralo al luogo/contesto neutro dell'incontro, senza mai usare stereotipi o inferenze sensibili.",
    guidedPracticePrompt:
      "Set A: Collega due nomi fittizi ai rispettivi contesti di lavoro/incontro.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "x04-gp-1",
          prompt: "Quale approccio rispetta le regole LOCO per ricordare nomi e volti?",
          options: [
            { id: "ok", label: "Collegare il nome dichiarato (es. Marta) al contesto neutro dell'incontro (es. la libreria) con un'immagine vivida." },
            { id: "bad", label: "Fare deduzioni su salute, origine o tratti sensibili della persona." },
          ],
          correctOptionId: "ok",
          explanation: "Usiamo sempre contesti neutri e rispettosi.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Studia i 5 profili fittizi con i loro contesti d'incontro («Marta → libreria», «Elia → piscina», «Chiara → museo», «Omar → stazione», «Adele → orto»). Nascondi i profili e, dato il contesto, scrivi il nome esatto della persona (almeno 4 su 5).",
    progressiveHints: [
      "Libreria: Marta sfoglia un atlante; Piscina: Elia nuota a delfino; Museo: Chiara illumina un quadro; Stazione: Omar controlla l'orologio dei treni; Orto: Adele annaffia i pomodori.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "libreria", target: "Marta", contextHint: "Incontrata in libreria mentre riordina gli scaffali." },
        { cue: "piscina", target: "Elia", contextHint: "Incontrato a bordo piscina con il cronometro." },
        { cue: "museo", target: "Chiara", contextHint: "Incontrata nella sala principale del museo." },
        { cue: "stazione", target: "Omar", contextHint: "Incontrato al binario 1 della stazione." },
        { cue: "orto", target: "Adele", contextHint: "Incontrata nell'orto botanico." },
      ],
      minCorrectCount: 4,
    },
  },

  /* =========================================================================
     CORSO 6 — Architetto dei palazzi (P01–P04 · POCO LOCO)
     ========================================================================= */
  P01: {
    lessonId: "P01",
    gameId: "P01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Come si progetta un palazzo da 25 loci in modo da sapere subito dove si trova il locus #18 senza contare da 1?",
    demonstrationOptions: [
      {
        id: "5x5-grid",
        label:
          "Organizzandolo in 5 zone distinte da 5 loci ciascuna (1–5, 6–10, 11–15, 16–20, 21–25): il #18 è automaticamente il 3° punto della 4ª zona.",
        isCorrect: true,
      },
      {
        id: "random-25",
        label: "Scegliendo 25 oggetti sparsi in un'unica stanza.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La matrice 5 zone × 5 fermate rende immediato il calcolo aritmetico di ogni posizione.",
    guidedPracticePrompt:
      "Set A: Calcola rapidamente a quale zona e posizione interna corrispondono i numeri 11 e 23.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "p01-gp-1",
          prompt: "In un palazzo 5×5 (5 zone da 5 loci), dove cade esattamente il locus #11?",
          options: [
            { id: "z3p1", label: "È il 1° punto della Zona 3 (che copre i loci 11–15)." },
            { id: "z2p5", label: "È l'ultimo punto della Zona 2." },
          ],
          correctOptionId: "z3p1",
          explanation: "Zona 1 = 1..5, Zona 2 = 6..10, quindi #11 inaugura la Zona 3.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Esamina la mappa 5×5 a 25 loci (Zona 1 Atrio 1–5, Zona 2 Cucina 6–10, Zona 3 Studio 11–15, Zona 4 Giardino 16–20, Zona 5 Terrazza 21–25). Poi, a mappa nascosta, supera il test di accesso diretto sulle posizioni #4, #11, #18 e #23.",
    progressiveHints: [
      "#4 (Zona 1, 4° punto) = orologio a pendolo; #11 (Zona 3, 1° punto) = mappamondo; #18 (Zona 4, 3° punto) = fontana; #23 (Zona 5, 3° punto) = telescopio.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "Locus #4 (Zona 1 Atrio, 4° punto)", target: "orologio", contextHint: "Zona 1 (1–5): 1.Portone, 2.Specchio, 3.Appendiabiti, 4.Orologio, 5.Panca." },
        { cue: "Locus #11 (Zona 3 Studio, 1° punto)", target: "mappamondo", contextHint: "Zona 3 (11–15): 11.Mappamondo, 12.Scrivania, 13.Libreria, 14.Poltrona, 15.Bacheca." },
        { cue: "Locus #18 (Zona 4 Giardino, 3° punto)", target: "fontana", contextHint: "Zona 4 (16–20): 16.Cancello, 17.Ulivo, 18.Fontana, 19.Gazebo, 20.Serra." },
        { cue: "Locus #23 (Zona 5 Terrazza, 3° punto)", target: "telescopio", contextHint: "Zona 5 (21–25): 21.Scala, 22.Parapetto, 23.Telescopio, 24.Amaca, 25.Faro." },
      ],
      minCorrectCount: 4,
    },
  },

  P02: {
    lessonId: "P02",
    gameId: "P02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Cosa succede («interferenza proattiva») se usi lo stesso identico palazzo nella stessa ora per due liste d'esame diverse?",
    demonstrationOptions: [
      {
        id: "ghosts",
        label:
          "Le vecchie immagini («immagini fantasma») competono con le nuove sugli stessi loci causando intrusioni.",
        isCorrect: true,
      },
      {
        id: "double-power",
        label: "Le due liste si fondono senza alcuna confusione.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Per argomenti permanenti o ravvicinati usa palazzi distinti; riusa un palazzo solo per liste temporanee dopo che la precedente non ti serve più.",
    guidedPracticePrompt:
      "Set A: Riconosci un'intrusione da sovrapposizione di palazzi.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "p02-gp-1",
          prompt: "Nel Palazzo A avevi messo «cannella» sul tavolo; ora ci metti «violino» e durante il test ti viene in mente «cannella». Come si chiama questo fenomeno?",
          options: [
            { id: "intr", label: "Intrusione da interferenza tra tracce sullo stesso locus." },
            { id: "amnesia", label: "Perdita totale della mappa spaziale." },
          ],
          correctOptionId: "intr",
          explanation: "La traccia precedente sul medesimo ancoraggio interferisce con quella nuova.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Il Palazzo A memorizza spezie; il Palazzo B memorizza strumenti musicali. In una seconda prova le due liste vengono caricate sullo stesso percorso e compaiono intrusioni («zafferano» in mezzo agli strumenti). Diagnostica il problema e definisci la regola operativa su quando riusare vs separare i palazzi.",
    progressiveHints: [
      "Spiega la differenza tra un percorso 'lavagna' (per commissioni giornaliere usa-e-getta) e un palazzo 'archivio' (per esami che devono durare mesi).",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Palazzo A memorizza spezie; Palazzo B memorizza strumenti musicali. In seconda prova le scene vengono sovrapposte sullo stesso percorso e compaiono intrusioni.",
      requestedOutput:
        "Individua le intrusioni e decidi con criteri precisi quando riusare o separare i palazzi.",
      structuredChecks: [
        {
          id: "p02-ic-1",
          prompt: "Qual è la regola corretta per gestire spezie e strumenti musicali se devi ricordarli entrambi per l'esame di domani?",
          options: [
            {
              id: "sep",
              label:
                "Assegnarli a due palazzi fisicamente distinti (es. Casa per le spezie, Scuola per gli strumenti), evitando la sovrapposizione ravvicinata.",
            },
            {
              id: "same",
              label: "Continuare a sovrapporli sugli stessi 5 mobili sperando di non confonderli.",
            },
          ],
          correctOptionId: "sep",
          explanation: "Separare i contesti spaziali elimina alla radice l'interferenza tra liste attive contemporaneamente.",
        },
      ],
      openPromptLabel:
        "Spiega quando è sicuro riusare un palazzo («lavagna») e quando invece è obbligatorio crearne uno separato («archivio»):",
      openPromptPlaceholder:
        "Posso riusare un palazzo quando... Devo invece separare i palazzi quando...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Riuso consentito solo per dati transitori (spesa, commissioni del giorno) dopo decadimento/reset; separazione obbligatoria per materie d'esame attive nello stesso periodo.",
    },
  },

  P03: {
    lessonId: "P03",
    gameId: "P03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Come puoi rappresentare la gerarchia «Capitolo → 3 Paragrafi → 3 Concetti ciascuno» dentro un palazzo?",
    demonstrationOptions: [
      {
        id: "rooms-subloci",
        label:
          "Usando 3 Stanze per i 3 Paragrafi principali e 3 oggetti ordinati dentro ogni stanza (1.1..1.3, 2.1..2.3, 3.1..3.3) per i dettagli.",
        isCorrect: true,
      },
      {
        id: "flat",
        label: "Mettendo tutto alla rinfusa senza distinguere titoli e dettagli.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "L'architettura dell'edificio rispecchia l'indice del libro: Stanza = Macro-categoria, Oggetto = Sotto-punto.",
    guidedPracticePrompt:
      "Set A: Interpreta l'indice gerarchico `2.3` (2ª Stanza, 3° Locus).",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "p03-gp-1",
          prompt: "Se la Stanza 1 è «Produttori», la Stanza 2 è «Consumatori» e la Stanza 3 è «Decompositori», cosa indica il codice `3.1`?",
          options: [
            { id: "ok", label: "Il 1° dettaglio nella stanza dei Decompositori." },
            { id: "bad", label: "Il 3° dettaglio dei Produttori." },
          ],
          correctOptionId: "ok",
          explanation: "Il primo numero indica la zona/stanza (3=Decompositori), il secondo la fermata interna (1).",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Studia il palazzo gerarchico sull'Ecosistema: Zona 1 Produttori (`1.1 piante, 1.2 alghe, 1.3 cianobatteri`), Zona 2 Consumatori (`2.1 erbivori, 2.2 carnivori, 2.3 onnivori`), Zona 3 Decompositori (`3.1 funghi, 3.2 batteri, 3.3 detritivori`). Poi, a mappa nascosta, rispondi agli accessi diretti `2.3`, `3.1`, `1.2` e `2.1`.",
    progressiveHints: [
      "Zona 2 = Consumatori (2.1 erbivori, 2.2 carnivori, 2.3 onnivori). Zona 3 = Decompositori (3.1 funghi). Zona 1 = Produttori (1.2 alghe).",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "Indice gerarchico 2.3 (Zona 2 Consumatori, 3° sottolocus)", target: "onnivori", contextHint: "Zona 2 Consumatori: 2.1 erbivori, 2.2 carnivori, 2.3 onnivori." },
        { cue: "Indice gerarchico 3.1 (Zona 3 Decompositori, 1° sottolocus)", target: "funghi", contextHint: "Zona 3 Decompositori: 3.1 funghi, 3.2 batteri, 3.3 detritivori." },
        { cue: "Indice gerarchico 1.2 (Zona 1 Produttori, 2° sottolocus)", target: "alghe", contextHint: "Zona 1 Produttori: 1.1 piante, 1.2 alghe, 1.3 cianobatteri." },
        { cue: "Indice gerarchico 2.1 (Zona 2 Consumatori, 1° sottolocus)", target: "erbivori", contextHint: "Primo sottolocus della Zona 2 (Consumatori)." },
      ],
      minCorrectCount: 3,
    },
  },

  P04: {
    lessonId: "P04",
    gameId: "P04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Qual è la differenza tra «collisione spaziale» e «collisione semantica» in un palazzo?",
    demonstrationOptions: [
      {
        id: "spatial-vs-sem",
        label:
          "La collisione spaziale nasce da due loci troppo simili (es. tre sportelli uguali in cucina); la collisione semantica nasce da due concetti simili codificati con la stessa immagine generica.",
        isCorrect: true,
      },
      {
        id: "same",
        label: "Sono due nomi per lo stesso errore di ortografia.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Per riparare una collisione spaziale cambi il mobile; per riparare una collisione semantica differenzi l'azione/dettaglio del cue.",
    guidedPracticePrompt:
      "Set A: Distingui tra riparazione del luogo e riparazione dell'immagine.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "p04-gp-1",
          prompt: "Hai usato tre pensili bianchi identici della cucina e scambi sempre i tre concetti. Cosa correggi per primo?",
          options: [
            { id: "sp", label: "La collisione spaziale: sostituisco due pensili con il frigorifero e il forno." },
            { id: "nothing", label: "Lascio i tre pensili uguali." },
          ],
          correctOptionId: "sp",
          explanation: "Tre ancore visivamente indistinguibili causano inevitabilmente scambi di posizione.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): In una rotta ci sono 3 ancore quasi uguali nella cucina e dati di due categorie che si confondono. Identifica collisione spaziale, collisione semantica e ordine invertito, proponendo una riparazione specifica per ciascuno.",
    progressiveHints: [
      "1) Collisione spaziale → sostituisci le 3 ancore uguali in cucina con 3 elettrodomestici diversi; 2) Collisione semantica → assegna simboli/azioni contrastanti; 3) Ordine invertito → fissa il senso orario.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Rotta problematica: tre ancore quasi uguali nella cucina (sportello 1, sportello 2, sportello 3); dati su due categorie affini che usano la stessa icona generica; inversione tra il punto 2 e il punto 3.",
      requestedOutput:
        "Identifica collisione spaziale, collisione semantica e ordine invertito; proponi una riparazione per volta.",
      structuredChecks: [
        {
          id: "p04-ic-1",
          prompt: "Quale piano di intervento isola e risolve tutte e tre le patologie del percorso?",
          options: [
            {
              id: "ok",
              label:
                "1) Spaziale: sostituire gli sportelli uguali con Frigorifero, Forno e Lavello; 2) Semantica: dare a ogni categoria un marcatore d'azione opposto (es. ghiaccio vs fuoco); 3) Ordine: fissare il vettore sinistra→destra.",
            },
            {
              id: "bad",
              label: "Aggiungere altri dieci sportelli uguali.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Ogni categoria di errore riceve una modifica strutturale mirata.",
        },
      ],
      openPromptLabel:
        "Descrivi passo per passo le tre riparazioni (1. Spaziale, 2. Semantica, 3. Ordine):",
      openPromptPlaceholder:
        "1) Riparazione collisione spaziale:...\n2) Riparazione collisione semantica:...\n3) Riparazione ordine:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) Sostituzione dei 3 sportelli identici con 3 landmark unici; (2) Differenziazione dei cue per le due categorie tramite codici sensoriali distinti; (3) Verifica a vuoto dell'ordine.",
    },
  },

  /* =========================================================================
     CORSO 7 — Maestria numerica: Peg e PAO (Q01–Q04 · POCO LOCO)
     ========================================================================= */
  Q01: {
    lessonId: "Q01",
    gameId: "Q01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "phonetic_major_v1",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Qual è il segreto di un dizionario `00–99` stabile rispetto a inventare parole nuove sul momento?",
    demonstrationOptions: [
      {
        id: "fixed-100",
        label:
          "Ogni coppia da 00 a 99 ha UNA SOLA immagine fissa, tangibile e non duplicata che riconosci all'istante senza ricalcolare le consonanti.",
        isCorrect: true,
      },
      {
        id: "change-every-day",
        label: "Cambiare parola per lo stesso numero a ogni esercizio.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un vocabolario fisso 00–99 trasforma due cifre in un singolo oggetto immediato senza collisioni.",
    guidedPracticePrompt:
      "Set A: Verifica 05 (`sole`) e 12 (`tana`).",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "05", mode: "encode", expected: "05" },
        { numberOrWord: "12", mode: "encode", expected: "12" },
      ],
    },
    widgetKind: "phonetic_word_for_numbers",
    independentPrompt:
      "La prova vera (Set B): Per le 10 coppie numeriche «05, 12, 24, 37, 48, 59, 63, 70, 86, 91», proponi 10 parole italiane concrete tutte diverse e foneticamente valide secondo `major-it-v1` (almeno 8 su 10 corrette e prive di collisioni).",
    progressiveHints: [
      "Esempi conformi a `major-it-v1`: 05=sole, 12=tana, 24=nero, 37=mago, 48=riva, 59=lupo, 63=gemma, 70=casa, 86=faccia, 91=botte.",
    ],
    phoneticNumbersSpec: {
      targetNumbers: ["05", "12", "24", "37", "48", "59", "63", "70", "86", "91"],
      exampleWordsAfterSubmit: {
        "05": "sole",
        "12": "tana",
        "24": "nero",
        "37": "mago",
        "48": "riva",
        "59": "lupo",
        "63": "gemma",
        "70": "casa",
        "86": "faccia",
        "91": "botte",
      },
      minValidCount: 8,
    },
  },

  Q02: {
    lessonId: "Q02",
    gameId: "Q02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "In che cosa il Peg System (ganci numerati 1..10) differisce dal Linked Method?",
    demonstrationOptions: [
      {
        id: "peg-jump",
        label:
          "Ogni elemento è agganciato al proprio gancio fisso (1=Tè, 2=Noè, 3=Amo, 4=Re, 5=Ala): puoi interrogare direttamente il 4° o il 2° senza percorrere gli altri.",
        isCorrect: true,
      },
      {
        id: "no-numbers",
        label: "Nel Peg System non esistono numeri.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "I Peg fungono da 'appendiabiti' numerati permanenti nella tua mente.",
    guidedPracticePrompt:
      "Set A: Ripassa i 5 Peg fissi (1=Tè, 2=Noè, 3=Amo, 4=Re, 5=Ala).",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "q02-gp-1",
          prompt: "Se il Peg #4 è «Re» e gli agganci la parola «volpe», cosa vedi quando ti chiedono il 4° elemento?",
          options: [
            { id: "ok", label: "Il Re (#4) con una volpe sulla corona → rispondi subito «volpe»." },
            { id: "bad", label: "Devi ripartire dal #1." },
          ],
          correctOptionId: "ok",
          explanation: "Il numero 4 richiama istantaneamente il Peg «Re» e l'oggetto associato.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Aggancia ai Peg 1–5 la nuova lista: «1° → faro, 2° → sciarpa, 3° → moneta, 4° → volpe, 5° → violino». Poi, a lista nascosta, rispondi alle interrogazioni fuori ordine: 4°, 2°, 5°, 1° e 3°.",
    progressiveHints: [
      "Peg 1 (Tè) → faro; Peg 2 (Noè) → sciarpa; Peg 3 (Amo) → moneta; Peg 4 (Re) → volpe; Peg 5 (Ala) → violino.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "4° posizione (Peg #4: Re)", target: "volpe", contextHint: "Il Re (#4) accarezza una volpe rossa sul trono." },
        { cue: "2° posizione (Peg #2: Noè)", target: "sciarpa", contextHint: "Noè (#2) avvolge l'arca con una lunga sciarpa di lana." },
        { cue: "5° posizione (Peg #5: Ala)", target: "violino", contextHint: "Un'ala (#5) suona le corde di un violino in volo." },
        { cue: "1° posizione (Peg #1: Tè)", target: "faro", contextHint: "Una tazza di tè (#1) illumina la stanza come un faro." },
        { cue: "3° posizione (Peg #3: Amo)", target: "moneta", contextHint: "Un amo da pesca (#3) aggancia una moneta d'oro." },
      ],
      minCorrectCount: 4,
    },
  },

  Q03: {
    lessonId: "Q03",
    gameId: "Q03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Nel sistema PAO (Person–Action–Object), come fanno tre coppie di cifre (es. 12 - 24 - 37) a diventare una sola scena?",
    demonstrationOptions: [
      {
        id: "pao-order",
        label:
          "La 1ª coppia fornisce la PERSONA (12), la 2ª coppia fornisce l'AZIONE (24) e la 3ª coppia fornisce l'OGGETTO (37) in quell'ordine rigoroso.",
        isCorrect: true,
      },
      {
        id: "random-pao",
        label: "Si scelgono tre oggetti qualsiasi senza distinguere chi fa cosa.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "L'ordine grammaticale Persona → Azione → Oggetto comprime 6 cifre in un'unica micro-scena su un solo locus.",
    guidedPracticePrompt:
      "Set A: Verifica il ruolo grammaticale di Persona (1ª coppia), Azione (2ª coppia) e Oggetto (3ª coppia).",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "q03-gp-1",
          prompt: "Nel codice PAO `12 → violinista (P)`, `24 → lancia (A)`, `37 → lanterna (O)`, quale numero a 6 cifre rappresenta «Il violinista lancia la lanterna»?",
          options: [
            { id: "ok", label: "122437 (12=Persona, 24=Azione, 37=Oggetto)." },
            { id: "rev", label: "372412." },
          ],
          correctOptionId: "ok",
          explanation: "Persona (12) + Azione (24) + Oggetto (37) = 122437.",
        },
      ],
    },
    widgetKind: "pao_scene_codec",
    independentPrompt:
      "La prova vera (Set B): Studia il mini-codebook PAO («12: Persona = violinista», «24: Azione = lancia», «37: Oggetto = lanterna»). Nascondi la tabella, componi gli elementi della sfida `12 - 24 - 37` nell'ordine esatto P-A-O e ricostruisci la stringa di 6 cifre.",
    progressiveHints: [
      "12 = violinista (Persona), 24 = lancia (Azione), 37 = lanterna (Oggetto) → sequenza 122437.",
    ],
    paoCodecSpec: {
      codebook: [
        { digits: "12", person: "violinista", action: "suona", object: "violino" },
        { digits: "24", person: "nuotatore", action: "lancia", object: "rete" },
        { digits: "37", person: "mago", action: "illumina", object: "lanterna" },
      ],
      challengeSequence: ["12", "24", "37"],
      expectedPaoWords: ["violinista", "lancia", "lanterna"],
    },
  },

  Q04: {
    lessonId: "Q04",
    gameId: "Q04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "phonetic_encoding",
    demonstrationQuestion:
      "Come eviti di confondere i blocchi centrali quando memorizzi tre stringhe di 6 cifre ciascuna?",
    demonstrationOptions: [
      {
        id: "chunk-loci",
        label:
          "Segmentando ogni stringa di 6 cifre in 3 coppie da 2 cifre (es. `64-02-81`) e collocando ogni stringa su un locus distinto.",
        isCorrect: true,
      },
      {
        id: "raw-18",
        label: "Ripetendo le 18 cifre tutte insieme ad alta voce.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La segmentazione in coppie (conservando gli zeri come `02` e `40`) trasforma 6 cifre in 3 immagini concatenate su un locus.",
    guidedPracticePrompt:
      "Set A: Segmenta `640281` nelle tre coppie `64`, `02`, `81`.",
    guidedPracticeTask: {
      kind: "major_mini",
      majorTargets: [
        { numberOrWord: "64", mode: "encode", expected: "64" },
        { numberOrWord: "02", mode: "encode", expected: "02" },
      ],
    },
    widgetKind: "long_number_chunks",
    independentPrompt:
      "La prova vera (Set B): Osserva le 3 sequenze di sei cifre «640281», «729540», «183762» (segmentate in coppie `64-02-81`, `72-95-40`, `18-37-62`). Nascondi i numeri e ricostruisci tutte le coppie nell'ordine esatto conservando gli zeri.",
    progressiveHints: [
      "Stringa 1 (Locus 1): 64 (cero/giara) - 02 (scena/zaino) - 81 (fata/foto).",
      "Stringa 2 (Locus 2): 72 (cane) - 95 (palla) - 40 (rosa). Stringa 3 (Locus 3): 18 (tuffo) - 37 (mago) - 62 (cena).",
    ],
    longNumbersSpec: {
      sequences: ["640281", "729540", "183762"],
      expectedPairs: [
        ["64", "02", "81"],
        ["72", "95", "40"],
        ["18", "37", "62"],
      ],
    },
  },

  /* =========================================================================
     CORSO 8 — Stratega dello studio (R01–R04 · POCO LOCO)
     ========================================================================= */
  R01: {
    lessonId: "R01",
    gameId: "R01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Perché trasformare un capitolo di 10 pagine in 200 immagini mnemoniche è un errore strategico?",
    demonstrationOptions: [
      {
        id: "structure-first",
        label:
          "Perché un capitolo è una struttura causale con pochi concetti-cardine: prima disegni lo schema causa-effetto, poi crei cue solo per i termini/dati arbitrari.",
        isCorrect: true,
      },
      {
        id: "more-is-better",
        label: "Perché servirebbero almeno 500 immagini per pagina.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Mappa strutturale per capire il filo logico + selettività chirurgica per i termini tecnici.",
    guidedPracticePrompt:
      "Set A: Separa in un breve testo lo schema causale dai termini tecnici.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "r01-gp-1",
          prompt: "In un capitolo sulla tettonica, cosa va messo nello schema causale e cosa nei loci?",
          options: [
            { id: "ok", label: "Nello schema causale il meccanismo convettivo e lo scontro tra placche; nei loci i nomi specifici delle discontinuità o delle ere." },
            { id: "bad", label: "Mettere le congiunzioni 'e', 'ma', 'però' nei loci." },
          ],
          correctOptionId: "ok",
          explanation: "I processi si comprendono con uno schema causale; i nomi arbitrari si ancorano coi loci.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Da un testo verificato sulla tettonica a 3 frasi («Il calore interno genera moti convettivi nel mantello. Le placche litosferiche scorrono sull'astenosfera plastica. Lungo la faglia di San Andreas il margine è trascorrente»), estrai 2 nessi causali e 2 target fattuali/terminologici con risposta e fonte.",
    progressiveHints: [
      "I 2 nessi causali legano calore→moti convettivi→movimento placche; i 2 target terminologici riguardano «astenosfera» e «faglia di San Andreas (margine trascorrente)».",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Testo verificato: «Il calore interno genera moti convettivi nel mantello. Le placche litosferiche scorrono sull'astenosfera plastica. Lungo la faglia di San Andreas il margine è trascorrente».",
      requestedOutput:
        "Disegna/descrivi lo schema causale e crea due target fattuali con risposta e fonte.",
      structuredChecks: [
        {
          id: "r01-ic-1",
          prompt: "Quale sintesi separa correttamente catena causale e target fattuali?",
          options: [
            {
              id: "ok",
              label:
                "Schema causale: Calore interno → moti convettivi del mantello → scorrimento delle placche. Target fattuali: 1) Su quale strato scorre la litosfera? (Astenosfera); 2) Che tipo di margine è la faglia di San Andreas? (Trascorrente).",
            },
            {
              id: "bad",
              label: "Creare 25 immagini per ogni articolo e preposizione della frase.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Isola il meccanismo causale in 3 passaggi e seleziona solo i 2 termini tecnici come target puntuali.",
        },
      ],
      openPromptLabel:
        "Scrivi il tuo schema causale (A → B → C) e i 2 target fattuali (Domanda + Risposta + Fonte):",
      openPromptPlaceholder:
        "Schema causale: Calore -> ...\nTarget 1 (Domanda/Risposta): ...\nTarget 2 (Domanda/Risposta): ...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Schema causale: Calore interno → convezione mantello → trascinamento placche litosferiche. Target 1: Strato plastico sottostante = Astenosfera. Target 2: Esempio di margine trascorrente = Faglia di San Andreas.",
    },
  },

  R02: {
    lessonId: "R02",
    gameId: "R02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Perché prepararsi per un esame orale, un test a risposta breve e un problema applicativo richiede tre prove diverse?",
    demonstrationOptions: [
      {
        id: "exam-modes",
        label:
          "Perché l'orale richiede una scaletta argomentativa fluida, la risposta breve richiede precisione terminologica e il problema richiede l'applicazione a dati nuovi.",
        isCorrect: true,
      },
      {
        id: "same-test",
        label: "Basta ripetere a pappagallo la stessa frase per tutti e tre.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Allena sempre il formato di recupero in cui verrai effettivamente valutato.",
    guidedPracticePrompt:
      "Set A: Distingui tra traccia per l'orale e problema applicativo.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "r02-gp-1",
          prompt: "Quale prova allena specificamente l'esame ORALE sul ciclo dell'acqua?",
          options: [
            { id: "oral", label: "Esporre a voce per 2 minuti il passaggio evaporazione → condensazione → precipitazione → raccolta seguendo 4 loci." },
            { id: "mc", label: "Mettere una crocetta su Sì/No." },
          ],
          correctOptionId: "oral",
          explanation: "L'orale richiede produzione continua e collegamenti logici tra le tappe.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Fonte breve sul ciclo dell'acqua: prepara e risolvi (1) una traccia per domanda orale, (2) una domanda a risposta breve precisa e (3) un problema applicativo su una variante di contesto (es. deforestazione o bassa temperatura).",
    progressiveHints: [
      "Non limitarti a scrivere le domande: fornisci anche la risposta attesa per ciascuna delle 3 modalità.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Fonte: Ciclo dell’acqua (evaporazione solare, traspirazione vegetale, condensazione in quota, precipitazione, infiltrazione/deflusso).",
      requestedOutput:
        "Costruisci tre prove diverse (orale, risposta breve, problema applicativo) e rispondi su variante di contesto; non premiare sola ripetizione verbatim.",
      structuredChecks: [
        {
          id: "r02-ic-1",
          prompt: "Quale delle seguenti è una vera domanda APPLICATIVA su variante di contesto?",
          options: [
            {
              id: "app",
              label:
                "Come cambiano traspirazione e deflusso superficiale in un bacino idrografico dopo una vasta deforestazione?",
            },
            {
              id: "verb",
              label: "Ripeti le cinque parole tra parentesi.",
            },
          ],
          correctOptionId: "app",
          explanation: "Richiede di usare il modello del ciclo dell'acqua per dedurre l'effetto di una perturbazione reale.",
        },
      ],
      openPromptLabel:
        "Scrivi le 3 prove (1. Orale, 2. Risposta breve, 3. Problema applicativo) con le relative risposte:",
      openPromptPlaceholder:
        "1) Prova orale + scaletta risposta:...\n2) Domanda risposta breve + termine esatto:...\n3) Problema applicativo + soluzione:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) Orale: scaletta in 4 tappe collegate dal bilancio energetico solare; (2) Breve: distinzione tra evaporazione e traspirazione; (3) Applicativo: riduzione dell'infiltrazione e aumento del ruscellamento superficiale in assenza di copertura arborea.",
    },
  },

  R03: {
    lessonId: "R03",
    gameId: "R03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "retention_decay",
    demonstrationQuestion:
      "Hai solo 20 minuti prima di una verifica e 12 target in archivio (3 errati, 4 scaduti, 5 già solidi). Come distribuisci il tempo?",
    demonstrationOptions: [
      {
        id: "triage",
        label:
          "Triage per priorità: prima riparo e ritesto i 3 errati (~10 min), poi eseguo il Blind Recall sui 4 scaduti (~7 min), e dedico solo un rapido campionamento finale (~3 min) ai 5 solidi.",
        isCorrect: true,
      },
      {
        id: "re-read-solid",
        label: "Passo 18 minuti a rileggere i 5 argomenti che so già benissimo per sentirmi sicuro.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Il triage basato sulle evidenze investe i minuti dove il guadagno marginale di ritenzione è massimo.",
    guidedPracticePrompt:
      "Set A: Ordina per priorità Errati > Scaduti > Solidi.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "r03-gp-1",
          prompt: "Qual è l'errore più comune di chi ripassa senza dati?",
          options: [
            { id: "comfort", label: "Rileggere gli argomenti già padroneggiati (comfort zone) trascurando i target errati o scaduti." },
            { id: "blind", label: "Fare prove a risposta nascosta." },
          ],
          correctOptionId: "comfort",
          explanation: "Ripassare ciò che è già solido dà gratificazione immediata ma non riduce le lacune.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Calendario simulato: esame tra 6 giorni, 12 target totali (4 scaduti, 3 errati, 5 solidi). Alloca una sessione di 20 minuti motivando le priorità e il test di copertura finale.",
    progressiveHints: [
      "Assegna i blocchi di minuti: 1° blocco ai 3 errati (diagnosi + riparazione cue + nuovo tentativo), 2° blocco ai 4 scaduti (blind recall), 3° blocco rapido ai 5 solidi.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Calendario simulato: esame tra 6 giorni, 12 target: 4 scaduti, 3 errati, 5 solidi. Budget sessione odierna: 20 minuti.",
      requestedOutput:
        "Alloca 20 minuti di ripasso motivando priorità e test di copertura finale.",
      structuredChecks: [
        {
          id: "r03-ic-1",
          prompt: "Quale allocazione dei 20 minuti massimizza il consolidamento?",
          options: [
            {
              id: "ok",
              label:
                "~10 min sui 3 target errati (riparazione + verifica), ~7 min sui 4 scaduti (blind recall), ~3 min di check rapido a campione sui 5 solidi.",
            },
            {
              id: "bad",
              label: "20 min di rilettura passiva partendo dal primo capitolo.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Dà priorità agli errori attivi e alle scadenze della curva dell'oblio.",
        },
      ],
      openPromptLabel:
        "Scrivi il tuo piano dettagliato dei 20 minuti e come verificherai i 3 errati a fine sessione:",
      openPromptPlaceholder:
        "Minuti 0–10 (3 errati):...\nMinuti 10–17 (4 scaduti):...\nMinuti 17–20 (5 solidi + verifica finale):...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Priorità 1: 3 errati (diagnosi causa + riparazione + re-test a fine sessione e domani); Priorità 2: 4 scaduti (recupero attivo senza hint); Priorità 3: 5 solidi (spot-check veloce).",
    },
  },

  R04: {
    lessonId: "R04",
    gameId: "R04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "source_misconception",
    demonstrationQuestion:
      "Perché ricordare a memoria la formula della densità $\\rho = m / V$ non basta se non sai usarla su due materiali nuovi?",
    demonstrationOptions: [
      {
        id: "transfer",
        label:
          "Perché la vera padronanza richiede il trasferimento: calcolare la densità nei nuovi casi e confrontarla con quella del fluido ($1\\text{ g/cm}^3$) per dedurre chi galleggia.",
        isCorrect: true,
      },
      {
        id: "cue-enough",
        label: "Basta immaginare la lettera greca rho sul frigorifero.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Un corpo galleggia in acqua ($\\rho_{\\text{acqua}} = 1\\text{ g/cm}^3$) se la sua densità media $\\rho = m / V$ è minore di $1\\text{ g/cm}^3$.",
    guidedPracticePrompt:
      "Set A: Se un oggetto ha massa $50\\text{ g}$ e volume $100\\text{ cm}^3$, quanto vale la sua densità?",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "r04-gp-1",
          prompt: "Con $m = 50\\text{ g}$ e $V = 100\\text{ cm}^3$, qual è la densità $\\rho = m / V$ e cosa fa in acqua ($1\\text{ g/cm}^3$)?",
          options: [
            { id: "ok", label: "0.5 g/cm³ → galleggia perché 0.5 < 1." },
            { id: "bad", label: "2 g/cm³ → affonda." },
          ],
          correctOptionId: "ok",
          explanation: "50 / 100 = 0.5 g/cm³, inferiore a 1 g/cm³.",
        },
      ],
    },
    widgetKind: "numeric_transfer_lab",
    independentPrompt:
      "La prova vera (Set B): Fluido: acqua ($1\\text{ g/cm}^3$). Materiale A: massa $= 200\\text{ g}$, volume $= 100\\text{ cm}^3$. Materiale B: massa $= 80\\text{ g}$, volume $= 100\\text{ cm}^3$. Calcola la densità di A, la densità di B e indica quale materiale galleggia.",
    progressiveHints: [
      "Applica densità = massa / volume: per A calcola 200 / 100; per B calcola 80 / 100.",
      "Confronta entrambi i valori con 1 g/cm³: galleggia il materiale con densità < 1.",
    ],
    numericTransferSpec: {
      fluidDensityGcm3: 1,
      materialA: { massG: 200, volumeCm3: 100, expectedDensity: 2 },
      materialB: { massG: 80, volumeCm3: 100, expectedDensity: 0.8 },
      expectedFloats: "B",
    },
  },

  /* =========================================================================
     CORSO 9 — Spazi del mondo: palazzi reali e virtuali (W01–W04 · POCO LOCO)
     ========================================================================= */
  W01: {
    lessonId: "W01",
    gameId: "W01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Qual è la differenza cognitiva tra usare casa tua e usare un museo virtuale visitato per la prima volta 2 minuti fa?",
    demonstrationOptions: [
      {
        id: "familiarity-cost",
        label:
          "Casa tua ha costo di memorizzazione della mappa pari a zero; un ambiente nuovo richiede prima di consolidare la rotta a vuoto per evitare incertezze sull'ordine.",
        isCorrect: true,
      },
      {
        id: "virtual-always-better",
        label: "Il museo virtuale funziona automaticamente meglio per chiunque senza allenamento.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Gli ambienti virtuali ampliano i tuoi palazzi ma vanno prima stabilizzati con giri a vuoto.",
    guidedPracticePrompt:
      "Set A: Confronta tempo di preparazione e rischio d'inversione tra luogo familiare e luogo nuovo.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "w01-gp-1",
          prompt: "Prima di caricare 10 formule in una stanza virtuale nuova, quale verifica devi fare?",
          options: [
            { id: "ok", label: "Chiudere gli occhi e recitare tutte le fermate della stanza virtuale da 1 a 10 e da 10 a 1 senza guardare." },
            { id: "bad", label: "Caricare subito 30 formule senza conoscere le fermate." },
          ],
          correctOptionId: "ok",
          explanation: "La rotta a vuoto verifica che l'ambiente nuovo sia diventato davvero stabile.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B — Laboratorio locale senza API esterne): Confronta un percorso di casa conosciuto (6 punti) e una galleria/museo virtuale appena esplorato (6 punti). Predici punti di forza e rischi di ciascuno e registra le conclusioni senza fare generalizzazioni assolute.",
    progressiveHints: [
      "Confronta: (1) tempo di preparazione della mappa, (2) rischio di confondere due sale simili nel museo, (3) vantaggio di avere nuovi spazi quando i palazzi domestici sono pieni.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Confronto sperimentale: Percorso 1 = 6 punti di casa tua; Percorso 2 = 6 punti di una galleria virtuale appena visitata.",
      requestedOutput:
        "Predici qual è più immediato, analizza i rischi di confusione e registra risultati distinti senza universalizzare.",
      structuredChecks: [
        {
          id: "w01-ic-1",
          prompt: "Quale conclusione metodologica è corretta sul confronto tra luoghi familiari e virtuali?",
          options: [
            {
              id: "ok",
              label:
                "I luoghi familiari richiedono meno preparazione iniziale; i luoghi virtuali sono utili per espandere il repertorio ma richiedono un consolidamento preliminare delle ancore.",
            },
            {
              id: "bad",
              label: "I luoghi virtuali garantiscono memoria fotografica istantanea a tutti.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Rispetta le differenze individuali e il costo di consolidamento della mappa.",
        },
      ],
      openPromptLabel:
        "Confronta i due percorsi da 6 punti (Casa vs Galleria virtuale) indicando vantaggi, rischi e quando useresti il secondo:",
      openPromptPlaceholder:
        "Percorso Casa (6 punti):...\nPercorso Galleria virtuale (6 punti):...\nConclusione personale:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Casa = richiamo immediato dell'ordine, rischio saturazione se riusata troppo; Galleria virtuale = espansione illimitata, ma richiede selezione di sale/opere molto distinte e test a vuoto prima dell'uso.",
    },
  },

  W02: {
    lessonId: "W02",
    gameId: "W02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Se costruisci un percorso lungo una strada (dal vivo o in foto panoramica), perché un'auto parcheggiata è un pessimo locus?",
    demonstrationOptions: [
      {
        id: "volatile",
        label:
          "Perché è un elemento transitorio/mobile: un locus stradale deve essere un'ancora architettonica permanente (arco, portone, statua, scalinata).",
        isCorrect: true,
      },
      {
        id: "color",
        label: "Perché le auto hanno le ruote nere.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Nei percorsi urbani seleziona solo landmark fissi e permanenti (`stable`), scartando tutto ciò che è mobile o temporaneo (`unstable`).",
    guidedPracticePrompt:
      "Set A: Distingui un elemento architettonico fisso da un elemento effimero.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "w02-gp-1",
          prompt: "Tra «Fontana in pietra» e «Furgone delle consegne», quale scegli come locus #3?",
          options: [
            { id: "fountain", label: "Fontana in pietra (landmark stabile)." },
            { id: "van", label: "Furgone delle consegne." },
          ],
          correctOptionId: "fountain",
          explanation: "La fontana resta fissa nello spazio e nel tempo.",
        },
      ],
    },
    widgetKind: "multi_case_classification",
    independentPrompt:
      "La prova vera (Set B — Scena urbana simulata locale): Nella vista stradale osservi 6 elementi: «arco, portone, scala, auto parcheggiata, passante, cartellone temporaneo». Classifica ciascuno come Landmark Stabile (`stable`) oppure Elemento Volatile da scartare (`unstable`).",
    progressiveHints: [
      "Strutture murarie fisse (arco, portone, scala) = stable; veicoli, persone e pubblicità provvisorie = unstable.",
    ],
    classificationSpec: {
      categories: [
        { id: "stable", label: "Landmark Stabile (permanente — adatto come locus)" },
        { id: "unstable", label: "Elemento Volatile (mobile/temporaneo — da scartare)" },
      ],
      cases: [
        { id: "w1", stimulus: "1. «arco» in pietra all'imbocco della via", expectedCategory: "stable" },
        { id: "w2", stimulus: "2. «portone» storico in legno", expectedCategory: "stable" },
        { id: "w3", stimulus: "3. «scala» monumentale della piazza", expectedCategory: "stable" },
        { id: "w4", stimulus: "4. «auto parcheggiata» sul marciapiede", expectedCategory: "unstable" },
        { id: "w5", stimulus: "5. «passante» con l'ombrello", expectedCategory: "unstable" },
        { id: "w6", stimulus: "6. «cartellone temporaneo» di un cantiere", expectedCategory: "unstable" },
      ],
    },
  },

  W03: {
    lessonId: "W03",
    gameId: "W03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Un palazzo dei loci dipende dalla grafica 3D o dalla stabilità delle relazioni spaziali tra le fermate?",
    demonstrationOptions: [
      {
        id: "spatial-relations",
        label:
          "Dipende dall'identità e dall'ordine delle fermate: gli stessi 5 loci funzionano in 3D, in una foto 2D o in una lista ordinata accessibile.",
        isCorrect: true,
      },
      {
        id: "only-3d",
        label: "Senza un visore 3D la tecnica dei loci non può funzionare.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "In LOCO lo stesso percorso è usabile in 3D, in pianta 2D e in modalità testuale accessibile senza perdere alcun legame.",
    guidedPracticePrompt:
      "Set A: Verifica la corrispondenza tra vista grafica e lista testuale ordinata.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "w03-gp-1",
          prompt: "Se passi dalla vista 3D della stanza alla lista testuale per ipovedenti o uso da tastiera, cosa deve restare invariato?",
          options: [
            { id: "ok", label: "Gli ID, i nomi e l'ordine esatto (1→5) dei loci e delle associazioni." },
            { id: "bad", label: "Bisogna cambiare tutti i concetti." },
          ],
          correctOptionId: "ok",
          explanation: "L'identità del locus è indipendente dal formato di visualizzazione.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B — Multi-modalità senza dipendenza da scanner/API): Studia i 5 loci della stanza nella rappresentazione A (pianta/schema: «1. Libreria → cobalto, 2. Mappamondo → meridiano, 3. Scrivania → sestante, 4. Finestra → zenit, 5. Poltrona → astrolabio»). Poi, passando alla sola interrogazione testuale a etichette nascoste, recupera i 5 target.",
    progressiveHints: [
      "1. Libreria → cobalto; 2. Mappamondo → meridiano; 3. Scrivania → sestante; 4. Finestra → zenit; 5. Poltrona → astrolabio.",
    ],
    pairsRecallSpec: {
      studyPairs: [
        { cue: "Locus #1: Libreria", target: "cobalto", contextHint: "Un minerale blu cobalto brilla sul primo scaffale." },
        { cue: "Locus #2: Mappamondo", target: "meridiano", contextHint: "Un arco d'oro segna il meridiano sul mappamondo." },
        { cue: "Locus #3: Scrivania", target: "sestante", contextHint: "Un sestante nautico misura gli angoli sulla scrivania." },
        { cue: "Locus #4: Finestra", target: "zenit", contextHint: "Un raggio verticale punta allo zenit sopra la finestra." },
        { cue: "Locus #5: Poltrona", target: "astrolabio", contextHint: "Un antico astrolabio ruota sul bracciolo della poltrona." },
      ],
      minCorrectCount: 4,
    },
  },

  W04: {
    lessonId: "W04",
    gameId: "W04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "ambiguous_locus",
    demonstrationQuestion:
      "Se nella tua stanza reale il locus #3 «divano» viene sostituito da una «libreria» durante un trasloco, come aggiorni il palazzo senza perdere il concetto «clorofilla»?",
    demonstrationOptions: [
      {
        id: "migrate-anchor",
        label:
          "Mantieni invariata la posizione #3 e il fatto verificato («clorofilla»), ma aggiorni la scena d'azione sul nuovo mobile («libreria») conservando la cronologia.",
        isCorrect: true,
      },
      {
        id: "delete-course",
        label: "Cancelli tutto il corso di biologia.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "La manutenzione del palazzo aggiorna il gancio spaziale preservando intatto il bersaglio conoscitivo e la sua storia di ripasso.",
    guidedPracticePrompt:
      "Set A: Trasferisci un target dal vecchio mobile a quello nuovo nella stessa posizione.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "w04-gp-1",
          prompt: "Quando aggiorni il locus #3 da «divano» a «libreria», il concetto «clorofilla» cambia significato?",
          options: [
            { id: "no", label: "No: il fatto sorgente («clorofilla») resta identico; cambia solo l'ancoraggio spaziale #3." },
            { id: "yes", label: "Sì, diventa un altro argomento." },
          ],
          correctOptionId: "no",
          explanation: "Fatto sorgente e ancoraggio spaziale sono separati nel modello dati di LOCO.",
        },
      ],
    },
    widgetKind: "builder_then_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Il locus #3 «divano» è stato sostituito da «libreria» (target: «clorofilla») e il locus #4 «tappeto» da «baule» (target: «mitocondrio»). Riscrivi i cue sui nuovi mobili mantenendo fermi i punti #1, #2 e #3/#4, poi recupera i target a scena nascosta.",
    progressiveHints: [
      "Sul nuovo locus #3 (Libreria) fai agire la «clorofilla» (es. foglie verdi ricche di clorofilla che illuminano gli scaffali); sul nuovo #4 (Baule) il «mitocondrio».",
    ],
    builderRecallSpec: {
      itemsToBuild: [
        {
          locusOrContext: "Locus #1 (Porta — invariato)",
          targetWord: "cellula",
          actionPlaceholder: "Scena esistente sulla porta per «cellula»...",
        },
        {
          locusOrContext: "Locus #2 (Specchio — invariato)",
          targetWord: "nucleo",
          actionPlaceholder: "Scena esistente sullo specchio per «nucleo»...",
        },
        {
          locusOrContext: "Locus #3 MIGRATO (da Divano → nuova Libreria)",
          targetWord: "clorofilla",
          actionPlaceholder: "Nuova scena sulla Libreria per «clorofilla»...",
        },
        {
          locusOrContext: "Locus #4 MIGRATO (da Tappeto → nuovo Baule)",
          targetWord: "mitocondrio",
          actionPlaceholder: "Nuova scena sul Baule per «mitocondrio»...",
        },
      ],
      minRecalledCount: 4,
    },
  },

  /* =========================================================================
     CORSO 10 — Palestra dei campioni (U01–U04 · POCO LOCO)
     ========================================================================= */
  U01: {
    lessonId: "U01",
    gameId: "U01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Perché un punteggio unico di «memoria generale = 82%» è scientificamente ingannevole?",
    demonstrationOptions: [
      {
        id: "task-specific",
        label:
          "Perché la performance mnemonica è specifica per compito (es. puoi fare 9/10 sulle parole ma 5/10 sui nomi): aggregare tutto nasconde dove devi allenarti.",
        isCorrect: true,
      },
      {
        id: "iq",
        label: "Perché equivale direttamente al quoziente intellettivo.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Nell'allenamento deliberato misuri separatamente parole, nomi e numeri con il relativo campione dichiarato.",
    guidedPracticePrompt:
      "Set A: Leggi tre risultati separati senza fonderli in un'etichetta globale.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "u01-gp-1",
          prompt: "Se fai 9/10 sulle parole e 5/10 sui nomi, su quale abilità devi concentrare la pratica deliberata?",
          options: [
            { id: "names", label: "Sull'associazione nomi-contesto (5/10 = 50%)." },
            { id: "words", label: "Solo sulle parole dove fai già 90%." },
          ],
          correctOptionId: "names",
          explanation: "L'allenamento deliberato lavora sul collo di bottiglia misurato.",
        },
      ],
    },
    widgetKind: "metrics_and_trials_lab",
    independentPrompt:
      "La prova vera (Set B): Analizza i tre report di sessione: «9/10 parole», «5/10 volti-nomi», «8/10 cifre». Calcola le tre accuratezze separate (`0.9`, `0.5`, `0.8`) e indica quale conclusione sul «punteggio globale di memoria» NON è supportata.",
    progressiveHints: [
      "9/10 = 0.9; 5/10 = 0.5; 8/10 = 0.8. Un 'globalMemoryScore' unico non è supportato (`not supported`).",
    ],
    metricsTrialsSpec: {
      mode: "u01_metrics",
    },
  },

  U02: {
    lessonId: "U02",
    gameId: "U02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "attention_reading",
    demonstrationQuestion:
      "Nell'allenamento mnemonico, quando ha senso abbassare il tempo di esposizione per andare più veloci?",
    demonstrationOptions: [
      {
        id: "accuracy-first",
        label:
          "Solo DOPO che la precisione è solida e stabile: correre in 35 secondi sbagliando 4 item su 10 consolida solo errori.",
        isCorrect: true,
      },
      {
        id: "speed-only",
        label: "Fin dal primo giorno, anche se si sbagliano tutte le risposte.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Prima la precisione (10/10), poi la riduzione graduale del tempo a parità di difficoltà del set.",
    guidedPracticePrompt:
      "Set A: Confronta due prove con diversa velocità e precisione.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "u02-gp-1",
          prompt: "Tra «60s con 10/10» e «50s con 10/10» (su set di pari difficoltà), quale mostra un progresso reale?",
          options: [
            { id: "ok", label: "La prova da 50s con 10/10: mantiene il 100% di accuratezza riducendo la latenza." },
            { id: "bad", label: "Una prova da 20s con 2/10." },
          ],
          correctOptionId: "ok",
          explanation: "La velocità è utile solo quando preserva l'accuratezza.",
        },
      ],
    },
    widgetKind: "metrics_and_trials_lab",
    independentPrompt:
      "La prova vera (Set B): Confronta i tre tentativi su 10 numeri: Prova 0 (`60 s, 10/10 corretti`), Prova 1 (`35 s, 6/10 corretti`), Prova 2 (`50 s, 10/10 corretti`). Identifica le prove più accurate, la più veloce ma imprecisa, il miglior compromesso velocità-precisione e la cautela metodologica.",
    progressiveHints: [
      "Le prove con 10/10 sono la 0 e la 2; la più veloce è la 1 (ma scende a 6/10); il miglior compromesso velocità-precisione è la Prova 2 (50 s con 10/10).",
    ],
    metricsTrialsSpec: {
      mode: "u02_trials",
    },
  },

  U03: {
    lessonId: "U03",
    gameId: "U03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_sequence",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Come si allenano carte da gioco e nomi in modo serio senza trasformarli in trucchi da palcoscenico?",
    demonstrationOptions: [
      {
        id: "separate-scores",
        label:
          "Usando codifiche stabili per le carte sulla rotta e contesti d'incontro per i nomi, mantenendo punteggi e diagnosi separati per le due discipline.",
        isCorrect: true,
      },
      {
        id: "mix-all",
        label: "Mescolando i punteggi senza sapere cosa hai sbagliato.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Ogni micro-disciplina ha la sua metrica: ordine esatto per le carte, abbinamento contesto→nome per le persone.",
    guidedPracticePrompt:
      "Set A: Osserva 3 carte in sequenza e richiamale in ordine.",
    guidedPracticeTask: {
      kind: "flash_mini",
      flashWords: ["4♠", "9♥", "A♦"],
    },
    widgetKind: "cards_and_names_dual_lab",
    independentPrompt:
      "La prova vera (Set B): Memorizza la sequenza di 5 carte «4♠, 9♥, A♦, Q♣, 2♥» e i 3 profili nome-contesto («Marta → libreria», «Elia → piscina», «Chiara → museo»). Nascondi gli stimoli e ricostruisci separatamente l'ordine esatto delle 5 carte e i 3 nomi.",
    progressiveHints: [
      "Carte sui primi 5 loci: 1) 4♠, 2) 9♥, 3) A♦, 4) Q♣, 5) 2♥.",
      "Nomi: libreria → Marta, piscina → Elia, museo → Chiara.",
    ],
    cardsAndNamesSpec: {
      cards: ["4♠", "9♥", "A♦", "Q♣", "2♥"],
      namePairs: [
        { context: "libreria", name: "Marta" },
        { context: "piscina", name: "Elia" },
        { context: "museo", name: "Chiara" },
      ],
    },
  },

  U04: {
    lessonId: "U04",
    gameId: "U04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "order_omission_inversion",
    demonstrationQuestion:
      "Come ragiona un auto-coach quando legge il proprio registro degli errori?",
    demonstrationOptions: [
      {
        id: "hypothesis-test",
        label:
          "Isola il pattern ricorrente sul campione dichiarato, formula un'ipotesi specifica, applica UNA correzione mirata e definisce la prova futura per verificarla.",
        isCorrect: true,
      },
      {
        id: "give-up",
        label: "Conclude di non essere portato per lo studio.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Dato osservato → Ipotesi causale → Correzione singola → Verifica falsificabile sul prossimo set.",
    guidedPracticePrompt:
      "Set A: Distingui tra un'ipotesi verificabile e un giudizio generico.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "u04-gp-1",
          prompt: "Su 10 prove noti 4 inversioni sempre tra il locus #6 e il #7. Qual è l'ipotesi più fondata?",
          options: [
            { id: "ok", label: "I loci #6 e #7 sono troppo vicini o simili nella stanza e necessitano di una differenziazione spaziale." },
            { id: "bad", label: "Tutti i 25 loci sono sbagliati." },
          ],
          correctOptionId: "ok",
          explanation: "L'errore è localizzato specificamente sulla coppia 6–7.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B): Su 10 tentativi registrati osservi: «4 inversioni fra i loci 6 e 7», «2 errori fonetici sul suono /tʃ/ (C dolce = 6)», «4 successi netti». Formula un'ipotesi specifica, scegli la correzione mirata e definisci una prova futura che possa confermarla o falsificarla.",
    progressiveHints: [
      "Indirizza separatamente i due cluster: (1) ridisegnare il locus #6 o #7 per eliminare l'inversione; (2) ripassare la regola C dolce /tʃ/ = 6 (N02/N04); (3) testare su 10 nuovi tentativi se le inversioni 6–7 scendono a 0–1.",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Report di 10 tentativi: 4 inversioni fra loci 6 e 7; 2 errori sul fonema /tʃ/ (cifra 6); 4 successi completi.",
      requestedOutput:
        "Formula ipotesi specifica, scegli una correzione e definisci una prova futura che la falsifichi.",
      structuredChecks: [
        {
          id: "u04-ic-1",
          prompt: "Quale diagnosi risponde esattamente ai dati del campione (n=10)?",
          options: [
            {
              id: "ok",
              label:
                "Cluster 1: ambiguità direzionale tra locus 6 e 7 (4/10); Cluster 2: incertezza fonetica su /tʃ/=6 (2/10). Intervento: sostituire il locus #7 e fare drill su C dolce vs C dura.",
            },
            {
              id: "bad",
              label: "Cambiare lingua di studio e cancellare tutti i palazzi.",
            },
          ],
          correctOptionId: "ok",
          explanation: "Mira esattamente ai due pattern osservati nel campione di 10 tentativi.",
        },
      ],
      openPromptLabel:
        "Scrivi (1) Ipotesi diagnostica, (2) Correzione su loci 6–7 e /tʃ/, (3) Criterio di falsificazione nella prossima sessione da 10 prove:",
      openPromptPlaceholder:
        "1) Ipotesi:...\n2) Correzione:...\n3) Prova futura di verifica/falsificazione:...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: (1) Ipotesi: i loci 6–7 mancano di asimmetria visiva e /tʃ/ viene confuso con /k/ o /ʃ/; (2) Correzione: distanziare #6 e #7 in micro-zone diverse + drill su parole con C dolce; (3) Falsificazione: se in un nuovo set da 10 compaiono ancora >=2 inversioni tra 6 e 7, il problema è il punto mediano #5.",
    },
  },

  /* =========================================================================
     CORSO 11 — AI Memory Studio (A01–A04 · PRO LOCO · Mock locale trasparente)
     ========================================================================= */
  A01: {
    lessonId: "A01",
    gameId: "A01-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "source_misconception",
    demonstrationQuestion:
      "Perché in LOCO una scheda generata dall'AI NON diventa mai automaticamente un bersaglio di studio attivo?",
    demonstrationOptions: [
      {
        id: "human-gate",
        label:
          "Perché un modello può invertire cifre o inventare dettagli (allucinazioni): serve sempre la verifica sulla fonte e la conferma esplicita dell'utente.",
        isCorrect: true,
      },
      {
        id: "ai-infallible",
        label: "Perché l'AI non sbaglia mai i numeri.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Invariante LOCO: nessuna conoscenza estratta dall'AI entra nel tuo palazzo senza il tuo controllo sulla fonte originale.",
    guidedPracticePrompt:
      "Set A: Confronta l'estratto originale con la sintesi automatica.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "a01-gp-1",
          prompt: "La fonte dice «1789» e la bozza AI propone «1798». Cosa fai?",
          options: [
            { id: "fix", label: "Rifiuto il dato 1798, correggo in 1789 citando la fonte e solo dopo confermo il target." },
            { id: "accept", label: "Imparo 1798 perché l'ha scritto il computer." },
          ],
          correctOptionId: "fix",
          explanation: "Memorizzare un dato non verificato significa scolpire un errore nella memoria.",
        },
      ],
    },
    widgetKind: "source_fact_check_lab",
    independentPrompt:
      "La prova vera (Set B — Laboratorio di verifica critica, nessuna chiamata AI esterna): Fonte originale: «L’azoto costituisce circa il 78% dell’atmosfera terrestre». Bozza AI proposta: «L’azoto costituisce circa l’87% dell’atmosfera terrestre». Individua l'errore, inserisci il valore corretto verificato e conferma il requisito di approvazione della fonte.",
    progressiveHints: [
      "Nota l'inversione delle cifre: la fonte indica 78%, mentre la proposta automatica ha invertito in 87%.",
    ],
    sourceFactCheckSpec: {
      sourceExcerpt: "L’azoto costituisce circa il 78% dell’atmosfera terrestre.",
      aiProposedClaim: "L’azoto costituisce circa l’87% dell’atmosfera terrestre.",
      expectedCorrectNumber: 78,
    },
  },

  A02: {
    lessonId: "A02",
    gameId: "A02-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "rubric_guided_self_check",
    defaultErrorCategory: "weak_cue",
    demonstrationQuestion:
      "Quando un assistente AI ti suggerisce tre immagini per un concetto difficile, quale devi scegliere o rielaborare?",
    demonstrationOptions: [
      {
        id: "decodable-personal",
        label:
          "Quella che traduce il meccanismo reale della definizione e che TU riesci a decodificare istantaneamente senza leggere l'etichetta.",
        isCorrect: true,
      },
      {
        id: "prettiest",
        label: "Quella più astratta e decorativa anche se non c'entra col significato.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "L'AI può offrire spunti creativi per sbloccarti, ma la scena funziona solo se la fai tua e ne verifichi la decodifica.",
    guidedPracticePrompt:
      "Set A: Scarta i suggerimenti puramente estetici.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "a02-gp-1",
          prompt: "Per «permeabilità», quale proposta ha valore mnemonico e concettuale?",
          options: [
            { id: "ok", label: "Un filtro poroso che lascia attraversare l'acqua a velocità misurabile." },
            { id: "bad", label: "Un quadro astratto viola senza liquidi né pori." },
          ],
          correctOptionId: "ok",
          explanation: "Ancora l'immagine al passaggio del fluido attraverso i pori del materiale.",
        },
      ],
    },
    widgetKind: "structured_plus_rubric",
    independentPrompt:
      "La prova vera (Set B — Laboratorio mock locale): Esamina tre proposte di cue per «permeabilità»: (1) una puramente estetica, (2) una scientificamente imprecisa, (3) una ancorata al passaggio attraverso un filtro. Scegli e personalizza la cue migliore dimostrando come riporta alla definizione esatta.",
    progressiveHints: [
      "Scegli la proposta #3 (passaggio attraverso filtro poroso) e personalizzala su un locus concreto specificando come decodifichi la parola «permeabilità».",
    ],
    structuredPlusRubricSpec: {
      stimulusText:
        "Tre proposte di cue per «permeabilità»: Proposta 1 (estetica): sfera dorata fluttuante; Proposta 2 (imprecisa): muro che blocca ogni liquido; Proposta 3 (funzionale): spugna/filtro di roccia porosa sul lavandino che si lascia attraversare dall'acqua.",
      requestedOutput:
        "Scegli o modifica la cue e dimostra che riporta alla definizione corretta di permeabilità.",
      structuredChecks: [
        {
          id: "a02-ic-1",
          prompt: "Quale proposta accetti come base e perché scarti le prime due?",
          options: [
            {
              id: "p3",
              label:
                "Accetto e personalizzo la Proposta 3 perché mostra la capacità di un materiale di lasciarsi attraversare da un fluido; la 1 è muta e la 2 rappresenta l'impermeabilità (l'opposto!).",
            },
            {
              id: "p2",
              label: "Accetto la Proposta 2 anche se rappresenta il contrario.",
            },
          ],
          correctOptionId: "p3",
          explanation: "La Proposta 2 indurrebbe una misconception opposta (impermeabilità).",
        },
      ],
      openPromptLabel:
        "Scrivi la versione finale personalizzata del tuo cue per «permeabilità» e la definizione a cui ti riporta:",
      openPromptPlaceholder:
        "Cue personalizzato sul mio locus:...\nDefinizione recuperata: La permeabilità è la proprietà di...",
      rubricCriteria: DEFAULT_RUBRIC_CRITERIA,
      modelReferenceAfterSubmit:
        "Riferimento: Scelta della Proposta 3 adattata a un locus specifico + definizione corretta (capacità di un corpo/mezzo poroso di lasciarsi attraversare da un fluido).",
    },
  },

  A03: {
    lessonId: "A03",
    gameId: "A03-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "hybrid_deterministic_and_rubric",
    gradingReliability: "hybrid_recall_and_rubric",
    defaultErrorCategory: "attention_reading",
    demonstrationQuestion:
      "Qual è la differenza tra un «indizio socratico» (es. «pensa alla centrale energetica della cellula») e un suggerimento che regala già la parola?",
    demonstrationOptions: [
      {
        id: "socratic",
        label:
          "L'indizio socratico riattiva il percorso di recupero senza svelare la risposta; tuttavia il tentativo va comunque registrato come `assisted`, non autonomo.",
        isCorrect: true,
      },
      {
        id: "same-as-unassisted",
        label: "Usare tre indizi equivale a rispondere senza alcun aiuto.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "Tenta sempre prima senza indizi; se usi la scaletta di hint, il sistema registra onestamente `hintsUsed > 0`.",
    guidedPracticePrompt:
      "Set A: Ordina gli indizi dal più leggero (contesto/locus) al più rivelatore.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "a03-gp-1",
          prompt: "Quale indizio mantiene ancora attivo lo sforzo di recupero?",
          options: [
            { id: "light", label: "Indizio 1: «Guarda il locus #4 (il forno della cucina): quale organello produce energia lì?»" },
            { id: "spoiler", label: "La risposta è scritta qui: MITOCONDRIO." },
          ],
          correctOptionId: "light",
          explanation: "Il richiamo del locus stimola la decodifica senza mostrare la soluzione.",
        },
      ],
    },
    widgetKind: "pairs_blind_recall",
    independentPrompt:
      "La prova vera (Set B): Rispondi alla domanda a risposta nascosta «Quale organello genera la maggior parte dell’ATP nella respirazione cellulare aerobica?» e classifica correttamente la differenza tra tentativo autonomo e assistito.",
    progressiveHints: [
      "Indizio graduale 1 (non rivelatore): Pensa all'organello a doppia membrana noto come centrale energetica della cellula eucariote.",
      "Indizio graduale 2: Nel tuo palazzo biologico era associato al baule/forno che genera energia (inizia per 'mito-...').",
    ],
    pairsRecallSpec: {
      studyPairs: [
        {
          cue: "Quale organello genera la maggior parte dell’ATP nella respirazione cellulare aerobica?",
          target: "mitocondrio",
          contextHint: "Organello cellulare sede della respirazione aerobica e produzione di ATP.",
        },
        {
          cue: "Se rispondi correttamente DOPO aver aperto l'Indizio 1, il tentativo è «autonomo» o «assistito»?",
          target: "assistito",
          contextHint: "Ogni tentativo con hintsUsed > 0 viene classificato come assistito.",
        },
      ],
      minCorrectCount: 2,
    },
  },

  A04: {
    lessonId: "A04",
    gameId: "A04-lab-v2",
    datasetVersion: "2.0.0-a",
    assessmentMode: "deterministic_exact",
    gradingReliability: "deterministic_verified",
    defaultErrorCategory: "wrong_target",
    demonstrationQuestion:
      "Perché un buon sistema di analisi ti dice «Hai sbagliato 4 di 12 codifiche con /tʃ/ negli ultimi 14 giorni» e MAI «Hai una cattiva memoria»?",
    demonstrationOptions: [
      {
        id: "evidence-vs-label",
        label:
          "Perché il primo è un'osservazione basata su campione, finestra temporale e abilità specifica (`sample_based_observation`); il secondo è un'etichetta personale infondata (`unsupported_personal_label`).",
        isCorrect: true,
      },
      {
        id: "labels-help",
        label: "Perché le etichette personali aiutano a studiare meglio.",
        isCorrect: false,
      },
    ],
    demonstrationModelReveal:
      "In LOCO ogni feedback dichiara il campione ($n$), la finestra temporale e l'azione concreta, rifiutando giudizi sulla persona.",
    guidedPracticePrompt:
      "Set A: Riconosci una metrica con campione dichiarato.",
    guidedPracticeTask: {
      kind: "structured_checks",
      checks: [
        {
          id: "a04-gp-1",
          prompt: "Quale messaggio rispetta le regole di trasparenza di LOCO?",
          options: [
            { id: "ok", label: "«Campione ridotto (2 prove): completa altre 3 prove per una raccomandazione affidabile.»" },
            { id: "bad", label: "«Dopo 1 sola prova sappiamo tutto del tuo cervello.»" },
          ],
          correctOptionId: "ok",
          explanation: "Quando il campione è insufficiente, LOCO lo dichiara apertamente.",
        },
      ],
    },
    widgetKind: "multi_case_classification",
    independentPrompt:
      "La prova vera (Set B): Classifica le due affermazioni del report diagnostico tra Osservazione basata su campione (`sample_based_observation`) ed Etichetta personale non supportata (`unsupported_personal_label`).",
    progressiveHints: [
      "La frase con '4 errori su 12 codifiche negli ultimi 14 giorni' dichiara errore specifico, campione (12) e finestra (14 giorni).",
    ],
    classificationSpec: {
      categories: [
        {
          id: "sample_based_observation",
          label: "Osservazione basata su campione e finestra (valida e azionabile)",
        },
        {
          id: "unsupported_personal_label",
          label: "Etichetta personale non supportata (da rifiutare)",
        },
      ],
      cases: [
        {
          id: "e1",
          stimulus: "Affermazione 1: «4 errori su 12 codifiche con /tʃ/ negli ultimi 14 giorni»",
          expectedCategory: "sample_based_observation",
        },
        {
          id: "e2",
          stimulus: "Affermazione 2: «sei una persona con cattiva memoria»",
          expectedCategory: "unsupported_personal_label",
        },
      ],
    },
  },
};

/* ===========================================================================
   PURE EVALUATION FUNCTIONS FOR ALL V2 WIDGET ARCHETYPES
   =========================================================================== */

export function normalizeAnswerToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,;:!?'"«»()]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Valuta un richiamo di lista ordinata (`ordered_flash_recall` — S01, L03, L06, K01).
 * Distingue copertura (quanti elementi ricordati) e ordine esatto (quanti nella posizione corretta).
 */
export function evaluateOrderedWordsAttempt(params: {
  lessonId: string;
  expectedWords: string[];
  submittedWords: string[];
  minOrderedPassCount: number;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const nowIso = params.nowIso ?? new Date().toISOString();
  const expectedNorm = params.expectedWords.map(normalizeAnswerToken);
  const submittedNorm = params.submittedWords.map(normalizeAnswerToken);

  let exactOrderCount = 0;
  let presentAnywhereCount = 0;
  const omissions: string[] = [];
  const inversions: string[] = [];

  expectedNorm.forEach((exp, idx) => {
    if (submittedNorm[idx] === exp) {
      exactOrderCount += 1;
      presentAnywhereCount += 1;
    } else if (submittedNorm.includes(exp)) {
      presentAnywhereCount += 1;
      inversions.push(params.expectedWords[idx]);
    } else {
      omissions.push(params.expectedWords[idx]);
    }
  });

  const passedGate =
    params.submittedBeforeReveal && exactOrderCount >= params.minOrderedPassCount;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  let errorCat: ErrorDiagnosisCategory | null = null;
  let diag = `Hai ricordato ${exactOrderCount}/${expectedNorm.length} elementi nella posizione esatta (${presentAnywhereCount}/${expectedNorm.length} presenti in totale).`;

  if (!params.submittedBeforeReveal) {
    errorCat = "attention_reading";
    diag =
      "Hai rivelato la soluzione prima di consegnare il tentativo: vale come studio, non come recupero autonomo.";
  } else if (!passedGate) {
    errorCat = "order_omission_inversion";
    const parts: string[] = [diag];
    if (inversions.length > 0) {
      parts.push(
        `Inversione di posizione su: ${inversions.join(", ")} (ricordati ma nel posto sbagliato).`
      );
    }
    if (omissions.length > 0) {
      parts.push(`Omissione su: ${omissions.join(", ")}.`);
    }
    diag = parts.join(" ");
  }

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-ordered-set-b`,
    submittedAnswer: params.submittedWords,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: expectedNorm.length > 0 ? exactOrderCount / expectedNorm.length : 0,
    summaryHeadline: passedGate
      ? autonomousMasteryEligible
        ? `Recupero ordinato superato (${exactOrderCount}/${expectedNorm.length})`
        : `Recupero assistito (${exactOrderCount}/${expectedNorm.length} con ${params.hintsUsed} hint)`
      : `Ordine o copertura incompleti (${exactOrderCount}/${expectedNorm.length} in ordine)`,
    diagnosticFeedback: diag,
    errorCategory: errorCat,
    repairAction: errorCat ? ERROR_DIAGNOSIS_CATALOG[errorCat].repairAction : null,
    createdAt: nowIso,
  };
}

/**
 * Valuta un richiamo di lista non ordinata (`unordered_flash_recall` — T02, X03).
 */
export function evaluateUnorderedWordsAttempt(params: {
  lessonId: string;
  expectedWords: string[];
  submittedWords: string[];
  minRecallCount: number;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const nowIso = params.nowIso ?? new Date().toISOString();
  const submittedSet = new Set(
    params.submittedWords.map(normalizeAnswerToken).filter(Boolean)
  );
  const recalled: string[] = [];
  const omitted: string[] = [];

  for (const exp of params.expectedWords) {
    if (submittedSet.has(normalizeAnswerToken(exp))) {
      recalled.push(exp);
    } else {
      omitted.push(exp);
    }
  }

  const passedGate =
    params.submittedBeforeReveal && recalled.length >= params.minRecallCount;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;
  const errorCat: ErrorDiagnosisCategory | null = passedGate
    ? null
    : "order_omission_inversion";

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-unordered-set-b`,
    submittedAnswer: params.submittedWords,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      params.expectedWords.length > 0
        ? recalled.length / params.expectedWords.length
        : 0,
    summaryHeadline: passedGate
      ? `Copertura raggiunta (${recalled.length}/${params.expectedWords.length})`
      : `Voci mancanti (${recalled.length}/${params.expectedWords.length})`,
    diagnosticFeedback:
      omitted.length === 0
        ? "Hai recuperato tutti gli elementi senza alcuna omissione."
        : `Elementi omessi da consolidare nel proprio gruppo/locus: ${omitted.join(", ")}.`,
    errorCategory: errorCat,
    repairAction: errorCat ? ERROR_DIAGNOSIS_CATALOG[errorCat].repairAction : null,
    createdAt: nowIso,
  };
}

/**
 * Valuta coppie a risposta nascosta (`pairs_blind_recall` e `builder_then_blind_recall`).
 */
export function evaluatePairsBlindRecallAttempt(params: {
  lessonId: string;
  expectedPairs: { cue: string; target: string }[];
  submittedByCue: Record<string, string>;
  minCorrectCount: number;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const nowIso = params.nowIso ?? new Date().toISOString();
  const allTargetsNorm = params.expectedPairs.map((p) =>
    normalizeAnswerToken(p.target)
  );

  let correctCount = 0;
  let swappedCount = 0;
  const wrongCues: string[] = [];

  for (const pair of params.expectedPairs) {
    const rawUser = params.submittedByCue[pair.cue] ?? "";
    const userNorm = normalizeAnswerToken(rawUser);
    const expNorm = normalizeAnswerToken(pair.target);
    if (userNorm === expNorm) {
      correctCount += 1;
    } else {
      wrongCues.push(`${pair.cue} → atteso «${pair.target}»`);
      if (userNorm && allTargetsNorm.includes(userNorm)) {
        swappedCount += 1;
      }
    }
  }

  const passedGate =
    params.submittedBeforeReveal && correctCount >= params.minCorrectCount;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;
  const errorCat: ErrorDiagnosisCategory | null = passedGate
    ? null
    : swappedCount > 0
      ? "ambiguous_locus"
      : "weak_cue";

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-pairs-set-b`,
    submittedAnswer: params.submittedByCue,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      params.expectedPairs.length > 0
        ? correctCount / params.expectedPairs.length
        : 0,
    summaryHeadline: passedGate
      ? autonomousMasteryEligible
        ? `Richiamo cieco superato (${correctCount}/${params.expectedPairs.length})`
        : `Richiamo assistito (${correctCount}/${params.expectedPairs.length} con hint)`
      : `Richiamo cieco da rinforzare (${correctCount}/${params.expectedPairs.length})`,
    diagnosticFeedback:
      wrongCues.length === 0
        ? "Tutte le associazioni hanno restituito il bersaglio esatto a partire dal solo luogo/contesto."
        : swappedCount > 0
          ? `Hai scambiato i bersagli tra due luoghi (${swappedCount} inversioni). Da riparare: ${wrongCues.join("; ")}.`
          : `Il cue non ha riportato alla parola esatta su: ${wrongCues.join("; ")}.`,
    errorCategory: errorCat,
    repairAction: errorCat ? ERROR_DIAGNOSIS_CATALOG[errorCat].repairAction : null,
    createdAt: nowIso,
  };
}

/**
 * Valuta una prova con rubrica + controlli strutturati (`structured_plus_rubric`).
 * REGOLA CRITICA: `nonEmpty = correct` per la mastery è VIETATO!
 * Un testo libero troppo corto o copiato dallo stimolo viene rifiutato;
 * anche quando valido e autovalutato con la rubrica, assegna `verifiedBy: "learner_self_check"`
 * e `autonomousMasteryEligible: false` (pratica completata con autovalutazione, non mastery automatica).
 */
export function evaluateStructuredPlusRubricAttempt(params: {
  lessonId: string;
  structuredAnswers: Record<string, string>;
  openResponseText: string;
  rubricCheckedIndices: number[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.structuredPlusRubricSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  const checks = spec?.structuredChecks ?? [];
  let structuredCorrect = 0;
  for (const chk of checks) {
    if (params.structuredAnswers[chk.id] === chk.correctOptionId) {
      structuredCorrect += 1;
    }
  }
  const allStructuredOk = checks.length === 0 || structuredCorrect === checks.length;

  const cleanedText = params.openResponseText.trim();
  const stimulusClean = (spec?.stimulusText ?? "").trim().toLowerCase();
  const isCopiedVerbatim =
    cleanedText.length > 0 &&
    stimulusClean.includes(cleanedText.toLowerCase()) &&
    cleanedText.length <= stimulusClean.length;

  const hasSubstantiveOpenText =
    cleanedText.length >= 35 &&
    cleanedText.split(/\s+/).length >= 7 &&
    !isCopiedVerbatim;

  const totalRubricItems = spec?.rubricCriteria.length ?? 4;
  const rubricCompleted = params.rubricCheckedIndices.length >= Math.min(3, totalRubricItems);

  const practiceValid =
    params.submittedBeforeReveal &&
    allStructuredOk &&
    hasSubstantiveOpenText &&
    rubricCompleted;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-rubric-set-b`,
    submittedAnswer: {
      structuredAnswers: params.structuredAnswers,
      openResponseText: params.openResponseText,
      rubricCheckedIndices: params.rubricCheckedIndices,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    // `correct` is null when open semantic text is self-checked, or false if structural checks failed
    correct: practiceValid ? null : false,
    verifiedBy: "learner_self_check",
    // Open rubric self-check NEVER grants automatic mastery (`05_GAME_ENGINE_SPEC.md` Section 3)
    autonomousMasteryEligible: false,
    scoreRatio: practiceValid ? 1 : structuredCorrect / Math.max(1, checks.length + 1),
    summaryHeadline: practiceValid
      ? "Pratica completata con autovalutazione guidata (non mastery automatica)"
      : !allStructuredOk
        ? "Verifica prima i quesiti diagnostici strutturati"
        : isCopiedVerbatim
          ? "La risposta ripete il testo dello stimolo: formula esempi/domande originali"
          : !hasSubstantiveOpenText
            ? "Sviluppa tutte le parti richieste nella risposta scritta (almeno una frase completa per punto)"
            : "Conferma i criteri della rubrica di autovalutazione dopo aver confrontato il tuo lavoro",
    diagnosticFeedback: practiceValid
      ? "Hai superato i controlli strutturati e confrontato la tua produzione aperta con la rubrica. Come da regole LOCO 2.0, le prove aperte autovalutate accreditano la pratica svolta (`skill_practiced`), non la padronanza automatica."
      : ERROR_DIAGNOSIS_CATALOG[mission?.defaultErrorCategory ?? "wrong_target"].diagnosis,
    errorCategory: practiceValid
      ? null
      : mission?.defaultErrorCategory ?? "wrong_target",
    repairAction: practiceValid
      ? null
      : ERROR_DIAGNOSIS_CATALOG[mission?.defaultErrorCategory ?? "wrong_target"]
          .repairAction,
    createdAt: nowIso,
  };
}

export const MAJOR_IT_V1_VERIFIED_LEXICON_V2: Record<string, string> = {
  scena: "02",
  sci: "0",
  scia: "0",
  scimmia: "03",
  sasso: "00",
  sole: "05",
  zaino: "02",
  zero: "04",
  sera: "04",
  zucchero: "074",
  toro: "14",
  tiro: "14",
  tana: "12",
  dono: "12",
  teca: "17",
  diga: "17",
  tenda: "121",
  dado: "11",
  dito: "11",
  tuffo: "18",
  tubo: "19",
  tappo: "19",
  nave: "28",
  nido: "21",
  nero: "24",
  gnomo: "23",
  nemo: "23",
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
  rupe: "49",
  rabbia: "49",
  rana: "42",
  remo: "43",
  rosa: "40",
  raso: "40",
  re: "4",
  luna: "52",
  leone: "52",
  lupo: "59",
  foglia: "85",
  aglio: "5",
  figlio: "85",
  limone: "532",
  libro: "594",
  ciao: "6",
  cielo: "65",
  cena: "62",
  gemma: "63",
  gelato: "651",
  gioco: "67",
  cippo: "69",
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
  fumo: "83",
  faccia: "86",
  fiaba: "89",
  vela: "85",
  fuoco: "87",
  violino: "852",
  pane: "92",
  pino: "92",
  piede: "91",
  botte: "91",
  pipa: "99",
  papa: "99",
  ponte: "921",
  banca: "927",
  barca: "947",
  bussola: "905",
  banana: "922",
  bicicletta: "96751",
};

export function encodeItalianWordToMajorDigitsV2(rawWord: string): string {
  const cleaned = rawWord
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

  if (!cleaned) return "";

  if (MAJOR_IT_V1_VERIFIED_LEXICON_V2[cleaned] !== undefined) {
    return MAJOR_IT_V1_VERIFIED_LEXICON_V2[cleaned];
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

/**
 * Valuta `builder_then_blind_recall` (S04, L04, K02, X02, W04).
 * REGOLA CRITICA: Costruire le scene da solo NON dà mai padronanza mnemonica;
 * è obbligatorio superare anche la Fase 2 di richiamo a etichette nascoste!
 */
export function evaluateBuilderThenBlindRecallAttempt(params: {
  lessonId: string;
  builtScenesByCue: Record<string, { actionVerb: string; sensoryDetail: string } | string>;
  recalledTargetByCue: Record<string, string>;
  rubricCheckedIndices: number[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.builderRecallSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  type RawAssignmentItem = {
    locusOrAnchor?: string;
    locusOrContext?: string;
    targetToRemember?: string;
    targetWord?: string;
  };
  const rawItems = (spec?.assignments ?? spec?.itemsToBuild ?? []) as RawAssignmentItem[];
  const assignments = rawItems.map((item) => ({
    locusOrAnchor: item.locusOrAnchor ?? item.locusOrContext ?? "",
    targetToRemember: item.targetToRemember ?? item.targetWord ?? "",
  }));

  const builtScenesNorm: Record<string, { actionVerb: string; sensoryDetail: string } | string> = {};
  for (const [k, v] of Object.entries(params.builtScenesByCue)) {
    builtScenesNorm[normalizeAnswerToken(k)] = v;
  }
  const recalledNorm: Record<string, string> = {};
  for (const [k, v] of Object.entries(params.recalledTargetByCue)) {
    recalledNorm[normalizeAnswerToken(k)] = v;
  }

  let validScenesCount = 0;
  let recalledCorrectCount = 0;
  const missedTargets: string[] = [];

  for (const item of assignments) {
    const key = normalizeAnswerToken(item.locusOrAnchor);
    const scene = builtScenesNorm[key];
    const isSceneValid =
      scene &&
      (typeof scene === "string"
        ? scene.trim().length >= 4
        : ((scene.actionVerb?.trim()?.length ?? 0) >= 2 ||
            (scene.sensoryDetail?.trim()?.length ?? 0) >= 2));

    if (isSceneValid) {
      validScenesCount += 1;
    }

    const recalledRaw = recalledNorm[key] ?? "";
    if (
      recalledRaw &&
      normalizeAnswerToken(recalledRaw) ===
        normalizeAnswerToken(item.targetToRemember)
    ) {
      recalledCorrectCount += 1;
    } else {
      missedTargets.push(`${item.locusOrAnchor} → «${item.targetToRemember}»`);
    }
  }

  const minRequired = spec?.minRecalledCount ?? assignments.length;
  const allBuilt = assignments.length > 0 && validScenesCount >= minRequired;
  const allRecalled =
    assignments.length > 0 && recalledCorrectCount >= minRequired;
  const passedGate = params.submittedBeforeReveal && allBuilt && allRecalled;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  let errorCat: ErrorDiagnosisCategory | null = null;
  if (!passedGate) {
    errorCat = !allBuilt ? "weak_cue" : "order_omission_inversion";
  }

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-builder-recall-set-b`,
    submittedAnswer: {
      builtScenesByCue: params.builtScenesByCue,
      recalledTargetByCue: params.recalledTargetByCue,
      rubricCheckedIndices: params.rubricCheckedIndices,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      assignments.length > 0 ? recalledCorrectCount / assignments.length : 0,
    summaryHeadline: passedGate
      ? `Scene costruite (${validScenesCount}/${assignments.length}) e richiamo cieco superato (${recalledCorrectCount}/${assignments.length})`
      : !allBuilt
        ? `Completa prima le scene con azione e dettaglio sensoriale (${validScenesCount}/${assignments.length})`
        : `Costruzione completata, ma richiamo cieco parziale (${recalledCorrectCount}/${assignments.length})`,
    diagnosticFeedback: passedGate
      ? "Hai trasformato la costruzione mnemonica in vero recupero senza etichette visibili."
      : !allBuilt
        ? "Ricorda: un builder incompleto non crea un aggancio d'azione solido."
        : `Compilare il builder vale come costruzione, non come memoria: nel richiamo a etichette nascoste hai mancato ${missedTargets.join(", ")}.`,
    errorCategory: errorCat,
    repairAction: errorCat ? ERROR_DIAGNOSIS_CATALOG[errorCat].repairAction : null,
    createdAt: nowIso,
  };
}

/**
 * Valuta `loci_route_and_blind_order` (S03, L02, L07, P01, P03, W03).
 * Verifica: 1) selezione di soli loci validi/distinti, 2) ricostruzione cieca dell'ordine 1..N,
 * 3) eventuale domanda di accesso diretto fuori ordine (`spotCheckIndex`).
 */
export function evaluateLociRouteAttempt(params: {
  lessonId: string;
  selectedLocusIdsInOrder: string[];
  blindReconstructedOrderIds: string[];
  spotCheckSelectedId?: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.lociRouteSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  type RawCandidateStop = {
    id: string;
    label: string;
    isValid?: boolean;
    isAmbiguousDistractor?: boolean;
    invalidReason?: string;
    zone?: string;
  };
  const rawCandidates = (spec?.candidates ?? spec?.candidateStops ?? []) as RawCandidateStop[];
  const candidates = rawCandidates.map((c) => ({
    id: c.id,
    label: c.label,
    isValid: typeof c.isValid === "boolean" ? c.isValid : !c.isAmbiguousDistractor,
    invalidReason:
      c.invalidReason ??
      (c.isAmbiguousDistractor ? "Elemento ambiguo o duplicato" : undefined),
    zone: c.zone,
  }));
  const candidateById = Object.fromEntries(candidates.map((c) => [c.id, c]));
  const reqCount =
    spec?.requiredValidCount ?? spec?.expectedOrderedStopIds?.length ?? 5;

  const invalidSelections = params.selectedLocusIdsInOrder.filter(
    (id) => !candidateById[id]?.isValid
  );
  const validUniqueSelections = Array.from(
    new Set(
      params.selectedLocusIdsInOrder.filter((id) => candidateById[id]?.isValid)
    )
  );
  const selectionOk =
    invalidSelections.length === 0 && validUniqueSelections.length === reqCount;

  let exactOrderMatches = 0;
  for (let i = 0; i < reqCount; i += 1) {
    if (
      params.blindReconstructedOrderIds[i] &&
      params.blindReconstructedOrderIds[i] === params.selectedLocusIdsInOrder[i]
    ) {
      exactOrderMatches += 1;
    }
  }
  const blindOrderOk = exactOrderMatches === reqCount;

  const expectedSpotId =
    spec?.spotCheckIndex !== undefined
      ? params.selectedLocusIdsInOrder[spec.spotCheckIndex - 1]
      : undefined;
  const spotCheckOk =
    expectedSpotId === undefined || params.spotCheckSelectedId === expectedSpotId;

  const passedGate =
    params.submittedBeforeReveal && selectionOk && blindOrderOk && spotCheckOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  let errorCat: ErrorDiagnosisCategory | null = null;
  if (!passedGate) {
    errorCat = !selectionOk ? "ambiguous_locus" : "order_omission_inversion";
  }

  const invalidReasons = invalidSelections
    .map((id) => `${candidateById[id]?.label}: ${candidateById[id]?.invalidReason}`)
    .join("; ");

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-loci-route-set-b`,
    submittedAnswer: {
      selectedLocusIdsInOrder: params.selectedLocusIdsInOrder,
      blindReconstructedOrderIds: params.blindReconstructedOrderIds,
      spotCheckSelectedId: params.spotCheckSelectedId,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: reqCount > 0 ? exactOrderMatches / reqCount : 0,
    summaryHeadline: passedGate
      ? `Percorso di ${reqCount} loci distinti e ordine a memoria verificati (${exactOrderMatches}/${reqCount})`
      : !selectionOk
        ? "Attenzione: hai incluso punti ambigui/duplicati o non hai selezionato tutti i loci richiesti"
        : !blindOrderOk
          ? `Ordine a etichette nascoste incompleto (${exactOrderMatches}/${reqCount})`
          : `Accesso diretto al locus #${spec?.spotCheckIndex} non superato`,
    diagnosticFeedback: passedGate
      ? "Hai selezionato solo ancore fisse e non ambigue e ne hai ricostruito l'ordine senza etichette visibili."
      : invalidSelections.length > 0
        ? `Punti scartati perché instabili o duplicati: ${invalidReasons}.`
        : `Ricorda: cliccare i loci non basta; devi ricostruire esattamente la sequenza 1→${reqCount} a etichette nascoste.`,
    errorCategory: errorCat,
    repairAction: errorCat ? ERROR_DIAGNOSIS_CATALOG[errorCat].repairAction : null,
    createdAt: nowIso,
  };
}

/**
 * Valuta `missing_link_diagnosis` (K04).
 */
export function evaluateMissingLinkAttempt(params: {
  lessonId: string;
  omittedWord: string;
  brokenAfterWord: string;
  repairSentence: string;
  reconstructedChain: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.missingLinkSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  const expectedChain = spec?.memorizedChain ?? [];
  const omittedOk =
    normalizeAnswerToken(params.omittedWord) ===
    normalizeAnswerToken(spec?.expectedOmittedWord ?? "");
  const brokenAfterOk =
    normalizeAnswerToken(params.brokenAfterWord) ===
    normalizeAnswerToken(spec?.expectedBrokenAfterWord ?? "");
  const repairOk = params.repairSentence.trim().length >= 8;

  let chainMatches = 0;
  expectedChain.forEach((w, idx) => {
    if (
      normalizeAnswerToken(params.reconstructedChain[idx] ?? "") ===
      normalizeAnswerToken(w)
    ) {
      chainMatches += 1;
    }
  });
  const chainOk =
    expectedChain.length > 0 && chainMatches === expectedChain.length;

  const passedGate =
    params.submittedBeforeReveal &&
    omittedOk &&
    brokenAfterOk &&
    repairOk &&
    chainOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-missing-link-set-b`,
    submittedAnswer: {
      omittedWord: params.omittedWord,
      brokenAfterWord: params.brokenAfterWord,
      repairSentence: params.repairSentence,
      reconstructedChain: params.reconstructedChain,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      expectedChain.length > 0 ? chainMatches / expectedChain.length : 0,
    summaryHeadline: passedGate
      ? `Anello rotto riparato («${spec?.expectedBrokenAfterWord} → ${spec?.expectedOmittedWord}») e catena 7/7 ricostruita`
      : "Diagnosi dell'anello mancante o ricostruzione della catena incompleta",
    diagnosticFeedback: passedGate
      ? "Hai individuato con precisione chirurgica il punto di rottura dopo «sedia», riparato l'anello con «mongolfiera» e ricostruito le 7 voci."
      : `Verifica: elemento omesso atteso = «${spec?.expectedOmittedWord}», rottura subito dopo = «${spec?.expectedBrokenAfterWord}», catena completa = ${expectedChain.join(" → ")}.`,
    errorCategory: passedGate ? null : "order_omission_inversion",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.order_omission_inversion.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `phonetic_word_for_numbers` (N01, Q01).
 */
export function evaluatePhoneticWordForNumbersAttempt(params: {
  lessonId: string;
  wordByNumber: Record<string, string>;
  recalledNumberBySlot?: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.phoneticNumbersSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const targets = spec?.targetNumbers ?? [];
  const minValid = spec?.minValidCount ?? targets.length;

  let validCount = 0;
  const mismatches: string[] = [];

  for (const num of targets) {
    const userWord = (params.wordByNumber[num] ?? "").trim();
    const encoded = encodeItalianWordToMajorDigitsV2(userWord);
    if (userWord.length >= 2 && encoded === num) {
      validCount += 1;
    } else {
      mismatches.push(
        `${num}: «${userWord || "vuoto"}» → produce «${encoded || "—"}» (es. valido: «${spec?.exampleWordsAfterSubmit[num] ?? ""}»)`
      );
    }
  }

  let recallOk = true;
  if (params.recalledNumberBySlot && params.recalledNumberBySlot.length > 0) {
    let recalledCount = 0;
    targets.forEach((num, idx) => {
      if ((params.recalledNumberBySlot?.[idx] ?? "").trim() === num) {
        recalledCount += 1;
      }
    });
    recallOk = recalledCount >= minValid;
  }

  const passedGate =
    params.submittedBeforeReveal && validCount >= minValid && recallOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-phonetic-encode-set-b`,
    submittedAnswer: {
      wordByNumber: params.wordByNumber,
      recalledNumberBySlot: params.recalledNumberBySlot,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: targets.length > 0 ? validCount / targets.length : 0,
    summaryHeadline: passedGate
      ? `Codifica fonetica major-it-v1 superata (${validCount}/${targets.length})`
      : `Codifica fonetica da correggere (${validCount}/${targets.length} valide, richieste almeno ${minValid})`,
    diagnosticFeedback:
      mismatches.length === 0
        ? "Tutte le parole inserite rispettano esattamente il trasduttore fonetico major-it-v1!"
        : `Correzioni fonetiche: ${mismatches.join("; ")}.`,
    errorCategory: passedGate ? null : "phonetic_encoding",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.phonetic_encoding.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `phonetic_decode_words` (N02, N04, Q04).
 * Preserva rigorosamente gli zeri iniziali (`"02"`, `"0"`, `"074"`).
 */
export function evaluatePhoneticDecodeWordsAttempt(params: {
  lessonId: string;
  digitsByWord: Record<string, string>;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.phoneticDecodeSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const words = spec?.words ?? [];
  const expectedDigits = spec?.expectedDigits ?? [];
  const minCorrect = spec?.minCorrectCount ?? words.length;

  let correctCount = 0;
  const errors: string[] = [];

  words.forEach((word, idx) => {
    const exp = expectedDigits[idx] ?? encodeItalianWordToMajorDigitsV2(word);
    const userDigits = (params.digitsByWord[word] ?? "").trim();
    if (userDigits === exp) {
      correctCount += 1;
    } else {
      errors.push(`«${word}» → atteso ${exp} (scritto: ${userDigits || "vuoto"})`);
    }
  });

  const passedGate =
    params.submittedBeforeReveal && correctCount >= minCorrect;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-phonetic-decode-set-b`,
    submittedAnswer: params.digitsByWord,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: words.length > 0 ? correctCount / words.length : 0,
    summaryHeadline: passedGate
      ? `Decodifica Parola → Numero superata (${correctCount}/${words.length})`
      : `Decodifica incompleta (${correctCount}/${words.length}, richieste almeno ${minCorrect})`,
    diagnosticFeedback:
      errors.length === 0
        ? "Tutte le parole sono state decodificate nelle cifre esatte conservando anche gli zeri iniziali!"
        : `Errori fonetici rilevati: ${errors.join("; ")}.`,
    errorCategory: passedGate ? null : "phonetic_encoding",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.phonetic_encoding.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `phonetic_year_blocks` (N03: 1749 e 1926 in due blocchi da 2 cifre).
 */
export function evaluatePhoneticYearBlocksAttempt(params: {
  lessonId: string;
  blocksByCode: Record<string, [string, string]>;
  recalledCodes: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.phoneticBlocksSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const codes = spec?.fourDigitCodes ?? [];

  let validCodesCount = 0;
  const issues: string[] = [];

  codes.forEach((code, idx) => {
    const firstPair = code.slice(0, 2);
    const secondPair = code.slice(2, 4);
    const pairWords = params.blocksByCode[code] ?? ["", ""];
    const d1 = encodeItalianWordToMajorDigitsV2(pairWords[0] ?? "");
    const d2 = encodeItalianWordToMajorDigitsV2(pairWords[1] ?? "");
    const recalled = (params.recalledCodes[idx] ?? "").trim();

    if (d1 === firstPair && d2 === secondPair && recalled === code) {
      validCodesCount += 1;
    } else {
      issues.push(
        `Codice ${code} (${firstPair}+${secondPair}): parole «${pairWords[0] || "—"}» (${d1 || "—"}) + «${pairWords[1] || "—"}» (${d2 || "—"}), richiamo «${recalled || "—"}»`
      );
    }
  });

  const passedGate =
    params.submittedBeforeReveal &&
    codes.length > 0 &&
    validCodesCount === codes.length;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-year-blocks-set-b`,
    submittedAnswer: {
      blocksByCode: params.blocksByCode,
      recalledCodes: params.recalledCodes,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: codes.length > 0 ? validCodesCount / codes.length : 0,
    summaryHeadline: passedGate
      ? `Codici a 4 cifre (${codes.join(", ")}) codificati in blocchi e recuperati`
      : `Blocchi fonetici o recupero da correggere (${validCodesCount}/${codes.length})`,
    diagnosticFeedback:
      issues.length === 0
        ? "Entrambi i codici a 4 cifre sono stati scomposti in due immagini interagenti e decodificati in ordine."
        : `Dettaglio blocchi: ${issues.join("; ")}.`,
    errorCategory: passedGate ? null : "phonetic_encoding",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.phonetic_encoding.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `pao_scene_codec` (Q03: 489270 e 523714 con PAO).
 */
export function evaluatePaoSceneCodecAttempt(params: {
  lessonId: string;
  recalledSixDigitStrings: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.paoSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const targets = spec?.sixDigitTargets ?? [];

  let correctCount = 0;
  targets.forEach((target, idx) => {
    const cleaned = (params.recalledSixDigitStrings[idx] ?? "").replace(/\s+/g, "");
    if (cleaned === target) {
      correctCount += 1;
    }
  });

  const passedGate =
    params.submittedBeforeReveal &&
    targets.length > 0 &&
    correctCount === targets.length;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-pao-set-b`,
    submittedAnswer: params.recalledSixDigitStrings,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: targets.length > 0 ? correctCount / targets.length : 0,
    summaryHeadline: passedGate
      ? `Scene PAO decodificate senza inversioni (${correctCount}/${targets.length})`
      : `Ordine Persona→Azione→Oggetto da verificare (${correctCount}/${targets.length})`,
    diagnosticFeedback: passedGate
      ? "Hai mantenuto la sintassi rigorosa Persona (prime 2 cifre) → Azione (cifre 3–4) → Oggetto (cifre 5–6)."
      : `Atteso: ${targets.join(" e ")}. Controlla di non aver scambiato il codice dell'Azione con quello dell'Oggetto.`,
    errorCategory: passedGate ? null : "order_omission_inversion",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.order_omission_inversion.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `long_number_chunks` (M02: 16 cifre 4892705237148523 in 4 loci).
 */
export function evaluateLongNumberChunksAttempt(params: {
  lessonId: string;
  recalledChunksByLocus: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.longNumberSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const expectedChunks = spec?.chunks ?? [];

  let exactChunks = 0;
  expectedChunks.forEach((chk, idx) => {
    if ((params.recalledChunksByLocus[idx] ?? "").trim() === chk) {
      exactChunks += 1;
    }
  });

  const reconstructedFull = params.recalledChunksByLocus
    .map((c) => c.trim())
    .join("");
  const passedGate =
    params.submittedBeforeReveal &&
    expectedChunks.length > 0 &&
    exactChunks === expectedChunks.length &&
    reconstructedFull === spec?.fullDigits;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-long-digits-set-b`,
    submittedAnswer: params.recalledChunksByLocus,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      expectedChunks.length > 0 ? exactChunks / expectedChunks.length : 0,
    summaryHeadline: passedGate
      ? `Sequenza di 16 cifre ricostruita (${exactChunks}/${expectedChunks.length} loci)`
      : `Blocchi corretti: ${exactChunks}/${expectedChunks.length}`,
    diagnosticFeedback: passedGate
      ? "I 4 loci hanno isolato perfettamente i 4 blocchi da 4 cifre ricostruendo l'intera stringa di 16 cifre."
      : `Blocchi attesi nei 4 loci: ${expectedChunks.join(" · ")}.`,
    errorCategory: passedGate ? null : "phonetic_encoding",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.phonetic_encoding.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `multi_case_classification` (S06, T04, T05, P04, R03, A04).
 */
export function evaluateMultiCaseClassificationAttempt(params: {
  lessonId: string;
  selectedCategoryByCaseId: Record<string, string>;
  selectedFollowUpOptionId?: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.classificationSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const cases = spec?.cases ?? [];

  let correctCases = 0;
  const wrongLabels: string[] = [];

  for (const c of cases) {
    if (params.selectedCategoryByCaseId[c.id] === c.expectedCategory) {
      correctCases += 1;
    } else {
      wrongLabels.push(`${c.stimulus} → atteso «${c.expectedCategory}»`);
    }
  }

  const followUpOk =
    !spec?.followUpQuestion ||
    params.selectedFollowUpOptionId === spec.followUpQuestion.correctOptionId;

  const passedGate =
    params.submittedBeforeReveal &&
    cases.length > 0 &&
    correctCases === cases.length &&
    followUpOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-classification-set-b`,
    submittedAnswer: {
      selectedCategoryByCaseId: params.selectedCategoryByCaseId,
      selectedFollowUpOptionId: params.selectedFollowUpOptionId,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: cases.length > 0 ? correctCases / cases.length : 0,
    summaryHeadline: passedGate
      ? `Classificazione diagnostica perfetta (${correctCases}/${cases.length})`
      : `Classificazione da correggere (${correctCases}/${cases.length} casi corretti)`,
    diagnosticFeedback:
      wrongLabels.length === 0 && followUpOk
        ? "Hai classificato correttamente tutti i casi senza confondere stati o cause d'errore."
        : wrongLabels.length > 0
          ? `Da correggere: ${wrongLabels.join("; ")}.`
          : "I casi sono corretti, ma rivedi la domanda conclusiva di verifica.",
    errorCategory: passedGate ? null : mission?.defaultErrorCategory ?? "wrong_target",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG[mission?.defaultErrorCategory ?? "wrong_target"]
          .repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `numeric_transfer_lab` (R04: legge di Ohm con nuovi numeri + diagnosi).
 */
export function evaluateNumericTransferAttempt(params: {
  lessonId: string;
  numericValue: string;
  selectedUnit: string;
  selectedFollowUpById: Record<string, string>;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.numericTransferSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  const parsed = Number(params.numericValue.trim().replace(",", "."));
  const numberOk =
    !Number.isNaN(parsed) && Math.abs(parsed - (spec?.expectedNumber ?? 24)) < 1e-6;
  const unitOk =
    normalizeAnswerToken(params.selectedUnit) ===
    normalizeAnswerToken(spec?.expectedUnit ?? "V");

  const checks = spec?.followUpChecks ?? [];
  let checksOkCount = 0;
  for (const chk of checks) {
    if (params.selectedFollowUpById[chk.id] === chk.correctOptionId) {
      checksOkCount += 1;
    }
  }
  const allChecksOk = checksOkCount === checks.length;

  const passedGate =
    params.submittedBeforeReveal && numberOk && unitOk && allChecksOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-numeric-transfer-set-b`,
    submittedAnswer: {
      numericValue: params.numericValue,
      selectedUnit: params.selectedUnit,
      selectedFollowUpById: params.selectedFollowUpById,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: passedGate ? 1 : (numberOk ? 0.5 : 0) + (allChecksOk ? 0.4 : 0),
    summaryHeadline: passedGate
      ? `Trasferimento numerico superato (${spec?.expectedNumber} ${spec?.expectedUnit})`
      : "Verifica il calcolo V = R × I, l'unità di misura o la diagnosi dell'errore",
    diagnosticFeedback: passedGate
      ? "Hai applicato la relazione fisica V = R × I a dati nuovi (12 Ω × 2 A = 24 V) distinguendo la formula dall'esempio memorizzato."
      : `Atteso: ${spec?.expectedNumber} ${spec?.expectedUnit} (moltiplicando 12 Ω per 2 A, senza dividere R per I).`,
    errorCategory: passedGate ? null : "source_misconception",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.source_misconception.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `metrics_and_trials_lab` (M01: 4 prove su «cammello, zattera, obelisco, lanterna, clessidra, bussola»).
 */
export function evaluateMetricsAndTrialsAttempt(params: {
  lessonId: string;
  recalledWords: string[];
  selectedDecisionById: Record<string, string>;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.metricsTrialsSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  const targetWords = spec?.activeRecallWords ?? [];
  let exactOrderCount = 0;
  targetWords.forEach((w, idx) => {
    if (
      normalizeAnswerToken(params.recalledWords[idx] ?? "") ===
      normalizeAnswerToken(w)
    ) {
      exactOrderCount += 1;
    }
  });
  const recallOk =
    targetWords.length > 0 && exactOrderCount >= targetWords.length - 1;

  const checks = spec?.decisionChecks ?? [];
  let checksOk = 0;
  for (const chk of checks) {
    if (params.selectedDecisionById[chk.id] === chk.correctOptionId) {
      checksOk += 1;
    }
  }
  const allChecksOk = checksOk === checks.length;

  const passedGate = params.submittedBeforeReveal && recallOk && allChecksOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-metrics-trials-set-b`,
    submittedAnswer: {
      recalledWords: params.recalledWords,
      selectedDecisionById: params.selectedDecisionById,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      targetWords.length > 0 ? exactOrderCount / targetWords.length : 0,
    summaryHeadline: passedGate
      ? `Richiamo (${exactOrderCount}/${targetWords.length}) e analisi delle 4 prove superati`
      : "Completa sia il richiamo della sequenza sia la lettura diagnostica delle 4 prove",
    diagnosticFeedback: passedGate
      ? "Hai separato velocità e precisione individuando la priorità sulle omissioni."
      : `Sequenza: ${exactOrderCount}/${targetWords.length} in ordine; quesiti diagnostici: ${checksOk}/${checks.length}.`,
    errorCategory: passedGate ? null : "order_omission_inversion",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.order_omission_inversion.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `cards_and_names_dual_lab` (M03: 6 carte + 3 profili persona-ruolo-dettaglio).
 */
export function evaluateCardsAndNamesDualAttempt(params: {
  lessonId: string;
  recalledCardsInOrder: string[];
  recalledRoleByPerson: Record<string, string>;
  recalledDetailByPerson: Record<string, string>;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.cardsAndNamesSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();

  const expectedCards = spec?.orderedCards ?? [];
  let cardsCorrect = 0;
  expectedCards.forEach((card, idx) => {
    if (
      normalizeAnswerToken(params.recalledCardsInOrder[idx] ?? "") ===
      normalizeAnswerToken(card)
    ) {
      cardsCorrect += 1;
    }
  });
  const cardsOk =
    expectedCards.length > 0 && cardsCorrect === expectedCards.length;

  const profiles = spec?.profiles ?? [];
  let profilesCorrect = 0;
  for (const prof of profiles) {
    const roleMatch =
      normalizeAnswerToken(params.recalledRoleByPerson[prof.person] ?? "") ===
      normalizeAnswerToken(prof.role);
    const detailMatch =
      normalizeAnswerToken(params.recalledDetailByPerson[prof.person] ?? "") ===
      normalizeAnswerToken(prof.detail);
    if (roleMatch && detailMatch) {
      profilesCorrect += 1;
    }
  }
  const profilesOk =
    profiles.length > 0 && profilesCorrect === profiles.length;

  const passedGate = params.submittedBeforeReveal && cardsOk && profilesOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-cards-names-set-b`,
    submittedAnswer: {
      recalledCardsInOrder: params.recalledCardsInOrder,
      recalledRoleByPerson: params.recalledRoleByPerson,
      recalledDetailByPerson: params.recalledDetailByPerson,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio:
      (cardsCorrect + profilesCorrect) /
      Math.max(1, expectedCards.length + profiles.length),
    summaryHeadline: passedGate
      ? `Sequenza carte (${cardsCorrect}/6) e profili (${profilesCorrect}/3) recuperati`
      : `Carte in ordine: ${cardsCorrect}/6 · Profili completi: ${profilesCorrect}/3`,
    diagnosticFeedback: passedGate
      ? "Hai gestito sia la codifica simbolica ordinata (6 carte) sia l'ancoraggio volto-nome-ruolo-dettaglio."
      : "Verifica l'ordine esatto delle 6 carte e l'abbinamento tra nome, ruolo e dettaglio distintivo.",
    errorCategory: passedGate ? null : "order_omission_inversion",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.order_omission_inversion.repairAction,
    createdAt: nowIso,
  };
}

/**
 * Valuta `source_fact_check_lab` (A01: revisione critica di 3 card AI rispetto al testo fonte).
 */
export function evaluateSourceFactCheckAttempt(params: {
  lessonId: string;
  decisionByCardId: Record<string, "approve" | "reject">;
  selectedCorrectionOptionId: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const mission = ACADEMY_V2_MISSIONS[params.lessonId];
  const spec = mission?.sourceFactCheckSpec;
  const nowIso = params.nowIso ?? new Date().toISOString();
  const cards = spec?.candidateCards ?? [];

  let cardsCorrect = 0;
  for (const c of cards) {
    if (params.decisionByCardId[c.id] === c.expectedDecision) {
      cardsCorrect += 1;
    }
  }
  const allCardsOk = cards.length > 0 && cardsCorrect === cards.length;
  const correctionOk =
    params.selectedCorrectionOptionId === spec?.correctOptionIdForRejected;

  const passedGate =
    params.submittedBeforeReveal && allCardsOk && correctionOk;
  const autonomousMasteryEligible = passedGate && params.hintsUsed === 0;

  return {
    lessonId: params.lessonId,
    lessonVersion: ACADEMY_V2_SCHEMA_VERSION,
    gameId: mission?.gameId ?? `${params.lessonId}-lab-v2`,
    datasetVersion: mission?.datasetVersion ?? ACADEMY_V2_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: `${params.lessonId}-fact-check-set-b`,
    submittedAnswer: {
      decisionByCardId: params.decisionByCardId,
      selectedCorrectionOptionId: params.selectedCorrectionOptionId,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: passedGate,
    verifiedBy: "deterministic",
    autonomousMasteryEligible,
    scoreRatio: cards.length > 0 ? cardsCorrect / cards.length : 0,
    summaryHeadline: passedGate
      ? "Revisione critica della fonte completata: errore AI intercettato e corretto"
      : "Attenzione: una scheda fedele è stata scartata o l'allucinazione AI non è stata corretta",
    diagnosticFeedback: passedGate
      ? "Hai approvato le 2 schede fedeli al testo e sostituito la scheda allucinata («più pesante dell'acqua») con la causa corretta."
      : "Confronta sempre ogni scheda generata dall'AI con il testo fonte: la card 3 afferma il contrario del brano.",
    errorCategory: passedGate ? null : "source_misconception",
    repairAction: passedGate
      ? null
      : ERROR_DIAGNOSIS_CATALOG.source_misconception.repairAction,
    createdAt: nowIso,
  };
}

export const RAW_PLAYER_CONTENT_V2 = playerContentV2;
