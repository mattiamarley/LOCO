/**
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
 * 1. Answers remain hidden until a valid attempt is submitted (`blindBeforeReveal: true`).
 * 2. Every attempt records `submittedBeforeReveal`, `hintsUsed`, `datasetVersion`,
 *    `verifiedBy`, and `lessonVersion` ("5.0.0").
 * 3. Revealing the answer or using an answer-revealing hint prevents autonomous mastery.
 * 4. Completing a builder or clicking loci proves construction (`skill_practiced`),
 *    NEVER memory recall (`construction != correct recall`).
 * 5. Open-ended rubric tasks never grant automatic mastery from non-empty text
 *    (`verifiedBy: "learner_self_check"` grants practice credit, not automatic mastery).
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

export const FLAGSHIP_FIXTURES_V5 = {
  "F01": {
    "type": "memory_experiment",
    "guided_study": [
      "elica",
      "pera",
      "violino",
      "foca",
      "lanterna"
    ],
    "independent_study": [
      "pettine",
      "zattera",
      "tulipano",
      "tamburo",
      "calamita"
    ],
    "distractors": [
      "granchio",
      "pianola",
      "cascata",
      "candela",
      "matita"
    ],
    "validation": "exact_token_recall_and_order",
    "hidden_during": "independent_recall"
  },
  "A03": {
    "type": "chain_repair",
    "guided_chain": [
      "gatto",
      "razzo",
      "sapone",
      "martello"
    ],
    "guided_weak_edge_index": 2,
    "guided_fix_example": "un martello frantuma la saponetta",
    "independent_chain": [
      "gelato",
      "treno",
      "cactus",
      "campana"
    ],
    "independent_flaw_description": "cactus e campana appaiono semplicemente vicini, senza azione",
    "validation": "detect_edge+repair+free_recall"
  },
  "P02": {
    "type": "floorplan_route",
    "map_setup": "porta in basso al centro; lampada in basso a sinistra; libreria a sinistra; finestra in alto; scrivania in alto a destra; divano in basso a destra",
    "guided_route": [
      "porta",
      "lampada",
      "libreria",
      "finestra",
      "scrivania",
      "divano"
    ],
    "convention": "dalla porta, inizia dalla parete sinistra, prosegui sempre nello stesso senso",
    "allow_equivalent_valid_routes": true,
    "blind_test": "recover_locus_names_without_map"
  },
  "P03": {
    "type": "custom_loci",
    "demo_room": [
      "ingresso",
      "tappeto",
      "scarpiera",
      "attaccapanni",
      "specchio",
      "comodino",
      "finestra",
      "divano"
    ],
    "must_match_asset_geometry": true,
    "target_loci_count": 8,
    "independent_test": "recall_all_in_order_and_positions_3_7_1",
    "validator": "compare_to_users_own_saved_route"
  },
  "N03": {
    "type": "italian_major_phoneme",
    "supported_dictionary": {
      "giro": "64",
      "gara": "74",
      "cera": "64",
      "cara": "74",
      "coro": "74"
    },
    "independent_stimuli": [
      "coro",
      "cera"
    ],
    "answers": {
      "coro": "74",
      "cera": "64"
    },
    "unsupported": "do not automatically validate gn gli sc double-consonant ambiguities without tested parser"
  },
  "S03": {
    "type": "mnemonic_budget",
    "number_of_tokens": 3,
    "guided_items": [
      {
        "id": "g1",
        "kind": "causal",
        "text": "La molla restituisce energia quando si distende"
      },
      {
        "id": "g2",
        "kind": "arbitrary",
        "text": "La navetta fittizia è chiamata Vela-7"
      },
      {
        "id": "g3",
        "kind": "causal",
        "text": "La luce intensa aumenta la temperatura di una superficie scura"
      },
      {
        "id": "g4",
        "kind": "arbitrary",
        "text": "Il rapporto di prova immaginario porta sigla R-14"
      },
      {
        "id": "g5",
        "kind": "classification",
        "text": "I materiali si dividono in due famiglie nella simulazione"
      },
      {
        "id": "g6",
        "kind": "arbitrary",
        "text": "Il prototipo inventato è stato inaugurato nel 2037"
      }
    ],
    "evaluation": "human_or_rubric_with_reasoned_alternatives; no single arbitrary answer"
  },
  "C03": {
    "type": "ordered_cards",
    "example_study": [
      "A♠",
      "7♥",
      "Q♦",
      "3♣",
      "10♠"
    ],
    "draw_constraint": "independent deck draws only from user verified distinct codes; if fewer than 5, return to C02",
    "study_seconds_default": 10,
    "user_can_adjust_time": true,
    "recall_input": "free notation or entire 52-card shuffled deck, never only the 5 targets",
    "evaluation": "exact_card_and_exact_position"
  },
  "E01": {
    "type": "face_name",
    "fictional_portrait": {
      "asset_id": "fictional-portrait-giorgia",
      "display_name": "Giorgia",
      "distinctive_neutral_feature": "orecchino triangolare"
    },
    "independent_display_name": "Giorgia",
    "hidden_during": "name_recall",
    "evaluation": "exact_name_normalized; reveal marks practice-assisted"
  }
};

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
        ? `Recupero completato: ${recalledCount}/${targetWords.length} elementi (${orderCorrectCount} in ordine esatto)`
        : `Recupero parziale: ${recalledCount}/${targetWords.length} elementi`,
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
    /\b(lancia|spine|suona|colpisce|frantuma|esplode|spezza|martella|incastra|scaglia|infila|sbatte|tocca|strappa|buca)\b/.test(
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
      ? `Budget mnemonico ottimizzato (${arbitrarySpentCount}/3 gettoni su dettagli arbitrari)`
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
        ? `Sequenza di 5 carte ricostruita esattamente (${exactMatches}/5)!`
        : `Sequenza parziale: ${exactMatches}/5 carte nella posizione corretta`,
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

export const ACADEMY_V5_MISSIONS: Record<string, V2LessonMissionSpec> = {
  "F01": {
    "lessonId": "F01",
    "gameId": "F01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Quale differenza misura la prova a lista nascosta rispetto al riconoscimento?",
    "demonstrationOptions": [
      {
        "id": "f01-d1",
        "label": "Riconoscere misura la familiarità passiva, produrre da zero misura il recupero effettivo.",
        "isCorrect": true
      },
      {
        "id": "f01-d2",
        "label": "Riconoscere e produrre misurano esattamente la stessa ritenzione mnemonica.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Riconoscere una tessera con la parola visibile dà familiarità passiva. Scriverla senza guardare richiede un recupero attivo autentico.",
    "guidedPracticePrompt": "Premi «Ho finito di osservare». La lista si oscura. Digita ciò che ricordi: ogni casella accetta una parola. Se non ricordi un elemento, lascia vuoto; evita suggerimenti.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "F01-gp-check-1",
          "prompt": "Pratica guidata: Premi «Ho finito di osservare». La lista si oscura. Digita ciò che ricordi: ogni casella accetta una parola. S...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Prima sequenza: elica, pera, violino, foca, lanterna. Osservala; dopo la scomparsa scrivi ciò che recuperi, anche fuori ordine. Poi riconosci gli stessi elementi tra dieci tessere:"
        }
      ]
    },
    "widgetKind": "ordered_flash_recall",
    "independentPrompt": "Nuova sequenza mai mostrata: pettine, zattera, tulipano, tamburo, calamita. Dopo dodici secondi, recupera gli elementi senza opzioni e senza vedere il testo iniziale.",
    "progressiveHints": [
      "Hai riconosciuto più oggetti di quanti ne hai prodotti? È un risultato normale. Non rileggere subito: prova a creare un indizio concreto e ripeti con elementi diversi.",
      "Alla prossima pagina di studio, chiudila e prova a spiegare un punto senza guardare."
    ],
    "orderedFlashSpec": {
      "baselineWords": [
        "elica",
        "pera",
        "violino",
        "foca",
        "lanterna"
      ],
      "targetWords": [
        "pettine",
        "zattera",
        "tulipano",
        "tamburo",
        "calamita"
      ],
      "hideAfterSeconds": 12,
      "minOrderedPassCount": 4
    }
  },
  "F02": {
    "lessonId": "F02",
    "gameId": "F02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "attention_reading",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Guarda dove conta»)?",
    "demonstrationOptions": [
      {
        "id": "F02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "F02-d2",
        "label": "Errore comune: Se ricordi lo sfondo ma non il bersaglio, la prossima volta traduci su...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Notare non significa fotografare ogni dettaglio. Prima di guardare una scena, scegli quale informazione conta: posizione, colore, forma, relazione o sequenza. Quando cerchi un nome, per esempio, può servirti un tratto de",
    "guidedPracticePrompt": "Cerca tre oggetti indicati nella piantina e poi selezionali sulla stessa scena senza etichette.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "F02-gp-check-1",
          "prompt": "Pratica guidata: Cerca tre oggetti indicati nella piantina e poi selezionali sulla stessa scena senza etichette....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Nella stanza illustrata c'è una pianta sul tavolo, una tazza vicino alla finestra e un libro sotto la lampada. Se sai che dovrai ricordare un oggetto vicino alla finestra, la tazza"
        }
      ]
    },
    "widgetKind": "multi_case_classification",
    "independentPrompt": "La seconda stanza contiene sette elementi. Prima appare «ricorda cosa sta alla sinistra della libreria»; poi il disegno sparisce e scegli la posizione su una griglia vuota.",
    "progressiveHints": [
      "Se ricordi lo sfondo ma non il bersaglio, la prossima volta traduci subito la consegna in una domanda: «Che cosa devo ritrovare?».",
      "Quando appoggi le chiavi, nota posizione e rapporto con un oggetto fisso; non limitarti a guardarle."
    ],
    "classificationSpec": {
      "cases": [
        {
          "id": "c1",
          "stimulus": "Dettaglio A",
          "expectedCategory": "cat_1"
        },
        {
          "id": "c2",
          "stimulus": "Dettaglio B",
          "expectedCategory": "cat_2"
        }
      ],
      "categories": [
        {
          "id": "cat_1",
          "label": "Categoria 1"
        },
        {
          "id": "cat_2",
          "label": "Categoria 2"
        }
      ]
    }
  },
  "F03": {
    "lessonId": "F03",
    "gameId": "F03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Immagini che mordono»)?",
    "demonstrationOptions": [
      {
        "id": "F03-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "F03-d2",
        "label": "Errore comune: «Fantastico» non basta. Se recuperi «pioggia» invece di «ombrello», il...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Una buona associazione non è semplicemente assurda. Deve contenere l'informazione che vuoi recuperare, avere un'azione fisica riconoscibile e lasciare pochi dubbi sulla risposta. L'enormità e il movimento sono strumenti,",
    "guidedPracticePrompt": "Trascina le leve «scala», «azione», «interazione» su un'immagine neutra per mostrare come diventa più precisa.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "F03-gp-check-1",
          "prompt": "Pratica guidata: Trascina le leve «scala», «azione», «interazione» su un'immagine neutra per mostrare come diventa più precisa....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Porta + limone. Scena A: porta gialla. Scena B: limone sullo zerbino. Scena C: un limone enorme blocca la serratura e spruzza succo acido quando giri la chiave. C ha una relazione "
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Con nuovo bersaglio «ombrello» e locus «frigorifero», scegli due trasformazioni, poi nascondi e scrivi il bersaglio evocato dalla scena.",
    "progressiveHints": [
      "«Fantastico» non basta. Se recuperi «pioggia» invece di «ombrello», il tuo indizio punta al contesto e non all'oggetto richiesto.",
      "Quando codifichi una parola astratta, prima costruisci una versione visiva inequivocabile."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Porta + limone. Scena A: porta gialla. Scena B: limone sullo zerbino. Scena C: un limone enorme blocca la serratura e spruzza succo acido quando giri la chiave.",
      "requestedOutput": "Con nuovo bersaglio «ombrello» e locus «frigorifero», scegli due trasformazioni, poi nascondi e scrivi il bersaglio evocato dalla scena.",
      "structuredChecks": [
        {
          "id": "F03-ic-1",
          "prompt": "Verifica della missione: Con nuovo bersaglio «ombrello» e locus «frigorifero», scegli due trasformazioni, poi nascondi e scri...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "La qualità della costruzione usa una rubrica; mastery soltanto se il bersaglio viene recuperato a scena nascosta o da un cue non esplicito."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "La qualità della costruzione usa una rubrica; mastery soltanto se il bersaglio viene recuperato a scena nascosta o da un cue non esplicito."
    }
  },
  "F04": {
    "lessonId": "F04",
    "gameId": "F04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Il segreto è l'indizio»)?",
    "demonstrationOptions": [
      {
        "id": "F04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "F04-d2",
        "label": "Errore comune: Se recuperi «musica», aggiungi le corde e l'archetto nella scena: l'in...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "La memoria funziona anche quando sei stanco, solo se l'indizio indica il bersaglio. Un'immagine deve consentire la decodifica: dal luogo o dalla parola precedente devi tornare all'informazione corretta. Prova a leggere l",
    "guidedPracticePrompt": "Tocca la parte di tre vignette che rischia di generare una risposta ambigua. Poi cambia soltanto quella parte.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "F04-gp-check-1",
          "prompt": "Pratica guidata: Tocca la parte di tre vignette che rischia di generare una risposta ambigua. Poi cambia soltanto quella parte....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«Faro» da ricordare su una sedia: un fascio di luce rotante esce dallo schienale e ti acceca quando ti siedi. La sedia gialla con un po' di luce diffusa sarebbe insufficiente."
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Nuovo bersaglio «violino» su «lavatrice»: crea un'azione che differenzi il violino da qualsiasi altro strumento, poi prova a nominarlo dal locus, senza testo.",
    "progressiveHints": [
      "Se recuperi «musica», aggiungi le corde e l'archetto nella scena: l'indizio deve selezionare «violino».",
      "Quando sbagli un termine, non aggiungere dettagli a caso: ripara proprio la parte del cue che ha causato l'errore."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "«Faro» da ricordare su una sedia: un fascio di luce rotante esce dallo schienale e ti acceca quando ti siedi. La sedia gialla con un po' di luce diffusa sarebbe",
      "requestedOutput": "Nuovo bersaglio «violino» su «lavatrice»: crea un'azione che differenzi il violino da qualsiasi altro strumento, poi prova a nominarlo dal locus, senza testo.",
      "structuredChecks": [
        {
          "id": "F04-ic-1",
          "prompt": "Verifica della missione: Nuovo bersaglio «violino» su «lavatrice»: crea un'azione che differenzi il violino da qualsiasi altr...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Rubrica: specificità del target, causalità, chiarezza; ricordo target prima di reveal. Nessun algoritmo pretende di valutare «creatività» in"
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Rubrica: specificità del target, causalità, chiarezza; ricordo target prima di reveal. Nessun algoritmo pretende di valutare «creatività» in assoluto."
    }
  },
  "F05": {
    "lessonId": "F05",
    "gameId": "F05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Impara il primo trucco, poi dimenticalo»)?",
    "demonstrationOptions": [
      {
        "id": "F05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "F05-d2",
        "label": "Errore comune: Se vuoi mettere un'intera spiegazione su un mobile, prova prima a form...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Non esiste un unico trucco per ogni compito. Liste in ordine, nomi, date e spiegazioni richiedono indizi differenti. Oggi non devi imparare un altro acronimo: devi riconoscere che la stessa azione mentale non funziona se",
    "guidedPracticePrompt": "Tre mini-situazioni: scegli «associazione», «posizione», «comprensione» e scopri il motivo specifico.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "F05-gp-check-1",
          "prompt": "Pratica guidata: Tre mini-situazioni: scegli «associazione», «posizione», «comprensione» e scopri il motivo specifico....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Per «cigno, moka, mulino», una catena bizzarra può bastare. Per «terzo punto di un discorso» è utile anche una posizione fissa. Per una spiegazione causale devi prima capire il rap"
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Due nuovi compiti: ricordare otto commissioni nell'ordine e spiegare perché un seme germina. Scegli un approccio per ciascuno e giustifica la differenza in una frase.",
    "progressiveHints": [
      "Se vuoi mettere un'intera spiegazione su un mobile, prova prima a formulare una relazione che potresti dire a parole tue.",
      "Ogni volta che apri LOCO chiediti: «Quale azione voglio saper compiere senza guardare?»."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Per «cigno, moka, mulino», una catena bizzarra può bastare. Per «terzo punto di un discorso» è utile anche una posizione fissa. Per una spiegazione causale devi",
      "requestedOutput": "Due nuovi compiti: ricordare otto commissioni nell'ordine e spiegare perché un seme germina. Scegli un approccio per ciascuno e giustifica la differenza in una ",
      "structuredChecks": [
        {
          "id": "F05-ic-1",
          "prompt": "Verifica della missione: Due nuovi compiti: ricordare otto commissioni nell'ordine e spiegare perché un seme germina. Scegli ...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Valutazione a rubrica, non premi per aver scelto la parola più lunga; include almeno un caso dove la tecnica mnemonica non è la prima scelta"
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Valutazione a rubrica, non premi per aver scelto la parola più lunga; include almeno un caso dove la tecnica mnemonica non è la prima scelta."
    }
  },
  "A01": {
    "lessonId": "A01",
    "gameId": "A01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "hybrid_deterministic_and_rubric",
    "gradingReliability": "hybrid_recall_and_rubric",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Non appoggiare: fai esplodere»)?",
    "demonstrationOptions": [
      {
        "id": "A01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "A01-d2",
        "label": "Errore comune: Se dici «valigia» invece di «zaino», aggiungi un tratto non ambiguo: s...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Gli oggetti che si limitano a condividere una scena spesso non producono un legame abbastanza preciso. Serve un'interazione: uno modifica l'altro. La causalità ti aiuta a transitare dal primo oggetto al secondo. Esageraz",
    "guidedPracticePrompt": "Scegli uno dei verbi «schiaccia / incolla / trasforma» e applicalo a «torta → ombrello». Il gioco mostra come cambia la direzione del link.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A01-gp-check-1",
          "prompt": "Pratica guidata: Scegli uno dei verbi «schiaccia / incolla / trasforma» e applicalo a «torta → ombrello». Il gioco mostra come ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Per ricordare «chiave → arancia», una chiave tra due arance è poco informativa. Una chiave enorme fora l'arancia e il succo invade la serratura: quando pensi alla chiave, l'arancia"
        }
      ]
    },
    "widgetKind": "builder_then_blind_recall",
    "independentPrompt": "Bersagli nuovi «cuscino → zaino». Progetta un unico gesto e poi, vedendo solo il cuscino, scrivi il secondo elemento.",
    "progressiveHints": [
      "Se dici «valigia» invece di «zaino», aggiungi un tratto non ambiguo: spallacci e fibbie.",
      "Nei collegamenti quotidiani, pensa a un verbo prima che a un colore."
    ],
    "builderRecallSpec": {
      "assignments": [
        {
          "locusOrAnchor": "Scrivania",
          "targetToRemember": "clessidra"
        },
        {
          "locusOrAnchor": "Libreria",
          "targetToRemember": "bussola"
        },
        {
          "locusOrAnchor": "Finestra",
          "targetToRemember": "aquilone"
        }
      ],
      "minRecalledCount": 3
    }
  },
  "A02": {
    "lessonId": "A02",
    "gameId": "A02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "order_omission_inversion",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («La catena che si racconta da sola»)?",
    "demonstrationOptions": [
      {
        "id": "A02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "A02-d2",
        "label": "Errore comune: Se perdi «pizza» dopo «giraffa», il guasto è il collegamento giraffa →...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il Linked Method lega ogni elemento al successivo. Non serve recitare una storia letteraria: ogni passaggio deve far comparire in modo inevitabile l'oggetto dopo. La catena è economica per liste brevi, ma il richiamo di ",
    "guidedPracticePrompt": "Una catena di tre tessere manca di un legame. Trascina un verbo nel vuoto, poi ascolta la relazione leggendo da sinistra a destra.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A02-gp-check-1",
          "prompt": "Pratica guidata: Una catena di tre tessere manca di un legame. Trascina un verbo nel vuoto, poi ascolta la relazione leggendo d...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«lumaca, torcia, pianoforte, bolla»: lumaca mangia torcia; torcia incendia tasti del piano; dal piano esce una bolla che lo ingloba. Quattro immagini, tre azioni, nessuna ambientaz"
        }
      ]
    },
    "widgetKind": "ordered_flash_recall",
    "independentPrompt": "«secchio, giraffa, pizza, tromba, farfalla». Disegna o scrivi i quattro passaggi; poi nascondi ogni tessera salvo «secchio» e ricostruisci la sequenza.",
    "progressiveHints": [
      "Se perdi «pizza» dopo «giraffa», il guasto è il collegamento giraffa → pizza; ripara solo quello, non ricominciare tutto da zero.",
      "Usa un link quando hai un elenco breve che ti serve nell'ordine, come cinque cose da prendere."
    ],
    "orderedFlashSpec": {
      "targetWords": [
        "anello",
        "barca",
        "castello",
        "drago",
        "elmo"
      ],
      "hideAfterSeconds": 12,
      "minOrderedPassCount": 4
    }
  },
  "A03": {
    "lessonId": "A03",
    "gameId": "A03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "hybrid_deterministic_and_rubric",
    "gradingReliability": "hybrid_recall_and_rubric",
    "defaultErrorCategory": "order_omission_inversion",
    "demonstrationQuestion": "In quale punto la sequenza iniziale gatto → razzo → sapone → martello si indebolisce?",
    "demonstrationOptions": [
      {
        "id": "a03-d1",
        "label": "Tra sapone e martello: sono solo accostati passivamente senza un'azione fisica trasformativa.",
        "isCorrect": true
      },
      {
        "id": "a03-d2",
        "label": "Tra gatto e razzo, perché il gatto è un essere vivente.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Se due oggetti sono solo accostati, il legame è debole. Un'azione fisica trasformativa ripara la catena.",
    "guidedPracticePrompt": "Tocca l'anello guasto in un fumetto a quattro scene; aggiungi un verbo e verifica che il bersaglio resti specifico.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A03-gp-check-1",
          "prompt": "Pratica guidata: Tocca l'anello guasto in un fumetto a quattro scene; aggiungi un verbo e verifica che il bersaglio resti speci...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Gatto graffia razzo; razzo spara schiuma di sapone; il sapone si limita a essere accanto al martello. Il legame finale non interagisce. Un martello che sbriciola la saponetta in mi"
        }
      ]
    },
    "widgetKind": "missing_link_diagnosis",
    "independentPrompt": "Nuova catena «gelato → treno → cactus → campana»: uno dei passaggi è raffigurato in modo troppo vago. Identificalo, riparalo e richiama tutte le parole.",
    "progressiveHints": [
      "Se correggi una scena che già funzionava, chiediti quale parola è stata effettivamente persa: gli errori indicano la posizione del difetto.",
      "In un percorso personale, correggi le associazioni specifiche che sbagli anziché moltiplicare i ripassi ciechi."
    ],
    "missingLinkSpec": {
      "memorizedChain": [
        "gelato",
        "treno",
        "cactus",
        "campana"
      ],
      "corruptedRecall": [
        "gelato",
        "treno",
        "cactus"
      ],
      "expectedOmittedWord": "campana",
      "expectedBrokenAfterWord": "cactus"
    }
  },
  "A04": {
    "lessonId": "A04",
    "gameId": "A04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Parole astratte, immagini concrete»)?",
    "demonstrationOptions": [
      {
        "id": "A04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "A04-d2",
        "label": "Errore comune: Ricordi l'orso ma non la parola? Riduci il numero di passaggi: il sost...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Quando un termine è astratto o poco familiare, puoi costruire una parola sostitutiva dal suono, poi collegarla al significato corretto. Il sostituto non è il significato: è soltanto un ponte fonetico. Dopo l'apprendiment",
    "guidedPracticePrompt": "Dato un termine inventato «calimero», scegli la parte sonora che ti permette di ricostruirlo da una scena e distingui suono da significato.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A04-gp-check-1",
          "prompt": "Pratica guidata: Dato un termine inventato «calimero», scegli la parte sonora che ti permette di ricostruirlo da una scena e di...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Per «osmòsi» puoi inventare «orso + mosì» come ancoraggio sonoro; ma l'ancora vale solo se riesci a tornare a «osmosi» e a spiegare il passaggio dell'acqua attraverso una membrana "
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Parola immaginaria «toràvico», definita qui come «oggetto che blocca una porta». Crea un sostituto, nascondi la parola e recuperala da un'immagine + definizione.",
    "progressiveHints": [
      "Ricordi l'orso ma non la parola? Riduci il numero di passaggi: il sostituto deve aiutarti a pronunciare il termine, non diventare un ricordo concorrente.",
      "Usa parole sostitutive soprattutto per vocaboli e nomi nuovi, non per concetti che già comprendi."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "A05": {
    "lessonId": "A05",
    "gameId": "A05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Il tuo corpo è una mappa»)?",
    "demonstrationOptions": [
      {
        "id": "A05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "A05-d2",
        "label": "Errore comune: Se confondi spalla e testa, rendi più differente il gesto fisico: lasc...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Una sequenza corporea funziona come un piccolo palazzo portatile. Devi scegliere un ordine fisso e ripeterlo sempre uguale: piedi, ginocchia, cintura, spalle, bocca, testa è solo una possibile convenzione. Gli oggetti im",
    "guidedPracticePrompt": "Trascina sei oggetti su una sagoma stilizzata con sei hotspot numerati; la sagoma poi scompare.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A05-gp-check-1",
          "prompt": "Pratica guidata: Trascina sei oggetti su una sagoma stilizzata con sei hotspot numerati; la sagoma poi scompare....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Per ricordare «sveglia» al ginocchio, immagina che il ginocchio suoni come una sveglia quando pieghi la gamba. Per «caramella» alla bocca, una caramella enorme ti impedisce di parl"
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Set nuovo «lanterna, ancora, nuvola, biscotto, scala, sirena». Associa a sei punti fissi e richiama dall'ultimo al primo senza vedere le parole.",
    "progressiveHints": [
      "Se confondi spalla e testa, rendi più differente il gesto fisico: lascia che l'oggetto trasformi proprio quella parte.",
      "Usalo per mini-liste urgenti quando non puoi aprire un ambiente digitale."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "A06": {
    "lessonId": "A06",
    "gameId": "A06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Tre strumenti, tre situazioni»)?",
    "demonstrationOptions": [
      {
        "id": "A06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "A06-d2",
        "label": "Errore comune: Se scegli sempre il palazzo, chiediti se costruire una rotta costa più...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il Link è rapido per una sequenza corta. Un percorso di loci fornisce posizioni stabili e accesso per punto. Un peg preappreso è comodo quando vuoi recuperare l'elemento numero 4 senza ripercorrere tutti gli altri. Nessu",
    "guidedPracticePrompt": "Sposta il cursore «quanto / per quanto / in che ordine» e osserva quale esigenza cambia.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "A06-gp-check-1",
          "prompt": "Pratica guidata: Sposta il cursore «quanto / per quanto / in che ordine» e osserva quale esigenza cambia....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Lista della spesa in ordine: link; discorso con otto punti: loci; tre date associate a indici fissi: peg. Non è proibito usare altre tecniche, ma devi motivare il costo e il vantag"
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Tre casi nuovi: 1) ricordare 10 fermate nel percorso, 2) ricordare la terza riga di una scaletta, 3) portare quattro oggetti in palestra. Scegli una strategia, indicando almeno un motivo.",
    "progressiveHints": [
      "Se scegli sempre il palazzo, chiediti se costruire una rotta costa più tempo del compito. L'efficienza fa parte della competenza.",
      "Prima di codificare una nuova cosa, chiediti se ti serve ordine, posizione precisa o recupero di una parola."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Lista della spesa in ordine: link; discorso con otto punti: loci; tre date associate a indici fissi: peg. Non è proibito usare altre tecniche, ma devi motivare ",
      "requestedOutput": "Tre casi nuovi: 1) ricordare 10 fermate nel percorso, 2) ricordare la terza riga di una scaletta, 3) portare quattro oggetti in palestra. Scegli una strategia, ",
      "structuredChecks": [
        {
          "id": "A06-ic-1",
          "prompt": "Verifica della missione: Tre casi nuovi: 1) ricordare 10 fermate nel percorso, 2) ricordare la terza riga di una scaletta, 3)...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Valuta coerenza della scelta e capacità di spiegare limiti. Più soluzioni possono essere accettabili con motivazioni precise."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Valuta coerenza della scelta e capacità di spiegare limiti. Più soluzioni possono essere accettabili con motivazioni precise."
    }
  },
  "P01": {
    "lessonId": "P01",
    "gameId": "P01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Un punto, non un'area»)?",
    "demonstrationOptions": [
      {
        "id": "P01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "P01-d2",
        "label": "Errore comune: Un locus non è sbagliato perché piccolo: è debole quando non riesci a ...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un locus utile è stabile, riconoscibile e distinguibile dai vicini. Deve essere abbastanza specifico da ospitare una scena senza invadere quella successiva. «Angolo in alto» è vago; «maniglia della porta» è chiaro. L'arc",
    "guidedPracticePrompt": "Tocca sei punti su una piantina e marca tre come «buono», «ambiguo» o «instabile». Le spiegazioni appaiono dopo ogni scelta.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P01-gp-check-1",
          "prompt": "Pratica guidata: Tocca sei punti su una piantina e marca tre come «buono», «ambiguo» o «instabile». Le spiegazioni appaiono dop...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Nella stanza ci sono una porta, una cassettiera, due sedie identiche, una libreria e una finestra. Le due sedie adiacenti rischiano collisioni; maniglia, cassetto superiore, librer"
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Nuova stanza con due mensole identiche, una lampada a stelo e un grande specchio. Seleziona cinque loci ordinabili e giustifica l'esclusione di uno.",
    "progressiveHints": [
      "Un locus non è sbagliato perché piccolo: è debole quando non riesci a distinguerlo o ritrovarlo mentalmente.",
      "Nella tua camera reale individua tre punti che non cambiano posizione ogni giorno."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "P02": {
    "lessonId": "P02",
    "gameId": "P02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Perché dalla porta si segue una direzione costante (es. sempre in senso orario lungo la parete sinistra)?",
    "demonstrationOptions": [
      {
        "id": "p02-d1",
        "label": "Evita salti incrociati e garantisce che nessun locus venga saltato o contato due volte.",
        "isCorrect": true
      },
      {
        "id": "p02-d2",
        "label": "Perché è l'unica regola ammessa nei campionati mondiali.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Seguire il perimetro in un solo senso impedisce di tagliare diagonalmente la stanza o confondere l'ordine.",
    "guidedPracticePrompt": "Su una piantina vuota, trascina il marcatore 1 dalla porta alla libreria e prosegui lungo la parete sinistra. Linea tratteggiata solo mentre costruisci.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P02-gp-check-1",
          "prompt": "Pratica guidata: Su una piantina vuota, trascina il marcatore 1 dalla porta alla libreria e prosegui lungo la parete sinistra. ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Porta → libreria → lampada → divano → finestra → scrivania. L'ordine segue le pareti senza incroci. Un percorso «porta → scrivania → libreria → finestra → lampada» costringe a cont"
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Nuovo monolocale con porta in alto a destra, cinque mobili e due angoli. Costruisci la tua rotta e ripercorrila in senso inverso a mappa nascosta, pronunciando i loci.",
    "progressiveHints": [
      "Hai attraversato la stanza saltando un mobile? Non significa che sei sbagliato: prova una direzione unica e controlla se la rotta è più facile da ripetere.",
      "Per il primo palazzo reale scegli una sola regola d'orientamento e usala in tutte le stanze."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "porta",
          "label": "Porta d'ingresso",
          "isAmbiguousDistractor": false,
          "zone": "Ingresso"
        },
        {
          "id": "lampada",
          "label": "Lampada da tavolo",
          "isAmbiguousDistractor": false,
          "zone": "Parete sinistra"
        },
        {
          "id": "libreria",
          "label": "Libreria a parete",
          "isAmbiguousDistractor": false,
          "zone": "Parete sinistra"
        },
        {
          "id": "finestra",
          "label": "Finestra con vista",
          "isAmbiguousDistractor": false,
          "zone": "Parete frontale"
        },
        {
          "id": "scrivania",
          "label": "Scrivania da studio",
          "isAmbiguousDistractor": false,
          "zone": "Parete destra"
        },
        {
          "id": "divano",
          "label": "Divano accogliente",
          "isAmbiguousDistractor": false,
          "zone": "Parete destra"
        }
      ],
      "expectedOrderedStopIds": [
        "porta",
        "lampada",
        "libreria",
        "finestra",
        "scrivania",
        "divano"
      ],
      "requiredValidCount": 6
    }
  },
  "P03": {
    "lessonId": "P03",
    "gameId": "P03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il vantaggio dell'accesso casuale a un locus (es. punto 3 o punto 7) senza dover scorrere tutti i precedenti?",
    "demonstrationOptions": [
      {
        "id": "p03-d1",
        "label": "Permette l'accesso immediato all'informazione specifica durante l'uso reale.",
        "isCorrect": true
      },
      {
        "id": "p03-d2",
        "label": "Serve solo per prove di velocità mnemonica.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un palazzo della memoria maturo non è solo una catena lineare: permette l'accesso diretto a qualsiasi stazione.",
    "guidedPracticePrompt": "Tocca otto hotspot, assegna un nome corto a ciascuno, poi osserva i numeri per dieci secondi.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P03-gp-check-1",
          "prompt": "Pratica guidata: Tocca otto hotspot, assegna un nome corto a ciascuno, poi osserva i numeri per dieci secondi....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Ingresso → tappeto → scarpiere → attaccapanni → specchio → comodino → finestra → divano. La sequenza è solo un esempio; va controllato che corrisponda davvero alla geometria della "
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "La piantina scompare; compaiono solo otto caselle vuote. Digita i tuoi loci nell'ordine costruito. Poi ti viene chiesto «cosa c'è al punto 6?».",
    "progressiveHints": [
      "Se confondi «comodino» e «divano», l'errore di rotta va risolto prima di aggiungere contenuti.",
      "Fai lo stesso con un vero ambiente che conosci: è più importante la stabilità della familiarità decorativa."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "ingresso",
          "label": "Ingresso",
          "isAmbiguousDistractor": false
        },
        {
          "id": "tappeto",
          "label": "Tappeto",
          "isAmbiguousDistractor": false
        },
        {
          "id": "scarpiera",
          "label": "Scarpiera",
          "isAmbiguousDistractor": false
        },
        {
          "id": "attaccapanni",
          "label": "Attaccapanni",
          "isAmbiguousDistractor": false
        },
        {
          "id": "specchio",
          "label": "Specchio",
          "isAmbiguousDistractor": false
        },
        {
          "id": "comodino",
          "label": "Comodino",
          "isAmbiguousDistractor": false
        },
        {
          "id": "finestra",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "divano",
          "label": "Divano",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "ingresso",
        "tappeto",
        "scarpiera",
        "attaccapanni",
        "specchio",
        "comodino",
        "finestra",
        "divano"
      ],
      "randomAccessProbes": [
        {
          "prompt": "Cosa c'è al punto 3?",
          "expectedAnswer": "scarpiera"
        },
        {
          "prompt": "Cosa c'è al punto 7?",
          "expectedAnswer": "finestra"
        },
        {
          "prompt": "Cosa c'è al punto 1?",
          "expectedAnswer": "ingresso"
        }
      ],
      "requiredValidCount": 8
    }
  },
  "P04": {
    "lessonId": "P04",
    "gameId": "P04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "hybrid_deterministic_and_rubric",
    "gradingReliability": "hybrid_recall_and_rubric",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Il limone entra in libreria»)?",
    "demonstrationOptions": [
      {
        "id": "P04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "P04-d2",
        "label": "Errore comune: Se da «specchio» ricavi «pesce», devi aggiungere un elemento inequivoc...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il locus non è uno scaffale dove poggiare un'immagine. Ogni target deve fare qualcosa al locus: bloccare, rompere, suonare, illuminare, trascinare. Un'immagine specifica e dinamica riduce la confusione tra punti vicini. ",
    "guidedPracticePrompt": "In tre loci completi, trascina un target e seleziona il verbo che lo fa interagire con l'arredo; la scena illustrata si aggiorna.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P04-gp-check-1",
          "prompt": "Pratica guidata: In tre loci completi, trascina un target e seleziona il verbo che lo fa interagire con l'arredo; la scena illu...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Punto 3 = specchio; parola = balena. Una balena gigante esce dallo specchio e lo fa esplodere in gocce d'acqua. Dal locus «specchio» devi risalire a «balena», non genericamente a «"
        }
      ]
    },
    "widgetKind": "builder_then_blind_recall",
    "independentPrompt": "Quattro parole nuove «aquilone, tamburo, salmone, pattino» su quattro loci scelti. Costruisci scene con almeno un dettaglio distintivo, nascondi e fai richiamo da loci in ordine casuale.",
    "progressiveHints": [
      "Se da «specchio» ricavi «pesce», devi aggiungere un elemento inequivocabile della balena, non un altro colore.",
      "Usa lo stesso metodo per otto punti di un intervento orale."
    ],
    "builderRecallSpec": {
      "assignments": [
        {
          "locusOrAnchor": "Scrivania",
          "targetToRemember": "clessidra"
        },
        {
          "locusOrAnchor": "Libreria",
          "targetToRemember": "bussola"
        },
        {
          "locusOrAnchor": "Finestra",
          "targetToRemember": "aquilone"
        }
      ],
      "minRecalledCount": 3
    }
  },
  "P05": {
    "lessonId": "P05",
    "gameId": "P05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Vai direttamente al punto 5»)?",
    "demonstrationOptions": [
      {
        "id": "P05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "P05-d2",
        "label": "Errore comune: Se conosci la parola ma la metti sul locus vicino, il problema è la se...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un percorso può essere usato in sequenza, ma una buona conoscenza dei suoi punti permette anche un accesso più diretto. Non confondere la posizione con il contenuto: prima recuperi il locus numero 5, poi da quel locus l'",
    "guidedPracticePrompt": "Il sistema chiama i loci 2, 6 e 4. Tu tocchi la posizione sulla piantina e pronunci mentalmente l'oggetto prima di selezionarlo.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P05-gp-check-1",
          "prompt": "Pratica guidata: Il sistema chiama i loci 2, 6 e 4. Tu tocchi la posizione sulla piantina e pronunci mentalmente l'oggetto prim...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Dopo avere associato «tamburo» alla finestra, la domanda «che cosa c'era alla finestra?» deve evocare il tamburo, non il punto precedente."
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Mappa nascosta, nomi dei loci ancora disponibili come indizi singoli. Richiama cinque parole da posizioni casuali; poi prova due posizioni solo dal numero.",
    "progressiveHints": [
      "Se conosci la parola ma la metti sul locus vicino, il problema è la separazione spaziale, non l'immagine in sé.",
      "Con un discorso, prova a richiamare direttamente il terzo argomento senza iniziare dal primo."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "P06": {
    "lessonId": "P06",
    "gameId": "P06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Dal corridoio alla seconda stanza»)?",
    "demonstrationOptions": [
      {
        "id": "P06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "P06-d2",
        "label": "Errore comune: Se il percorso torna indietro tra la stessa porta tre volte, modifica ...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Quando una rotta attraversa più ambienti, anche l'uscita e l'ingresso diventano parte dell'ordine. Il rischio maggiore è saltare da un mobile all'altro senza una direzione naturale. Prima progetta il tragitto fra le stan",
    "guidedPracticePrompt": "Completa le due transizioni mancanti tra tre stanze su una pianta, evitando una linea che attraversi un muro.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P06-gp-check-1",
          "prompt": "Pratica guidata: Completa le due transizioni mancanti tra tre stanze su una pianta, evitando una linea che attraversi un muro....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Ingresso → corridoio → salotto → cucina. In salotto procedi dalla libreria alla finestra e poi alla porta della cucina. In cucina riparti da un punto fisso vicino alla soglia."
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Nuova planimetria con camera, cucina e soggiorno. Costruisci una rotta continua di 12 loci e recupera posizione 1, 6 e 12 senza visualizzare i numeri risolti.",
    "progressiveHints": [
      "Se il percorso torna indietro tra la stessa porta tre volte, modifica la sequenza delle stanze prima di cambiare i loci.",
      "Quando lo farai nella tua casa reale, prova a camminarlo fisicamente una volta senza memorizzare nulla."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "P07": {
    "lessonId": "P07",
    "gameId": "P07-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («La stanza dei bug»)?",
    "demonstrationOptions": [
      {
        "id": "P07-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "P07-d2",
        "label": "Errore comune: Se hai marcato un arredo insolito come «sbagliato», ricordati che inso...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Le principali cause di errore strutturale sono loci troppo simili, ordine ambiguo, scene che si sovrappongono e percorsi che attraversano pareti o tornano indietro. Devi imparare a distinguere il difetto del percorso dal",
    "guidedPracticePrompt": "Su una pianta con tre errori intenzionali, seleziona «locus duplicato», «inversione» e «scena troppo larga» e associa a ogni bug una riparazione.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "P07-gp-check-1",
          "prompt": "Pratica guidata: Su una pianta con tre errori intenzionali, seleziona «locus duplicato», «inversione» e «scena troppo larga» e ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Due mensole identiche usate come due loci adiacenti: quando richiami, le immagini si scambiano. Soluzione possibile: sostituire una mensola con la maniglia della finestra."
        }
      ]
    },
    "widgetKind": "multi_case_classification",
    "independentPrompt": "Nuovo appartamento con un incrocio, due specchi simili e una porta mai visitata. Individua due problemi reali e una falsa pista, poi prova la rotta riparata.",
    "progressiveHints": [
      "Se hai marcato un arredo insolito come «sbagliato», ricordati che insolito può essere utile; il vero difetto è l'ambiguità operativa.",
      "Dopo ogni fallimento di richiamo, annota se l'errore riguarda posizione, scena o recupero."
    ],
    "classificationSpec": {
      "cases": [
        {
          "id": "c1",
          "stimulus": "Dettaglio A",
          "expectedCategory": "cat_1"
        },
        {
          "id": "c2",
          "stimulus": "Dettaglio B",
          "expectedCategory": "cat_2"
        }
      ],
      "categories": [
        {
          "id": "cat_1",
          "label": "Categoria 1"
        },
        {
          "id": "cat_2",
          "label": "Categoria 2"
        }
      ]
    }
  },
  "N01": {
    "lessonId": "N01",
    "gameId": "N01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Le cifre non hanno una faccia»)?",
    "demonstrationOptions": [
      {
        "id": "N01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N01-d2",
        "label": "Errore comune: Se due cifre evocano lo stesso oggetto, serve un codice più discrimina...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un codice numerico trasforma simboli astratti in immagini. Esistono sistemi intuitivi basati sulla forma delle cifre, sulle rime e sui suoni consonantici. I primi sono rapidi da capire ma poco flessibili sui numeri lungh",
    "guidedPracticePrompt": "Su sei cifre scegli una metafora visiva e verifica se, rivedendola, recuperi la cifra prevista.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N01-gp-check-1",
          "prompt": "Pratica guidata: Su sei cifre scegli una metafora visiva e verifica se, rivedendola, recuperi la cifra prevista....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "La cifra 2 può ricordarti un cigno, il 8 due anelli sovrapposti. Ma queste immagini personali non costituiscono ancora una regola universale per decodificare un numero lungo."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Nuove cifre 7, 4 e 9: progetta un'immagine distinta per ciascuna. Il gioco le mostra in ordine casuale e chiede il numero associato.",
    "progressiveHints": [
      "Se due cifre evocano lo stesso oggetto, serve un codice più discriminante.",
      "Per date e codici frequenti potrai costruire in seguito un sistema fonetico stabile."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "N02": {
    "lessonId": "N02",
    "gameId": "N02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "phonetic_major_v1",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Il dizionario segreto dei suoni»)?",
    "demonstrationOptions": [
      {
        "id": "N02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N02-d2",
        "label": "Errore comune: Se «faro» diventa 48, hai invertito l'ordine delle consonanti: mantien...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Nel sistema fonetico, a ogni cifra corrisponde un gruppo di suoni consonantici. Per una versione italiana coerente: 0 S/Z, 1 T/D, 2 N, 3 M, 4 R, 5 L, 6 C/G dolce, 7 C/G dura, 8 F/V, 9 P/B. Le vocali servono a creare paro",
    "guidedPracticePrompt": "Trascina i suoni T, N, M, R, L sulle cifre 1–5; ascolta o leggi la pronuncia e scopri il perché.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N02-gp-check-1",
          "prompt": "Pratica guidata: Trascina i suoni T, N, M, R, L sulle cifre 1–5; ascolta o leggi la pronuncia e scopri il perché....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«toro»: T=1, R=4, le vocali non contano → 14. «mano»: M=3, N=2 → 32. Non usare ancora parole con digrammi ambigui."
        }
      ]
    },
    "widgetKind": "phonetic_decode_words",
    "independentPrompt": "Cinque token nuovi: D, V, P, N, R. Associali alle cifre, poi decodifica «faro» (84) e «luna» (52) senza legenda.",
    "progressiveHints": [
      "Se «faro» diventa 48, hai invertito l'ordine delle consonanti: mantieni la sequenza sonora, non quella delle immagini.",
      "Per oggi non inventare un lessico da 100 parole: rendi automatiche le dieci corrispondenze di base."
    ],
    "phoneticDecodeSpec": {
      "words": [
        "toro",
        "mano",
        "luna"
      ],
      "expectedDigits": [
        "14",
        "32",
        "52"
      ],
      "minCorrectCount": 3
    }
  },
  "N03": {
    "lessonId": "N03",
    "gameId": "N03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "phonetic_major_v1",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "In «coro» e «cera», qual è la cifra corrispondente alla consonante iniziale C?",
    "demonstrationOptions": [
      {
        "id": "n03-d1",
        "label": "«coro» ha C dura /k/ = 7, «cera» ha C dolce /tʃ/ = 6.",
        "isCorrect": true
      },
      {
        "id": "n03-d2",
        "label": "Entrambe valgono 7 perché la lettera scritta è la stessa.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Nel sistema fonetico major-it-v1 si convertono i suoni consonantici reali, non le lettere grafiche: C dura = 7, C dolce = 6.",
    "guidedPracticePrompt": "Evidenzia il fonema che determina la cifra in «cera», «cara», «giro», «gara»; ascolta la spiegazione.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N03-gp-check-1",
          "prompt": "Pratica guidata: Evidenzia il fonema che determina la cifra in «cera», «cara», «giro», «gara»; ascolta la spiegazione....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«giro» ha G dolce=6 e R=4 → 64. «gara» ha G dura=7 e R=4 → 74. In entrambe le parole le vocali non contano."
        }
      ]
    },
    "widgetKind": "phonetic_word_for_numbers",
    "independentPrompt": "«coro» e «cera»: inserisci due codici differenti, senza avere sotto mano il mapping. Poi spiega in una frase la differenza.",
    "progressiveHints": [
      "Se attribuisci sempre G=7, stai leggendo lettere, non suoni. Controlla la vocale successiva.",
      "Quando crei il tuo lessico, scegli parole di pronuncia semplice: ridurranno gli errori di conversione."
    ],
    "phoneticNumbersSpec": {
      "targetNumbers": [
        "74",
        "64"
      ],
      "exampleWordsAfterSubmit": {
        "64": "cera",
        "74": "coro"
      },
      "minValidCount": 2
    }
  },
  "N04": {
    "lessonId": "N04",
    "gameId": "N04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "phonetic_major_v1",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Da 2 cifre a una cosa»)?",
    "demonstrationOptions": [
      {
        "id": "N04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N04-d2",
        "label": "Errore comune: Se la parola contiene tre consonanti numeriche, non codifica più due s...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Trasforma una coppia di cifre in una parola concreta e facilmente immaginabile. Cerca una parola che contenga, nell'ordine, i suoni consonantici corrispondenti. Non scegliere soltanto una parola che suona bene: prova sub",
    "guidedPracticePrompt": "In un banco di fonemi compone «p-a-n-e» per 92; il sistema mostra quali vocali restano libere.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N04-gp-check-1",
          "prompt": "Pratica guidata: In un banco di fonemi compone «p-a-n-e» per 92; il sistema mostra quali vocali restano libere....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "92 → P/B + N → «pane» (P=9, N=2). 37 → M + G dura → «mago» (M=3, G di «go»=7). Due oggetti diversi, due codici."
        }
      ]
    },
    "widgetKind": "phonetic_word_for_numbers",
    "independentPrompt": "Codifica le coppie 14, 53 e 81 con parole reali a scelta; poi il gioco nasconde i numeri e ti chiede di decodificare le parole da te create.",
    "progressiveHints": [
      "Se la parola contiene tre consonanti numeriche, non codifica più due sole cifre: semplifica il codice.",
      "Costruisci un lessico personale solo dopo avere confermato che sai rileggere numeri dalle immagini."
    ],
    "phoneticNumbersSpec": {
      "targetNumbers": [
        "14",
        "32"
      ],
      "exampleWordsAfterSubmit": {
        "14": "toro",
        "32": "mano"
      },
      "minValidCount": 2
    }
  },
  "N05": {
    "lessonId": "N05",
    "gameId": "N05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Trovare 00–99 senza impazzire»)?",
    "demonstrationOptions": [
      {
        "id": "N05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N05-d2",
        "label": "Errore comune: Se devi pensare troppo a una parola poco visualizzabile, sostituiscila...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un lessico stabile 00–99 rende più veloce la codifica rispetto all'invenzione di una parola per ogni numero. È un investimento: dieci codici affidabili sono più utili di cento codici confusi. Devi evitare collisioni, ren",
    "guidedPracticePrompt": "Popola sei caselle di una matrice 10×10; il gioco mostra potenziali collisioni tra termini troppo simili.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N05-gp-check-1",
          "prompt": "Pratica guidata: Popola sei caselle di una matrice 10×10; il gioco mostra potenziali collisioni tra termini troppo simili....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "La coppia 52 diventa «luna» e 92 «pane». Se 52 e 25 finiscono entrambi per evocare «luna», il problema è l'ordine dei suoni."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Ricevi sei numeri nuovi 04, 18, 23, 47, 65, 90. Proponi codici, poi fai round-trip per tutti e correggi eventuali errori prima di salvarli.",
    "progressiveHints": [
      "Se devi pensare troppo a una parola poco visualizzabile, sostituiscila. Un codice è utile solo se torna rapidamente alla cifra giusta.",
      "Quando la Palestra esisterà, il lessico personale sarà il materiale di esercizi ripetibili."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "N06": {
    "lessonId": "N06",
    "gameId": "N06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "phonetic_major_v1",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («La data che torna intera»)?",
    "demonstrationOptions": [
      {
        "id": "N06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N06-d2",
        "label": "Errore comune: Se ricordi 3817, la scena non distingue primo e secondo blocco: impost...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Una data ha almeno due componenti: il fatto che vuoi ricordare e l'anno esatto. Spezzare l'anno può aiutare, ma devi conservare l'ordine dei blocchi e il legame con l'evento. Un palazzo o una scena in due parti può codif",
    "guidedPracticePrompt": "Inserisci due blocchi nell'ordine, scegli dove posizionarli e richiama il numero completo dopo l'animazione.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N06-gp-check-1",
          "prompt": "Pratica guidata: Inserisci due blocchi nell'ordine, scegli dove posizionarli e richiama il numero completo dopo l'animazione....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "14=toro e 92=pane: il toro spinge un enorme pane su una nave. La scena va collegata all'evento della partenza, non soltanto a una generica data."
        }
      ]
    },
    "widgetKind": "phonetic_year_blocks",
    "independentPrompt": "Evento inventato «apertura dell'Osservatorio LOCO» nell'anno 1738. Codifica 17 e 38 con immagini di tua scelta, poi recupera evento+anno senza vedere i blocchi.",
    "progressiveHints": [
      "Se ricordi 3817, la scena non distingue primo e secondo blocco: imposta una direzione fissa.",
      "Per date storiche vere, separa la verifica del fatto dalla costruzione della mnemonica."
    ],
    "phoneticBlocksSpec": {
      "fourDigitCodes": [
        "1738"
      ],
      "exampleBlocksAfterSubmit": {
        "1738": [
          "teca",
          "muffa"
        ]
      }
    }
  },
  "N07": {
    "lessonId": "N07",
    "gameId": "N07-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "phonetic_encoding",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Sistema Major o Dominic?»)?",
    "demonstrationOptions": [
      {
        "id": "N07-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "N07-d2",
        "label": "Errore comune: Se ritieni che «tutte le parole si codificano nello stesso modo», la d...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il sistema fonetico Major mappa le cifre su suoni consonantici e produce parole. Il sistema Dominic usa un'altra convenzione di lettere e persone, spesso con azioni associate. Mischiare i due sistemi senza avvisare crea ",
    "guidedPracticePrompt": "Due pannelli mostrano la conversione dello stesso numero secondo regole esplicite; indica quale passaggio appartiene a quale sistema.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "N07-gp-check-1",
          "prompt": "Pratica guidata: Due pannelli mostrano la conversione dello stesso numero secondo regole esplicite; indica quale passaggio appa...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Per 14 il Major può produrre «toro». In Dominic 1 e 4 seguono una tabella di iniziali specifica di quel metodo, non T/R. Non si può usare «toro» come prova di entrambi senza dichia"
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Analizza tre strategie inventate: una rispetta Major, una rispetta Dominic, una mescola codici senza regola. Individua l'incoerenza e scegli il sistema che preferisci esplorare.",
    "progressiveHints": [
      "Se ritieni che «tutte le parole si codificano nello stesso modo», la difficoltà è la grammatica: scegli una sola lingua numerica per volta.",
      "Per carte e cifre lunghe puoi imparare sistemi più densi, ma solo dopo avere stabilizzato il codice di base."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Per 14 il Major può produrre «toro». In Dominic 1 e 4 seguono una tabella di iniziali specifica di quel metodo, non T/R. Non si può usare «toro» come prova di e",
      "requestedOutput": "Analizza tre strategie inventate: una rispetta Major, una rispetta Dominic, una mescola codici senza regola. Individua l'incoerenza e scegli il sistema che pref",
      "structuredChecks": [
        {
          "id": "N07-ic-1",
          "prompt": "Verifica della missione: Analizza tre strategie inventate: una rispetta Major, una rispetta Dominic, una mescola codici senza...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Comprensione delle differenze, non velocità. Può completarsi scegliendo Major e senza memorizzare la tabella Dominic."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Comprensione delle differenze, non velocità. Può completarsi scegliendo Major e senza memorizzare la tabella Dominic."
    }
  },
  "E01": {
    "lessonId": "E01",
    "gameId": "E01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il primo errore che porta a dimenticare un nome nei primi cinque secondi?",
    "demonstrationOptions": [
      {
        "id": "e01-d1",
        "label": "Non ascoltare davvero il nome perché si è concentrati su cosa dire dopo.",
        "isCorrect": true
      },
      {
        "id": "e01-d2",
        "label": "Non avere un palazzo della memoria con cento stanze già pronto.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Isola subito il nome sonoro ('Giorgia') e ancoralo a un dettaglio neutro distintivo della persona prima che svanisca.",
    "guidedPracticePrompt": "Tre volti stilizzati con nomi fittizi. Scegli un dettaglio per ciascuno, poi il gioco propone due possibili ponti sonori.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E01-gp-check-1",
          "prompt": "Pratica guidata: Tre volti stilizzati con nomi fittizi. Scegli un dettaglio per ciascuno, poi il gioco propone due possibili po...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Volto illustrato con occhiali dalla montatura triangolare; nome «Marta». Una «martellata» delicata fa suonare il triangolo degli occhiali: MARTA → martello. Il ponte è utile solo s"
        }
      ]
    },
    "widgetKind": "cards_and_names_dual_lab",
    "independentPrompt": "Vedi un nuovo volto di fantasia e il nome «Giorgia» per cinque secondi; il nome scompare. Scegli un cue tuo, aspetta un passaggio di distrazione e digita il nome dal volto.",
    "progressiveHints": [
      "Se ricordi «Giulia», il ponte era troppo generico; scegli un suono più vicino al nome originale.",
      "Alla prossima presentazione reale, usa il nome nella conversazione e poi prova a richiamarlo mentalmente."
    ],
    "cardsAndNamesSpec": {
      "namePairs": [
        {
          "context": "Orecchino triangolare",
          "name": "Giorgia"
        }
      ],
      "profiles": [
        {
          "person": "Giorgia",
          "role": "Partecipante",
          "detail": "Orecchino triangolare"
        }
      ]
    }
  },
  "E02": {
    "lessonId": "E02",
    "gameId": "E02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Cognomi e indizi senza stereotipi»)?",
    "demonstrationOptions": [
      {
        "id": "E02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "E02-d2",
        "label": "Errore comune: Se il ponte evoca solo «ravanello» ma non il plurale, inserisci un ind...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "I cognomi richiedono spesso più segmenti sonori. Scomponili in due o tre parti, trova immagini vicine alla pronuncia e collega il tutto a un indizio del volto o del contesto. Non trasformare il nome in una caratteristica",
    "guidedPracticePrompt": "Segmenta tre cognomi inventati in sillabe e scegli un aggancio sonoro per ciascun segmento.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E02-gp-check-1",
          "prompt": "Pratica guidata: Segmenta tre cognomi inventati in sillabe e scegli un aggancio sonoro per ciascun segmento....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«Tassinari» può ricordare «tazza + nari». In una scena privata e buffa una tazza si appoggia su un paio di narici di cartone. Serve poi una prova in cui vedi il volto e pronunci Ta"
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Cognome fittizio «Ravanelli». Costruisci un'immagine fonetica non offensiva, poi osserva un ritratto neutro e scrivi il cognome dal solo volto.",
    "progressiveHints": [
      "Se il ponte evoca solo «ravanello» ma non il plurale, inserisci un indizio per la terminazione «-elli».",
      "Per persone reali, usa dettagli rispettosi e non condividere immagini mnemoniche potenzialmente imbarazzanti."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "E03": {
    "lessonId": "E03",
    "gameId": "E03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Una strada diventa una storia»)?",
    "demonstrationOptions": [
      {
        "id": "E03-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "E03-d2",
        "label": "Errore comune: Hai invertito al secondo incrocio? Collega la svolta a un landmark non...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un percorso reale ha indizi naturali: incroci, ponti, edifici riconoscibili. Puoi legare svolte e riferimenti in ordine, evitando di memorizzare isolatamente una sequenza di «destra/sinistra». Il sistema non sostituisce ",
    "guidedPracticePrompt": "Traccia un percorso su una mappa di quartiere stilizzata con tre decisioni. Il sistema collega una scena ad ogni bivio.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E03-gp-check-1",
          "prompt": "Pratica guidata: Traccia un percorso su una mappa di quartiere stilizzata con tre decisioni. Il sistema collega una scena ad og...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Dalla piazza vai a destra davanti alla fontana; passa sotto il ponte giallo; gira a sinistra al negozio con l'insegna a forma di pesce. Ogni luogo evoca la svolta successiva."
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Nuova mappa con cinque bivi e punti di riferimento simili; osserva le indicazioni, nascondile e raggiungi l'arrivo scegliendo le svolte.",
    "progressiveHints": [
      "Hai invertito al secondo incrocio? Collega la svolta a un landmark non ripetuto, anziché tentare di ricordare solo la parola «destra».",
      "Per una passeggiata reale, usa la tecnica soltanto come aiuto alla memoria, non come sostituto del controllo della strada."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "E04": {
    "lessonId": "E04",
    "gameId": "E04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Ricordati domani, non adesso»)?",
    "demonstrationOptions": [
      {
        "id": "E04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "E04-d2",
        "label": "Errore comune: Ricordi il foglio ma non quando consegnarlo? Il trigger non era abbast...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "La memoria prospettica riguarda un'azione futura attivata da un indizio. Non basta ricordare l'oggetto: devi agganciarlo al luogo o evento in cui dovrai agire. Per compiti importanti gli allarmi e le liste restano strume",
    "guidedPracticePrompt": "Tre coppie «quando → cosa»: premi il momento trigger e costruisci una scena fisica che lo trasformi in promemoria.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E04-gp-check-1",
          "prompt": "Pratica guidata: Tre coppie «quando → cosa»: premi il momento trigger e costruisci una scena fisica che lo trasformi in promemo...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Devo prendere il quaderno quando apro la porta. Immagino che la maniglia sia fatta di quaderni e non possa aprirsi finché non ne prendo uno."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Situazione inventata: «domani, dopo colazione, consegna un foglio giallo». Scegli l'indizio giusto fra oggetti e orari, costruisci un cue e dopo un breve compito distrattore rispondi a «cosa devi fare quando…?».",
    "progressiveHints": [
      "Ricordi il foglio ma non quando consegnarlo? Il trigger non era abbastanza concreto.",
      "Usa un allarme per appuntamenti critici; il cue mnemonico può aiutarti nel momento del passaggio."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "E05": {
    "lessonId": "E05",
    "gameId": "E05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Imparare vocaboli senza magia»)?",
    "demonstrationOptions": [
      {
        "id": "E05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "E05-d2",
        "label": "Errore comune: Se sai «fiume» ma non ricostruisci «nalufo», l'immagine sonora non con...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Per una parola straniera ti servono suono, significato e recupero nelle due direzioni. Una parola sostitutiva può creare un ponte, ma va verificata sulla pronuncia e sulla comprensione. Se un vocabolo è già trasparente, ",
    "guidedPracticePrompt": "Trascina una parola, un'immagine sonora e un significato in una catena a tre anelli; disattiva poi l'immagine centrale.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E05-gp-check-1",
          "prompt": "Pratica guidata: Trascina una parola, un'immagine sonora e un significato in una catena a tre anelli; disattiva poi l'immagine ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«mavèra» = «casa» (lingua fittizia): un'enorme vela copre una casa; il cue «vela» aiuta a pronunciare mavèra, la casa fornisce il significato. Test: casa → mavèra e mavèra → casa."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Nuova parola fittizia «nalufo» = «fiume». Inventa un ponte e completa due prove nascoste: sentendo «nalufo», scegli il significato, poi dato «fiume» produci la parola.",
    "progressiveHints": [
      "Se sai «fiume» ma non ricostruisci «nalufo», l'immagine sonora non conserva abbastanza sillabe.",
      "Quando usi una lingua vera, integra ascolto, uso in frase e verifica da fonte linguistica affidabile."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "E06": {
    "lessonId": "E06",
    "gameId": "E06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_sequence",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Parla senza imparare un copione»)?",
    "demonstrationOptions": [
      {
        "id": "E06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "E06-d2",
        "label": "Errore comune: Se reciti una frase perfetta ma non sai spiegare perché esiste quel pu...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Per un discorso naturale il palazzo contiene punti e transizioni, non necessariamente frasi complete. Ogni locus rappresenta una parte del ragionamento; la scena richiama un titolo o una domanda da spiegare con parole pr",
    "guidedPracticePrompt": "Metti quattro punti del discorso su quattro loci e registra una frase guida che li colleghi.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "E06-gp-check-1",
          "prompt": "Pratica guidata: Metti quattro punti del discorso su quattro loci e registra una frase guida che li colleghi....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Presentazione fittizia su un mercato: porta=problema dei rifiuti, tavolo=tre cause, finestra=proposta, lampada=risultato atteso. La stanza porta da un argomento al successivo."
        }
      ]
    },
    "widgetKind": "loci_route_and_blind_order",
    "independentPrompt": "Tema nuovo «biblioteca di quartiere»: quattro punti dati, due possibili rotte. Scegline una, nascondi la scaletta e restituisci l'ordine dei temi dalla sola pianta.",
    "progressiveHints": [
      "Se reciti una frase perfetta ma non sai spiegare perché esiste quel punto, stai usando il percorso come copione rigido.",
      "Prima di una presentazione reale, fai una prova fuori ordine partendo da un argomento casuale."
    ],
    "lociRouteSpec": {
      "candidateStops": [
        {
          "id": "l1",
          "label": "Porta",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l2",
          "label": "Scrivania",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l3",
          "label": "Libreria",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l4",
          "label": "Finestra",
          "isAmbiguousDistractor": false
        },
        {
          "id": "l5",
          "label": "Poltrona",
          "isAmbiguousDistractor": false
        }
      ],
      "expectedOrderedStopIds": [
        "l1",
        "l2",
        "l3",
        "l4",
        "l5"
      ],
      "requiredValidCount": 5
    }
  },
  "S01": {
    "lessonId": "S01",
    "gameId": "S01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "source_misconception",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Una pagina non è una lista»)?",
    "demonstrationOptions": [
      {
        "id": "S01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "S01-d2",
        "label": "Errore comune: Se ricordi una parola chiave ma non la relazione, il problema è concet...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Alcune informazioni vanno comprese attraverso rapporti causali, altre sono etichette o dati arbitrari da ricordare con precisione. Le mnemoniche non sostituiscono il ragionamento: un'immagine ti aiuta a recuperare una pa",
    "guidedPracticePrompt": "Dividi sei micro-affermazioni in «capire un rapporto», «ricordare un'etichetta», «serve entrambi». Le categorie contengono spiegazioni.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S01-gp-check-1",
          "prompt": "Pratica guidata: Dividi sei micro-affermazioni in «capire un rapporto», «ricordare un'etichetta», «serve entrambi». Le categori...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«Un oggetto più caldo tende a dilatarsi» richiede capire un meccanismo. «Il simbolo chimico del sodio è Na» è una coppia convenzionale che puoi codificare con un'associazione."
        }
      ]
    },
    "widgetKind": "multi_case_classification",
    "independentPrompt": "Breve paragrafo fittizio su un ecosistema: marca il rapporto causale e due dati nominali. Poi spiega il rapporto senza vedere il testo e richiama un dato etichettato.",
    "progressiveHints": [
      "Se ricordi una parola chiave ma non la relazione, il problema è concettuale: torna allo schema prima dell'associazione.",
      "All'inizio di ogni capitolo chiediti che cosa dovrai spiegare, elencare e identificare."
    ],
    "classificationSpec": {
      "cases": [
        {
          "id": "c1",
          "stimulus": "Dettaglio A",
          "expectedCategory": "cat_1"
        },
        {
          "id": "c2",
          "stimulus": "Dettaglio B",
          "expectedCategory": "cat_2"
        }
      ],
      "categories": [
        {
          "id": "cat_1",
          "label": "Categoria 1"
        },
        {
          "id": "cat_2",
          "label": "Categoria 2"
        }
      ]
    }
  },
  "S02": {
    "lessonId": "S02",
    "gameId": "S02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "source_misconception",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Trasforma il testo in domande»)?",
    "demonstrationOptions": [
      {
        "id": "S02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "S02-d2",
        "label": "Errore comune: Se la domanda contiene già la risposta («la molla immagazzina energia?...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Una domanda buona specifica l'azione cognitiva: nominare, confrontare, spiegare, applicare o ordinare. Evidenziare tutto rende impossibile capire che cosa controllare. Prima individua le relazioni importanti, poi scrivi ",
    "guidedPracticePrompt": "Evidenzia tre frasi su un testo illustrato; trascinale in tre domande per generare un primo set di cue.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S02-gp-check-1",
          "prompt": "Pratica guidata: Evidenzia tre frasi su un testo illustrato; trascinale in tre domande per generare un primo set di cue....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Mini testo su fotosintesi: «Le piante assorbono luce, acqua e CO₂ per produrre sostanze organiche; si libera O₂». Domanda debole: «La fotosintesi usa la luce?». Domanda utile: «Qua"
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Nuovo paragrafo fittizio su una bicicletta che immagazzina energia in una molla: scrivi due domande, una di spiegazione e una di dettaglio.",
    "progressiveHints": [
      "Se la domanda contiene già la risposta («la molla immagazzina energia?»), alza la difficoltà chiedendo come e quando la restituisce.",
      "Trasforma ogni sezione difficile dei tuoi appunti in 2–4 domande che puoi usare durante il ripasso."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Mini testo su fotosintesi: «Le piante assorbono luce, acqua e CO₂ per produrre sostanze organiche; si libera O₂». Domanda debole: «La fotosintesi usa la luce?».",
      "requestedOutput": "Nuovo paragrafo fittizio su una bicicletta che immagazzina energia in una molla: scrivi due domande, una di spiegazione e una di dettaglio.",
      "structuredChecks": [
        {
          "id": "S02-ic-1",
          "prompt": "Verifica della missione: Nuovo paragrafo fittizio su una bicicletta che immagazzina energia in una molla: scrivi due domande,...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Rubrica: specificità, possibilità di rispondere senza testo e copertura delle idee principali. La domanda «hai capito?» non vale."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Rubrica: specificità, possibilità di rispondere senza testo e copertura delle idee principali. La domanda «hai capito?» non vale."
    }
  },
  "S03": {
    "lessonId": "S03",
    "gameId": "S03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "source_misconception",
    "demonstrationQuestion": "Quando studi un testo, a quali informazioni devi dedicare il «budget» di immagini mentali?",
    "demonstrationOptions": [
      {
        "id": "s03-d1",
        "label": "Ai codici, date e dettagli arbitrari non deducibili con la logica.",
        "isCorrect": true
      },
      {
        "id": "s03-d2",
        "label": "Ai concetti generali e alle regole di buon senso già comprensibili.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Ciò che puoi capire e dedurre logicamente non spreca budget mnemonico. Dedica immagini vivide solo a codici arbitrari.",
    "guidedPracticePrompt": "Hai tre gettoni: assegnali a sei dettagli di un capitolo, mentre un indicatore mostra quale informazione già conosci per deduzione.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S03-gp-check-1",
          "prompt": "Pratica guidata: Hai tre gettoni: assegnali a sei dettagli di un capitolo, mentre un indicatore mostra quale informazione già c...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Testo breve sui vulcani: «il magma sale per differenza di densità» è una relazione da spiegare; «il campione si chiama Vesuvianite» è un'etichetta da verificare e poi ricordare, no"
        }
      ]
    },
    "widgetKind": "multi_case_classification",
    "independentPrompt": "Nuovo testo su una stazione spaziale fittizia con due nomi, una data e tre relazioni. Seleziona quali due elementi codificare e giustifica il criterio.",
    "progressiveHints": [
      "Hai codificato il concetto principale ma lasciato un codice fittizio impossibile da dedurre? Sposta il budget verso il dettaglio fragile.",
      "Questa scelta riduce il numero di loci necessari quando studierai davvero."
    ],
    "classificationSpec": {
      "cases": [
        {
          "id": "g1",
          "stimulus": "La molla restituisce energia quando si distende",
          "expectedCategory": "causale"
        },
        {
          "id": "g2",
          "stimulus": "La navetta fittizia è chiamata Vela-7",
          "expectedCategory": "arbitrario"
        },
        {
          "id": "g3",
          "stimulus": "La luce intensa aumenta la temperatura di una superficie scura",
          "expectedCategory": "causale"
        },
        {
          "id": "g4",
          "stimulus": "Il rapporto di prova immaginario porta sigla R-14",
          "expectedCategory": "arbitrario"
        },
        {
          "id": "g5",
          "stimulus": "I materiali si dividono in due famiglie nella simulazione",
          "expectedCategory": "causale"
        },
        {
          "id": "g6",
          "stimulus": "Il prototipo inventato è stato inaugurato nel 2037",
          "expectedCategory": "arbitrario"
        }
      ],
      "categories": [
        {
          "id": "causale",
          "label": "Comprensione causale / Deducibile (zero gettoni)"
        },
        {
          "id": "arbitrario",
          "label": "Dettaglio arbitrario / Codice fragile (assegna gettone)"
        }
      ]
    }
  },
  "S04": {
    "lessonId": "S04",
    "gameId": "S04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "source_misconception",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Dalle idee alla mappa mentale»)?",
    "demonstrationOptions": [
      {
        "id": "S04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "S04-d2",
        "label": "Errore comune: Se hai disegnato una catena per una classificazione, stai introducendo...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Prima di memorizzare un argomento complesso, determina la sua struttura: causa-effetto, classificazione, fasi, confronto. Una mappa concettuale non è un palazzo, ma può dirti quali elementi hanno bisogno di ancore distin",
    "guidedPracticePrompt": "Collega cinque nodi in un diagramma causale senza duplicare le frecce; poi il gioco mostra una relazione sbagliata da correggere.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S04-gp-check-1",
          "prompt": "Pratica guidata: Collega cinque nodi in un diagramma causale senza duplicare le frecce; poi il gioco mostra una relazione sbagl...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "«Seme → germinazione → crescita» è una sequenza; «albero → conifere/latifoglie» è una tassonomia. Due diagrammi differenti, entrambi più utili di una fila di parole."
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Mini-caso «azienda di biciclette»: distingui una lista di componenti da un processo di montaggio e scegli due visualizzazioni diverse.",
    "progressiveHints": [
      "Se hai disegnato una catena per una classificazione, stai introducendo un ordine che il concetto non richiede.",
      "Quando aprirai uno studio reale, fai uno schema prima di occupare i loci."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "«Seme → germinazione → crescita» è una sequenza; «albero → conifere/latifoglie» è una tassonomia. Due diagrammi differenti, entrambi più utili di una fila di pa",
      "requestedOutput": "Mini-caso «azienda di biciclette»: distingui una lista di componenti da un processo di montaggio e scegli due visualizzazioni diverse.",
      "structuredChecks": [
        {
          "id": "S04-ic-1",
          "prompt": "Verifica della missione: Mini-caso «azienda di biciclette»: distingui una lista di componenti da un processo di montaggio e s...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Coerenza strutturale, non bellezza della mappa. Serve che l'utente sappia spiegare i collegamenti."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Coerenza strutturale, non bellezza della mappa. Serve che l'utente sappia spiegare i collegamenti."
    }
  },
  "S05": {
    "lessonId": "S05",
    "gameId": "S05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "hybrid_deterministic_and_rubric",
    "gradingReliability": "hybrid_recall_and_rubric",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Dal concetto al palazzo, senza perderlo»)?",
    "demonstrationOptions": [
      {
        "id": "S05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "S05-d2",
        "label": "Errore comune: Se ricordi «materiale» ma non perché lo hai scelto, il locus ha conser...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Nei percorsi di studio usa il luogo per recuperare la struttura, non sostituire il contenuto con immagini mute. Ogni locus dovrebbe evocare un titolo o una domanda che puoi spiegare. Se le informazioni hanno dipendenze c",
    "guidedPracticePrompt": "Assegna quattro concetti a quattro loci; dopo ogni assegnazione scrivi la domanda che il locus deve evocare.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S05-gp-check-1",
          "prompt": "Pratica guidata: Assegna quattro concetti a quattro loci; dopo ogni assegnazione scrivi la domanda che il locus deve evocare....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Lezione fittizia su un ponte: porta=carichi, divano=materiali, finestra=vincoli, lampada=verifica. Il percorso ti ricorda gli argomenti, ma per superarli devi spiegare come cambian"
        }
      ]
    },
    "widgetKind": "builder_then_blind_recall",
    "independentPrompt": "Nuova mini-materia su come progettare un orto scolastico: cinque tappe, tre dipendenze. Costruisci una rotta e spiega due relazioni senza guardare la mappa.",
    "progressiveHints": [
      "Se ricordi «materiale» ma non perché lo hai scelto, il locus ha conservato una parola, non una decisione.",
      "Per gli esami, usa il palazzo come indice di accesso a ciò che comprendi, non come sostituto della preparazione."
    ],
    "builderRecallSpec": {
      "assignments": [
        {
          "locusOrAnchor": "Scrivania",
          "targetToRemember": "clessidra"
        },
        {
          "locusOrAnchor": "Libreria",
          "targetToRemember": "bussola"
        },
        {
          "locusOrAnchor": "Finestra",
          "targetToRemember": "aquilone"
        }
      ],
      "minRecalledCount": 3
    }
  },
  "S06": {
    "lessonId": "S06",
    "gameId": "S06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "source_misconception",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Ripassa senza autosuggestione»)?",
    "demonstrationOptions": [
      {
        "id": "S06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "S06-d2",
        "label": "Errore comune: Hai guardato la soluzione durante il tentativo? Non è un fallimento: c...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un buon ripasso ha una domanda, un tentativo senza risposta visibile e un confronto che corregge l'errore. Poi torni sull'informazione dopo un intervallo, non solo immediatamente. L'intervallo adeguato dipende dalla diff",
    "guidedPracticePrompt": "Scegli fra quattro comportamenti di ripasso e ordina le fasi «domanda → risposta autonoma → confronto → prossimo controllo».",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "S06-gp-check-1",
          "prompt": "Pratica guidata: Scegli fra quattro comportamenti di ripasso e ordina le fasi «domanda → risposta autonoma → confronto → prossi...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Giorno 1 rileggi una definizione; giorno 2 la riscrivi senza testo e correggi ciò che manca; giorno 5 riprovi. La seconda procedura fornisce evidenza migliore del sapere."
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Due piccoli calendari mostrano studio e richiamo su un termine; indica quale contiene una verifica indipendente, poi crea una domanda per un concetto nuovo.",
    "progressiveHints": [
      "Hai guardato la soluzione durante il tentativo? Non è un fallimento: conta come studio assistito, non come prova autonoma.",
      "Quando userai una funzione di ripasso, prima prova, poi controlla, e annota la causa dell'errore."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Giorno 1 rileggi una definizione; giorno 2 la riscrivi senza testo e correggi ciò che manca; giorno 5 riprovi. La seconda procedura fornisce evidenza migliore d",
      "requestedOutput": "Due piccoli calendari mostrano studio e richiamo su un termine; indica quale contiene una verifica indipendente, poi crea una domanda per un concetto nuovo.",
      "structuredChecks": [
        {
          "id": "S06-ic-1",
          "prompt": "Verifica della missione: Due piccoli calendari mostrano studio e richiamo su un termine; indica quale contiene una verifica i...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Comprensione della procedura, non scheduling FSRS reale. Il delayed recall vero avverrà in app dopo un intervallo effettivo."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Comprensione della procedura, non scheduling FSRS reale. Il delayed recall vero avverrà in app dopo un intervallo effettivo."
    }
  },
  "C01": {
    "lessonId": "C01",
    "gameId": "C01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Il mazzo è una lingua, non un disegno»)?",
    "demonstrationOptions": [
      {
        "id": "C01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "C01-d2",
        "label": "Errore comune: Se sbagli J e Q, fissa la conversione delle figure prima di aggiungere...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Prima dei sistemi competitivi serve leggere fluentemente una carta: valore, seme, ordine e differenza tra figure. Non creare subito 52 personaggi. All'inizio separa «identifico la carta» da «la trasformo in immagine mnem",
    "guidedPracticePrompt": "Su un mini-mazzo di 12 carte, leggi valori e semi; il gioco ruota le carte, nasconde le etichette e chiede la dicitura corretta.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "C01-gp-check-1",
          "prompt": "Pratica guidata: Su un mini-mazzo di 12 carte, leggi valori e semi; il gioco ruota le carte, nasconde le etichette e chiede la ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Q♥ è Donna di cuori, 7♠ è sette di picche. Nella notazione internazionale A, J, Q, K rappresentano asso, fante, donna, re; i segni indicano i semi."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Nuove 8 carte non viste, miste; per quattro inserisci nome e seme, per quattro ordina secondo una sequenza specificata. Nessuna immagine-associazione suggerita.",
    "progressiveHints": [
      "Se sbagli J e Q, fissa la conversione delle figure prima di aggiungere PAO.",
      "Guardare le carte come simboli distinti riduce il tempo perso nella fase successiva."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "C02": {
    "lessonId": "C02",
    "gameId": "C02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Dai un'immagine a una carta»)?",
    "demonstrationOptions": [
      {
        "id": "C02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "C02-d2",
        "label": "Errore comune: Se due carte diventano entrambi «un cavallo», aggiungi un criterio sta...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un mazzo si memorizza meglio quando ogni carta ha una rappresentazione riconoscibile e distinta. Puoi usare persone, oggetti o azioni, ma prima devi stabilire una mappa coerente. Copiare una lista di un campione non ti r",
    "guidedPracticePrompt": "Scegli immagini per cinque carte con semi diversi e verifica che non collidano.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "C02-gp-check-1",
          "prompt": "Pratica guidata: Scegli immagini per cinque carte con semi diversi e verifica che non collidano....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Asso di picche → un'ancora nera; regina di cuori → una regina che porta un cuore gigante. Sono esempi arbitrari, non un sistema universalmente corretto. La prova è tornare dall'imm"
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Assegna codici ad altre quattro carte «4♣, 9♦, J♥, 2♠». Poi le icone vengono rimescolate: identifica le carte da sole immagini.",
    "progressiveHints": [
      "Se due carte diventano entrambi «un cavallo», aggiungi un criterio stabile (colore, azione, identità) o sostituisci una delle immagini.",
      "Usa soltanto il tuo lessico verificato quando passerai alle piccole sequenze."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "C03": {
    "lessonId": "C03",
    "gameId": "C03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "order_omission_inversion",
    "demonstrationQuestion": "Se ricordi tutte e 5 le carte ma in ordine sparso, hai superato la prova di sequenziamento?",
    "demonstrationOptions": [
      {
        "id": "c03-d1",
        "label": "No: per le sequenze di carte, la posizione esatta è vincolante quanto l'identità della carta.",
        "isCorrect": true
      },
      {
        "id": "c03-d2",
        "label": "Sì, l'ordine non ha importanza in un mazzo.",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Nei protocolli per le carte, il richiamo deve rispettare rigorosamente sia il valore che la posizione ordinale.",
    "guidedPracticePrompt": "Codifica tre carte fittizie con immagini già note e ripercorri il collegamento con le immagini visibili.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "C03-gp-check-1",
          "prompt": "Pratica guidata: Codifica tre carte fittizie con immagini già note e ripercorri il collegamento con le immagini visibili....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "L'asso di picche (ancora) trascina la regina di cuori (regina), che apre una porta e fa uscire un «4♣» rappresentato da una tua immagine. La scena deve essere tua, non una lista co"
        }
      ]
    },
    "widgetKind": "ordered_flash_recall",
    "independentPrompt": "Cinque carte estratte senza ripetizioni dal sottoinsieme di carte già codificate e verificate dall’utente, visibili per un breve periodo. Dopo hide seleziona da un mazzo completo o digita le sigle nell'ordine: il mazzo è mescolato e non segnala quale carta sia stata vista.",
    "progressiveHints": [
      "Se hai ricordato le cinque carte ma ne hai invertite due, la codifica funziona: manca l'indizio di ordine tra le scene.",
      "Prima di alzare il numero di carte, controlla la stabilità delle tue immagini."
    ],
    "orderedFlashSpec": {
      "targetWords": [
        "A♠",
        "7♥",
        "Q♦",
        "3♣",
        "10♠"
      ],
      "hideAfterSeconds": 10,
      "minOrderedPassCount": 5
    }
  },
  "C05": {
    "lessonId": "C05",
    "gameId": "C05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («La tua biblioteca da 52»)?",
    "demonstrationOptions": [
      {
        "id": "C05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "C05-d2",
        "label": "Errore comune: Se il tuo codice è impossibile da ricordare, riduci la fantasia e aume...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Un lessico da 52 è una struttura che si costruisce a blocchi. In questa lezione impari a progettare gruppi coerenti per seme e valore, ad evitare immagini duplicate e a distinguere una prima rappresentazione semplice da ",
    "guidedPracticePrompt": "Verifica dieci slot esistenti della tua libreria e segnala collisioni o immagini troppo vaghe.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "C05-gp-check-1",
          "prompt": "Pratica guidata: Verifica dieci slot esistenti della tua libreria e segnala collisioni o immagini troppo vaghe....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Se tutte le carte di cuori hanno un riferimento affettivo, può essere facile costruire famiglia di immagini, ma due figure troppo simili restano pericolose. Il criterio è sempre la"
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Popola otto carte nuove del tuo mazzo; poi il gioco mostra solo le rappresentazioni e tu rispondi con carta e seme senza opzioni.",
    "progressiveHints": [
      "Se il tuo codice è impossibile da ricordare, riduci la fantasia e aumenta la semplicità fisica delle immagini.",
      "Quando avrai una libreria stabile potrai allenare mazzi completi nella futura Palestra, non in questa introduzione."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "C04": {
    "lessonId": "C04",
    "gameId": "C04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "ambiguous_locus",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Dodici carte in un palazzo»)?",
    "demonstrationOptions": [
      {
        "id": "C04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "C04-d2",
        "label": "Errore comune: Se inverti due carte nello stesso locus, modifica l'azione: la prima d...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il palazzo crea una struttura di posizioni. Puoi collocare una o più immagini di carte per locus secondo una grammatica dichiarata. Oggi l'obiettivo non è stabilire un record: è capire come si distribuiscono scene divers",
    "guidedPracticePrompt": "Assegna sei coppie predefinite ai sei loci e descrivi un gesto per ciascuna; controlla una volta la mappa.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "C04-gp-check-1",
          "prompt": "Pratica guidata: Assegna sei coppie predefinite ai sei loci e descrivi un gesto per ciascuna; controlla una volta la mappa....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Sei loci, due carte ciascuno: prima carta agisce sulla seconda. Il locus è il «contenitore», l'interazione decide l'ordine interno della coppia."
        }
      ]
    },
    "widgetKind": "ordered_flash_recall",
    "independentPrompt": "Dodici carte casuali pescate soltanto dall’insieme di carte già associate a immagini e verificate dall’utente, con un seed unico e nessuna ripetizione. Vengono mostrati sei loci vuoti; dopo l'encoding la mappa sparisce e devi ricostruire la sequenza completa.",
    "progressiveHints": [
      "Se inverti due carte nello stesso locus, modifica l'azione: la prima deve fare qualcosa alla seconda, non il contrario.",
      "Usa una grammatica stabile quando aumenti la densità dei loci."
    ],
    "orderedFlashSpec": {
      "targetWords": [
        "anello",
        "barca",
        "castello",
        "drago",
        "elmo"
      ],
      "hideAfterSeconds": 12,
      "minOrderedPassCount": 4
    }
  },
  "X01": {
    "lessonId": "X01",
    "gameId": "X01-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («PAO: tre ruoli, una scena»)?",
    "demonstrationOptions": [
      {
        "id": "X01-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X01-d2",
        "label": "Errore comune: Se non sai da quale codice arrivi una «spada», il ruolo oggetto non è ...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "PAO è una grammatica: una codifica produce una persona, un'azione e un oggetto, provenienti da codici distinti. Le tre componenti devono avere ruoli stabili e decodificabili. Non confondere una scena con tre persone, né ",
    "guidedPracticePrompt": "Tre colonne Persona / Azione / Oggetto e tre icone. Trascina i componenti nella colonna corretta; modifica una scena che viola i ruoli.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X01-gp-check-1",
          "prompt": "Pratica guidata: Tre colonne Persona / Azione / Oggetto e tre icone. Trascina i componenti nella colonna corretta; modifica una...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Un codice 12 evoca un personaggio fittizio, 34 un'azione e 56 un oggetto. Nella stessa scena il personaggio compie quell'azione sull'oggetto. Senza conoscere la tua tabella non pos"
        }
      ]
    },
    "widgetKind": "pao_scene_codec",
    "independentPrompt": "Usando sei codici già definiti dal tuo profilo, costruisci due scene PAO da tre coppie ciascuna e poi decodifica la sequenza numerica nascosta.",
    "progressiveHints": [
      "Se non sai da quale codice arrivi una «spada», il ruolo oggetto non è sufficientemente stabile nella tua libreria.",
      "La compressione vale soltanto se puoi sciogliere correttamente ogni scena."
    ],
    "paoSpec": {
      "sixDigitTargets": [
        "143252"
      ],
      "targets": [
        {
          "digits": "14",
          "person": "Toro",
          "action": "Corre",
          "object": "Luna"
        }
      ]
    }
  },
  "X02": {
    "lessonId": "X02",
    "gameId": "X02-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Binario a gruppi»)?",
    "demonstrationOptions": [
      {
        "id": "X02-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X02-d2",
        "label": "Errore comune: Hai ricostruito `110101001`? I codici erano giusti ma l'ordine dei loc...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Il binario usa soltanto zero e uno. Per ricordarlo puoi creare codici fissi per blocchi di bit; tre bit danno otto combinazioni, da 000 a 111. Il raggruppamento riduce il numero di unità da mantenere in mente, ma devi ri",
    "guidedPracticePrompt": "Trascina blocchi da 3 bit in otto caselle numerate da 000 a 111; il gioco mostra la differenza tra 010 e 100.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X02-gp-check-1",
          "prompt": "Pratica guidata: Trascina blocchi da 3 bit in otto caselle numerate da 000 a 111; il gioco mostra la differenza tra 010 e 100....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "`101101` → `101 | 101`: due gruppi uguali. Assegna un'immagine al gruppo 101 e collocala in due loci diversi; poi riespandi entrambi i gruppi."
        }
      ]
    },
    "widgetKind": "long_number_chunks",
    "independentPrompt": "Sequenza nuova `110001101`; dividila in tre blocchi, ricostruisci la sequenza dopo hide e indica il blocco centrale.",
    "progressiveHints": [
      "Hai ricostruito `110101001`? I codici erano giusti ma l'ordine dei loci si è confuso.",
      "È una porta d'ingresso alla memorizzazione competitiva, non una necessità per la vita quotidiana."
    ],
    "longNumbersSpec": {
      "sequences": [
        "14325292"
      ],
      "expectedPairs": [
        [
          "14",
          "32",
          "52",
          "92"
        ]
      ]
    }
  },
  "X03": {
    "lessonId": "X03",
    "gameId": "X03-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Citazione esatta o idea corretta?»)?",
    "demonstrationOptions": [
      {
        "id": "X03-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X03-d2",
        "label": "Errore comune: Hai scritto un sinonimo corretto ma non identico? Ottima comprensione,...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Ricordare il senso generale e ricordare una formulazione esatta sono due obiettivi differenti. Per la memorizzazione verbatim serve attenzione a ordine, ritmo, struttura e parole funzionali; per una presentazione bastano",
    "guidedPracticePrompt": "Il gioco oscura tre parole del verso e chiede di ricostruirle senza banca di opzioni; poi confronta spazi e punteggiatura senza penalità eccessive.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X03-gp-check-1",
          "prompt": "Pratica guidata: Il gioco oscura tre parole del verso e chiede di ricostruirle senza banca di opzioni; poi confronta spazi e pu...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Verso originale di LOCO: «La finestra aspetta il vento / e la chiave cerca il cielo». Ricordare «finestra, vento, chiave, cielo» non dimostra di aver memorizzato tutte le parole."
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Nuovo distico originale: «Sul ponte dorme una vela / la notte custodisce il faro». Dopo breve studio, digita il testo completo e indica due differenze fra senso e forma.",
    "progressiveHints": [
      "Hai scritto un sinonimo corretto ma non identico? Ottima comprensione, ma la prova verbatim misura la formula esatta.",
      "Scegli sempre se l'esame o il discorso richiede parole identiche o spiegazioni personali."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Verso originale di LOCO: «La finestra aspetta il vento / e la chiave cerca il cielo». Ricordare «finestra, vento, chiave, cielo» non dimostra di aver memorizzat",
      "requestedOutput": "Nuovo distico originale: «Sul ponte dorme una vela / la notte custodisce il faro». Dopo breve studio, digita il testo completo e indica due differenze fra senso",
      "structuredChecks": [
        {
          "id": "X03-ic-1",
          "prompt": "Verifica della missione: Nuovo distico originale: «Sul ponte dorme una vela / la notte custodisce il faro». Dopo breve studio...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Punteggio parola per parola e ordine; segnala omissioni e sostituzioni; non usare testi protetti dai libri."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Punteggio parola per parola e ordine; segnala omissioni e sostituzioni; non usare testi protetti dai libri."
    }
  },
  "X04": {
    "lessonId": "X04",
    "gameId": "X04-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "deterministic_exact",
    "gradingReliability": "deterministic_verified",
    "defaultErrorCategory": "weak_cue",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Capitali, elementi e coppie arbitrarie»)?",
    "demonstrationOptions": [
      {
        "id": "X04-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X04-d2",
        "label": "Errore comune: Se da «Rivasole» torni a «Toravia», i tuoi due indizi si somigliano tr...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Le coppie arbitrarie richiedono due indizi: uno porta da A a B, l'altro permette di tornare da B ad A. Non usare associazioni che cancellano una metà. Per questa demo usiamo un mondo immaginario: paesi, città e simboli i",
    "guidedPracticePrompt": "Associa quattro coppie di paesi fittizi e capitali con piccole scene e fai un doppio test A→B e B→A.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X04-gp-check-1",
          "prompt": "Pratica guidata: Associa quattro coppie di paesi fittizi e capitali con piccole scene e fai un doppio test A→B e B→A....",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Paese fittizio «Lunaria» → capitale «Ponteblu». Una luna enorme solleva un ponte blu sopra un fiume; dal ponte blu devi poter tornare a Lunaria, non genericamente a «notte»."
        }
      ]
    },
    "widgetKind": "pairs_blind_recall",
    "independentPrompt": "Nuovi paesi inventati «Toravia → Altomare», «Belcoro → Rivasole». Costruisci indizi e recupera entrambi i versi senza lista visibile.",
    "progressiveHints": [
      "Se da «Rivasole» torni a «Toravia», i tuoi due indizi si somigliano troppo. Differenzia la scena fondamentale.",
      "La stessa struttura serve per formule, nomi-scoperte e terminologie tecniche."
    ],
    "pairsRecallSpec": {
      "studyPairs": [
        {
          "cue": "chiave",
          "target": "scrigno",
          "contextHint": "rotola nello scrigno"
        },
        {
          "cue": "faro",
          "target": "balena",
          "contextHint": "illumina la balena"
        },
        {
          "cue": "aquila",
          "target": "vetta",
          "contextHint": "atterra sulla vetta"
        }
      ],
      "minCorrectCount": 3
    }
  },
  "X05": {
    "lessonId": "X05",
    "gameId": "X05-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Ortografia e parole difficili»)?",
    "demonstrationOptions": [
      {
        "id": "X05-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X05-d2",
        "label": "Errore comune: Hai ricordato la parola ma omesso una doppia: il cue deve puntare alla...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Ortografia, pronuncia e significato possono divergere. Per una parola difficile cerca il pezzo che tendi a sbagliare e costruisci un indizio esclusivamente per quel punto. Non codificare tutta la parola quando il problem",
    "guidedPracticePrompt": "In tre parole conosciute individua il punto che cambia tra grafia corretta ed errore; ricostruisci le lettere in ordine.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X05-gp-check-1",
          "prompt": "Pratica guidata: In tre parole conosciute individua il punto che cambia tra grafia corretta ed errore; ricostruisci le lettere ...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "In «acquazzone» potresti confondere la sequenza «cqu». Immagina tre cartelli successivi C-Q-U che sbattono sulla porta della piscina. L'immagine serve a richiamare l'ordine, ma la "
        }
      ]
    },
    "widgetKind": "structured_plus_rubric",
    "independentPrompt": "Nuova parola italiana «soprattutto»; dopo breve studio, una frase lacunosa la richiede senza opzioni. Se sbagli, indica dove sta l'errore e costruisci un cue per quella parte.",
    "progressiveHints": [
      "Hai ricordato la parola ma omesso una doppia: il cue deve puntare alla doppia, non all'idea generale.",
      "In un testo di studio, usa la tecnica solo per grafie davvero difficili per te."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "In «acquazzone» potresti confondere la sequenza «cqu». Immagina tre cartelli successivi C-Q-U che sbattono sulla porta della piscina. L'immagine serve a richiam",
      "requestedOutput": "Nuova parola italiana «soprattutto»; dopo breve studio, una frase lacunosa la richiede senza opzioni. Se sbagli, indica dove sta l'errore e costruisci un cue pe",
      "structuredChecks": [
        {
          "id": "X05-ic-1",
          "prompt": "Verifica della missione: Nuova parola italiana «soprattutto»; dopo breve studio, una frase lacunosa la richiede senza opzioni...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Stringa esatta con normalizzazione spazi; non considerare sinonimi corretti. Il dizionario della lingua va verificato prima del rilascio."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Stringa esatta con normalizzazione spazi; non considerare sinonimi corretti. Il dizionario della lingua va verificato prima del rilascio."
    }
  },
  "X06": {
    "lessonId": "X06",
    "gameId": "X06-lab-v5",
    "datasetVersion": "5.0.0-a",
    "assessmentMode": "rubric_manual",
    "gradingReliability": "rubric_guided_self_check",
    "defaultErrorCategory": "retention_decay",
    "demonstrationQuestion": "Qual è il principio chiave di questa lezione («Che cosa misurano i campioni?»)?",
    "demonstrationOptions": [
      {
        "id": "X06-d1",
        "label": "Recupero attivo autentico a stimolo nascosto.",
        "isCorrect": true
      },
      {
        "id": "X06-d2",
        "label": "Errore comune: Se confondi il tempo di studio con il tempo di recupero, stai confront...",
        "isCorrect": false
      }
    ],
    "demonstrationModelReveal": "Le discipline agonistiche misurano prestazioni specifiche: accuratezza, velocità, quantità di informazioni, tipo di materiale e condizioni di prova. Un sistema da gara è costruito per un obiettivo preciso, non per una me",
    "guidedPracticePrompt": "Confronta due schede di risultato con stessi cinque bersagli, ma prove diverse. Indica quale dimostra richiamo in ordine e quale soltanto riconoscimento.",
    "guidedPracticeTask": {
      "kind": "structured_checks",
      "checks": [
        {
          "id": "X06-gp-check-1",
          "prompt": "Pratica guidata: Confronta due schede di risultato con stessi cinque bersagli, ma prove diverse. Indica quale dimostra richiamo...",
          "options": [
            {
              "id": "ok",
              "label": "Ho completato l'interazione guidata applicando la tecnica"
            },
            {
              "id": "help",
              "label": "Ho bisogno di rivedere l'esempio guidato"
            }
          ],
          "correctOptionId": "ok",
          "explanation": "Cinque carte ricordate esattamente in ordine sono una prova diversa da cinque carte riconosciute tra otto opzioni. Anche tempo e protocollo cambiano il risultato."
        }
      ]
    },
    "widgetKind": "metrics_and_trials_lab",
    "independentPrompt": "Simula un report di una gara di carte fittizia: 12 carte, 2 minuti studio, recall cieco, una inversione. Scrivi quale metrica è corretta e quale claim sarebbe fuorviante.",
    "progressiveHints": [
      "Se confondi il tempo di studio con il tempo di recupero, stai confrontando due attività differenti.",
      "Quando svilupperemo la Palestra, le discipline e le classifiche dovranno avere protocolli chiari e confrontabili."
    ],
    "structuredPlusRubricSpec": {
      "stimulusText": "Cinque carte ricordate esattamente in ordine sono una prova diversa da cinque carte riconosciute tra otto opzioni. Anche tempo e protocollo cambiano il risultat",
      "requestedOutput": "Simula un report di una gara di carte fittizia: 12 carte, 2 minuti studio, recall cieco, una inversione. Scrivi quale metrica è corretta e quale claim sarebbe f",
      "structuredChecks": [
        {
          "id": "X06-ic-1",
          "prompt": "Verifica della missione: Simula un report di una gara di carte fittizia: 12 carte, 2 minuti studio, recall cieco, una inversi...",
          "options": [
            {
              "id": "verified",
              "label": "Ho eseguito la prova verificando il recupero autentico"
            },
            {
              "id": "partial",
              "label": "Ho completato parzialmente la prova"
            }
          ],
          "correctOptionId": "verified",
          "explanation": "Individua almeno tre dimensioni del protocollo e non chiama «record» un test non comparabile."
        }
      ],
      "openPromptLabel": "Spiega brevemente come hai applicato la tecnica e come hai verificato il risultato:",
      "openPromptPlaceholder": "Descrivi il recupero a stimolo nascosto e l'indizio utilizzato...",
      "rubricCriteria": [
        "Ho tentato il recupero a stimolo nascosto prima di verificare la soluzione",
        "Ho formulato un indizio/ancora specifico e non invertibile",
        "Ho diagnosticato eventuali punti deboli della codifica",
        "Posso applicare la stessa procedura su materiale nuovo"
      ],
      "modelReferenceAfterSubmit": "Individua almeno tre dimensioni del protocollo e non chiama «record» un test non comparabile."
    }
  }
};

// Backward compatibility alias
export const ACADEMY_V2_MISSIONS = ACADEMY_V5_MISSIONS;
export const RAW_PLAYER_CONTENT_V2 = {
  version: ACADEMY_V5_SCHEMA_VERSION,
  lessons: curriculumV5.lessons.map((l) => ({
    id: l.id,
    courseId: `course-${l.path.toLowerCase().replace(/\s+/g, "-")}`,
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
      stepId: `${l.id}-step-${idx + 1}`,
      type: s.kind === "guided_interaction" ? "guided_practice" : s.kind === "worked_example" ? "demonstration" : s.kind === "error_feedback" ? "diagnostic_feedback" : s.kind,
      title: s.label,
      body: s.text,
      prompt: s.text,
    })),
  })),
};
