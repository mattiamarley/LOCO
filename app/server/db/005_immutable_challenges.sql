-- LOCO Backend Blueprint v2 — 005_immutable_challenges.sql
-- Challenge Integrity, Audit & Immutability Controls (3 tables + triggers)

BEGIN;

CREATE TABLE IF NOT EXISTS challenge_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL UNIQUE REFERENCES challenge_runs(id) ON DELETE CASCADE,
  verifier_version TEXT NOT NULL DEFAULT 'verifier-v2',
  nonce_verified BOOLEAN NOT NULL,
  deadline_verified BOOLEAN NOT NULL,
  payload_valid BOOLEAN NOT NULL,
  anomaly_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
  rejection_reason TEXT,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES challenge_runs(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
  event_kind TEXT NOT NULL
    CHECK (event_kind IN ('run_started', 'run_submitted', 'result_verified', 'result_rejected', 'score_revoked', 'best_recomputed')),
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_version_id UUID NOT NULL REFERENCES challenge_versions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global')),
  entry_count INTEGER NOT NULL DEFAULT 0,
  entries_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION prevent_published_challenge_version_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.published_at IS NOT NULL AND (
    NEW.rules_json IS DISTINCT FROM OLD.rules_json OR
    NEW.duration_ms IS DISTINCT FROM OLD.duration_ms OR
    NEW.scorer_type IS DISTINCT FROM OLD.scorer_type OR
    NEW.scorer_version IS DISTINCT FROM OLD.scorer_version OR
    NEW.public_stimuli_json IS DISTINCT FROM OLD.public_stimuli_json OR
    NEW.private_answer_key_json IS DISTINCT FROM OLD.private_answer_key_json
  ) THEN
    RAISE EXCEPTION 'Published challenge_version is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_challenge_version ON challenge_versions;
CREATE TRIGGER trg_immutable_challenge_version
  BEFORE UPDATE ON challenge_versions
  FOR EACH ROW
  EXECUTE FUNCTION prevent_published_challenge_version_mutation();

COMMIT;
