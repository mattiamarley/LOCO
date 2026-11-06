-- LOCO Backend Blueprint v2 — 007_performance_adaptivity.sql
-- Addendum v2: Memory Performance (18 versioned metric families) & Explainable Adaptivity (9 additive tables)

BEGIN;

-- 1. Memory Metric Definitions (Catalog of the 18 versioned metric families)
CREATE TABLE IF NOT EXISTS memory_metric_definitions (
  metric_key TEXT PRIMARY KEY,
  dashboard_section TEXT NOT NULL
    CHECK (dashboard_section IN ('overview', 'memory_skills', 'technique_mastery', 'learning_analytics', 'records_rankings')),
  display_name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('ratio', 'ms', 'items_per_min', 'score_100', 'days', 'count', 'trials_per_item')),
  polarity TEXT NOT NULL CHECK (polarity IN ('higher_better', 'lower_better', 'neutral')),
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  min_sample_size INTEGER NOT NULL DEFAULT 20 CHECK (min_sample_size >= 1),
  default_window_days INTEGER NOT NULL DEFAULT 28 CHECK (default_window_days >= 1),
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO memory_metric_definitions (
  metric_key, dashboard_section, display_name, unit, polarity, formula_version, min_sample_size, default_window_days, description
) VALUES
  ('immediate_recall_accuracy', 'overview', 'Immediate Recall Accuracy', 'ratio', 'higher_better', 'v2.0', 10, 28, 'Risposte corrette senza aiuti su prove immediate valide.'),
  ('delayed_recall_accuracy', 'overview', 'Delayed Recall Accuracy', 'ratio', 'higher_better', 'v2.0', 10, 28, 'Risposte corrette senza aiuti a distanza, con finestra di delay dichiarata (>= 24h).'),
  ('encoding_speed', 'overview', 'Encoding Speed', 'ms', 'lower_better', 'v2.0', 10, 28, 'Mediana millisecondi per elemento codificato su compiti comparabili.'),
  ('retrieval_speed', 'overview', 'Retrieval Speed', 'ms', 'lower_better', 'v2.0', 10, 28, 'Mediana tempo di risposta in ms su tentativi corretti e autonomi.'),
  ('retention_efficiency', 'overview', 'Retention Efficiency', 'items_per_min', 'higher_better', 'v2.0', 10, 28, 'Elementi corretti a distanza diviso minuti attivi di studio.'),
  ('learning_rate', 'learning_analytics', 'Learning Rate', 'ratio', 'higher_better', 'v2.0', 20, 28, 'Variazione di accuratezza nel tempo su set, difficoltà e test comparabili.'),
  ('error_rate', 'learning_analytics', 'Error Rate', 'ratio', 'lower_better', 'v2.0', 10, 28, 'Quota e distribuzione per categoria di errore su prove valide.'),
  ('hint_dependency', 'learning_analytics', 'Hint Dependency', 'ratio', 'lower_better', 'v2.0', 10, 28, 'Quota di risposte con aiuto, distinta dalla visione anticipata della risposta.'),
  ('memory_stability', 'learning_analytics', 'Memory Stability', 'days', 'higher_better', 'v2.0', 15, 28, 'Stima mediana di stabilità in giorni dello scheduler versionato sulle nozioni attive.'),
  ('recall_consistency', 'learning_analytics', 'Recall Consistency', 'ratio', 'higher_better', 'v2.0', 15, 28, 'Complemento della dispersione (1 - IQR normalizzato) su prove equivalenti.'),
  ('training_volume', 'overview', 'Training Volume', 'count', 'neutral', 'v2.0', 1, 28, 'Sessioni, item e tempo attivo nel periodo; non confondere con apprendimento.'),
  ('review_efficiency', 'learning_analytics', 'Review Efficiency', 'trials_per_item', 'lower_better', 'v2.0', 10, 28, 'Ripassi medi necessari al raggiungimento di 3 richiami autonomi consecutivi.'),
  ('spatial_memory', 'memory_skills', 'Spatial Memory', 'score_100', 'higher_better', 'v2.0', 15, 28, 'Accuratezza posizione/ordine sui loci con test avanti, inverso e casuale.'),
  ('visual_encoding', 'memory_skills', 'Visual Encoding', 'score_100', 'higher_better', 'v2.0', 15, 28, 'Rapidità e correttezza di codifica/richiamo in prove visive e associative.'),
  ('numerical_memory', 'memory_skills', 'Numerical Memory', 'score_100', 'higher_better', 'v2.0', 15, 28, 'Cifre corrette e conversione Major/PAO distinte per direzione.'),
  ('conceptual_association', 'memory_skills', 'Conceptual Association', 'score_100', 'higher_better', 'v2.0', 10, 28, 'Decodifica dell’immagine mnemonica e spiegazione corretta del concetto.'),
  ('sequential_memory', 'memory_skills', 'Sequential Memory', 'score_100', 'higher_better', 'v2.0', 15, 28, 'Accuratezza di ordine e assenza di salti nei loci e nelle sequenze.'),
  ('technique_mastery', 'technique_mastery', 'Technique Mastery', 'score_100', 'higher_better', 'v2.0', 20, 28, 'Progresso specifico per tecnica (Major 00–99, PAO, Loci, Faces, Speech, Abstract).')
