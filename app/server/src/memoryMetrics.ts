// LOCO Backend Blueprint v2 — src/memoryMetrics.ts
// Versioned calculation engine for the 18 Memory Performance metric families,
// directional skill item stats (Major 00-99 forward vs reverse), and locus swap diagnostics.

import type { DataConfidenceLevel, ErrorCategory, SkillKind, UUID } from './models.ts';
import {
  ALL_MEMORY_METRIC_KEYS,
  type DelayBucket,
  type LocusConfusionPairStat,
  type MemoryMetricDefinition,
  type MemoryMetricKey,
  type MetricValueSnapshot,
  type SkillItemDiagnosticStat,
  type TrialDiagnosticRecord
} from './models.v2.ts';

export { ALL_MEMORY_METRIC_KEYS };
export const FORMULA_VERSION = 'v2.0';

export const METRIC_DEFINITIONS: Record<MemoryMetricKey, MemoryMetricDefinition> = {
  immediate_recall_accuracy: {
    metricKey: 'immediate_recall_accuracy',
    dashboardSection: 'overview',
    displayName: 'Immediate Recall Accuracy',
    unit: 'ratio',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Risposte corrette senza aiuti su prove immediate valide (< 24h).'
  },
  delayed_recall_accuracy: {
    metricKey: 'delayed_recall_accuracy',
    dashboardSection: 'overview',
    displayName: 'Delayed Recall Accuracy',
    unit: 'ratio',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Risposte corrette senza aiuti a distanza (>= 24h dall’ultimo studio).'
  },
  encoding_speed: {
    metricKey: 'encoding_speed',
    dashboardSection: 'overview',
    displayName: 'Encoding Speed',
    unit: 'ms',
    polarity: 'lower_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Mediana millisecondi per elemento codificato su compiti comparabili.'
  },
  retrieval_speed: {
    metricKey: 'retrieval_speed',
    dashboardSection: 'overview',
    displayName: 'Retrieval Speed',
    unit: 'ms',
    polarity: 'lower_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Mediana tempo di risposta (ms) su tentativi corretti e autonomi.'
  },
  retention_efficiency: {
    metricKey: 'retention_efficiency',
    dashboardSection: 'overview',
    displayName: 'Retention Efficiency',
    unit: 'items_per_min',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Elementi ricordati correttamente a distanza per minuto attivo di studio.'
  },
  learning_rate: {
    metricKey: 'learning_rate',
    dashboardSection: 'learning_analytics',
    displayName: 'Learning Rate',
    unit: 'ratio',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 20,
    defaultWindowDays: 28,
    description: 'Variazione di accuratezza autonoma tra prima e seconda metà della finestra.'
  },
  error_rate: {
    metricKey: 'error_rate',
    dashboardSection: 'learning_analytics',
    displayName: 'Error Rate',
    unit: 'ratio',
    polarity: 'lower_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Quota complessiva e distribuzione per categoria di errore (position/decoding/conceptual).'
  },
  hint_dependency: {
    metricKey: 'hint_dependency',
    dashboardSection: 'learning_analytics',
    displayName: 'Hint Dependency',
    unit: 'ratio',
    polarity: 'lower_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Quota di tentativi con richiesta di aiuto, distinta dalla visione anticipata della risposta.'
  },
  memory_stability: {
    metricKey: 'memory_stability',
    dashboardSection: 'learning_analytics',
    displayName: 'Memory Stability',
    unit: 'days',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Stima mediana di stabilità in giorni dello scheduler sulle learning target attive.'
  },
  recall_consistency: {
    metricKey: 'recall_consistency',
    dashboardSection: 'learning_analytics',
    displayName: 'Recall Consistency',
    unit: 'ratio',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 15,
    defaultWindowDays: 28,
    description: 'Stabilità della performance (1 - dispersione) tra prove equivalenti.'
  },
  training_volume: {
    metricKey: 'training_volume',
    dashboardSection: 'overview',
    displayName: 'Training Volume',
    unit: 'count',
    polarity: 'neutral',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 1,
    defaultWindowDays: 28,
    description: 'Totale prove valide e minuti attivi nel periodo (non confondere con apprendimento).'
  },
  review_efficiency: {
    metricKey: 'review_efficiency',
    dashboardSection: 'learning_analytics',
    displayName: 'Review Efficiency',
    unit: 'trials_per_item',
    polarity: 'lower_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Tentativi medi necessari per raggiungere 3 richiami autonomi corretti.'
  },
  spatial_memory: {
    metricKey: 'spatial_memory',
    dashboardSection: 'memory_skills',
    displayName: 'Spatial Memory',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 12,
    defaultWindowDays: 28,
    description: 'Accuratezza spaziale nei loci senza errori di posizione.'
  },
  visual_encoding: {
    metricKey: 'visual_encoding',
    dashboardSection: 'memory_skills',
    displayName: 'Visual Encoding',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 12,
    defaultWindowDays: 28,
    description: 'Rapidità e correttezza di codifica su prove visive, immagini e scene 3D.'
  },
  numerical_memory: {
    metricKey: 'numerical_memory',
    dashboardSection: 'memory_skills',
    displayName: 'Numerical Memory',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 12,
    defaultWindowDays: 28,
    description: 'Accuratezza e rapidità su numeri, Major 00–99 e PAO distinte per direzione.'
  },
  conceptual_association: {
    metricKey: 'conceptual_association',
    dashboardSection: 'memory_skills',
    displayName: 'Conceptual Association',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 10,
    defaultWindowDays: 28,
    description: 'Capacità di decodificare l’associazione e spiegare correttamente il concetto.'
  },
  sequential_memory: {
    metricKey: 'sequential_memory',
    dashboardSection: 'memory_skills',
    displayName: 'Sequential Memory',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 12,
    defaultWindowDays: 28,
    description: 'Accuratezza dell’ordine sequenziale e assenza di salti nei percorsi.'
  },
  technique_mastery: {
    metricKey: 'technique_mastery',
    dashboardSection: 'technique_mastery',
    displayName: 'Technique Mastery',
    unit: 'score_100',
    polarity: 'higher_better',
    formulaVersion: FORMULA_VERSION,
    minSampleSize: 15,
    defaultWindowDays: 28,
    description: 'Padronanza specifica sulle tecniche LOCO (Major, PAO, Loci, Faces, Speech, Abstract).'
  }
};

