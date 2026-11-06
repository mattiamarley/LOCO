# LOCO — Backend Blueprint v2: Media & Spatial Engine (`MEDIA_SPATIAL_V2.md`)

## 1. Separazione tra Nozione, Associazione, Scena e Oggetto 3D

- Una `knowledge_item` ha `1:N` `learning_targets` (es. `forward`, `reverse`, `explain`).
- Ogni `learning_target` può avere `1:N` `mnemonic_associations`, versionate tramite `association_revisions`.
- I file binari (PDF, immagini WebP/PNG, video MP4/HLS, modelli GLB) risiedono in object storage privato; il database conserva solo `media_assets` e `media_variants` con `storage_key` privato e SHA-256.

## 2. Versionamento Immutabile delle Scene (`palace_scene_versions`)

- Ogni palazzo possiede una o più versioni di scena (`palace_scene_versions`) con `scene_code` e `coordinate_frame_id` espliciti (es. `loco-room-v1`, `castle-v1`, `photo-palace-v1`).
- Un `locus_anchor` e un `locus_placement` sono sempre vincolati a una specifica `scene_version_id`: una conversione di scena non sovrascrive mai le coordinate 3D precedenti.
- `PATCH /v1/loci/:id` e `POST /v1/palaces/:id/loci` verificano che `anchor.scene` coincida con `palace.scene_version`, restituendo `409 CONFLICT` in caso di disallineamento.