ON CONFLICT (metric_key) DO NOTHING;

-- 2. Trial Diagnostics (per-attempt granular diagnostic record linked to review_attempts or training_trials)
CREATE TABLE IF NOT EXISTS trial_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('review_attempt', 'training_trial')),
  review_attempt_id UUID,
  training_trial_id UUID,
  learning_target_id UUID,
  palace_id UUID,
  locus_id UUID,
  skill TEXT NOT NULL
    CHECK (skill IN ('loci', 'numbers', 'major', 'pao', 'faces', 'abstract', 'speech')),
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  is_correct BOOLEAN NOT NULL,
  is_unassisted BOOLEAN NOT NULL,
  error_category TEXT NOT NULL DEFAULT 'none'
    CHECK (error_category IN ('none', 'position', 'decoding', 'conceptual', 'order', 'timeout')),
  confused_with_key TEXT,
  expected_locus_ordinal INTEGER,
  actual_locus_ordinal INTEGER,
  recall_delay_seconds INTEGER NOT NULL DEFAULT 0 CHECK (recall_delay_seconds >= 0),
  delay_bucket TEXT NOT NULL DEFAULT 'immediate'
    CHECK (delay_bucket IN ('immediate', 'same_day', 'd1_3', 'd4_7', 'd8_30', 'd30_plus')),
  encoding_duration_ms INTEGER CHECK (encoding_duration_ms IS NULL OR encoding_duration_ms >= 0),
  retrieval_latency_ms INTEGER CHECK (retrieval_latency_ms IS NULL OR retrieval_latency_ms >= 0),
  active_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (active_duration_ms >= 0),
  hint_count SMALLINT NOT NULL DEFAULT 0 CHECK (hint_count >= 0),
  viewed_answer_before_attempt BOOLEAN NOT NULL DEFAULT false,
  association_revision INTEGER CHECK (association_revision IS NULL OR association_revision >= 1),
  media_mode TEXT NOT NULL DEFAULT 'text'
    CHECK (media_mode IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  difficulty_level SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 10),
  comparability_group TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (source_kind = 'review_attempt' AND review_attempt_id IS NOT NULL AND training_trial_id IS NULL) OR
    (source_kind = 'training_trial' AND training_trial_id IS NOT NULL AND review_attempt_id IS NULL)
  ),
  FOREIGN KEY (review_attempt_id, owner_id) REFERENCES review_attempts(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (training_trial_id, owner_id) REFERENCES training_trials(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS trial_diagnostics_owner_skill_created_idx
  ON trial_diagnostics(owner_id, skill, created_at DESC);

CREATE INDEX IF NOT EXISTS trial_diagnostics_owner_stimulus_dir_idx
  ON trial_diagnostics(owner_id, stimulus_key, direction);

-- 3. Learning Exposures (what material/media was actually viewed or studied and for how long)
CREATE TABLE IF NOT EXISTS learning_exposures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  study_session_id UUID,
  learning_target_id UUID,
  association_id UUID,
  association_revision INTEGER,
  palace_id UUID,
  locus_id UUID,
  scene_version_id UUID,
  media_mode TEXT NOT NULL DEFAULT 'text'
    CHECK (media_mode IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  asset_id UUID,
  dwell_ms INTEGER NOT NULL CHECK (dwell_ms >= 0),
  active_duration_ms INTEGER NOT NULL CHECK (active_duration_ms >= 0),
  interaction_kind TEXT NOT NULL DEFAULT 'study_view'
    CHECK (interaction_kind IN ('study_view', 'encoding_edit', 'locus_walkthrough', 'media_replay')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (study_session_id, owner_id) REFERENCES study_sessions(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (learning_target_id, owner_id) REFERENCES learning_targets(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS learning_exposures_owner_target_idx
  ON learning_exposures(owner_id, learning_target_id, created_at DESC);

-- 4. User Metric Snapshots (versioned snapshots for the 18 metric families with explicit sample_size & window)
CREATE TABLE IF NOT EXISTS user_metric_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL REFERENCES memory_metric_definitions(metric_key) ON DELETE RESTRICT,
  scope_kind TEXT NOT NULL DEFAULT 'global'
    CHECK (scope_kind IN ('global', 'skill', 'direction', 'media_mode', 'delay_bucket')),
  scope_value TEXT NOT NULL DEFAULT 'all',
  window_days INTEGER NOT NULL DEFAULT 28 CHECK (window_days >= 1),
  raw_value NUMERIC(14,4),
  normalized_score_100 NUMERIC(5,2) CHECK (normalized_score_100 IS NULL OR normalized_score_100 BETWEEN 0 AND 100),
  sample_size INTEGER NOT NULL DEFAULT 0 CHECK (sample_size >= 0),
  n_valid INTEGER NOT NULL DEFAULT 0 CHECK (n_valid >= 0),
  n_unassisted INTEGER NOT NULL DEFAULT 0 CHECK (n_unassisted >= 0),
  confidence_level TEXT NOT NULL DEFAULT 'insufficient'
    CHECK (confidence_level IN ('insufficient', 'low', 'medium', 'high')),
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  comparability_group TEXT NOT NULL DEFAULT 'standard',
  breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_metric_snapshots_lookup_idx
  ON user_metric_snapshots(owner_id, metric_key, scope_kind, scope_value, computed_at DESC);

-- 5. User Skill Item Stats (granular item-level stats e.g. Major 00-99 pairs per direction)
CREATE TABLE IF NOT EXISTS user_skill_item_stats (
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  skill TEXT NOT NULL
    CHECK (skill IN ('loci', 'numbers', 'major', 'pao', 'faces', 'abstract', 'speech')),
  stimulus_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'forward',
  n_trials INTEGER NOT NULL DEFAULT 0 CHECK (n_trials >= 0),
  n_correct INTEGER NOT NULL DEFAULT 0 CHECK (n_correct >= 0),
  n_unassisted_correct INTEGER NOT NULL DEFAULT 0 CHECK (n_unassisted_correct >= 0),
  median_encoding_ms INTEGER,
  median_retrieval_ms INTEGER,
  p90_retrieval_ms INTEGER,
  last_error_category TEXT,
  top_confused_with_key TEXT,
  top_confusion_count INTEGER NOT NULL DEFAULT 0,
  formula_version TEXT NOT NULL DEFAULT 'v2.0',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, skill, stimulus_key, direction)
);

-- 6. Locus Confusion Stats (tracks swaps and order errors between specific loci in a palace)
CREATE TABLE IF NOT EXISTS locus_confusion_stats (
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  palace_id UUID NOT NULL,
  locus_id UUID NOT NULL,
  confused_with_locus_id UUID NOT NULL,
  n_trials INTEGER NOT NULL DEFAULT 0 CHECK (n_trials >= 0),
  swap_count INTEGER NOT NULL DEFAULT 0 CHECK (swap_count >= 0),
  order_skip_count INTEGER NOT NULL DEFAULT 0 CHECK (order_skip_count >= 0),
  position_error_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, palace_id, locus_id, confused_with_locus_id),
  FOREIGN KEY (palace_id, owner_id) REFERENCES palaces(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (locus_id, owner_id) REFERENCES loci(id, owner_id) ON DELETE CASCADE
);

-- 7. Learning Interventions (explainable adaptive recommendations with rationale_code, evidence & confidence)
CREATE TABLE IF NOT EXISTS learning_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  rationale_code TEXT NOT NULL
    CHECK (rationale_code IN (
      'insufficient_data_baseline',
      'repeated_target_errors_revise_association',
      'neighbor_loci_swap_interleaving',
      'slow_major_pair_bidirectional_drill',
      'high_immediate_low_delayed_increase_spacing',
      'high_hint_dependency_closed_book_recall',
      'conceptual_vs_decoding_gap_explain_mode',
      'ready_for_harder_or_delayed_test'
    )),
  algorithm_version TEXT NOT NULL DEFAULT 'adaptive-rules-v2.0',
  metric_version TEXT NOT NULL DEFAULT 'v2.0',
  target_scope TEXT NOT NULL
    CHECK (target_scope IN ('learning_target', 'skill', 'palace', 'locus', 'schedule', 'global')),
  target_id UUID,
  skill TEXT,
  stimulus_key TEXT,
  recommended_action TEXT NOT NULL,
  explanation TEXT NOT NULL,
  evidence_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  confidence_level TEXT NOT NULL
    CHECK (confidence_level IN ('insufficient', 'low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'accepted', 'dismissed', 'completed', 'expired')),
  user_response_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE (id, owner_id)
);

CREATE INDEX IF NOT EXISTS learning_interventions_owner_status_idx
  ON learning_interventions(owner_id, status, created_at DESC);

-- 8. Intervention Outcomes (post-intervention evaluation requiring verified comparability)
CREATE TABLE IF NOT EXISTS intervention_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intervention_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL REFERENCES memory_metric_definitions(metric_key) ON DELETE RESTRICT,
  pre_sample_size INTEGER NOT NULL CHECK (pre_sample_size >= 0),
  post_sample_size INTEGER NOT NULL CHECK (post_sample_size >= 0),
  pre_value NUMERIC(14,4),
  post_value NUMERIC(14,4),
  comparability_verified BOOLEAN NOT NULL DEFAULT false,
  outcome_status TEXT NOT NULL
    CHECK (outcome_status IN ('improved', 'no_change', 'regressed', 'inconclusive')),
  evaluation_reason TEXT NOT NULL DEFAULT '',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (intervention_id, owner_id) REFERENCES learning_interventions(id, owner_id) ON DELETE CASCADE
);

-- 9. Media Comparability Experiments (optional controlled comparisons e.g. image vs video without false causality)
CREATE TABLE IF NOT EXISTS media_comparability_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  project_id UUID,
  skill TEXT NOT NULL,
  media_mode_a TEXT NOT NULL CHECK (media_mode_a IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  media_mode_b TEXT NOT NULL CHECK (media_mode_b IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  comparability_group TEXT NOT NULL,
  sample_size_a INTEGER NOT NULL DEFAULT 0 CHECK (sample_size_a >= 0),
  sample_size_b INTEGER NOT NULL DEFAULT 0 CHECK (sample_size_b >= 0),
  comparability_verified BOOLEAN NOT NULL DEFAULT false,
  outcome_status TEXT NOT NULL DEFAULT 'inconclusive'
    CHECK (outcome_status IN ('inconclusive', 'mode_a_better', 'mode_b_better', 'equivalent')),
  metric_version TEXT NOT NULL DEFAULT 'v2.0',
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evaluated_at TIMESTAMPTZ,
  FOREIGN KEY (project_id, owner_id) REFERENCES study_projects(id, owner_id) ON DELETE SET NULL
);

COMMIT;
