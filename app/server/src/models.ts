// LOCO Backend Blueprint v2 — src/models.ts
// Core v1 TypeScript contracts across the 7 domain modules

export type UUID = string;
export type ISODateTime = string;

export type LeaderboardVisibility = 'public' | 'friends' | 'hidden';
export type LearningGoal = 'exam' | 'long_term' | 'memory_sport' | 'professional';
export type SrsAlgorithmVersion = 'simple-v1' | 'fsrs-7';

export type SkillKind =
  | 'loci'
  | 'numbers'
  | 'major'
  | 'pao'
  | 'faces'
  | 'abstract'
  | 'speech';

export type KnowledgeKind =
  | 'concept'
  | 'fact'
  | 'definition'
  | 'procedure'
  | 'date'
  | 'formula'
  | 'vocabulary';

export type KnowledgeState = 'proposed' | 'confirmed' | 'archived';
export type KnowledgeOrigin = 'manual' | 'ai_extracted' | 'imported_legacy';

export type PromptMode = 'forward' | 'reverse' | 'explain' | 'apply' | 'cloze';

export type MnemonicTechnique =
  | 'loci'
  | 'link_story'
  | 'major'
  | 'pao'
  | 'peg'
  | 'acrostic'
  | 'visual_metaphor';

export type EnvironmentKind =
  | 'room'
  | 'castle'
  | 'streetview'
  | 'photo_palace'
  | 'scan_3d';

export type RecallVerdict = 'correct' | 'partial' | 'forgot';
export type SchedulerGrade = 'again' | 'hard' | 'good' | 'easy';
export type EvaluationMode = 'self' | 'rules' | 'ai_assisted';

export type ErrorCategory =
  | 'none'
  | 'position'
  | 'decoding'
  | 'conceptual'
  | 'order'
  | 'timeout';

export type DataConfidenceLevel = 'insufficient' | 'low' | 'medium' | 'high';

export type ChallengeScorerType = 'accuracy_time' | 'perfect_speed';

export interface ApiErrorEnvelope {
  error: {
    code:
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'VALIDATION_ERROR'
      | 'RATE_LIMITED'
      | 'PAYLOAD_TOO_LARGE'
      | 'INTERNAL_ERROR';
    message: string;
    requestId: string;
  };
}

export interface AppUserProfile {
  id: UUID;
  handle: string;
  displayName: string;
  avatarAssetId?: UUID | null;
  locale: string;
  timezone: string;
  discoverable: boolean;
  leaderboardVisibility: LeaderboardVisibility;
  createdAt: ISODateTime;
}

export interface UserPreferences {
  userId: UUID;
  learningGoal: LearningGoal;
  dailyTargetMinutes: number;
  desiredRetention: number;
  preferredSrsAlgorithm: SrsAlgorithmVersion;
  accessibility: Record<string, unknown>;
  aiPersonalizationOptIn: boolean;
  updatedAt: ISODateTime;
}

export interface StudyProject {
  id: UUID;
  ownerId: UUID;
  title: string;
  description: string;
  goal: string;
  targetDate?: string | null;
  status: 'draft' | 'active' | 'archived';
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface KnowledgeItem {
  id: UUID;
  ownerId: UUID;
  projectId: UUID;
  kind: KnowledgeKind;
  prompt: string;
  answer: string;
  briefExplanation: string;
  importance: 1 | 2 | 3 | 4 | 5;
  state: KnowledgeState;
  origin: KnowledgeOrigin;
  currentRevision: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface KnowledgeEvidence {
  id: UUID;
  ownerId: UUID;
  knowledgeItemId: UUID;
  documentId: UUID;
  chunkId: UUID;
  pageNumber?: number | null;
  quoteText: string;
  confidence: number;
  createdAt: ISODateTime;
}

export interface LearningTarget {
  id: UUID;
  ownerId: UUID;
  knowledgeItemId: UUID;
  promptMode: PromptMode;
  active: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface SpatialAnchorV1 {
  scene: string;
  point: Vector3D;
  normal: Vector3D;
  camera: Vector3D;
  yaw: number;
  pitch: number;
  surface: string;
}

export interface Palace {
  id: UUID;
  ownerId: UUID;
  projectId?: UUID | null;
  title: string;
  description: string;
  environmentKind: EnvironmentKind;
  sceneVersion: string;
  status: 'draft' | 'ready' | 'archived';
  revision: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Locus {
  id: UUID;
  ownerId: UUID;
  palaceId: UUID;
  ordinal: number;
  label: string;
  sceneVersion: string;
  anchor: SpatialAnchorV1 | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface MnemonicAssociation {
  id: UUID;
  ownerId: UUID;
  learningTargetId: UUID;
  locusId?: UUID | null;
  technique: MnemonicTechnique;
  associationText: string;
  imageAssetId?: UUID | null;
  origin: 'user' | 'ai' | 'legacy_import';
  state: 'proposed' | 'confirmed' | 'retired';
  currentRevision: number;
  encodingDurationMs?: number | null;
  revisionCount: number;
  hintRequests: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ReviewAttemptInput {
  targetId: UUID;
  sessionId?: UUID | null;
  responseText?: string | null;
  responseMs?: number | null;
  activeDurationMs?: number | null;
  hintCount: number;
  viewedAnswerBeforeAttempt: boolean;
  confidence?: 1 | 2 | 3 | 4 | 5 | null;
  userRating: SchedulerGrade;
  verdict?: RecallVerdict;
  evaluationMode?: EvaluationMode;
  mediaMode?: 'text' | 'image' | 'video' | 'animated_3d' | 'audio';
  idempotencyKey: string;
}

export interface ReviewScheduleState {
  targetId: UUID;
  ownerId: UUID;
  knowledgeRevision: number;
  algorithmVersion: SrsAlgorithmVersion;
  dueAt: ISODateTime;
  lastReviewedAt?: ISODateTime | null;
  streak: number;
  repetitions: number;
  lapses: number;
  stability?: number | null;
  difficulty?: number | null;
  stateJson: Record<string, unknown>;
  updatedAt: ISODateTime;
}

export type OutboxEventType =
  | 'source.uploaded'
  | 'source.extracted'
  | 'knowledge.confirmed'
  | 'knowledge.revised'
  | 'mnemonic.confirmed'
  | 'recall.completed'
  | 'schedule.changed'
  | 'training.completed'
  | 'skill_profile.refreshed'
  | 'friend.accepted'
  | 'challenge.run_submitted'
  | 'challenge.result_verified'
  | 'challenge.leaderboard_updated';

export interface OutboxEventEnvelope<TPayload = Record<string, unknown>> {
  id: UUID;
  eventType: OutboxEventType;
  aggregateType: string;
  aggregateId: UUID;
  actorId?: UUID | null;
  schemaVersion: number;
  createdAt: ISODateTime;
  payload: TPayload;
}
