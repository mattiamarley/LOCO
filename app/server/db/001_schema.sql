-- LOCO Backend Blueprint v2 — 001_schema.sql
-- Core v1 PostgreSQL Schema (31 core tables across 7 domain modules)
-- Target: PostgreSQL 15+

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- 1. IDENTITY & PREFERENCES (2 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9_]{3,32}$' AND position('@' in handle) = 0),
  display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 80),
  avatar_asset_id UUID,
  locale TEXT NOT NULL DEFAULT 'it-IT',
  timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
  discoverable BOOLEAN NOT NULL DEFAULT true,
  leaderboard_visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (leaderboard_visibility IN ('public', 'friends', 'hidden')),
  account_status TEXT NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended', 'pending_deletion', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  learning_goal TEXT NOT NULL DEFAULT 'exam'
    CHECK (learning_goal IN ('exam', 'long_term', 'memory_sport', 'professional')),
  daily_target_minutes INTEGER NOT NULL DEFAULT 15
    CHECK (daily_target_minutes BETWEEN 1 AND 480),
  desired_retention NUMERIC(4,3) NOT NULL DEFAULT 0.900
    CHECK (desired_retention BETWEEN 0.700 AND 0.990),
  preferred_srs_algorithm TEXT NOT NULL DEFAULT 'simple-v1'
    CHECK (preferred_srs_algorithm IN ('simple-v1', 'fsrs-7')),
  accessibility_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_personalization_opt_in BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. SOCIAL & FRIENDS (3 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (sender_id <> recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_active_pair_idx
  ON friend_requests(sender_id, recipient_id)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS friendships (
  user_low_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  user_high_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_request_id UUID REFERENCES friend_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_low_id, user_high_id),
  CHECK (user_low_id < user_high_id)
);

CREATE INDEX IF NOT EXISTS friendships_high_idx ON friendships(user_high_id);

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS user_blocks_blocked_idx ON user_blocks(blocked_id);

-- =============================================================================
-- 3. STUDY, ASSETS & KNOWLEDGE (8 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS study_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  description TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE INDEX IF NOT EXISTS study_projects_owner_idx
  ON study_projects(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  media_kind TEXT NOT NULL DEFAULT 'document'
    CHECK (media_kind IN ('document', 'image', 'video', 'model_3d', 'audio', 'export')),
  status TEXT NOT NULL DEFAULT 'pending_upload'
    CHECK (status IN ('pending_upload', 'uploaded', 'verified', 'quarantined', 'deleted')),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE INDEX IF NOT EXISTS media_assets_owner_sha_idx
  ON media_assets(owner_id, sha256);

CREATE TABLE IF NOT EXISTS source_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  asset_id UUID NOT NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  language TEXT NOT NULL DEFAULT 'it',
  page_count INTEGER CHECK (page_count IS NULL OR page_count >= 1),
  parser_version TEXT NOT NULL DEFAULT 'pdf-text-v1',
  ocr_used BOOLEAN NOT NULL DEFAULT false,
  ocr_notice TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'processing', 'ready', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  FOREIGN KEY (project_id, owner_id) REFERENCES study_projects(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS source_documents_project_idx
  ON source_documents(owner_id, project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  document_id UUID NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  page_start INTEGER CHECK (page_start IS NULL OR page_start >= 1),
  page_end INTEGER CHECK (page_end IS NULL OR page_end >= page_start),
  char_start INTEGER CHECK (char_start IS NULL OR char_start >= 0),
  char_end INTEGER CHECK (char_end IS NULL OR char_end >= char_start),
  heading TEXT,
  content_text TEXT NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0 CHECK (token_estimate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, ordinal),
  UNIQUE (id, owner_id),
  FOREIGN KEY (document_id, owner_id) REFERENCES source_documents(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'concept'
    CHECK (kind IN ('concept', 'fact', 'definition', 'procedure', 'date', 'formula', 'vocabulary')),
  prompt TEXT NOT NULL CHECK (char_length(btrim(prompt)) BETWEEN 1 AND 4000),
  answer TEXT NOT NULL CHECK (char_length(btrim(answer)) BETWEEN 1 AND 4000),
  brief_explanation TEXT NOT NULL DEFAULT '',
  importance SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  state TEXT NOT NULL DEFAULT 'proposed'
    CHECK (state IN ('proposed', 'confirmed', 'archived')),
  origin TEXT NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual', 'ai_extracted', 'imported_legacy')),
  current_revision INTEGER NOT NULL DEFAULT 1 CHECK (current_revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  FOREIGN KEY (project_id, owner_id) REFERENCES study_projects(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS knowledge_items_project_state_idx
  ON knowledge_items(owner_id, project_id, state);

CREATE TABLE IF NOT EXISTS knowledge_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id UUID NOT NULL,
  document_id UUID NOT NULL,
  chunk_id UUID NOT NULL,
  page_number INTEGER CHECK (page_number IS NULL OR page_number >= 1),
  char_start INTEGER,
  char_end INTEGER,
  quote_text TEXT NOT NULL DEFAULT '',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (knowledge_item_id, owner_id) REFERENCES knowledge_items(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (document_id, owner_id) REFERENCES source_documents(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (chunk_id, owner_id) REFERENCES document_chunks(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS knowledge_evidence_item_idx
  ON knowledge_evidence(owner_id, knowledge_item_id);

CREATE TABLE IF NOT EXISTS knowledge_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id UUID NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  brief_explanation TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT 'user' CHECK (changed_by IN ('user', 'ai_confirmed', 'legacy_import')),
  change_reason TEXT NOT NULL DEFAULT 'initial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (knowledge_item_id, revision),
  FOREIGN KEY (knowledge_item_id, owner_id) REFERENCES knowledge_items(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knowledge_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  from_item_id UUID NOT NULL,
  to_item_id UUID NOT NULL,
  relation_type TEXT NOT NULL
    CHECK (relation_type IN ('prerequisite', 'related', 'contrasts_with', 'part_of')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (from_item_id <> to_item_id),
  UNIQUE (owner_id, from_item_id, to_item_id, relation_type),
  FOREIGN KEY (from_item_id, owner_id) REFERENCES knowledge_items(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (to_item_id, owner_id) REFERENCES knowledge_items(id, owner_id) ON DELETE CASCADE
);

-- =============================================================================
-- 4. PALACES, LOCI & MEMORY ENCODING (4 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS palaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES study_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 120),
  description TEXT NOT NULL DEFAULT '',
  environment_kind TEXT NOT NULL DEFAULT 'room'
    CHECK (environment_kind IN ('room', 'castle', 'streetview', 'photo_palace', 'scan_3d')),
  scene_version TEXT NOT NULL DEFAULT 'loco-room-v1',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'archived')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id)
);

CREATE INDEX IF NOT EXISTS palaces_owner_idx ON palaces(owner_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS loci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  palace_id UUID NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  label TEXT NOT NULL CHECK (char_length(btrim(label)) BETWEEN 1 AND 120),
  scene_version TEXT NOT NULL DEFAULT 'loco-room-v1',
  anchor_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (palace_id, ordinal),
  UNIQUE (id, owner_id),
  FOREIGN KEY (palace_id, owner_id) REFERENCES palaces(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS learning_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id UUID NOT NULL,
  prompt_mode TEXT NOT NULL DEFAULT 'forward'
    CHECK (prompt_mode IN ('forward', 'reverse', 'explain', 'apply', 'cloze')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (knowledge_item_id, prompt_mode),
  UNIQUE (id, owner_id),
  FOREIGN KEY (knowledge_item_id, owner_id) REFERENCES knowledge_items(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS learning_targets_owner_active_idx
  ON learning_targets(owner_id, active);

CREATE TABLE IF NOT EXISTS mnemonic_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  learning_target_id UUID NOT NULL,
  locus_id UUID,
  technique TEXT NOT NULL DEFAULT 'loci'
    CHECK (technique IN ('loci', 'link_story', 'major', 'pao', 'peg', 'acrostic', 'visual_metaphor')),
  association_text TEXT NOT NULL DEFAULT '' CHECK (char_length(association_text) <= 4000),
  image_asset_id UUID,
  origin TEXT NOT NULL DEFAULT 'user'
    CHECK (origin IN ('user', 'ai', 'legacy_import')),
  state TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (state IN ('proposed', 'confirmed', 'retired')),
  current_revision INTEGER NOT NULL DEFAULT 1 CHECK (current_revision >= 1),
  encoding_duration_ms INTEGER CHECK (encoding_duration_ms IS NULL OR encoding_duration_ms >= 0),
  revision_count INTEGER NOT NULL DEFAULT 1 CHECK (revision_count >= 1),
  hint_requests INTEGER NOT NULL DEFAULT 0 CHECK (hint_requests >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  FOREIGN KEY (learning_target_id, owner_id) REFERENCES learning_targets(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (locus_id, owner_id) REFERENCES loci(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (image_asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS mnemonic_associations_target_idx
  ON mnemonic_associations(owner_id, learning_target_id, state);

-- =============================================================================
-- 5. LEARNING, RECALL & SCHEDULING (3 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id UUID,
  palace_id UUID,
  mode TEXT NOT NULL DEFAULT 'recall'
    CHECK (mode IN ('study', 'recall', 'cram', 'delayed_check')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  active_duration_ms INTEGER CHECK (active_duration_ms IS NULL OR active_duration_ms >= 0),
  UNIQUE (id, owner_id),
  FOREIGN KEY (project_id, owner_id) REFERENCES study_projects(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (palace_id, owner_id) REFERENCES palaces(id, owner_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS review_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  study_session_id UUID,
  knowledge_revision INTEGER NOT NULL CHECK (knowledge_revision >= 1),
  association_id UUID,
  association_revision INTEGER CHECK (association_revision IS NULL OR association_revision >= 1),
  locus_id UUID,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_ms INTEGER CHECK (response_ms IS NULL OR response_ms >= 0),
  active_duration_ms INTEGER CHECK (active_duration_ms IS NULL OR active_duration_ms >= 0),
  verdict TEXT NOT NULL CHECK (verdict IN ('correct', 'partial', 'forgot')),
  scheduler_grade TEXT NOT NULL CHECK (scheduler_grade IN ('again', 'hard', 'good', 'easy')),
  hint_count SMALLINT NOT NULL DEFAULT 0 CHECK (hint_count >= 0),
  viewed_answer_before_attempt BOOLEAN NOT NULL DEFAULT false,
  evaluation_mode TEXT NOT NULL DEFAULT 'self'
    CHECK (evaluation_mode IN ('self', 'rules', 'ai_assisted')),
  confidence SMALLINT CHECK (confidence IS NULL OR confidence BETWEEN 1 AND 5),
  response_text TEXT,
  recall_delay_seconds INTEGER CHECK (recall_delay_seconds IS NULL OR recall_delay_seconds >= 0),
  media_mode TEXT NOT NULL DEFAULT 'text'
    CHECK (media_mode IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  idempotency_key TEXT NOT NULL CHECK (char_length(btrim(idempotency_key)) BETWEEN 1 AND 128),
  UNIQUE (owner_id, idempotency_key),
  UNIQUE (id, owner_id),
  FOREIGN KEY (target_id, owner_id) REFERENCES learning_targets(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (study_session_id, owner_id) REFERENCES study_sessions(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (locus_id, owner_id) REFERENCES loci(id, owner_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS review_attempts_owner_target_answered_idx
  ON review_attempts(owner_id, target_id, answered_at DESC);

CREATE TABLE IF NOT EXISTS review_schedules (
  target_id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_revision INTEGER NOT NULL DEFAULT 1 CHECK (knowledge_revision >= 1),
  algorithm_version TEXT NOT NULL DEFAULT 'simple-v1'
    CHECK (algorithm_version IN ('simple-v1', 'fsrs-7')),
  due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  streak INTEGER NOT NULL DEFAULT 0 CHECK (streak >= 0),
  repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  lapses INTEGER NOT NULL DEFAULT 0 CHECK (lapses >= 0),
  stability NUMERIC(10,4),
  difficulty NUMERIC(6,4),
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (target_id, owner_id) REFERENCES learning_targets(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS review_schedules_owner_due_idx
  ON review_schedules(owner_id, due_at ASC);

-- =============================================================================
-- 6. TRAINING & SKILL ANALYTICS (4 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS training_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  skill TEXT NOT NULL
    CHECK (skill IN ('loci', 'numbers', 'major', 'pao', 'faces', 'abstract', 'speech')),
  default_direction TEXT NOT NULL DEFAULT 'forward',
  generator_version TEXT NOT NULL DEFAULT 'gen-v1',
  scorer_version TEXT NOT NULL DEFAULT 'scorer-v1',
  config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES training_exercises(id) ON DELETE RESTRICT,
  seed TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  test_condition TEXT NOT NULL DEFAULT 'immediate'
    CHECK (test_condition IN ('immediate', 'after_pause', 'delayed_24h')),
  difficulty_level SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
  stimuli_snapshot_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  active_duration_ms INTEGER CHECK (active_duration_ms IS NULL OR active_duration_ms >= 0),
  idempotency_key TEXT,
  UNIQUE (id, owner_id),
  UNIQUE (owner_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS training_sessions_owner_idx
  ON training_sessions(owner_id, started_at DESC);

CREATE TABLE IF NOT EXISTS training_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  stimulus_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  response_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_correct BOOLEAN NOT NULL,
  response_ms INTEGER NOT NULL CHECK (response_ms >= 0),
  encoding_ms INTEGER CHECK (encoding_ms IS NULL OR encoding_ms >= 0),
  hints_used SMALLINT NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  error_category TEXT NOT NULL DEFAULT 'none'
    CHECK (error_category IN ('none', 'position', 'decoding', 'conceptual', 'order', 'timeout')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, ordinal),
  UNIQUE (id, owner_id),
  FOREIGN KEY (session_id, owner_id) REFERENCES training_sessions(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS training_trials_owner_stimulus_idx
  ON training_trials(owner_id, stimulus_key, direction);

CREATE TABLE IF NOT EXISTS skill_profile_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL
    CHECK (skill IN ('loci', 'numbers', 'major', 'pao', 'faces', 'abstract', 'speech', 'overall')),
  window_days INTEGER NOT NULL DEFAULT 28 CHECK (window_days > 0),
  sample_size INTEGER NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  n_valid INTEGER NOT NULL DEFAULT 0 CHECK (n_valid >= 0),
  n_unassisted INTEGER NOT NULL DEFAULT 0 CHECK (n_unassisted >= 0),
  immediate_accuracy NUMERIC(5,4),
  delayed_accuracy NUMERIC(5,4),
  median_encoding_ms INTEGER,
  median_retrieval_ms INTEGER,
  p90_retrieval_ms INTEGER,
  position_error_rate NUMERIC(5,4),
  efficiency_per_min NUMERIC(8,4),
  data_confidence TEXT NOT NULL DEFAULT 'insufficient'
    CHECK (data_confidence IN ('insufficient', 'low', 'medium', 'high')),
  recommendation_code TEXT NOT NULL DEFAULT 'continue_baseline',
  metric_version TEXT NOT NULL DEFAULT 'metrics-v2.0',
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS skill_profile_snapshots_owner_skill_idx
  ON skill_profile_snapshots(owner_id, skill, computed_at DESC);

-- =============================================================================
-- 7. ARENA — CHALLENGES & LEADERBOARDS (7 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS challenge_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  skill TEXT NOT NULL
    CHECK (skill IN ('loci', 'numbers', 'major', 'pao', 'faces', 'abstract', 'speech')),
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenge_definitions(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  rules_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  duration_ms INTEGER NOT NULL CHECK (duration_ms > 0),
  scorer_type TEXT NOT NULL
    CHECK (scorer_type IN ('accuracy_time', 'perfect_speed')),
  scorer_version TEXT NOT NULL DEFAULT 'challenge-scorer-v1',
  public_stimuli_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  private_answer_key_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  private_seed TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, version_number)
);

CREATE TABLE IF NOT EXISTS challenge_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id UUID NOT NULL REFERENCES challenge_versions(id) ON DELETE RESTRICT,
  is_ranked BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'started'
    CHECK (status IN ('started', 'submitted', 'verified', 'rejected', 'expired')),
  nonce_hash TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deadline_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  elapsed_ms INTEGER CHECK (elapsed_ms IS NULL OR elapsed_ms >= 0),
  risk_flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key TEXT NOT NULL,
  UNIQUE (owner_id, idempotency_key),
  UNIQUE (id, owner_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS challenge_runs_single_ranked_attempt_idx
  ON challenge_runs(owner_id, challenge_version_id)
  WHERE is_ranked = true;

CREATE TABLE IF NOT EXISTS challenge_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
  submitted_value TEXT NOT NULL,
  response_ms INTEGER CHECK (response_ms IS NULL OR response_ms >= 0),
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, ordinal),
  FOREIGN KEY (run_id, owner_id) REFERENCES challenge_runs(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenge_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id UUID NOT NULL REFERENCES challenge_versions(id) ON DELETE RESTRICT,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL CHECK (correct_count >= 0),
  total_count INTEGER NOT NULL CHECK (total_count > 0),
  accuracy NUMERIC(5,4) NOT NULL CHECK (accuracy BETWEEN 0 AND 1),
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  eligible BOOLEAN NOT NULL DEFAULT false,
  scorer_version TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, owner_id) REFERENCES challenge_runs(id, owner_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenge_bests (
  challenge_version_id UUID NOT NULL REFERENCES challenge_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  best_result_id UUID NOT NULL REFERENCES challenge_results(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  accuracy NUMERIC(5,4) NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (challenge_version_id, user_id)
);

CREATE INDEX IF NOT EXISTS challenge_bests_leaderboard_idx
  ON challenge_bests(challenge_version_id, score DESC, accuracy DESC, elapsed_ms ASC, achieved_at ASC);

CREATE TABLE IF NOT EXISTS challenge_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id UUID NOT NULL REFERENCES challenge_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (sender_id <> recipient_id)
);

-- =============================================================================
-- 8. CURRICULUM, AI, NOTIFICATIONS, OUTBOX & PRIVACY (6 tables)
-- =============================================================================

CREATE TABLE IF NOT EXISTS technique_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  ordinal INTEGER NOT NULL UNIQUE CHECK (ordinal >= 0),
  title TEXT NOT NULL,
  skill TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  content_md TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES technique_lessons(id) ON DELETE CASCADE,
  lesson_version INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL
    CHECK (job_type IN ('document_parse', 'knowledge_extract', 'mnemonic_suggest', 'image_generate', 'video_generate', 'model_3d_generate', 'answer_evaluate')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  pipeline_version TEXT NOT NULL DEFAULT 'pipe-v1',
  prompt_version TEXT NOT NULL DEFAULT 'prompt-v1',
  model_version TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  input_ref_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_ref_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  token_usage_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_micros BIGINT NOT NULL DEFAULT 0 CHECK (cost_micros >= 0),
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL
    CHECK (kind IN ('friend_request', 'friend_accepted', 'challenge_invite', 'challenge_verified', 'review_due', 'export_ready', 'intervention_proposed')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  schema_version SMALLINT NOT NULL DEFAULT 1,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  attempts SMALLINT NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS outbox_events_unprocessed_idx
  ON outbox_events(created_at ASC)
  WHERE processed_at IS NULL;

CREATE TABLE IF NOT EXISTS data_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'ready', 'expired', 'failed')),
  asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (user_id, idempotency_key)
);

COMMIT;
