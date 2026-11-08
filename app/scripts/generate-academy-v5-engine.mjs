import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const curriculumPath = path.join(__dirname, "../components/webapp/loco-academy-v5-curriculum.json");
const fixturesPath = path.join(__dirname, "../server/data/academy-v5/FLAGSHIP_FIXTURES_PER_REVISIONE.json");
const outputPath = path.join(__dirname, "../components/webapp/loco-academy-engine-v5.ts");

const curriculumData = JSON.parse(fs.readFileSync(curriculumPath, "utf8"));
const fixturesData = JSON.parse(fs.readFileSync(fixturesPath, "utf8")).fixtures;

// Mapping minigames to widgetKind
function getWidgetKind(lesson) {
  const mg = lesson.proposed_minigame;
  const id = lesson.id;
  if (id === "F01") return "ordered_flash_recall";
  if (id === "A03") return "missing_link_diagnosis";
  if (id === "P02" || id === "P03") return "loci_route_and_blind_order";
  if (id === "N03") return "phonetic_word_for_numbers";
  if (id === "S03") return "multi_case_classification";
  if (id === "E01") return "cards_and_names_dual_lab";
  if (id === "C03") return "ordered_flash_recall";

  if (mg === "free_recall" || mg === "chain_builder" || mg === "card_sequence_first" || mg === "card_palace_12") {
    return "ordered_flash_recall";
  }
  if (mg === "scene_forge" || mg === "locus_scene_builder" || mg === "structured_palace") {
    return "builder_then_blind_recall";
  }
  if (
    mg === "substitute_word" ||
    mg === "number_shapes" ||
    mg === "lexicon_matrix" ||
    mg === "surname_bridge" ||
    mg === "future_cue" ||
    mg === "vocab_bridge" ||
    mg === "card_notation" ||
    mg === "card_image_lexicon" ||
    mg === "card_lexicon_editor" ||
    mg === "fact_pair_bridge"
  ) {
    return "pairs_blind_recall";
  }
  if (
    mg === "body_pegs" ||
    mg === "locus_picker" ||
    mg === "route_builder" ||
    mg === "first_room" ||
    mg === "random_access_palace" ||
    mg === "multiroom_path" ||
    mg === "direction_walk" ||
    mg === "speech_palace"
  ) {
    return "loci_route_and_blind_order";
  }
  if (mg === "major_map") return "phonetic_decode_words";
  if (mg === "number_word_forge" || mg === "phoneme_parser") return "phonetic_word_for_numbers";
  if (mg === "year_chunker") return "phonetic_year_blocks";
  if (mg === "pao_grammar") return "pao_scene_codec";
  if (mg === "binary_chunking") return "long_number_chunks";
  if (
    mg === "attention_hunt" ||
    mg === "palace_debugger" ||
    mg === "concept_vs_fact" ||
    mg === "mnemonic_budget"
  ) {
    return "multi_case_classification";
  }
  if (mg === "memory_events") return "metrics_and_trials_lab";
  return "structured_plus_rubric";
}

function getDefaultErrorCategory(lesson) {
  const p = lesson.path;
  const mg = lesson.proposed_minigame;
  if (p === "Numeri" || mg.includes("phoneme") || mg.includes("major")) return "phonetic_encoding";
  if (p === "Palazzi" || mg.includes("locus") || mg.includes("palace") || mg.includes("room")) return "ambiguous_locus";
  if (mg.includes("chain") || mg.includes("order") || mg.includes("sequence")) return "order_omission_inversion";
  if (p === "Studio" || mg.includes("concept") || mg.includes("budget")) return "source_misconception";
  if (mg.includes("cue") || mg.includes("bridge") || mg.includes("forge")) return "weak_cue";
  if (mg.includes("attention") || mg.includes("hunt")) return "attention_reading";
  return "retention_decay";
}

function getAssessmentMode(lesson) {
  const wk = getWidgetKind(lesson);
  if (wk === "ordered_flash_recall" || wk === "pairs_blind_recall") return "deterministic_exact";
  if (wk === "loci_route_and_blind_order") return "deterministic_sequence";
  if (wk === "phonetic_word_for_numbers" || wk === "phonetic_decode_words" || wk === "phonetic_year_blocks") return "phonetic_major_v1";
  if (wk === "builder_then_blind_recall" || wk === "missing_link_diagnosis") return "hybrid_deterministic_and_rubric";
  return "rubric_manual";
}

function getGradingReliability(lesson) {
  const mode = getAssessmentMode(lesson);
  if (mode === "deterministic_exact" || mode === "deterministic_sequence" || mode === "phonetic_major_v1") {
    return "deterministic_verified";
  }
  if (mode === "hybrid_deterministic_and_rubric") return "hybrid_recall_and_rubric";
  return "rubric_guided_self_check";
}

