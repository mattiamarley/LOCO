-- LOCO Backend Blueprint v2 — 006_media_spatial.sql
-- Addendum v2: Media & Spatial Engine (8 additive tables)
-- Supports image/video/GLB variants, association revision history, immutable palace scene versions,
-- versioned 3D/photo anchors, multi-object locus placements, AI generation candidates, and map references.

BEGIN;

-- 1. Media Variants (renderings/transcodes of private media_assets, with parent->child derivation)
CREATE TABLE IF NOT EXISTS media_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  parent_variant_id UUID REFERENCES media_variants(id) ON DELETE SET NULL,
  variant_kind TEXT NOT NULL
    CHECK (variant_kind IN ('original', 'thumbnail', 'webp_preview', 'video_mp4', 'video_hls', 'glb_lod0', 'glb_lod1', 'poster', 'audio_norm')),
  storage_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  sha256 TEXT NOT NULL CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  width INTEGER CHECK (width IS NULL OR width > 0),
  height INTEGER CHECK (height IS NULL OR height > 0),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  codec TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  FOREIGN KEY (asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS media_variants_asset_idx
  ON media_variants(owner_id, asset_id, variant_kind);

-- 2. Association Revisions (immutable history when mnemonic text, technique, or media changes)
CREATE TABLE IF NOT EXISTS association_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  technique TEXT NOT NULL
    CHECK (technique IN ('loci', 'link_story', 'major', 'pao', 'peg', 'acrostic', 'visual_metaphor')),
  association_text TEXT NOT NULL DEFAULT '',
  media_mode TEXT NOT NULL DEFAULT 'text'
    CHECK (media_mode IN ('text', 'image', 'video', 'animated_3d', 'audio')),
  primary_asset_id UUID,
  change_reason TEXT NOT NULL DEFAULT 'initial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (association_id, revision),
  UNIQUE (id, owner_id),
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (primary_asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE SET NULL
);

-- 3. Association Media Links (one association can reference multiple images/videos/3D models)
CREATE TABLE IF NOT EXISTS association_media_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID NOT NULL,
  association_revision INTEGER NOT NULL CHECK (association_revision >= 1),
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL,
  variant_id UUID,
  media_role TEXT NOT NULL DEFAULT 'primary'
    CHECK (media_role IN ('primary', 'alternate', 'spatial_model', 'motion_clip', 'audio_cue')),
  ordinal SMALLINT NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (association_id, association_revision, ordinal),
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id, owner_id) REFERENCES media_variants(id, owner_id) ON DELETE SET NULL
);

