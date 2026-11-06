-- LOCO Backend Blueprint v2 — 002_rls_optional.sql
-- Optional PostgreSQL Row-Level Security (defense-in-depth, requires session binding)
-- Set `SET LOCAL app.current_user_id = '<uuid>';` inside authenticated DB transactions.

BEGIN;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE palaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE loci ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mnemonic_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_profile_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY owner_user_preferences ON user_preferences
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

CREATE POLICY owner_study_projects ON study_projects
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_media_assets ON media_assets
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_source_documents ON source_documents
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_document_chunks ON document_chunks
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_knowledge_items ON knowledge_items
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_palaces ON palaces
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_loci ON loci
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_learning_targets ON learning_targets
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_mnemonic_associations ON mnemonic_associations
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_review_attempts ON review_attempts
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_review_schedules ON review_schedules
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_training_sessions ON training_sessions
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_training_trials ON training_trials
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_skill_profile_snapshots ON skill_profile_snapshots
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_challenge_runs ON challenge_runs
  USING (owner_id = app_current_user_id())
  WITH CHECK (owner_id = app_current_user_id());

CREATE POLICY owner_notifications ON notifications
  USING (user_id = app_current_user_id())
  WITH CHECK (user_id = app_current_user_id());

COMMIT;
