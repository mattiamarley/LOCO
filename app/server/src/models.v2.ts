// LOCO Backend Blueprint v2 — src/models.v2.ts
// Addendum v2 TypeScript contracts: 18 Metric Families, 5 Memory Profile Dashboards,
// Trial Diagnostics, Learning Exposures, Explainable Interventions, Media & Spatial Engine

import type {
  UUID,
  ISODateTime,
  SkillKind,
  MnemonicTechnique,
  ErrorCategory,
  DataConfidenceLevel,
  Vector3D
} from './models.ts';

export type MediaMode = 'text' | 'image' | 'video' | 'animated_3d' | 'audio';

export type DelayBucket =
  | 'immediate'
  | 'same_day'
  | 'd1_3'
  | 'd4_7'
  | 'd8_30'
  | 'd30_plus';

export type MemoryDashboardSection =
  | 'overview'
  | 'memory_skills'
  | 'technique_mastery'
  | 'learning_analytics'
  | 'records_rankings';

export type MemoryMetricKey =
  | 'immediate_recall_accuracy'
  | 'delayed_recall_accuracy'
  | 'encoding_speed'
  | 'retrieval_speed'
  | 'retention_efficiency'
  | 'learning_rate'
  | 'error_rate'
  | 'hint_dependency'
  | 'memory_stability'
  | 'recall_consistency'
  | 'training_volume'
  | 'review_efficiency'
  | 'spatial_memory'
  | 'visual_encoding'
  | 'numerical_memory'
  | 'conceptual_association'
  | 'sequential_memory'
  | 'technique_mastery';

export const ALL_MEMORY_METRIC_KEYS: readonly MemoryMetricKey[] = [
  'immediate_recall_accuracy',
  'delayed_recall_accuracy',
  'encoding_speed',
  'retrieval_speed',
  'retention_efficiency',
  'learning_rate',
  'error_rate',
  'hint_dependency',
  'memory_stability',
  'recall_consistency',
  'training_volume',
  'review_efficiency',
  'spatial_memory',
  'visual_encoding',
  'numerical_memory',
  'conceptual_association',
  'sequential_memory',
  'technique_mastery'
] as const;

export interface MemoryMetricDefinition {
  metricKey: MemoryMetricKey;
  dashboardSection: MemoryDashboardSection;
  displayName: string;
  unit: 'ratio' | 'ms' | 'items_per_min' | 'score_100' | 'days' | 'count' | 'trials_per_item';
  polarity: 'higher_better' | 'lower_better' | 'neutral';
  formulaVersion: string;
  minSampleSize: number;
  defaultWindowDays: number;
  description: string;
}

export interface TrialDiagnosticRecord {
  id: UUID;
  ownerId: UUID;
  sourceKind: 'review_attempt' | 'training_trial';
  reviewAttemptId?: UUID | null;
  trainingTrialId?: UUID | null;
  learningTargetId?: UUID | null;
  palaceId?: UUID | null;
  locusId?: UUID | null;
  skill: SkillKind;
  stimulusKey: string;
  direction: string;
  isCorrect: boolean;
  isUnassisted: boolean;
  errorCategory: ErrorCategory;
  confusedWithKey?: string | null;
  expectedLocusOrdinal?: number | null;
  actualLocusOrdinal?: number | null;
  recallDelaySeconds: number;
  delayBucket: DelayBucket;
  encodingDurationMs?: number | null;
  retrievalLatencyMs?: number | null;
  activeDurationMs: number;
  hintCount: number;
  viewedAnswerBeforeAttempt: boolean;
  associationRevision?: number | null;
  mediaMode: MediaMode;
  difficultyLevel: number;
  comparabilityGroup: string;
  createdAt: ISODateTime;
}