function generateMissions() {
  const missions = {};
  for (const l of curriculumData.lessons) {
    const wk = getWidgetKind(l);
    const mode = getAssessmentMode(l);
    const reliability = getGradingReliability(l);
    const errCat = getDefaultErrorCategory(l);

    let demoQ = `Qual è il principio chiave di questa lezione («${l.title}»)?`;
    let demoOpts = [
      { id: `${l.id}-d1`, label: l.masteryCriterion || "Recupero attivo autentico a stimolo nascosto.", isCorrect: true },
      { id: `${l.id}-d2`, label: `Errore comune: ${l.error_feedback.slice(0, 70)}...`, isCorrect: false },
    ];
    let demoReveal = l.explanation.slice(0, 220);

    // Specific options for flagships
    if (l.id === "F01") {
      demoQ = "Quale differenza misura la prova a lista nascosta rispetto al riconoscimento?";
      demoOpts = [
        { id: "f01-d1", label: "Riconoscere misura la familiarità passiva, produrre da zero misura il recupero effettivo.", isCorrect: true },
        { id: "f01-d2", label: "Riconoscere e produrre misurano esattamente la stessa ritenzione mnemonica.", isCorrect: false },
      ];
      demoReveal = "Riconoscere una tessera con la parola visibile dà familiarità passiva. Scriverla senza guardare richiede un recupero attivo autentico.";
    } else if (l.id === "A03") {
      demoQ = "In quale punto la sequenza iniziale gatto → razzo → sapone → martello si indebolisce?";
      demoOpts = [
        { id: "a03-d1", label: "Tra sapone e martello: sono solo accostati passivamente senza un'azione fisica trasformativa.", isCorrect: true },
        { id: "a03-d2", label: "Tra gatto e razzo, perché il gatto è un essere vivente.", isCorrect: false },
      ];
      demoReveal = "Se due oggetti sono solo accostati, il legame è debole. Un'azione fisica trasformativa ripara la catena.";
    } else if (l.id === "P02") {
      demoQ = "Perché dalla porta si segue una direzione costante (es. sempre in senso orario lungo la parete sinistra)?";
      demoOpts = [
        { id: "p02-d1", label: "Evita salti incrociati e garantisce che nessun locus venga saltato o contato due volte.", isCorrect: true },
        { id: "p02-d2", label: "Perché è l'unica regola ammessa nei campionati mondiali.", isCorrect: false },
      ];
      demoReveal = "Seguire il perimetro in un solo senso impedisce di tagliare diagonalmente la stanza o confondere l'ordine.";
    } else if (l.id === "P03") {
      demoQ = "Qual è il vantaggio dell'accesso casuale a un locus (es. punto 3 o punto 7) senza dover scorrere tutti i precedenti?";
      demoOpts = [
        { id: "p03-d1", label: "Permette l'accesso immediato all'informazione specifica durante l'uso reale.", isCorrect: true },
        { id: "p03-d2", label: "Serve solo per prove di velocità mnemonica.", isCorrect: false },
      ];
      demoReveal = "Un palazzo della memoria maturo non è solo una catena lineare: permette l'accesso diretto a qualsiasi stazione.";
    } else if (l.id === "N03") {
      demoQ = "In «coro» e «cera», qual è la cifra corrispondente alla consonante iniziale C?";
      demoOpts = [
        { id: "n03-d1", label: "«coro» ha C dura /k/ = 7, «cera» ha C dolce /tʃ/ = 6.", isCorrect: true },
        { id: "n03-d2", label: "Entrambe valgono 7 perché la lettera scritta è la stessa.", isCorrect: false },
      ];
      demoReveal = "Nel sistema fonetico major-it-v1 si convertono i suoni consonantici reali, non le lettere grafiche: C dura = 7, C dolce = 6.";
    } else if (l.id === "S03") {
      demoQ = "Quando studi un testo, a quali informazioni devi dedicare il «budget» di immagini mentali?";
      demoOpts = [
        { id: "s03-d1", label: "Ai codici, date e dettagli arbitrari non deducibili con la logica.", isCorrect: true },
        { id: "s03-d2", label: "Ai concetti generali e alle regole di buon senso già comprensibili.", isCorrect: false },
      ];
      demoReveal = "Ciò che puoi capire e dedurre logicamente non spreca budget mnemonico. Dedica immagini vivide solo a codici arbitrari.";
    } else if (l.id === "E01") {
      demoQ = "Qual è il primo errore che porta a dimenticare un nome nei primi cinque secondi?";
      demoOpts = [
        { id: "e01-d1", label: "Non ascoltare davvero il nome perché si è concentrati su cosa dire dopo.", isCorrect: true },
        { id: "e01-d2", label: "Non avere un palazzo della memoria con cento stanze già pronto.", isCorrect: false },
      ];
      demoReveal = "Isola subito il nome sonoro ('Giorgia') e ancoralo a un dettaglio neutro distintivo della persona prima che svanisca.";
    } else if (l.id === "C03") {
      demoQ = "Se ricordi tutte e 5 le carte ma in ordine sparso, hai superato la prova di sequenziamento?";
      demoOpts = [
        { id: "c03-d1", label: "No: per le sequenze di carte, la posizione esatta è vincolante quanto l'identità della carta.", isCorrect: true },
        { id: "c03-d2", label: "Sì, l'ordine non ha importanza in un mazzo.", isCorrect: false },
      ];
      demoReveal = "Nei protocolli per le carte, il richiamo deve rispettare rigorosamente sia il valore che la posizione ordinale.";
    }

    const mission = {
      lessonId: l.id,
      gameId: `${l.id}-lab-v5`,
      datasetVersion: "5.0.0-a",
      assessmentMode: mode,
      gradingReliability: reliability,
      defaultErrorCategory: errCat,
      demonstrationQuestion: demoQ,
      demonstrationOptions: demoOpts,
      demonstrationModelReveal: demoReveal,
      guidedPracticePrompt: l.guided_interaction,
      guidedPracticeTask: {
        kind: "structured_checks",
        checks: [
          {
            id: `${l.id}-gp-check-1`,
            prompt: `Pratica guidata: ${l.guided_interaction.slice(0, 110)}...`,
            options: [
              { id: "ok", label: "Ho completato l'interazione guidata applicando la tecnica" },
              { id: "help", label: "Ho bisogno di rivedere l'esempio guidato" },
            ],
            correctOptionId: "ok",
            explanation: l.worked_example.slice(0, 180),
          },
        ],
      },
      widgetKind: wk,
      independentPrompt: l.independent_challenge,
      progressiveHints: [
        l.error_feedback,
        l.outside_loco || "Rivedi l'esempio guidato per isolare il dettaglio mancante.",
      ],
    };

    // Attach specific specs based on widget kind or fixture
    if (l.id === "F01") {
      mission.orderedFlashSpec = {
        baselineWords: ["elica", "pera", "violino", "foca", "lanterna"],
        targetWords: ["pettine", "zattera", "tulipano", "tamburo", "calamita"],
        hideAfterSeconds: 12,
        minOrderedPassCount: 4,
      };
    } else if (l.id === "A03") {
      mission.missingLinkSpec = {
        memorizedChain: ["gelato", "treno", "cactus", "campana"],
        corruptedRecall: ["gelato", "treno", "cactus"],
        expectedOmittedWord: "campana",
        expectedBrokenAfterWord: "cactus",
      };
    } else if (l.id === "P02") {
      mission.lociRouteSpec = {
        candidateStops: [
          { id: "porta", label: "Porta d'ingresso", isAmbiguousDistractor: false, zone: "Ingresso" },
          { id: "lampada", label: "Lampada da tavolo", isAmbiguousDistractor: false, zone: "Parete sinistra" },
          { id: "libreria", label: "Libreria a parete", isAmbiguousDistractor: false, zone: "Parete sinistra" },
          { id: "finestra", label: "Finestra con vista", isAmbiguousDistractor: false, zone: "Parete frontale" },
          { id: "scrivania", label: "Scrivania da studio", isAmbiguousDistractor: false, zone: "Parete destra" },
          { id: "divano", label: "Divano accogliente", isAmbiguousDistractor: false, zone: "Parete destra" },
        ],
        expectedOrderedStopIds: ["porta", "lampada", "libreria", "finestra", "scrivania", "divano"],
        requiredValidCount: 6,
      };
    } else if (l.id === "P03") {
      mission.lociRouteSpec = {
        candidateStops: [
          { id: "ingresso", label: "Ingresso", isAmbiguousDistractor: false },
          { id: "tappeto", label: "Tappeto", isAmbiguousDistractor: false },
          { id: "scarpiera", label: "Scarpiera", isAmbiguousDistractor: false },
          { id: "attaccapanni", label: "Attaccapanni", isAmbiguousDistractor: false },
          { id: "specchio", label: "Specchio", isAmbiguousDistractor: false },
          { id: "comodino", label: "Comodino", isAmbiguousDistractor: false },
          { id: "finestra", label: "Finestra", isAmbiguousDistractor: false },
          { id: "divano", label: "Divano", isAmbiguousDistractor: false },
        ],
        expectedOrderedStopIds: ["ingresso", "tappeto", "scarpiera", "attaccapanni", "specchio", "comodino", "finestra", "divano"],
        randomAccessProbes: [
          { prompt: "Cosa c'è al punto 3?", expectedAnswer: "scarpiera" },
          { prompt: "Cosa c'è al punto 7?", expectedAnswer: "finestra" },
          { prompt: "Cosa c'è al punto 1?", expectedAnswer: "ingresso" },
        ],
        requiredValidCount: 8,
      };
    } else if (l.id === "N03") {
      mission.phoneticNumbersSpec = {
        targetNumbers: ["74", "64"],
        exampleWordsAfterSubmit: { "74": "coro", "64": "cera" },
        minValidCount: 2,
      };
    } else if (l.id === "S03") {
      mission.classificationSpec = {
        cases: [
          { id: "g1", stimulus: "La molla restituisce energia quando si distende", expectedCategory: "causale" },
          { id: "g2", stimulus: "La navetta fittizia è chiamata Vela-7", expectedCategory: "arbitrario" },
          { id: "g3", stimulus: "La luce intensa aumenta la temperatura di una superficie scura", expectedCategory: "causale" },
          { id: "g4", stimulus: "Il rapporto di prova immaginario porta sigla R-14", expectedCategory: "arbitrario" },
          { id: "g5", stimulus: "I materiali si dividono in due famiglie nella simulazione", expectedCategory: "causale" },
          { id: "g6", stimulus: "Il prototipo inventato è stato inaugurato nel 2037", expectedCategory: "arbitrario" },
        ],
        categories: [
          { id: "causale", label: "Comprensione causale / Deducibile (zero gettoni)" },
          { id: "arbitrario", label: "Dettaglio arbitrario / Codice fragile (assegna gettone)" },
        ],
      };
    } else if (l.id === "E01") {
      mission.cardsAndNamesSpec = {
        namePairs: [{ context: "Orecchino triangolare", name: "Giorgia" }],
        profiles: [{ person: "Giorgia", role: "Partecipante", detail: "Orecchino triangolare" }],
      };
    } else if (l.id === "C03") {
      mission.orderedFlashSpec = {
        targetWords: ["A♠", "7♥", "Q♦", "3♣", "10♠"],
        hideAfterSeconds: 10,
        minOrderedPassCount: 5,
      };
    } else if (wk === "ordered_flash_recall") {
      mission.orderedFlashSpec = {
        targetWords: ["anello", "barca", "castello", "drago", "elmo"],
        hideAfterSeconds: 12,
        minOrderedPassCount: 4,
      };
    } else if (wk === "pairs_blind_recall") {
      mission.pairsRecallSpec = {
        studyPairs: [
          { cue: "chiave", target: "scrigno", contextHint: "rotola nello scrigno" },
          { cue: "faro", target: "balena", contextHint: "illumina la balena" },
          { cue: "aquila", target: "vetta", contextHint: "atterra sulla vetta" },
        ],
        minCorrectCount: 3,
      };
    } else if (wk === "loci_route_and_blind_order") {
      mission.lociRouteSpec = {
        candidateStops: [
          { id: "l1", label: "Porta", isAmbiguousDistractor: false },
          { id: "l2", label: "Scrivania", isAmbiguousDistractor: false },
          { id: "l3", label: "Libreria", isAmbiguousDistractor: false },
          { id: "l4", label: "Finestra", isAmbiguousDistractor: false },
          { id: "l5", label: "Poltrona", isAmbiguousDistractor: false },
        ],
        expectedOrderedStopIds: ["l1", "l2", "l3", "l4", "l5"],
        requiredValidCount: 5,
      };
    } else if (wk === "builder_then_blind_recall") {
      mission.builderRecallSpec = {
        assignments: [
          { locusOrAnchor: "Scrivania", targetToRemember: "clessidra" },
          { locusOrAnchor: "Libreria", targetToRemember: "bussola" },
          { locusOrAnchor: "Finestra", targetToRemember: "aquilone" },
        ],
        minRecalledCount: 3,
      };
    } else if (wk === "phonetic_word_for_numbers") {
      mission.phoneticNumbersSpec = {
        targetNumbers: ["14", "32"],
        exampleWordsAfterSubmit: { "14": "toro", "32": "mano" },
        minValidCount: 2,
      };
    } else if (wk === "phonetic_decode_words") {
      mission.phoneticDecodeSpec = {
        words: ["toro", "mano", "luna"],
        expectedDigits: ["14", "32", "52"],
        minCorrectCount: 3,
      };
    } else if (wk === "phonetic_year_blocks") {
      mission.phoneticBlocksSpec = {
        fourDigitCodes: ["1738"],
        exampleBlocksAfterSubmit: { "1738": ["teca", "muffa"] },
      };
    } else if (wk === "pao_scene_codec") {
      mission.paoSpec = {
        sixDigitTargets: ["143252"],
        targets: [{ digits: "14", person: "Toro", action: "Corre", object: "Luna" }],
      };
    } else if (wk === "long_number_chunks") {
      mission.longNumbersSpec = {
        sequences: ["14325292"],
        expectedPairs: [["14", "32", "52", "92"]],
      };
    } else if (wk === "multi_case_classification") {
      mission.classificationSpec = {
        cases: [
          { id: "c1", stimulus: "Dettaglio A", expectedCategory: "cat_1" },
          { id: "c2", stimulus: "Dettaglio B", expectedCategory: "cat_2" },
        ],
        categories: [
          { id: "cat_1", label: "Categoria 1" },
          { id: "cat_2", label: "Categoria 2" },
        ],
      };
    } else {
      mission.structuredPlusRubricSpec = {
        stimulusText: l.worked_example.slice(0, 160),
        requestedOutput: l.independent_challenge.slice(0, 160),
        structuredChecks: [
          {
            id: `${l.id}-ic-1`,
            prompt: `Verifica della missione: ${l.independent_challenge.slice(0, 100)}...`,
            options: [
              { id: "verified", label: "Ho eseguito la prova verificando il recupero autentico" },
              { id: "partial", label: "Ho completato parzialmente la prova" },
            ],
            correctOptionId: "verified",
            explanation: l.assessment_contract.slice(0, 140),
          },
        ],
        openPromptLabel: "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
        openPromptPlaceholder: "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
        rubricCriteria: [
          "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
          "Ho formulato un indizio/ancora specifico e non invertibile",
          "Ho diagnosticato eventuali punti deboli della codifica",
          "Posso applicare la stessa procedura su materiale nuovo",
        ],
        modelReferenceAfterSubmit: l.assessment_contract,
      };
    }

    missions[l.id] = mission;
  }
  return missions;
}

