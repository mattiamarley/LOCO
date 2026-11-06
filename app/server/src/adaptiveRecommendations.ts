// LOCO Backend Blueprint v2 — src/adaptiveRecommendations.ts
// Explainable rule-based decision engine for study & training interventions
// and post-intervention outcome evaluation with strict comparability checks.

import { randomUUID } from 'node:crypto';
import type { UUID } from './models.ts';
import type {
  InterventionOutcomeEvaluation,
  InterventionRationaleCode,
  LearningIntervention,
  LocusConfusionPairStat,
  MemoryMetricKey,
  MetricValueSnapshot,
  SkillItemDiagnosticStat,
  TrialDiagnosticRecord
} from './models.v2.ts';
import {
  computeAllMemoryMetrics,
  computeLocusConfusionStats,
  computeSkillItemStats,
  FORMULA_VERSION
} from './memoryMetrics.ts';

export const ADAPTIVE_ALGORITHM_VERSION = 'adaptive-rules-v2.0';
export const MIN_GLOBAL_TRIALS_THRESHOLD = 20;

export interface AdaptiveDecisionInput {
  ownerId: UUID;
  trials: TrialDiagnosticRecord[];
  minTrialsThreshold?: number;
  nowIso?: string;
}

export function generateAdaptiveInterventions(
  input: AdaptiveDecisionInput
): LearningIntervention[] {
  const nowIso = input.nowIso ?? new Date().toISOString();
  const minThreshold = input.minTrialsThreshold ?? MIN_GLOBAL_TRIALS_THRESHOLD;
  const totalTrials = input.trials.length;

  // Rule 0: Insufficient data guard — never fabricate proficiency or opaque profiling
  if (totalTrials < minThreshold) {
    return [
      {
        id: randomUUID(),
        ownerId: input.ownerId,
        rationaleCode: 'insufficient_data_baseline',
        algorithmVersion: ADAPTIVE_ALGORITHM_VERSION,
        metricVersion: FORMULA_VERSION,
        targetScope: 'global',
        targetId: null,
        skill: null,
        stimulusKey: null,
        recommendedAction: 'continue_baseline',
        explanation: `Storico insufficiente (${totalTrials}/${minThreshold} prove valide). Continua le sessioni base prima di attivare adattamenti personalizzati.`,
        evidence: {
          sampleSize: totalTrials,
          requiredMinSampleSize: minThreshold
        },
        sampleSize: totalTrials,
        confidenceLevel: 'insufficient',
        status: 'proposed',
        createdAt: nowIso
      }
    ];
  }

  const metrics = computeAllMemoryMetrics({ trials: input.trials, computedAt: nowIso });
  const itemStats = computeSkillItemStats(input.trials);
  const locusConfusions = computeLocusConfusionStats(input.trials);
  const interventions: LearningIntervention[] = [];

  function pushIntervention(params: {
    rationaleCode: InterventionRationaleCode;
    targetScope: LearningIntervention['targetScope'];
    targetId?: UUID | null;
    skill?: LearningIntervention['skill'];
    stimulusKey?: string | null;
    recommendedAction: string;
    explanation: string;
    evidence: Record<string, unknown>;
    sampleSize: number;
  }): void {
    const confidenceLevel =
      params.sampleSize >= 40 ? 'high' : params.sampleSize >= 20 ? 'medium' : 'low';
    interventions.push({
      id: randomUUID(),
      ownerId: input.ownerId,
      rationaleCode: params.rationaleCode,
      algorithmVersion: ADAPTIVE_ALGORITHM_VERSION,
      metricVersion: FORMULA_VERSION,
      targetScope: params.targetScope,
      targetId: params.targetId ?? null,
      skill: params.skill ?? null,
      stimulusKey: params.stimulusKey ?? null,
      recommendedAction: params.recommendedAction,
      explanation: params.explanation,
      evidence: params.evidence,
      sampleSize: params.sampleSize,
      confidenceLevel,
      status: 'proposed',
      createdAt: nowIso
    });
  }

  // Rule 1: Repeated errors on the same learning_target -> priority recall + revise association
  const targetTrials = new Map<UUID, TrialDiagnosticRecord[]>();
  for (const t of input.trials) {
    if (!t.learningTargetId) continue;
    const list = targetTrials.get(t.learningTargetId) ?? [];
    list.push(t);
    targetTrials.set(t.learningTargetId, list);
  }
  for (const [targetId, list] of targetTrials.entries()) {
    const recent = list.slice(-5);
    const errors = recent.filter((t) => !t.isCorrect || t.viewedAnswerBeforeAttempt);
    if (errors.length >= 2) {
      pushIntervention({
        rationaleCode: 'repeated_target_errors_revise_association',
        targetScope: 'learning_target',
        targetId,
        skill: recent[0].skill,
        stimulusKey: recent[0].stimulusKey,
        recommendedAction: 'revise_association_and_prioritize_recall',
        explanation: `Rilevati ${errors.length} errori ravvicinati sulla stessa nozione. Rafforza l'immagine mnemonica aumentandone azione e contrasto prima del prossimo richiamo.`,
        evidence: {
          recentTrialsCount: recent.length,
          recentErrorCount: errors.length,
          lastAssociationRevision: recent[recent.length - 1].associationRevision ?? 1
        },
        sampleSize: list.length
      });
    }
  }

  // Rule 2: Neighbor loci swaps (e.g. locus 3 <-> locus 4) -> random order retrieval or contrast increase
  for (const conf of locusConfusions) {
    if (conf.swapCount >= 2) {
      pushIntervention({
        rationaleCode: 'neighbor_loci_swap_interleaving',
        targetScope: 'locus',
        targetId: conf.locusId,
        skill: 'loci',
        stimulusKey: `locus:${conf.expectedOrdinal}<->${conf.actualOrdinal}`,
        recommendedAction: 'random_locus_retrieval_and_contrast',
        explanation: `Scambio frequente tra locus ${conf.expectedOrdinal} e locus ${conf.actualOrdinal} (${conf.swapCount} inversioni). Esegui un richiamo in ordine casuale e differenzia visivamente i due punti.`,
        evidence: {
          palaceId: conf.palaceId,
          expectedOrdinal: conf.expectedOrdinal,
          actualOrdinal: conf.actualOrdinal,
          swapCount: conf.swapCount,
          positionErrorRate: conf.positionErrorRate
        },
        sampleSize: conf.nTrials
      });
    }
  }

  // Rule 3: Major 00-99 slow or confused pair (e.g. 36 slow or confused with 63) -> targeted bidirectional drill
  for (const stat of itemStats) {
    if (stat.skill !== 'major') continue;
    const isSlow = stat.medianRetrievalMs !== null && stat.medianRetrievalMs > 3500;
    const isLowAcc = stat.nTrials >= 4 && stat.unassistedAccuracy < 0.7;
    if (isSlow || isLowAcc || stat.topConfusionCount >= 2) {
      pushIntervention({
        rationaleCode: 'slow_major_pair_bidirectional_drill',
        targetScope: 'skill',
        skill: 'major',
        stimulusKey: stat.stimulusKey,
        recommendedAction: 'targeted_bidirectional_major_drill',
        explanation: `Conversione ${stat.stimulusKey} (${stat.direction}) lenta o imprecisa${
          stat.topConfusedWithKey ? `, spesso confusa con ${stat.topConfusedWithKey}` : ''
        }. Allena il recupero bidirezionale numero→immagine e immagine→numero prima di progredire.`,
        evidence: {
          stimulusKey: stat.stimulusKey,
          direction: stat.direction,
          unassistedAccuracy: stat.unassistedAccuracy,
          medianRetrievalMs: stat.medianRetrievalMs,
          topConfusedWithKey: stat.topConfusedWithKey,
          topConfusionCount: stat.topConfusionCount
        },
        sampleSize: stat.nTrials
      });
    }
  }

  // Rule 4: High immediate accuracy but low delayed accuracy -> increase delayed retrieval spacing
  const imm = metrics.immediate_recall_accuracy;
  const del = metrics.delayed_recall_accuracy;
  if (
    imm.rawValue !== null &&
    del.rawValue !== null &&
    imm.rawValue >= 0.8 &&
    del.rawValue < 0.65
  ) {
    pushIntervention({
      rationaleCode: 'high_immediate_low_delayed_increase_spacing',
      targetScope: 'schedule',
      recommendedAction: 'increase_delayed_retrieval_ratio',
      explanation: `Accuratezza immediata alta (${Math.round(
        imm.rawValue * 100
      )}%) ma ritenzione differita bassa (${Math.round(
        del.rawValue * 100
      )}%). Aumenta la quota di retrieval differito a libro chiuso senza rileggere prima la risposta.`,
      evidence: {
        immediateAccuracy: imm.rawValue,
        delayedAccuracy: del.rawValue,
        immediateSample: imm.sampleSize,
        delayedSample: del.sampleSize
      },
      sampleSize: imm.sampleSize + del.sampleSize
    });
  }

  // Rule 5: High hint dependency -> closed-book recall
  const hintDep = metrics.hint_dependency;
  if (hintDep.rawValue !== null && hintDep.rawValue >= 0.35) {
    pushIntervention({
      rationaleCode: 'high_hint_dependency_closed_book_recall',
      targetScope: 'global',
      recommendedAction: 'closed_book_recall_without_hints',
      explanation: `Uso di aiuti nel ${Math.round(
        hintDep.rawValue * 100
      )}% dei tentativi. Prova il richiamo libero prima di chiedere indizi per consolidare il recupero autonomo.`,
      evidence: {
        hintDependencyRatio: hintDep.rawValue,
        breakdown: hintDep.breakdown
      },
      sampleSize: hintDep.sampleSize
    });
  }

  // Rule 6: Conceptual vs decoding gap -> explain prompt mode
  const errorBreakdown = (metrics.error_rate.breakdown.byCategory ?? {}) as Record<
    string,
    number
  >;
  if ((errorBreakdown.conceptual ?? 0) >= 3) {
    pushIntervention({
      rationaleCode: 'conceptual_vs_decoding_gap_explain_mode',
      targetScope: 'skill',
      skill: 'abstract',
      recommendedAction: 'add_explain_learning_targets',
      explanation: `Rilevati ${errorBreakdown.conceptual} errori concettuali nonostante il ricordo dell'immagine. Aggiungi un learning_target in modalità 'explain' per collegare il locus alla spiegazione completa.`,
      evidence: {
        conceptualErrors: errorBreakdown.conceptual,
        decodingErrors: errorBreakdown.decoding ?? 0
      },
      sampleSize: totalTrials
    });
  }

  // Fallback Rule 7: Strong mastery -> ready for harder or delayed test
  if (interventions.length === 0) {
    const unassistedCorrect = input.trials.filter(
      (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
    ).length;
    const unassistedAcc = Number((unassistedCorrect / totalTrials).toFixed(4));
    if (unassistedAcc >= 0.85) {
      pushIntervention({
        rationaleCode: 'ready_for_harder_or_delayed_test',
        targetScope: 'global',
        recommendedAction: 'harder_skill_or_delayed_test',
        explanation: `Ottima accuratezza autonoma (${Math.round(
          unassistedAcc * 100
        )}% su ${totalTrials} prove). Puoi passare a un test differito a 24h o aumentare la complessità.`,
        evidence: {
          unassistedAccuracy: unassistedAcc,
          totalTrials
        },
        sampleSize: totalTrials
      });
    }
  }

  return interventions;
}

export interface EvaluateInterventionInput {
  interventionId: UUID;
  metricKey: MemoryMetricKey;
  polarity: 'higher_better' | 'lower_better';
  preTrials: TrialDiagnosticRecord[];
  postTrials: TrialDiagnosticRecord[];
  minSamplePerPhase?: number;
  evaluatedAt?: string;
}

/**
 * Evaluates whether an intervention improved performance.
 * If pre/post trials come from different skills, directions, or comparability groups,
 * or if the sample size is too small, returns `inconclusive` (never claims false causality).
 */
export function evaluateInterventionOutcome(
  input: EvaluateInterventionInput
): InterventionOutcomeEvaluation {
  const minSample = input.minSamplePerPhase ?? 8;
  const evaluatedAt = input.evaluatedAt ?? new Date().toISOString();
  const preSampleSize = input.preTrials.length;
  const postSampleSize = input.postTrials.length;

  if (preSampleSize < minSample || postSampleSize < minSample) {
    return {
      interventionId: input.interventionId,
      metricKey: input.metricKey,
      preSampleSize,
      postSampleSize,
      preValue: null,
      postValue: null,
      comparabilityVerified: false,
      outcomeStatus: 'inconclusive',
      evaluationReason: `Campione insufficiente per il confronto (pre=${preSampleSize}, post=${postSampleSize}, minimo=${minSample}).`,
      evaluatedAt
    };
  }

  const preGroups = new Set(
    input.preTrials.map((t) => `${t.skill}:${t.direction}:${t.comparabilityGroup}`)
  );
  const postGroups = new Set(
    input.postTrials.map((t) => `${t.skill}:${t.direction}:${t.comparabilityGroup}`)
  );

  const sameGroup =
    preGroups.size === 1 &&
    postGroups.size === 1 &&
    Array.from(preGroups)[0] === Array.from(postGroups)[0];

  if (!sameGroup) {
    return {
      interventionId: input.interventionId,
      metricKey: input.metricKey,
      preSampleSize,
      postSampleSize,
      preValue: null,
      postValue: null,
      comparabilityVerified: false,
      outcomeStatus: 'inconclusive',
      evaluationReason:
        'Prove pre e post non confrontabili (skill, direzione o difficoltà differenti).',
      evaluatedAt
    };
  }

  const preAcc =
    input.preTrials.filter(
      (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
    ).length / preSampleSize;
  const postAcc =
    input.postTrials.filter(
      (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
    ).length / postSampleSize;

  const preValue = Number(preAcc.toFixed(4));
  const postValue = Number(postAcc.toFixed(4));
  const delta = postValue - preValue;
  const effectiveDelta = input.polarity === 'higher_better' ? delta : -delta;

  let outcomeStatus: InterventionOutcomeEvaluation['outcomeStatus'] = 'no_change';
  if (effectiveDelta >= 0.05) {
    outcomeStatus = 'improved';
  } else if (effectiveDelta <= -0.05) {
    outcomeStatus = 'regressed';
  }

  return {
    interventionId: input.interventionId,
    metricKey: input.metricKey,
    preSampleSize,
    postSampleSize,
    preValue,
    postValue,
    comparabilityVerified: true,
    outcomeStatus,
    evaluationReason: `Confronto verificato su gruppo omogeneo (delta=${delta >= 0 ? '+' : ''}${delta.toFixed(
      3
    )}).`,
    evaluatedAt
  };
}

export type { MetricValueSnapshot, SkillItemDiagnosticStat, LocusConfusionPairStat };
