PRAGMA foreign_keys=ON;

-- =============================================================================
-- LEGACY v1 TABLES (preserved for 100% compatibility with prototype & tests)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS routes(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,title TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',topic TEXT NOT NULL DEFAULT '',environment TEXT NOT NULL DEFAULT 'room',status TEXT NOT NULL DEFAULT 'draft',created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS routes_owner ON routes(user_id,updated_at);
CREATE TABLE IF NOT EXISTS loci(id TEXT PRIMARY KEY,route_id TEXT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,position INTEGER NOT NULL,label TEXT NOT NULL,question TEXT NOT NULL,answer TEXT NOT NULL,scene TEXT NOT NULL DEFAULT '',x REAL NOT NULL DEFAULT 0.5,y REAL NOT NULL DEFAULT 0.5,streak INTEGER NOT NULL DEFAULT 0,due INTEGER NOT NULL,studied INTEGER NOT NULL DEFAULT 0,UNIQUE(route_id,position));
CREATE TABLE IF NOT EXISTS reviews(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,locus_id TEXT NOT NULL REFERENCES loci(id) ON DELETE CASCADE,outcome TEXT NOT NULL,at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS review_owner ON reviews(user_id,at);
CREATE TABLE IF NOT EXISTS lesson_progress(user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,lesson INTEGER NOT NULL,completed_at INTEGER NOT NULL,PRIMARY KEY(user_id,lesson));

-- =============================================================================
-- LOCO BACKEND BLUEPRINT v2 TABLES (SQLite runtime mirror of the 54 PG tables)
-- =============================================================================

-- 1. Identity & Preferences
CREATE TABLE IF NOT EXISTS app_users(
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_asset_id TEXT,
  locale TEXT NOT NULL DEFAULT 'it-IT',
  timezone TEXT NOT NULL DEFAULT 'Europe/Rome',
  discoverable INTEGER NOT NULL DEFAULT 1,
  leaderboard_visibility TEXT NOT NULL DEFAULT 'public',
  account_status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE IF NOT EXISTS user_preferences(
  user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  learning_goal TEXT NOT NULL DEFAULT 'exam',
  daily_target_minutes INTEGER NOT NULL DEFAULT 15,
  desired_retention REAL NOT NULL DEFAULT 0.9,
  preferred_srs_algorithm TEXT NOT NULL DEFAULT 'simple-v1',
  accessibility_json TEXT NOT NULL DEFAULT '{}',
  ai_personalization_opt_in INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- 2. Social & Friends
CREATE TABLE IF NOT EXISTS friend_requests(
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  responded_at TEXT
);
CREATE INDEX IF NOT EXISTS friend_requests_recipient_idx ON friend_requests(recipient_id, status);
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON friend_requests(sender_id, status);

CREATE TABLE IF NOT EXISTS friendships(
  user_low_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  user_high_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_request_id TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(user_low_id, user_high_id)
);

CREATE TABLE IF NOT EXISTS user_blocks(
  blocker_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(blocker_id, blocked_id)
);

-- 3. Study, Media Assets & Knowledge
CREATE TABLE IF NOT EXISTS study_projects(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  target_date TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS study_projects_owner_idx ON study_projects(owner_id, updated_at);

CREATE TABLE IF NOT EXISTS media_assets(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  media_kind TEXT NOT NULL DEFAULT 'document',
  status TEXT NOT NULL DEFAULT 'uploaded',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_variants(
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_variant_id TEXT,
  variant_kind TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER,
  codec TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_documents(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES study_projects(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'it',
  page_count INTEGER NOT NULL DEFAULT 1,
  parser_version TEXT NOT NULL DEFAULT 'pdf-text-v1',
  ocr_used INTEGER NOT NULL DEFAULT 0,
  ocr_notice TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_chunks(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  page_start INTEGER NOT NULL DEFAULT 1,
  page_end INTEGER NOT NULL DEFAULT 1,
  char_start INTEGER NOT NULL DEFAULT 0,
  char_end INTEGER NOT NULL DEFAULT 0,
  heading TEXT,
  content_text TEXT NOT NULL,
  token_estimate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(document_id, ordinal)
);

CREATE TABLE IF NOT EXISTS knowledge_items(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES study_projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'concept',
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  brief_explanation TEXT NOT NULL DEFAULT '',
  importance INTEGER NOT NULL DEFAULT 3,
  state TEXT NOT NULL DEFAULT 'proposed',
  origin TEXT NOT NULL DEFAULT 'manual',
  current_revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS knowledge_items_project_idx ON knowledge_items(owner_id, project_id, state);

CREATE TABLE IF NOT EXISTS knowledge_evidence(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE,
  chunk_id TEXT NOT NULL REFERENCES document_chunks(id) ON DELETE CASCADE,
  page_number INTEGER,
  quote_text TEXT NOT NULL DEFAULT '',
  confidence REAL NOT NULL DEFAULT 1.0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS knowledge_revisions(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  brief_explanation TEXT NOT NULL DEFAULT '',
  changed_by TEXT NOT NULL DEFAULT 'user',
  change_reason TEXT NOT NULL DEFAULT 'initial',
  created_at TEXT NOT NULL,
  UNIQUE(knowledge_item_id, revision)
);

CREATE TABLE IF NOT EXISTS knowledge_relations(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  from_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  to_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(owner_id, from_item_id, to_item_id, relation_type)
);

-- 4. Palaces, Scene Versions, Loci, Anchors, Placements & Mnemonics
CREATE TABLE IF NOT EXISTS palaces(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES study_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  environment_kind TEXT NOT NULL DEFAULT 'room',
  scene_version TEXT NOT NULL DEFAULT 'loco-room-v1',
  status TEXT NOT NULL DEFAULT 'draft',
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS palace_scene_versions(
  id TEXT PRIMARY KEY,
  palace_id TEXT NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  scene_code TEXT NOT NULL,
  scene_kind TEXT NOT NULL DEFAULT 'room_3d',
  coordinate_frame_id TEXT NOT NULL,
  scene_asset_id TEXT,
  bounds_json TEXT NOT NULL DEFAULT '{}',
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(palace_id, version_number),
  UNIQUE(palace_id, scene_code)
);

CREATE TABLE IF NOT EXISTS palace_loci(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  palace_id TEXT NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  label TEXT NOT NULL,
  scene_version TEXT NOT NULL DEFAULT 'loco-room-v1',
  anchor_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(palace_id, ordinal)
);

CREATE TABLE IF NOT EXISTS locus_anchors(
  id TEXT PRIMARY KEY,
  locus_id TEXT NOT NULL REFERENCES palace_loci(id) ON DELETE CASCADE,
  palace_id TEXT NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scene_version_id TEXT NOT NULL REFERENCES palace_scene_versions(id) ON DELETE CASCADE,
  coordinate_frame_id TEXT NOT NULL,
  anchor_kind TEXT NOT NULL DEFAULT 'surface_3d',
  point_json TEXT NOT NULL,
  normal_json TEXT,
  camera_pose_json TEXT,
  uv_json TEXT,
  surface_label TEXT NOT NULL DEFAULT '',
  object_ref TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(locus_id, scene_version_id)
);

CREATE TABLE IF NOT EXISTS learning_targets(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_item_id TEXT NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  prompt_mode TEXT NOT NULL DEFAULT 'forward',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(knowledge_item_id, prompt_mode)
);

CREATE TABLE IF NOT EXISTS mnemonic_associations(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  learning_target_id TEXT NOT NULL REFERENCES learning_targets(id) ON DELETE CASCADE,
  locus_id TEXT REFERENCES palace_loci(id) ON DELETE SET NULL,
  technique TEXT NOT NULL DEFAULT 'loci',
  association_text TEXT NOT NULL DEFAULT '',
  image_asset_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  media_mode TEXT NOT NULL DEFAULT 'text',
  origin TEXT NOT NULL DEFAULT 'user',
  state TEXT NOT NULL DEFAULT 'confirmed',
  current_revision INTEGER NOT NULL DEFAULT 1,
  encoding_duration_ms INTEGER,
  revision_count INTEGER NOT NULL DEFAULT 1,
  hint_requests INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS association_revisions(
  id TEXT PRIMARY KEY,
  association_id TEXT NOT NULL REFERENCES mnemonic_associations(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  technique TEXT NOT NULL,
  association_text TEXT NOT NULL DEFAULT '',
  media_mode TEXT NOT NULL DEFAULT 'text',
  primary_asset_id TEXT,
  change_reason TEXT NOT NULL DEFAULT 'initial',
  created_at TEXT NOT NULL,
  UNIQUE(association_id, revision)
);

CREATE TABLE IF NOT EXISTS association_media_links(
  id TEXT PRIMARY KEY,
  association_id TEXT NOT NULL REFERENCES mnemonic_associations(id) ON DELETE CASCADE,
  association_revision INTEGER NOT NULL,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  variant_id TEXT REFERENCES media_variants(id) ON DELETE SET NULL,
  media_role TEXT NOT NULL DEFAULT 'primary',
  ordinal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS locus_placements(
  id TEXT PRIMARY KEY,
  locus_id TEXT NOT NULL REFERENCES palace_loci(id) ON DELETE CASCADE,
  palace_id TEXT NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scene_version_id TEXT NOT NULL REFERENCES palace_scene_versions(id) ON DELETE CASCADE,
  association_id TEXT REFERENCES mnemonic_associations(id) ON DELETE SET NULL,
  asset_id TEXT REFERENCES media_assets(id) ON DELETE SET NULL,
  variant_id TEXT REFERENCES media_variants(id) ON DELETE SET NULL,
  placement_kind TEXT NOT NULL DEFAULT 'glb_model',
  position_json TEXT NOT NULL DEFAULT '{"x":0,"y":0,"z":0}',
  rotation_json TEXT NOT NULL DEFAULT '{"x":0,"y":0,"z":0}',
  scale_json TEXT NOT NULL DEFAULT '{"x":1,"y":1,"z":1}',
  animation_clip TEXT,
  playback_mode TEXT NOT NULL DEFAULT 'static',
  ordinal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS palace_map_references(
  id TEXT PRIMARY KEY,
  palace_id TEXT NOT NULL REFERENCES palaces(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_pano_id TEXT,
  latitude REAL,
  longitude REAL,
  heading REAL NOT NULL DEFAULT 0,
  pitch REAL NOT NULL DEFAULT 0,
  fov REAL NOT NULL DEFAULT 75,
  attribution_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- 5. Learning, Recall & SRS Schedules
CREATE TABLE IF NOT EXISTS study_sessions(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id TEXT REFERENCES study_projects(id) ON DELETE SET NULL,
  palace_id TEXT REFERENCES palaces(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'recall',
  started_at TEXT NOT NULL,
  ended_at TEXT,
  active_duration_ms INTEGER
);

CREATE TABLE IF NOT EXISTS review_attempts(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES learning_targets(id) ON DELETE CASCADE,
  study_session_id TEXT REFERENCES study_sessions(id) ON DELETE SET NULL,
  knowledge_revision INTEGER NOT NULL,
  association_id TEXT REFERENCES mnemonic_associations(id) ON DELETE SET NULL,
  association_revision INTEGER,
  locus_id TEXT REFERENCES palace_loci(id) ON DELETE SET NULL,
  answered_at TEXT NOT NULL,
  response_ms INTEGER,
  active_duration_ms INTEGER,
  verdict TEXT NOT NULL,
  scheduler_grade TEXT NOT NULL,
  hint_count INTEGER NOT NULL DEFAULT 0,
  viewed_answer_before_attempt INTEGER NOT NULL DEFAULT 0,
  evaluation_mode TEXT NOT NULL DEFAULT 'self',
  confidence INTEGER,
  response_text TEXT,
  recall_delay_seconds INTEGER NOT NULL DEFAULT 0,
  media_mode TEXT NOT NULL DEFAULT 'text',
  idempotency_key TEXT NOT NULL,
  UNIQUE(owner_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS review_attempts_owner_target_idx ON review_attempts(owner_id, target_id, answered_at);

CREATE TABLE IF NOT EXISTS review_schedules(
  target_id TEXT PRIMARY KEY REFERENCES learning_targets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  knowledge_revision INTEGER NOT NULL DEFAULT 1,
  algorithm_version TEXT NOT NULL DEFAULT 'simple-v1',
  due_at TEXT NOT NULL,
  due_at_ms INTEGER NOT NULL,
  last_reviewed_at TEXT,
  last_reviewed_at_ms INTEGER,
  streak INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  stability REAL,
  difficulty REAL,
  state_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS review_schedules_owner_due_idx ON review_schedules(owner_id, due_at_ms);

-- 6. Training, Diagnostics, 18 Metrics & Explainable Interventions
CREATE TABLE IF NOT EXISTS training_exercises(
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  skill TEXT NOT NULL,
  default_direction TEXT NOT NULL DEFAULT 'forward',
  generator_version TEXT NOT NULL DEFAULT 'gen-v1',
  scorer_version TEXT NOT NULL DEFAULT 'scorer-v1',
  config_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS training_sessions(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL REFERENCES training_exercises(id) ON DELETE RESTRICT,
  seed TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  test_condition TEXT NOT NULL DEFAULT 'immediate',
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  stimuli_snapshot_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'started',
  started_at TEXT NOT NULL,
  finished_at TEXT,
  active_duration_ms INTEGER,
  idempotency_key TEXT,
  UNIQUE(owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS training_trials(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  stimulus_json TEXT NOT NULL DEFAULT '{}',
  response_json TEXT NOT NULL DEFAULT '{}',
  is_correct INTEGER NOT NULL,
  response_ms INTEGER NOT NULL,
  encoding_ms INTEGER,
  hints_used INTEGER NOT NULL DEFAULT 0,
  error_category TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL,
  UNIQUE(session_id, ordinal)
);

CREATE TABLE IF NOT EXISTS skill_profile_snapshots(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  window_days INTEGER NOT NULL DEFAULT 28,
  sample_size INTEGER NOT NULL DEFAULT 0,
  n_valid INTEGER NOT NULL DEFAULT 0,
  n_unassisted INTEGER NOT NULL DEFAULT 0,
  immediate_accuracy REAL,
  delayed_accuracy REAL,
  median_encoding_ms INTEGER,
  median_retrieval_ms INTEGER,
  p90_retrieval_ms INTEGER,
  position_error_rate REAL,
  efficiency_per_min REAL,
  data_confidence TEXT NOT NULL DEFAULT 'insufficient',
  recommendation_code TEXT NOT NULL DEFAULT 'continue_baseline',
  metric_version TEXT NOT NULL DEFAULT 'v2.0',
  details_json TEXT NOT NULL DEFAULT '{}',
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_metric_definitions(
  metric_key TEXT PRIMARY KEY,
  dashboard_section TEXT NOT NULL,
  display_name TEXT NOT NULL,
  unit TEXT NOT NULL,
  polarity TEXT NOT NULL,
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  min_sample_size INTEGER NOT NULL DEFAULT 10,
  default_window_days INTEGER NOT NULL DEFAULT 28,
  description TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trial_diagnostics(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL,
  review_attempt_id TEXT REFERENCES review_attempts(id) ON DELETE CASCADE,
  training_trial_id TEXT REFERENCES training_trials(id) ON DELETE CASCADE,
  learning_target_id TEXT,
  palace_id TEXT,
  locus_id TEXT,
  skill TEXT NOT NULL,
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  is_correct INTEGER NOT NULL,
  is_unassisted INTEGER NOT NULL,
  error_category TEXT NOT NULL DEFAULT 'none',
  confused_with_key TEXT,
  expected_locus_ordinal INTEGER,
  actual_locus_ordinal INTEGER,
  recall_delay_seconds INTEGER NOT NULL DEFAULT 0,
  delay_bucket TEXT NOT NULL DEFAULT 'immediate',
  encoding_duration_ms INTEGER,
  retrieval_latency_ms INTEGER,
  active_duration_ms INTEGER NOT NULL DEFAULT 0,
  hint_count INTEGER NOT NULL DEFAULT 0,
  viewed_answer_before_attempt INTEGER NOT NULL DEFAULT 0,
  association_revision INTEGER,
  media_mode TEXT NOT NULL DEFAULT 'text',
  difficulty_level INTEGER NOT NULL DEFAULT 1,
  comparability_group TEXT NOT NULL DEFAULT 'standard',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS trial_diagnostics_owner_idx ON trial_diagnostics(owner_id, skill, created_at);

CREATE TABLE IF NOT EXISTS learning_exposures(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  study_session_id TEXT,
  learning_target_id TEXT,
  association_id TEXT,
  association_revision INTEGER,
  palace_id TEXT,
  locus_id TEXT,
  scene_version_id TEXT,
  media_mode TEXT NOT NULL DEFAULT 'text',
  asset_id TEXT,
  dwell_ms INTEGER NOT NULL DEFAULT 0,
  active_duration_ms INTEGER NOT NULL DEFAULT 0,
  interaction_kind TEXT NOT NULL DEFAULT 'study_view',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_metric_snapshots(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL REFERENCES memory_metric_definitions(metric_key) ON DELETE RESTRICT,
  scope_kind TEXT NOT NULL DEFAULT 'global',
  scope_value TEXT NOT NULL DEFAULT 'all',
  window_days INTEGER NOT NULL DEFAULT 28,
  raw_value REAL,
  normalized_score_100 REAL,
  sample_size INTEGER NOT NULL DEFAULT 0,
  n_valid INTEGER NOT NULL DEFAULT 0,
  n_unassisted INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'insufficient',
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  comparability_group TEXT NOT NULL DEFAULT 'standard',
  breakdown_json TEXT NOT NULL DEFAULT '{}',
  computed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_skill_item_stats(
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  n_trials INTEGER NOT NULL DEFAULT 0,
  n_correct INTEGER NOT NULL DEFAULT 0,
  n_unassisted_correct INTEGER NOT NULL DEFAULT 0,
  median_encoding_ms INTEGER,
  median_retrieval_ms INTEGER,
  p90_retrieval_ms INTEGER,
  last_error_category TEXT,
  top_confused_with_key TEXT,
  top_confusion_count INTEGER NOT NULL DEFAULT 0,
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, skill, stimulus_key, direction)
);

CREATE TABLE IF NOT EXISTS locus_confusion_stats(
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  palace_id TEXT NOT NULL,
  locus_id TEXT NOT NULL,
  confused_with_locus_id TEXT NOT NULL,
  n_trials INTEGER NOT NULL DEFAULT 0,
  swap_count INTEGER NOT NULL DEFAULT 0,
  order_skip_count INTEGER NOT NULL DEFAULT 0,
  position_error_rate REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(owner_id, palace_id, locus_id, confused_with_locus_id)
);

CREATE TABLE IF NOT EXISTS learning_interventions(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  rationale_code TEXT NOT NULL,
  algorithm_version TEXT NOT NULL DEFAULT 'adaptive-rules-v2.0',
  metric_version TEXT NOT NULL DEFAULT 'v2.0',
  target_scope TEXT NOT NULL,
  target_id TEXT,
  skill TEXT,
  stimulus_key TEXT,
  recommended_action TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '{}',
  sample_size INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'insufficient',
  status TEXT NOT NULL DEFAULT 'proposed',
  user_response_note TEXT,
  created_at TEXT NOT NULL,
  responded_at TEXT
);

CREATE TABLE IF NOT EXISTS intervention_outcomes(
  id TEXT PRIMARY KEY,
  intervention_id TEXT NOT NULL REFERENCES learning_interventions(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  pre_sample_size INTEGER NOT NULL,
  post_sample_size INTEGER NOT NULL,
  pre_value REAL,
  post_value REAL,
  comparability_verified INTEGER NOT NULL DEFAULT 0,
  outcome_status TEXT NOT NULL,
  evaluation_reason TEXT NOT NULL DEFAULT '',
  evaluated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media_comparability_experiments(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id TEXT,
  skill TEXT NOT NULL,
  media_mode_a TEXT NOT NULL,
  media_mode_b TEXT NOT NULL,
  comparability_group TEXT NOT NULL,
  sample_size_a INTEGER NOT NULL DEFAULT 0,
  sample_size_b INTEGER NOT NULL DEFAULT 0,
  comparability_verified INTEGER NOT NULL DEFAULT 0,
  outcome_status TEXT NOT NULL DEFAULT 'inconclusive',
  metric_version TEXT NOT NULL DEFAULT 'v2.0',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  evaluated_at TEXT
);

-- 7. Arena — Challenges & Leaderboards
CREATE TABLE IF NOT EXISTS challenge_definitions(
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  skill TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_versions(
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES challenge_definitions(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL,
  rules_json TEXT NOT NULL DEFAULT '{}',
  duration_ms INTEGER NOT NULL,
  scorer_type TEXT NOT NULL,
  scorer_version TEXT NOT NULL DEFAULT 'challenge-scorer-v1',
  public_stimuli_json TEXT NOT NULL DEFAULT '[]',
  private_answer_key_json TEXT NOT NULL DEFAULT '[]',
  private_seed TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(challenge_id, version_number)
);

CREATE TABLE IF NOT EXISTS challenge_runs(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id TEXT NOT NULL REFERENCES challenge_versions(id) ON DELETE RESTRICT,
  is_ranked INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'started',
  nonce_hash TEXT NOT NULL,
  started_at TEXT NOT NULL,
  started_at_ms INTEGER NOT NULL,
  deadline_at TEXT NOT NULL,
  deadline_at_ms INTEGER NOT NULL,
  submitted_at TEXT,
  elapsed_ms INTEGER,
  risk_flags_json TEXT NOT NULL DEFAULT '[]',
  idempotency_key TEXT NOT NULL,
  UNIQUE(owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS challenge_answers(
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES challenge_runs(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  submitted_value TEXT NOT NULL,
  response_ms INTEGER,
  is_correct INTEGER,
  created_at TEXT NOT NULL,
  UNIQUE(run_id, ordinal)
);

CREATE TABLE IF NOT EXISTS challenge_results(
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES challenge_runs(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id TEXT NOT NULL REFERENCES challenge_versions(id) ON DELETE RESTRICT,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  eligible INTEGER NOT NULL DEFAULT 0,
  scorer_version TEXT NOT NULL,
  verified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_bests(
  challenge_version_id TEXT NOT NULL REFERENCES challenge_versions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  best_result_id TEXT NOT NULL REFERENCES challenge_results(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  elapsed_ms INTEGER NOT NULL,
  achieved_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(challenge_version_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_invites(
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_version_id TEXT NOT NULL REFERENCES challenge_versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  responded_at TEXT
);

CREATE TABLE IF NOT EXISTS challenge_verifications(
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL UNIQUE REFERENCES challenge_runs(id) ON DELETE CASCADE,
  verifier_version TEXT NOT NULL DEFAULT 'verifier-v2',
  nonce_verified INTEGER NOT NULL,
  deadline_verified INTEGER NOT NULL,
  payload_valid INTEGER NOT NULL,
  anomaly_score REAL NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  verified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_audit_logs(
  id TEXT PRIMARY KEY,
  run_id TEXT,
  actor_id TEXT,
  event_kind TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots(
  id TEXT PRIMARY KEY,
  challenge_version_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  entry_count INTEGER NOT NULL DEFAULT 0,
  entries_json TEXT NOT NULL DEFAULT '[]',
  generated_at TEXT NOT NULL
);

-- 8. Curriculum, AI Jobs, Media Outputs, Notifications, Outbox, Privacy & Legacy Staging
CREATE TABLE IF NOT EXISTS technique_lessons(
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  ordinal INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  skill TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  content_md TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_progress_v2(
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES technique_lessons(id) ON DELETE CASCADE,
  lesson_version INTEGER NOT NULL DEFAULT 1,
  completed_at TEXT NOT NULL,
  PRIMARY KEY(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS ai_jobs(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  pipeline_version TEXT NOT NULL DEFAULT 'pipe-v1',
  prompt_version TEXT NOT NULL DEFAULT 'prompt-v1',
  model_version TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  input_ref_json TEXT NOT NULL DEFAULT '{}',
  output_ref_json TEXT NOT NULL DEFAULT '{}',
  token_usage_json TEXT NOT NULL DEFAULT '{}',
  cost_micros INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(owner_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS media_generation_outputs(
  id TEXT PRIMARY KEY,
  ai_job_id TEXT NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  learning_target_id TEXT,
  association_id TEXT,
  candidate_slot TEXT NOT NULL,
  output_kind TEXT NOT NULL,
  asset_id TEXT,
  variant_id TEXT,
  parent_output_id TEXT,
  provider TEXT NOT NULL DEFAULT 'local-mock',
  model_version TEXT NOT NULL DEFAULT 'gen-v1',
  pipeline_version TEXT NOT NULL DEFAULT 'pipe-v1',
  prompt_redacted TEXT NOT NULL DEFAULT '',
  selected_by_user INTEGER NOT NULL DEFAULT 0,
  cost_micros INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  selected_at TEXT,
  UNIQUE(ai_job_id, candidate_slot)
);

CREATE TABLE IF NOT EXISTS notifications(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  payload_json TEXT NOT NULL DEFAULT '{}',
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox_events(
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  actor_id TEXT,
  schema_version INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  processed_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS data_export_jobs(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ready',
  asset_id TEXT,
  expires_at TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  UNIQUE(user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS legacy_id_mappings(
  entity_type TEXT NOT NULL,
  legacy_id TEXT NOT NULL,
  new_id TEXT NOT NULL,
  migrated_at TEXT NOT NULL,
  PRIMARY KEY(entity_type, legacy_id)
);

CREATE TABLE IF NOT EXISTS legacy_locus_state(
  locus_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  legacy_route_id TEXT NOT NULL,
  legacy_locus_id TEXT NOT NULL,
  legacy_x REAL NOT NULL DEFAULT 0.5,
  legacy_y REAL NOT NULL DEFAULT 0.5,
  legacy_streak INTEGER NOT NULL DEFAULT 0,
  legacy_due_ms INTEGER NOT NULL,
  legacy_studied INTEGER NOT NULL DEFAULT 0,
  imported_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS legacy_review_events(
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  legacy_review_id TEXT NOT NULL UNIQUE,
  legacy_locus_id TEXT NOT NULL,
  mapped_target_id TEXT,
  legacy_outcome TEXT NOT NULL,
  reviewed_at_ms INTEGER NOT NULL,
  imported_at TEXT NOT NULL
);

PRAGMA user_version=1;