-- 4. Palace Scene Versions (immutable spatial coordinate frames so conversions never corrupt old coordinates)
CREATE TABLE IF NOT EXISTS palace_scene_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palace_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  scene_code TEXT NOT NULL,
  scene_kind TEXT NOT NULL
    CHECK (scene_kind IN ('room_3d', 'castle_3d', 'photo_2d', 'panorama_360', 'scan_glb', 'streetview_ref')),
  coordinate_frame_id TEXT NOT NULL,
  scene_asset_id UUID,
  bounds_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (palace_id, version_number),
  UNIQUE (palace_id, scene_code),
  UNIQUE (id, palace_id, owner_id),
  FOREIGN KEY (palace_id, owner_id) REFERENCES palaces(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (scene_asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE SET NULL
);

-- 5. Locus Anchors (versioned spatial anchor tied to a specific palace_scene_versions row)
CREATE TABLE IF NOT EXISTS locus_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locus_id UUID NOT NULL,
  palace_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL,
  coordinate_frame_id TEXT NOT NULL,
  anchor_kind TEXT NOT NULL DEFAULT 'surface_3d'
    CHECK (anchor_kind IN ('surface_3d', 'photo_uv', 'panorama_spherical')),
  point_json JSONB NOT NULL,
  normal_json JSONB,
  camera_pose_json JSONB,
  uv_json JSONB,
  surface_label TEXT NOT NULL DEFAULT '',
  object_ref TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (locus_id, scene_version_id),
  UNIQUE (id, owner_id),
  FOREIGN KEY (locus_id, owner_id) REFERENCES loci(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (scene_version_id, palace_id, owner_id) REFERENCES palace_scene_versions(id, palace_id, owner_id) ON DELETE CASCADE
);

-- 6. Locus Placements (multiple 2D/video/GLB animated objects placed inside a locus)
CREATE TABLE IF NOT EXISTS locus_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  locus_id UUID NOT NULL,
  palace_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scene_version_id UUID NOT NULL,
  association_id UUID,
  asset_id UUID,
  variant_id UUID,
  placement_kind TEXT NOT NULL DEFAULT 'glb_model'
    CHECK (placement_kind IN ('billboard_2d', 'video_plane', 'glb_model', 'spatial_marker')),
  position_json JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  rotation_json JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0}'::jsonb,
  scale_json JSONB NOT NULL DEFAULT '{"x":1,"y":1,"z":1}'::jsonb,
  animation_clip TEXT,
  playback_mode TEXT NOT NULL DEFAULT 'static'
    CHECK (playback_mode IN ('static', 'loop', 'on_focus', 'on_recall')),
  ordinal SMALLINT NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, owner_id),
  FOREIGN KEY (locus_id, owner_id) REFERENCES loci(id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (scene_version_id, palace_id, owner_id) REFERENCES palace_scene_versions(id, palace_id, owner_id) ON DELETE CASCADE,
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id, owner_id) REFERENCES media_variants(id, owner_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS locus_placements_locus_idx
  ON locus_placements(owner_id, locus_id, scene_version_id);

-- 7. Media Generation Outputs (multiple candidate variants A/B/C from AI jobs, explicit user selection)
CREATE TABLE IF NOT EXISTS media_generation_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_job_id UUID NOT NULL REFERENCES ai_jobs(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  learning_target_id UUID,
  association_id UUID,
  candidate_slot TEXT NOT NULL CHECK (candidate_slot IN ('A', 'B', 'C')),
  output_kind TEXT NOT NULL
    CHECK (output_kind IN ('mnemonic_text', 'image', 'video', 'animated_3d')),
  asset_id UUID,
  variant_id UUID,
  parent_output_id UUID REFERENCES media_generation_outputs(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'local-mock',
  model_version TEXT NOT NULL DEFAULT 'gen-v1',
  pipeline_version TEXT NOT NULL DEFAULT 'pipe-v1',
  prompt_redacted TEXT NOT NULL DEFAULT '',
  selected_by_user BOOLEAN NOT NULL DEFAULT false,
  cost_micros BIGINT NOT NULL DEFAULT 0 CHECK (cost_micros >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  selected_at TIMESTAMPTZ,
  UNIQUE (ai_job_id, candidate_slot),
  FOREIGN KEY (learning_target_id, owner_id) REFERENCES learning_targets(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (association_id, owner_id) REFERENCES mnemonic_associations(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (asset_id, owner_id) REFERENCES media_assets(id, owner_id) ON DELETE SET NULL,
  FOREIGN KEY (variant_id, owner_id) REFERENCES media_variants(id, owner_id) ON DELETE SET NULL
);

-- 8. Palace Map References (authorized coordinates/provider IDs without copying third-party Street View imagery)
CREATE TABLE IF NOT EXISTS palace_map_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  palace_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_streetview_ref', 'mapillary', 'user_gps')),
  provider_pano_id TEXT,
  latitude DOUBLE PRECISION CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  heading DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (heading BETWEEN 0 AND 360),
  pitch DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (pitch BETWEEN -90 AND 90),
  fov DOUBLE PRECISION NOT NULL DEFAULT 75 CHECK (fov BETWEEN 10 AND 120),
  attribution_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (palace_id, owner_id) REFERENCES palaces(id, owner_id) ON DELETE CASCADE
);

COMMIT;
