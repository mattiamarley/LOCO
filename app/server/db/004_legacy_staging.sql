-- LOCO Backend Blueprint v2 — 004_legacy_staging.sql
-- Legacy SQLite -> PostgreSQL Migration Mapping & Staging (3 tables)
-- Preserves 2D x/y coordinates, original millisecond due dates, and forgot/help/correct history.

BEGIN;

CREATE TABLE IF NOT EXISTS legacy_id_mappings (
  entity_type TEXT NOT NULL
    CHECK (entity_type IN ('user', 'route_project', 'route_palace', 'locus', 'knowledge_item', 'learning_target', 'mnemonic_association', 'review')),
  legacy_id TEXT NOT NULL,
  new_id UUID NOT NULL,
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, legacy_id)
);

CREATE TABLE IF NOT EXISTS legacy_locus_state (
  locus_id UUID PRIMARY KEY REFERENCES loci(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  legacy_route_id TEXT NOT NULL,
  legacy_locus_id TEXT NOT NULL,
  legacy_x DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK (legacy_x BETWEEN 0 AND 1),
  legacy_y DOUBLE PRECISION NOT NULL DEFAULT 0.5 CHECK (legacy_y BETWEEN 0 AND 1),
  legacy_streak INTEGER NOT NULL DEFAULT 0,
  legacy_due_ms BIGINT NOT NULL,
  legacy_studied BOOLEAN NOT NULL DEFAULT false,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legacy_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  legacy_review_id TEXT NOT NULL UNIQUE,
  legacy_locus_id TEXT NOT NULL,
  mapped_target_id UUID REFERENCES learning_targets(id) ON DELETE SET NULL,
  legacy_outcome TEXT NOT NULL CHECK (legacy_outcome IN ('forgot', 'help', 'correct')),
  reviewed_at_ms BIGINT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legacy_review_events_owner_idx
  ON legacy_review_events(owner_id, reviewed_at_ms DESC);

COMMIT;