const missionsObj = generateMissions();

console.log(`Generated missions for ${Object.keys(missionsObj).length} lessons.`);

// Now build the full typescript source for loco-academy-engine-v5.ts
const fileHeader = `/**
 * LOCO Academy 5.0 — Pedagogical Game & Assessment Engine
 *
 * Implements the 48 lessons across 8 learning paths from LOCO Academy V5:
 * - Unità 1: Fondamenta (F01–F05)
 * - Unità 2: Associazioni (A01–A06)
 * - Unità 3: Palazzi (P01–P07)
 * - Unità 4: Numeri (N01–N07)
 * - Unità 5: Vita reale (E01–E06)
 * - Unità 6: Studio (S01–S06)
 * - Unità 7: Carte (C01–C05)
 * - Unità 8: Specializzazioni (X01–X06)
 *
 * Fully deterministic & rubric-honest scoring:
 * 1. Answers remain hidden until a valid attempt is submitted (\`blindBeforeReveal: true\`).
 * 2. Every attempt records \`submittedBeforeReveal\`, \`hintsUsed\`, \`datasetVersion\`,
 *    \`verifiedBy\`, and \`lessonVersion\` ("5.0.0").
 * 3. Revealing the answer or using an answer-revealing hint prevents autonomous mastery.
 * 4. Completing a builder or clicking loci proves construction (\`skill_practiced\`),
 *    NEVER memory recall (\`construction != correct recall\`).
 * 5. Open-ended rubric tasks never grant automatic mastery from non-empty text
 *    (\`verifiedBy: "learner_self_check"\` grants practice credit, not automatic mastery).
 */

import curriculumV5 from "./loco-academy-v5-curriculum.json" with { type: "json" };
import {
  ERROR_DIAGNOSIS_CATALOG,
  MAJOR_IT_V1_VERIFIED_LEXICON_V2,
  encodeItalianWordToMajorDigitsV2,
  normalizeAnswerToken,
  type AssessmentMode,
  type AttemptEvidence,
  type ErrorDiagnosisCategory,
  type ErrorDiagnosisInfo,
  type LessonGradingReliability,
  type StructuredCheckQuestion,
  type V2ChallengeWidgetKind,
  type V2LessonMissionSpec,
  type VerificationAuthority,
  evaluateBuilderThenBlindRecallAttempt,
  evaluateCardsAndNamesDualAttempt,
  evaluateLociRouteAttempt,
  evaluateLongNumberChunksAttempt,
  evaluateMetricsAndTrialsAttempt,
  evaluateMissingLinkAttempt,
  evaluateMultiCaseClassificationAttempt,
  evaluateNumericTransferAttempt,
  evaluateOrderedWordsAttempt,
  evaluatePairsBlindRecallAttempt,
  evaluatePaoSceneCodecAttempt,
  evaluatePhoneticDecodeWordsAttempt,
  evaluatePhoneticWordForNumbersAttempt,
  evaluatePhoneticYearBlocksAttempt,
  evaluateSourceFactCheckAttempt,
  evaluateStructuredPlusRubricAttempt,
  evaluateUnorderedWordsAttempt,
} from "./loco-academy-engine-v2.ts";

export const ACADEMY_V5_SCHEMA_VERSION = "5.0.0";
export const ACADEMY_V5_DEFAULT_DATASET_VERSION = "5.0.0-a";

export {
  ERROR_DIAGNOSIS_CATALOG,
  MAJOR_IT_V1_VERIFIED_LEXICON_V2,
  encodeItalianWordToMajorDigitsV2,
  normalizeAnswerToken,
  type AssessmentMode,
  type AttemptEvidence,
  type ErrorDiagnosisCategory,
  type ErrorDiagnosisInfo,
  type LessonGradingReliability,
  type StructuredCheckQuestion,
  type V2ChallengeWidgetKind,
  type V2LessonMissionSpec,
  type VerificationAuthority,
  evaluateBuilderThenBlindRecallAttempt,
  evaluateCardsAndNamesDualAttempt,
  evaluateLociRouteAttempt,
  evaluateLongNumberChunksAttempt,
  evaluateMetricsAndTrialsAttempt,
  evaluateMissingLinkAttempt,
  evaluateMultiCaseClassificationAttempt,
  evaluateNumericTransferAttempt,
  evaluateOrderedWordsAttempt,
  evaluatePairsBlindRecallAttempt,
  evaluatePaoSceneCodecAttempt,
  evaluatePhoneticDecodeWordsAttempt,
  evaluatePhoneticWordForNumbersAttempt,
  evaluatePhoneticYearBlocksAttempt,
  evaluateSourceFactCheckAttempt,
  evaluateStructuredPlusRubricAttempt,
  evaluateUnorderedWordsAttempt,
};

/* =========================================================================
   FLAGSHIP FIXTURES FOR ACADEMY V5 (Exact specification from revision)
   ========================================================================= */

export const FLAGSHIP_FIXTURES_V5 = ${JSON.stringify(fixturesData, null, 2)};

/* =========================================================================
   FLAGSHIP EVALUATORS FOR ACADEMY V5
   ========================================================================= */

/**
 * 1. F01: Memory Experiment (Free Recall)
 * Confronta studio guidato (5 parole) con studio indipendente (5 parole).
 * Normalizza token, riporta quantita e ordine separatamente; nessuna penalita morale.
 */
export function evaluateMemoryExperimentF01(params: {
  submittedWords: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence & {
  recalledCount: number;
  totalTargetCount: number;
  orderCorrectCount: number;
} {
  const targetWords = FLAGSHIP_FIXTURES_V5.F01.independent_study;
  const normalizedTargets = targetWords.map(normalizeAnswerToken);
  const normalizedSubmitted = params.submittedWords.map(normalizeAnswerToken);

  let recalledCount = 0;
  let orderCorrectCount = 0;

  for (let i = 0; i < normalizedSubmitted.length; i++) {
    const word = normalizedSubmitted[i];
    if (!word) continue;
    if (normalizedTargets.includes(word)) {
      recalledCount++;
    }
    if (i < normalizedTargets.length && word === normalizedTargets[i]) {
      orderCorrectCount++;
    }
  }

  const isPassing = recalledCount >= 4;
  const autonomous = isPassing && params.submittedBeforeReveal && params.hintsUsed === 0;
  const scoreRatio = Math.min(1, recalledCount / targetWords.length);

  return {
    lessonId: "F01",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "F01-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "f01-set-b",
    submittedAnswer: params.submittedWords,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct: isPassing,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Richiamo assistito: soluzione consultata prima dell'invio"
      : isPassing
        ? \`Recupero completato: \${recalledCount}/\${targetWords.length} elementi (\${orderCorrectCount} in ordine esatto)\`
        : \`Recupero parziale: \${recalledCount}/\${targetWords.length} elementi\`,
    diagnosticFeedback: isPassing
      ? "Hai dimostrato la differenza reale tra riconoscimento e recupero attivo senza opzioni."
      : "Non rileggere subito: crea un indizio concreto per ogni elemento e ripeti la prova.",
    errorCategory: isPassing ? null : "attention_reading",
    repairAction: isPassing
      ? null
      : "Chiudi la pagina e prova a spiegare i punti senza guardare prima di riaprire.",
    createdAt: params.nowIso ?? new Date().toISOString(),
    recalledCount,
    totalTargetCount: targetWords.length,
    orderCorrectCount,
  };
}

/**
 * 2. A03: Chain Repair (Dove si spezza il film?)
 * Diagnosi dell'anello debole + riparazione con verbo attivo + recall catena completa.
 */
export function evaluateChainRepairA03(params: {
  selectedWeakEdgeIndex: number; // expected: 2 (cactus -> campana)
  repairActionText: string;
  recalledWords: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const targetChain = FLAGSHIP_FIXTURES_V5.A03.independent_chain;
  const expectedEdge = 2; // cactus -> campana

  const edgeCorrect = params.selectedWeakEdgeIndex === expectedEdge;
  const normRepair = params.repairActionText.trim().toLowerCase();
  const hasActiveVerb =
    normRepair.length >= 8 &&
    /\\b(lancia|spine|suona|colpisce|frantuma|esplode|spezza|martella|incastra|scaglia|infila|sbatte|tocca|strappa|buca)\\b/.test(
      normRepair
    );

  const normTarget = targetChain.map(normalizeAnswerToken);
  const normRecalled = params.recalledWords.map(normalizeAnswerToken);
  const wordsCorrect =
    normRecalled.length === normTarget.length &&
    normRecalled.every((w, i) => w === normTarget[i]);

  const correct = edgeCorrect && (hasActiveVerb || normRepair.length >= 15) && wordsCorrect;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "A03",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "A03-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "a03-independent-chain",
    submittedAnswer: {
      selectedWeakEdgeIndex: params.selectedWeakEdgeIndex,
      repairActionText: params.repairActionText,
      recalledWords: params.recalledWords,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: correct ? 1 : edgeCorrect ? 0.5 : 0.2,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Diagnosi assistita: risposta consultata prima dell'invio"
      : correct
        ? "Anello debole individuato e catena riparata con successo!"
        : !edgeCorrect
          ? "L'anello debole individuato non era quello guasto"
          : !wordsCorrect
            ? "Catena non ricostruita nell'ordine esatto"
            : "La riparazione necessita di un'azione fisica più vivida",
    diagnosticFeedback: correct
      ? "Hai individuato il legame statico tra cactus e campana, inserito un'azione trasformativa e richiamato l'intera sequenza."
      : "L'anello debole era il passaggio 2 (cactus e campana solo accostati passivamente). Usa un verbo d'azione concreto.",
    errorCategory: correct ? null : "weak_cue",
    repairAction: correct
      ? null
      : "Collega il terzo e quarto elemento con un verbo d'azione (es. 'le spine del cactus trafiggono la campana facendola rintoccare').",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 3. P02: Floorplan Route (Dalla porta, gira sempre uguale)
 * Rotta coerente dalla porta in senso orario / parete sinistra, e recupero nomi loci a mappa nascosta.
 */
export function evaluateFloorplanRouteP02(params: {
  orderedLociIds: string[];
  blindRecalledNames: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const expectedRoute = FLAGSHIP_FIXTURES_V5.P02.guided_route;
  const normExpected = expectedRoute.map(normalizeAnswerToken);
  const normSubmitted = params.orderedLociIds.map(normalizeAnswerToken);
  const normBlind = params.blindRecalledNames.map(normalizeAnswerToken);

  const routeOk =
    normSubmitted.length === normExpected.length &&
    normSubmitted.every((id, idx) => id === normExpected[idx]);

  const blindOk =
    normBlind.length === normExpected.length &&
    normBlind.every((name, idx) => name === normExpected[idx]);

  const correct = routeOk && blindOk;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "P02",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "P02-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "p02-route-plan",
    submittedAnswer: {
      orderedLociIds: params.orderedLociIds,
      blindRecalledNames: params.blindRecalledNames,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: correct ? 1 : routeOk ? 0.6 : 0.2,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Percorso assistito: mappa consultata prima dell'invio"
      : correct
        ? "Rotta circolare coerente e richiamo a mappa nascosta superato!"
        : "La rotta presenta salti o il richiamo cieco non corrisponde",
    diagnosticFeedback: correct
      ? "Hai percorso tutti i loci dalla porta in senso orario senza salti incrociati e li hai richiamati a memoria."
      : "Ricorda la regola fondamentale: dalla porta, inizia dalla parete sinistra e prosegui sempre nello stesso senso.",
    errorCategory: correct ? null : "ambiguous_locus",
    repairAction: correct
      ? null
      : "Evita di attraversare diagonalmente la stanza: segui il perimetro delle pareti con ordine continuo.",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 4. P03: Custom Loci (Otto punti, una stanza)
 * Verifica rotta da 8 punti e accesso casuale mirato alle posizioni 3, 7 e 1.
 */
export function evaluateCustomLociP03(params: {
  savedRouteLoci: string[];
  recalledLociInOrder: string[];
  probeAnswers: { probePosition: number; answerLocus: string }[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const normSaved = (
    params.savedRouteLoci.length >= 8
      ? params.savedRouteLoci
      : FLAGSHIP_FIXTURES_V5.P03.demo_room
  ).map(normalizeAnswerToken);

  const normRecalled = params.recalledLociInOrder.map(normalizeAnswerToken);

  let sequenceMatchCount = 0;
  for (let i = 0; i < Math.min(normSaved.length, normRecalled.length); i++) {
    if (normSaved[i] === normRecalled[i]) sequenceMatchCount++;
  }
  const sequenceOk = sequenceMatchCount >= 7;

  let probesOk = true;
  for (const probe of params.probeAnswers) {
    const expected = normSaved[probe.probePosition - 1];
    const actual = normalizeAnswerToken(probe.answerLocus);
    if (!expected || actual !== expected) {
      probesOk = false;
      break;
    }
  }

  const correct = sequenceOk && probesOk;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "P03",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "P03-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "p03-custom-room",
    submittedAnswer: {
      recalledLociInOrder: params.recalledLociInOrder,
      probeAnswers: params.probeAnswers,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: correct ? 1 : sequenceOk ? 0.6 : 0.2,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Verifica assistita: percorso consultato prima dell'invio"
      : correct
        ? "Stanza da 8 punti e accesso casuale (3, 7, 1) verificati!"
        : "La sequenza di loci o le risposte di accesso casuale contengono errori",
    diagnosticFeedback: correct
      ? "Hai dimostrato sia il recupero ordinato degli 8 punti sia l'accesso diretto ai punti 3, 7 e 1."
      : "Se confondi i punti o esiti sull'accesso casuale, rinforza i numeri ordinali associati a ciascun locus.",
    errorCategory: correct ? null : "ambiguous_locus",
    repairAction: correct
      ? null
      : "Pensa ad ogni locus associato al suo numero: punto 1 (porta/ingresso), punto 3 (scarpiera), punto 7 (finestra).",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 5. N03: Italian Major Phoneme (Una lettera non e sempre un suono)
 * Verifica C dura (/k/=7) vs C dolce (/tʃ/=6): coro=74, cera=64.
 */
export function evaluateItalianMajorPhonemeN03(params: {
  codeCoro: string;
  codeCera: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const coroOk = params.codeCoro.trim() === "74";
  const ceraOk = params.codeCera.trim() === "64";
  const correct = coroOk && ceraOk;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "N03",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "N03-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "n03-coro-cera",
    submittedAnswer: { codeCoro: params.codeCoro, codeCera: params.codeCera },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: correct ? 1 : coroOk || ceraOk ? 0.5 : 0,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Conversione assistita: risposta consultata prima dell'invio"
      : correct
        ? "Distinzione fonetica esatta: coro = 74, cera = 64"
        : "Errore di conversione fonetica tra C dura e C dolce",
    diagnosticFeedback: correct
      ? "Hai applicato la regola major-it-v1: «coro» ha C dura /k/ = 7 (R=4 -> 74); «cera» ha C dolce /tʃ/ = 6 (R=4 -> 64)."
      : "Attenzione: non guardare la lettera scritta, ma il suono! C dura (davanti ad A, O, U) vale 7; C dolce (davanti ad E, I) vale 6.",
    errorCategory: correct ? null : "phonetic_encoding",
    repairAction: correct
      ? null
      : "Pronuncia la parola: se il suono e duro come in 'casa' vale 7; se e dolce come in 'ciao' vale 6.",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 6. S03: Mnemonic Budget (Il budget delle immagini)
 * 3 gettoni su 6 fatti: premia l'allocazione su dati arbitrari (g2, g4, g6) rispetto a fatti causali deducibili.
 */
export function evaluateMnemonicBudgetS03(params: {
  allocatedItemIds: string[];
  justificationText?: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const arbitraryIds = new Set(["g2", "g4", "g6"]);
  const allocated = params.allocatedItemIds;

  let arbitrarySpentCount = 0;
  for (const id of allocated) {
    if (arbitraryIds.has(id)) arbitrarySpentCount++;
  }

  const budgetRespected = allocated.length <= 3 && allocated.length >= 2;
  const efficientAllocation = arbitrarySpentCount >= 2;
  const correct = budgetRespected && efficientAllocation;

  return {
    lessonId: "S03",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "S03-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "s03-budget-6-items",
    submittedAnswer: {
      allocatedItemIds: params.allocatedItemIds,
      justificationText: params.justificationText,
    },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "learner_self_check",
    autonomousMasteryEligible: false, // Honesty: rubric self-check grants practice credit
    scoreRatio: correct ? 1 : 0.5,
    summaryHeadline: correct
      ? \`Budget mnemonico ottimizzato (\${arbitrarySpentCount}/3 gettoni su dettagli arbitrari)\`
      : "Allocazione del budget migliorabile",
    diagnosticFeedback: correct
      ? "Hai riservato i gettoni ai dettagli arbitrari impossibili da dedurre (Vela-7, R-14, 2037), lasciando i concetti causali alla comprensione logica."
      : "Non sprecare immagini mentali su principi fisici che puoi dedurre. Riserva i gettoni a sigle, nomi inventati e date.",
    errorCategory: correct ? null : "source_misconception",
    repairAction: correct
      ? null
      : "Chiediti prima: 'Posso dedurre questa informazione ragionando?' Se si, non sprecare budget mnemonico.",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 7. E01: Face & Name (Il nome nei primi cinque secondi)
 * Volto fittizio di Giorgia con orecchino triangolare.
 */
export function evaluateFaceNameE01(params: {
  recalledName: string;
  selectedCue?: string;
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const normExpected = normalizeAnswerToken(FLAGSHIP_FIXTURES_V5.E01.independent_display_name);
  const normActual = normalizeAnswerToken(params.recalledName);
  const correct = normActual === normExpected;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "E01",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "E01-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "e01-portrait-giorgia",
    submittedAnswer: { recalledName: params.recalledName, selectedCue: params.selectedCue },
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: correct ? 1 : 0,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Richiamo assistito: nome consultato prima dell'invio"
      : correct
        ? "Nome 'Giorgia' recuperato correttamente dal volto!"
        : "Nome non recuperato o non corrispondente",
    diagnosticFeedback: correct
      ? "Hai ancorato il nome Giorgia al tratto distintivo neutro (l'orecchino) nei primi secondi critici."
      : "Se hai confuso il nome con un altro (es. Giulia o Marta), il ponte fonetico era troppo vago.",
    errorCategory: correct ? null : "weak_cue",
    repairAction: correct
      ? null
      : "Nei primi 5 secondi ripeti mentalmente il nome esatto e collegalo visivamente a un dettaglio del volto.",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/**
 * 8. C03: Ordered Cards (Cinque carte, cinque eventi)
 * Sequenza esatta: A♠, 7♥, Q♦, 3♣, 10♠.
 */
export function evaluateOrderedCardsC03(params: {
  submittedCards: string[];
  submittedBeforeReveal: boolean;
  hintsUsed: number;
  nowIso?: string;
}): AttemptEvidence {
  const targetCards = FLAGSHIP_FIXTURES_V5.C03.example_study;
  const normExpected = targetCards.map((c: string) => c.trim().toLowerCase());
  const normActual = params.submittedCards.map((c: string) => c.trim().toLowerCase());

  let exactMatches = 0;
  for (let i = 0; i < Math.min(normExpected.length, normActual.length); i++) {
    if (normExpected[i] === normActual[i]) exactMatches++;
  }

  const correct = exactMatches === targetCards.length;
  const autonomous = correct && params.submittedBeforeReveal && params.hintsUsed === 0;

  return {
    lessonId: "C03",
    lessonVersion: ACADEMY_V5_SCHEMA_VERSION,
    gameId: "C03-lab-v5",
    datasetVersion: ACADEMY_V5_DEFAULT_DATASET_VERSION,
    stageType: "independent_challenge",
    presentedStimulusId: "c03-5-cards",
    submittedAnswer: params.submittedCards,
    submittedBeforeReveal: params.submittedBeforeReveal,
    hintsUsed: params.hintsUsed,
    correct,
    verifiedBy: "deterministic",
    autonomousMasteryEligible: autonomous,
    scoreRatio: exactMatches / targetCards.length,
    summaryHeadline: !params.submittedBeforeReveal
      ? "Sequenza assistita: carte consultate prima dell'invio"
      : correct
        ? \`Sequenza di 5 carte ricostruita esattamente (\${exactMatches}/5)!\`
        : \`Sequenza parziale: \${exactMatches}/5 carte nella posizione corretta\`,
    diagnosticFeedback: correct
      ? "Hai ricostruito tutte e 5 le carte rispettando sia l'identità che la posizione ordinale esatta."
      : "Nelle carte, l'ordine e vincolante. Se hai invertito due carte, rafforza il legame sequenziale tra le scene.",
    errorCategory: correct ? null : "order_omission_inversion",
    repairAction: correct
      ? null
      : "Collega ogni carta alla successiva con un'azione di contatto, oppure assegna ciascuna a un locus numerato.",
    createdAt: params.nowIso ?? new Date().toISOString(),
  };
}

/* =========================================================================
   ACADEMY V5 MISSIONS DICTIONARY (48 Lessons across 8 units)
   ========================================================================= */

export const ACADEMY_V5_MISSIONS: Record<string, V2LessonMissionSpec> = ${JSON.stringify(missionsObj, null, 2)};

// Backward compatibility alias
export const ACADEMY_V2_MISSIONS = ACADEMY_V5_MISSIONS;
export const RAW_PLAYER_CONTENT_V2 = {
  version: ACADEMY_V5_SCHEMA_VERSION,
  lessons: curriculumV5.lessons.map((l) => ({
    id: l.id,
    courseId: \`course-\${l.path.toLowerCase().replace(/\\s+/g, "-")}\`,
    courseName: l.path,
    title: l.title,
    tier: l.access === "base" ? "free" : "plus",
    estimatedMinutes: 4,
    prerequisites: l.recommended_prerequisites,
    contentVersion: ACADEMY_V5_SCHEMA_VERSION,
    learningObjective: l.assessment_contract,
    masteryCriterion: l.assessment_contract,
    masteryGate: l.assessment_contract,
    commonMistake: l.error_feedback,
    commonMistakes: [l.error_feedback],
    steps: l.screens.map((s, idx) => ({
      stepId: \`\${l.id}-step-\${idx + 1}\`,
      type: s.kind === "guided_interaction" ? "guided_practice" : s.kind === "worked_example" ? "demonstration" : s.kind === "error_feedback" ? "diagnostic_feedback" : s.kind,
      title: s.label,
      body: s.text,
      prompt: s.text,
    })),
  })),
};
`;

fs.writeFileSync(outputPath, fileHeader, "utf8");
console.log(`Successfully generated ${outputPath}!`);