export interface LearningExposureRecord {
  id: UUID;
  ownerId: UUID;
  studySessionId?: UUID | null;
  learningTargetId?: UUID | null;
  associationId?: UUID | null;
  associationRevision?: number | null;
  palaceId?: UUID | null;
  locusId?: UUID | null;
  sceneVersionId?: UUID | null;
  mediaMode: MediaMode;
  assetId?: UUID | null;
  dwellMs: number;
  activeDurationMs: number;
  interactionKind: 'study_view' | 'encoding_edit' | 'locus_walkthrough' | 'media_replay';
  createdAt: ISODateTime;
}

export interface MetricValueSnapshot {
  metricKey: MemoryMetricKey;
  displayName: string;
  dashboardSection: MemoryDashboardSection;
  scopeKind: 'global' | 'skill' | 'direction' | 'media_mode' | 'delay_bucket';
  scopeValue: string;
  windowDays: number;
  rawValue: number | null;
  normalizedScore100: number | null;
  unit: MemoryMetricDefinition['unit'];
  sampleSize: number;
  nValid: number;
  nUnassisted: number;
  minSampleSize: number;
  confidenceLevel: DataConfidenceLevel;
  formulaVersion: string;
  comparabilityGroup: string;
  statusMessage?: string;
  breakdown: Record<string, unknown>;
  computedAt: ISODateTime;
}

export interface SkillItemDiagnosticStat {
  skill: SkillKind;
  stimulusKey: string;
  direction: string;
  nTrials: number;
  nCorrect: number;
  nUnassistedCorrect: number;
  unassistedAccuracy: number;
  medianEncodingMs: number | null;
  medianRetrievalMs: number | null;
  p90RetrievalMs: number | null;
  lastErrorCategory: ErrorCategory;
  topConfusedWithKey: string | null;
  topConfusionCount: number;
  formulaVersion: string;
}

export interface LocusConfusionPairStat {
  palaceId: UUID;
  locusId: UUID;
  confusedWithLocusId: UUID;
  expectedOrdinal: number;
  actualOrdinal: number;
  nTrials: number;
  swapCount: number;
  orderSkipCount: number;
  positionErrorRate: number;
}

export type InterventionRationaleCode =
  | 'insufficient_data_baseline'
  | 'repeated_target_errors_revise_association'
  | 'neighbor_loci_swap_interleaving'
  | 'slow_major_pair_bidirectional_drill'
  | 'high_immediate_low_delayed_increase_spacing'
  | 'high_hint_dependency_closed_book_recall'
  | 'conceptual_vs_decoding_gap_explain_mode'
  | 'ready_for_harder_or_delayed_test';

export interface LearningIntervention {
  id: UUID;
  ownerId: UUID;
  rationaleCode: InterventionRationaleCode;
  algorithmVersion: string;
  metricVersion: string;
  targetScope: 'learning_target' | 'skill' | 'palace' | 'locus' | 'schedule' | 'global';
  targetId?: UUID | null;
  skill?: SkillKind | null;
  stimulusKey?: string | null;
  recommendedAction: string;
  explanation: string;
  evidence: Record<string, unknown>;
  sampleSize: number;
  confidenceLevel: DataConfidenceLevel;
  status: 'proposed' | 'accepted' | 'dismissed' | 'completed' | 'expired';
  createdAt: ISODateTime;
  respondedAt?: ISODateTime | null;
}

export interface InterventionOutcomeEvaluation {
  interventionId: UUID;
  metricKey: MemoryMetricKey;
  preSampleSize: number;
  postSampleSize: number;
  preValue: number | null;
  postValue: number | null;
  comparabilityVerified: boolean;
  outcomeStatus: 'improved' | 'no_change' | 'regressed' | 'inconclusive';
  evaluationReason: string;
  evaluatedAt: ISODateTime;
}

// =============================================================================
// Media & Spatial Engine v2 Contracts
// =============================================================================