export function classifyDelayBucket(recallDelaySeconds: number): DelayBucket {
  const s = Math.max(0, Math.floor(recallDelaySeconds || 0));
  if (s < 3600) return 'immediate';
  if (s < 86_400) return 'same_day';
  if (s <= 259_200) return 'd1_3';
  if (s <= 604_800) return 'd4_7';
  if (s <= 2_592_000) return 'd8_30';
  return 'd30_plus';
}

export function computeConfidenceLevel(
  sampleSize: number,
  minSampleSize: number
): DataConfidenceLevel {
  if (sampleSize < minSampleSize) return 'insufficient';
  if (sampleSize < minSampleSize * 2) return 'low';
  if (sampleSize < minSampleSize * 4) return 'medium';
  return 'high';
}

export function percentile(values: number[], p: number): number | null {
  const clean = values.filter((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (clean.length === 0) return null;
  const sorted = [...clean].sort((a, b) => a - b);
  const idx = (sorted.length - 1) * Math.min(1, Math.max(0, p));
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return Math.round(sorted[lo]);
  const weight = idx - lo;
  return Math.round(sorted[lo] * (1 - weight) + sorted[hi] * weight);
}

export function median(values: number[]): number | null {
  return percentile(values, 0.5);
}

function clamp100(value: number): number {
  return Number(Math.min(100, Math.max(0, value)).toFixed(2));
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

export interface MemoryMetricsComputationInput {
  trials: TrialDiagnosticRecord[];
  scheduleStabilitiesDays?: number[];
  activeExposureMs?: number;
  windowDays?: number;
  computedAt?: string;
}

export function computeAllMemoryMetrics(
  input: MemoryMetricsComputationInput
): Record<MemoryMetricKey, MetricValueSnapshot> {
  const windowDays = input.windowDays ?? 28;
  const computedAt = input.computedAt ?? new Date().toISOString();
  const allTrials = input.trials;

  // Exclude trials where the user viewed the answer before attempting from autonomous accuracy denominators,
  // while still counting them in total attempts so spoofing is impossible.
  const validTrials = allTrials.filter((t) => t.retrievalLatencyMs === undefined || t.retrievalLatencyMs === null || t.retrievalLatencyMs <= 120_000);
  const unassistedTrials = validTrials.filter(
    (t) => !t.viewedAnswerBeforeAttempt && t.hintCount === 0
  );
  const unassistedCorrectTrials = unassistedTrials.filter((t) => t.isCorrect);

  const immediateTrials = validTrials.filter((t) => t.recallDelaySeconds < 86_400);
  const immediateUnassistedCorrect = immediateTrials.filter(
    (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
  );

  const delayedTrials = validTrials.filter((t) => t.recallDelaySeconds >= 86_400);
  const delayedUnassistedCorrect = delayedTrials.filter(
    (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
  );

  const encodingTimes = validTrials
    .map((t) => t.encodingDurationMs)
    .filter((v): v is number => typeof v === 'number' && v > 0 && v <= 180_000);

  const retrievalTimes = unassistedCorrectTrials
    .map((t) => t.retrievalLatencyMs)
    .filter((v): v is number => typeof v === 'number' && v > 0 && v <= 60_000);

  const totalTrialActiveMs = validTrials.reduce((acc, t) => acc + (t.activeDurationMs || 0), 0);
  const totalActiveMinutes = Math.max(
    0.1,
    (totalTrialActiveMs + (input.activeExposureMs ?? 0)) / 60_000
  );

  function buildSnapshot(
    metricKey: MemoryMetricKey,
    sampleSize: number,
    nValid: number,
    nUnassisted: number,
    rawCandidate: number | null,
    score100Candidate: number | null,
    breakdown: Record<string, unknown> = {}
  ): MetricValueSnapshot {
    const def = METRIC_DEFINITIONS[metricKey];
    const confidenceLevel = computeConfidenceLevel(sampleSize, def.minSampleSize);
    const hasEnoughData = confidenceLevel !== 'insufficient' && rawCandidate !== null;
    return {
      metricKey,
      displayName: def.displayName,
      dashboardSection: def.dashboardSection,
      scopeKind: 'global',
      scopeValue: 'all',
      windowDays,
      rawValue: hasEnoughData ? rawCandidate : null,
      normalizedScore100: hasEnoughData ? score100Candidate : null,
      unit: def.unit,
      sampleSize,
      nValid,
      nUnassisted,
      minSampleSize: def.minSampleSize,
      confidenceLevel,
      formulaVersion: FORMULA_VERSION,
      comparabilityGroup: 'standard',
      statusMessage: hasEnoughData ? undefined : 'Non abbastanza dati per una stima affidabile',
      breakdown,
      computedAt
    };
  }

  // 1. Immediate Recall Accuracy
  const immAcc =
    immediateTrials.length > 0
      ? round4(immediateUnassistedCorrect.length / immediateTrials.length)
      : null;

  // 2. Delayed Recall Accuracy
  const delAcc =
    delayedTrials.length > 0
      ? round4(delayedUnassistedCorrect.length / delayedTrials.length)
      : null;

  // 3. Encoding Speed
  const medEncoding = median(encodingTimes);
  const encodingScore100 =
    medEncoding !== null ? clamp100(100 - Math.max(0, (medEncoding - 1500) / 150)) : null;

  // 4. Retrieval Speed
  const medRetrieval = median(retrievalTimes);
  const p90Retrieval = percentile(retrievalTimes, 0.9);
  const retrievalScore100 =
    medRetrieval !== null ? clamp100(100 - Math.max(0, (medRetrieval - 1000) / 100)) : null;

  // 5. Retention Efficiency
  const retentionEff =
    delayedTrials.length > 0
      ? round4(delayedUnassistedCorrect.length / totalActiveMinutes)
      : null;

  // 6. Learning Rate (second half accuracy minus first half accuracy)
  let learningRateRaw: number | null = null;
  if (validTrials.length >= 4) {
    const sortedByTime = [...validTrials].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
    const mid = Math.floor(sortedByTime.length / 2);
    const firstHalf = sortedByTime.slice(0, mid);
    const secondHalf = sortedByTime.slice(mid);
    const firstAcc =
      firstHalf.filter((t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0)
        .length / firstHalf.length;
    const secondAcc =
      secondHalf.filter((t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0)
        .length / secondHalf.length;
    learningRateRaw = round4(secondAcc - firstAcc);
  }

  // 7. Error Rate & Breakdown
  const errorCounts: Record<ErrorCategory, number> = {
    none: 0,
    position: 0,
    decoding: 0,
    conceptual: 0,
    order: 0,
    timeout: 0
  };
  let totalErrors = 0;
  for (const t of validTrials) {
    if (!t.isCorrect) {
      totalErrors += 1;
      const cat = t.errorCategory === 'none' ? 'decoding' : t.errorCategory;
      errorCounts[cat] = (errorCounts[cat] ?? 0) + 1;
    } else {
      errorCounts.none += 1;
    }
  }
  const errorRateRaw =
    validTrials.length > 0 ? round4(totalErrors / validTrials.length) : null;

  // 8. Hint Dependency (separate from viewedAnswerBeforeAttempt)
  const hintedCount = validTrials.filter((t) => t.hintCount > 0).length;
  const peekedCount = validTrials.filter((t) => t.viewedAnswerBeforeAttempt).length;
  const hintDepRaw =
    validTrials.length > 0 ? round4(hintedCount / validTrials.length) : null;

  // 9. Memory Stability
  const stabilities = input.scheduleStabilitiesDays ?? [];
  const medStability =
    stabilities.length > 0
      ? round4(
          stabilities.slice().sort((a, b) => a - b)[Math.floor((stabilities.length - 1) / 2)]
        )
      : null;

  // 10. Recall Consistency
  let consistencyRaw: number | null = null;
  if (retrievalTimes.length >= 4 && medRetrieval !== null && medRetrieval > 0) {
    const q25 = percentile(retrievalTimes, 0.25) ?? medRetrieval;
    const q75 = percentile(retrievalTimes, 0.75) ?? medRetrieval;
    const iqrRatio = Math.min(1, Math.max(0, (q75 - q25) / (medRetrieval * 1.5)));
    consistencyRaw = round4(1 - iqrRatio);
  } else if (validTrials.length >= 15) {
    consistencyRaw = round4(unassistedCorrectTrials.length / validTrials.length);
  }

  // 11. Training Volume
  const trainingVolumeRaw = validTrials.length;

  // 12. Review Efficiency (trials per target to reach 3 unassisted correct)
  const byTarget = new Map<string, TrialDiagnosticRecord[]>();
  for (const t of validTrials) {
    const key = t.learningTargetId ?? t.stimulusKey;
    const list = byTarget.get(key) ?? [];
    list.push(t);
    byTarget.set(key, list);
  }
  const trialsToMastery: number[] = [];
  for (const list of byTarget.values()) {
    let consecutive = 0;
    let count = 0;
    for (const item of list) {
      count += 1;
      if (item.isCorrect && !item.viewedAnswerBeforeAttempt && item.hintCount === 0) {
        consecutive += 1;
        if (consecutive >= 3) {
          trialsToMastery.push(count);
          break;
        }
      } else {
        consecutive = 0;
      }
    }
  }
  const reviewEffRaw =
    trialsToMastery.length > 0
      ? round4(trialsToMastery.reduce((a, b) => a + b, 0) / trialsToMastery.length)
      : validTrials.length > 0
        ? round4(validTrials.length / Math.max(1, byTarget.size))
        : null;

  // 13. Spatial Memory
  const spatialTrials = validTrials.filter(
    (t) => t.skill === 'loci' || t.expectedLocusOrdinal !== null
  );
  const spatialCorrectNoPosError = spatialTrials.filter(
    (t) =>
      t.isCorrect &&
      !t.viewedAnswerBeforeAttempt &&
      t.hintCount === 0 &&
      t.errorCategory !== 'position'
  );
  const spatialScore =
    spatialTrials.length > 0
      ? clamp100((spatialCorrectNoPosError.length / spatialTrials.length) * 100)
      : null;

  // 14. Visual Encoding
  const visualTrials = validTrials.filter(
    (t) =>
      t.mediaMode === 'image' ||
      t.mediaMode === 'video' ||
      t.mediaMode === 'animated_3d' ||
      t.skill === 'faces' ||
      t.skill === 'loci'
  );
  const visualCorrect = visualTrials.filter(
    (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
  );
  const visualScore =
    visualTrials.length > 0
      ? clamp100((visualCorrect.length / visualTrials.length) * 100)
      : null;

  // 15. Numerical Memory (Major / PAO / Numbers with directional breakdown)
  const numericalTrials = validTrials.filter(
    (t) => t.skill === 'numbers' || t.skill === 'major' || t.skill === 'pao'
  );
  const numericalCorrect = numericalTrials.filter(
    (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
  );
  const numericalByDirection: Record<string, { n: number; correct: number; accuracy: number }> = {};
  for (const t of numericalTrials) {
    const dir = t.direction || 'forward';
    const bucket = numericalByDirection[dir] ?? { n: 0, correct: 0, accuracy: 0 };
    bucket.n += 1;
    if (t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0) {
      bucket.correct += 1;
    }
    bucket.accuracy = round4(bucket.correct / bucket.n);
    numericalByDirection[dir] = bucket;
  }
  const numericalScore =
    numericalTrials.length > 0
      ? clamp100((numericalCorrect.length / numericalTrials.length) * 100)
      : null;

  // 16. Conceptual Association
  const conceptualTrials = validTrials.filter(
    (t) => t.skill === 'abstract' || t.skill === 'speech' || t.errorCategory === 'conceptual'
  );
  const conceptualCorrect = conceptualTrials.filter(
    (t) =>
      t.isCorrect &&
      !t.viewedAnswerBeforeAttempt &&
      t.hintCount === 0 &&
      t.errorCategory !== 'conceptual'
  );
  const conceptualScore =
    conceptualTrials.length > 0
      ? clamp100((conceptualCorrect.length / conceptualTrials.length) * 100)
      : null;

  // 17. Sequential Memory
  const sequentialTrials = validTrials.filter(
    (t) => t.skill === 'loci' || t.skill === 'speech' || t.skill === 'numbers'
  );
  const sequentialOrderOk = sequentialTrials.filter(
    (t) =>
      t.isCorrect &&
      !t.viewedAnswerBeforeAttempt &&
      t.errorCategory !== 'order' &&
      t.errorCategory !== 'position'
  );
  const sequentialScore =
    sequentialTrials.length > 0
      ? clamp100((sequentialOrderOk.length / sequentialTrials.length) * 100)
      : null;

  // 18. Technique Mastery
  const bySkill: Record<string, { n: number; correct: number; score100: number }> = {};
  for (const t of validTrials) {
    const entry = bySkill[t.skill] ?? { n: 0, correct: 0, score100: 0 };
    entry.n += 1;
    if (t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0) {
      entry.correct += 1;
    }
    entry.score100 = clamp100((entry.correct / entry.n) * 100);
    bySkill[t.skill] = entry;
  }
  const techniqueMasteryScore =
    validTrials.length > 0
      ? clamp100((unassistedCorrectTrials.length / validTrials.length) * 100)
      : null;

  return {
    immediate_recall_accuracy: buildSnapshot(
      'immediate_recall_accuracy',
      immediateTrials.length,
      immediateTrials.length,
      immediateTrials.filter((t) => !t.viewedAnswerBeforeAttempt && t.hintCount === 0).length,
      immAcc,
      immAcc !== null ? clamp100(immAcc * 100) : null
    ),
    delayed_recall_accuracy: buildSnapshot(
      'delayed_recall_accuracy',
      delayedTrials.length,
      delayedTrials.length,
      delayedTrials.filter((t) => !t.viewedAnswerBeforeAttempt && t.hintCount === 0).length,
      delAcc,
      delAcc !== null ? clamp100(delAcc * 100) : null,
      { minDelaySeconds: 86_400 }
    ),
    encoding_speed: buildSnapshot(
      'encoding_speed',
      encodingTimes.length,
      encodingTimes.length,
      encodingTimes.length,
      medEncoding,
      encodingScore100,
      { p90EncodingMs: percentile(encodingTimes, 0.9) }
    ),
    retrieval_speed: buildSnapshot(
      'retrieval_speed',
      retrievalTimes.length,
      validTrials.length,
      unassistedCorrectTrials.length,
      medRetrieval,
      retrievalScore100,
      { p90RetrievalMs: p90Retrieval }
    ),
    retention_efficiency: buildSnapshot(
      'retention_efficiency',
      delayedTrials.length,
      delayedTrials.length,
      delayedUnassistedCorrect.length,
      retentionEff,
      retentionEff !== null ? clamp100(retentionEff * 25) : null,
      { activeMinutes: round4(totalActiveMinutes) }
    ),
    learning_rate: buildSnapshot(
      'learning_rate',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      learningRateRaw,
      learningRateRaw !== null ? clamp100(50 + learningRateRaw * 100) : null
    ),
    error_rate: buildSnapshot(
      'error_rate',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      errorRateRaw,
      errorRateRaw !== null ? clamp100((1 - errorRateRaw) * 100) : null,
      { byCategory: errorCounts }
    ),
    hint_dependency: buildSnapshot(
      'hint_dependency',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      hintDepRaw,
      hintDepRaw !== null ? clamp100((1 - hintDepRaw) * 100) : null,
      { hintedCount, viewedAnswerBeforeAttemptCount: peekedCount }
    ),
    memory_stability: buildSnapshot(
      'memory_stability',
      stabilities.length,
      stabilities.length,
      stabilities.length,
      medStability,
      medStability !== null ? clamp100(Math.min(100, (medStability / 30) * 100)) : null
    ),
    recall_consistency: buildSnapshot(
      'recall_consistency',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      consistencyRaw,
      consistencyRaw !== null ? clamp100(consistencyRaw * 100) : null
    ),
    training_volume: buildSnapshot(
      'training_volume',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      trainingVolumeRaw,
      null,
      { activeMinutes: round4(totalActiveMinutes) }
    ),
    review_efficiency: buildSnapshot(
      'review_efficiency',
      validTrials.length,
      validTrials.length,
      unassistedTrials.length,
      reviewEffRaw,
      reviewEffRaw !== null ? clamp100(Math.max(0, 100 - (reviewEffRaw - 3) * 15)) : null
    ),
    spatial_memory: buildSnapshot(
      'spatial_memory',
      spatialTrials.length,
      spatialTrials.length,
      spatialCorrectNoPosError.length,
      spatialScore,
      spatialScore
    ),
    visual_encoding: buildSnapshot(
      'visual_encoding',
      visualTrials.length,
      visualTrials.length,
      visualCorrect.length,
      visualScore,
      visualScore
    ),
    numerical_memory: buildSnapshot(
      'numerical_memory',
      numericalTrials.length,
      numericalTrials.length,
      numericalCorrect.length,
      numericalScore,
      numericalScore,
      { byDirection: numericalByDirection }
    ),
    conceptual_association: buildSnapshot(
      'conceptual_association',
      conceptualTrials.length,
      conceptualTrials.length,
      conceptualCorrect.length,
      conceptualScore,
      conceptualScore
    ),
    sequential_memory: buildSnapshot(
      'sequential_memory',
      sequentialTrials.length,
      sequentialTrials.length,
      sequentialOrderOk.length,
      sequentialScore,
      sequentialScore
    ),
    technique_mastery: buildSnapshot(
      'technique_mastery',
      validTrials.length,
      validTrials.length,
      unassistedCorrectTrials.length,
      techniqueMasteryScore,
      techniqueMasteryScore,
      { bySkill }
    )
  };
}

/**
 * Computes item-level statistics grouped by `(skill, stimulusKey, direction)`.
 * Forward (`number_to_image`) and reverse (`image_to_number`) are NEVER merged indiscriminately.
 */
export function computeSkillItemStats(
  trials: TrialDiagnosticRecord[]
): SkillItemDiagnosticStat[] {
  const groups = new Map<string, TrialDiagnosticRecord[]>();
  for (const t of trials) {
    const key = `${t.skill}::${t.stimulusKey}::${t.direction || 'forward'}`;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  }

  const results: SkillItemDiagnosticStat[] = [];
  for (const list of groups.values()) {
    const first = list[0];
    const nTrials = list.length;
    const nCorrect = list.filter((t) => t.isCorrect).length;
    const nUnassistedCorrect = list.filter(
      (t) => t.isCorrect && !t.viewedAnswerBeforeAttempt && t.hintCount === 0
    ).length;

    const encTimes = list
      .map((t) => t.encodingDurationMs)
      .filter((v): v is number => typeof v === 'number' && v > 0);
    const retTimes = list
      .map((t) => t.retrievalLatencyMs)
      .filter((v): v is number => typeof v === 'number' && v > 0);

    const confusionCounter = new Map<string, number>();
    let lastErrorCategory: ErrorCategory = 'none';
    for (const t of list) {
      if (!t.isCorrect && t.errorCategory !== 'none') {
        lastErrorCategory = t.errorCategory;
      }
      if (!t.isCorrect && t.confusedWithKey) {
        confusionCounter.set(
          t.confusedWithKey,
          (confusionCounter.get(t.confusedWithKey) ?? 0) + 1
        );
      }
    }

    let topConfusedWithKey: string | null = null;
    let topConfusionCount = 0;
    for (const [k, count] of confusionCounter.entries()) {
      if (count > topConfusionCount) {
        topConfusedWithKey = k;
        topConfusionCount = count;
      }
    }

    results.push({
      skill: first.skill as SkillKind,
      stimulusKey: first.stimulusKey,
      direction: first.direction || 'forward',
      nTrials,
      nCorrect,
      nUnassistedCorrect,
      unassistedAccuracy: round4(nUnassistedCorrect / nTrials),
      medianEncodingMs: median(encTimes),
      medianRetrievalMs: median(retTimes),
      p90RetrievalMs: percentile(retTimes, 0.9),
      lastErrorCategory,
      topConfusedWithKey,
      topConfusionCount,
      formulaVersion: FORMULA_VERSION
    });
  }

  return results.sort((a, b) => {
    if (a.skill !== b.skill) return a.skill.localeCompare(b.skill);
    if (a.stimulusKey !== b.stimulusKey) return a.stimulusKey.localeCompare(b.stimulusKey);
    return a.direction.localeCompare(b.direction);
  });
}

/**
 * Detects locus position errors and neighbor swaps (e.g. locus 3 <-> locus 4).
 */
export function computeLocusConfusionStats(
  trials: TrialDiagnosticRecord[]
): LocusConfusionPairStat[] {
  const spatialTrials = trials.filter(
    (t) =>
      t.palaceId &&
      t.locusId &&
      typeof t.expectedLocusOrdinal === 'number' &&
      typeof t.actualLocusOrdinal === 'number'
  );

  const pairMap = new Map<
    string,
    {
      palaceId: UUID;
      locusId: UUID;
      confusedWithLocusId: UUID;
      expectedOrdinal: number;
      actualOrdinal: number;
      nTrials: number;
      swapCount: number;
      orderSkipCount: number;
    }
  >();

  const trialsPerLocus = new Map<string, number>();
  for (const t of spatialTrials) {
    const lKey = `${t.palaceId}::${t.expectedLocusOrdinal}`;
    trialsPerLocus.set(lKey, (trialsPerLocus.get(lKey) ?? 0) + 1);
  }

  for (const t of spatialTrials) {
    if (t.expectedLocusOrdinal === t.actualLocusOrdinal) continue;
    const palaceId = t.palaceId!;
    const locusId = t.locusId!;
    const expOrd = t.expectedLocusOrdinal!;
    const actOrd = t.actualLocusOrdinal!;
    const confusedId = t.confusedWithKey ?? `locus_ord_${actOrd}`;
    const key = `${palaceId}::${expOrd}::${actOrd}`;
    const existing = pairMap.get(key) ?? {
      palaceId,
      locusId,
      confusedWithLocusId: confusedId,
      expectedOrdinal: expOrd,
      actualOrdinal: actOrd,
      nTrials: trialsPerLocus.get(`${palaceId}::${expOrd}`) ?? 1,
      swapCount: 0,
      orderSkipCount: 0
    };
    if (Math.abs(expOrd - actOrd) === 1) {
      existing.swapCount += 1;
    } else {
      existing.orderSkipCount += 1;
    }
    pairMap.set(key, existing);
  }

  return Array.from(pairMap.values()).map((entry) => ({
    ...entry,
    positionErrorRate: round4(
      (entry.swapCount + entry.orderSkipCount) / Math.max(1, entry.nTrials)
    )
  }));
}