export type MediaVariantKind =
  | 'original'
  | 'thumbnail'
  | 'webp_preview'
  | 'video_mp4'
  | 'video_hls'
  | 'glb_lod0'
  | 'glb_lod1'
  | 'poster'
  | 'audio_norm';

export interface MediaVariant {
  id: UUID;
  assetId: UUID;
  ownerId: UUID;
  parentVariantId?: UUID | null;
  variantKind: MediaVariantKind;
  mimeType: string;
  byteSize: number;
  sha256: string;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  codec?: string | null;
  createdAt: ISODateTime;
}

export interface AssociationRevision {
  id: UUID;
  associationId: UUID;
  ownerId: UUID;
  revision: number;
  technique: MnemonicTechnique;
  associationText: string;
  mediaMode: MediaMode;
  primaryAssetId?: UUID | null;
  changeReason: string;
  createdAt: ISODateTime;
}

export interface PalaceSceneVersion {
  id: UUID;
  palaceId: UUID;
  ownerId: UUID;
  versionNumber: number;
  sceneCode: string;
  sceneKind: 'room_3d' | 'castle_3d' | 'photo_2d' | 'panorama_360' | 'scan_glb' | 'streetview_ref';
  coordinateFrameId: string;
  sceneAssetId?: UUID | null;
  bounds: Record<string, unknown>;
  published: boolean;
  createdAt: ISODateTime;
}

export interface LocusAnchorV2 {
  id: UUID;
  locusId: UUID;
  palaceId: UUID;
  ownerId: UUID;
  sceneVersionId: UUID;
  coordinateFrameId: string;
  anchorKind: 'surface_3d' | 'photo_uv' | 'panorama_spherical';
  point: Vector3D;
  normal?: Vector3D | null;
  cameraPose?: { position: Vector3D; yaw: number; pitch: number } | null;
  uv?: { u: number; v: number } | null;
  surfaceLabel: string;
  objectRef?: string | null;
  isActive: boolean;
  createdAt: ISODateTime;
}

export interface LocusPlacement {
  id: UUID;
  locusId: UUID;
  palaceId: UUID;
  ownerId: UUID;
  sceneVersionId: UUID;
  associationId?: UUID | null;
  assetId?: UUID | null;
  variantId?: UUID | null;
  placementKind: 'billboard_2d' | 'video_plane' | 'glb_model' | 'spatial_marker';
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  animationClip?: string | null;
  playbackMode: 'static' | 'loop' | 'on_focus' | 'on_recall';
  ordinal: number;
  createdAt: ISODateTime;
}

export interface MediaGenerationOutput {
  id: UUID;
  aiJobId: UUID;
  ownerId: UUID;
  learningTargetId?: UUID | null;
  associationId?: UUID | null;
  candidateSlot: 'A' | 'B' | 'C';
  outputKind: 'mnemonic_text' | 'image' | 'video' | 'animated_3d';
  assetId?: UUID | null;
  variantId?: UUID | null;
  provider: string;
  modelVersion: string;
  pipelineVersion: string;
  promptRedacted: string;
  selectedByUser: boolean;
  costMicros: number;
  createdAt: ISODateTime;
}

export interface MemoryProfileDashboardResponse {
  userId: UUID;
  windowDays: number;
  formulaVersion: string;
  computedAt: ISODateTime;
  dashboards: {
    overview: MetricValueSnapshot[];
    memorySkills: MetricValueSnapshot[];
    techniqueMastery: {
      metrics: MetricValueSnapshot[];
      itemStats: SkillItemDiagnosticStat[];
    };
    learningAnalytics: {
      metrics: MetricValueSnapshot[];
      locusConfusions: LocusConfusionPairStat[];
      interventions: LearningIntervention[];
    };
    recordsRankings: {
      personalBests: Array<{
        challengeVersionId: UUID;
        challengeTitle: string;
        score: number;
        accuracy: number;
        elapsedMs: number;
        rank: number | null;
        achievedAt: ISODateTime;
      }>;
    };
  };
}
