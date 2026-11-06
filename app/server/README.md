# LOCO: Backend Locale & Blueprint v2 (`/api` + `/v1`)

Avvio dalla radice: `node app/server/dev.mjs` (oppure da `app/`: `npm run dev:local`).
Richiede Node con `node:sqlite` e supporto TypeScript nativo (verificato su Node 25.2.1).
Aprire http://127.0.0.1:8781 .

## Architettura: Compatibilità v1 + Backend Blueprint v2

Il server locale mantiene **il 100% di retrocompatibilità** con il prototipo esistente (`/api/*` e tabelle SQLite `users`, `sessions`, `routes`, `loci`, `reviews`, `lesson_progress` con `PRAGMA user_version=2`) e integra l'intera architettura **LOCO — Backend Blueprint v2** su `/v1/*`:

1. **Identity + Friends (`/v1/me`, `/v1/users`, `/v1/friends`, `/v1/friend-requests`)**
   - Profilo pubblico limitato (`handle` senza email, `displayName`, `discoverable`, `leaderboardVisibility`: `public` | `friends` | `hidden`).
   - Preferenze di studio (`learningGoal`, `dailyTargetMinutes`, `desiredRetention`, `preferredSrsAlgorithm`: `simple-v1` | `fsrs-7`, `aiPersonalizationOptIn`).
   - Amicizie normalizzate `(user_low_id, user_high_id)`, inviti con anti-inversione e blocchi bidirezionali (`user_blocks`) che rimuovono immediatamente visibilità social e classifiche.
   - Export GDPR idempotente (`POST /v1/me/exports`).

2. **Study + Knowledge (`/v1/projects`, `/v1/sources`, `/v1/knowledge`)**
   - Upload in bucket privato (`media_assets`), parsing documenti in `document_chunks` con pagina/offset.
   - Nozioni `knowledge_items` con revisioni immutabili (`knowledge_revisions`) ed evidenze citate (`knowledge_evidence`).
   - **Guardrail AI**: una nozione estratta da AI nasce sempre `state = 'proposed'` e non può diventare un `learning_target` attivo finché l'utente non la conferma (`POST /v1/knowledge/:id/confirm`).
   - Controllo ottimistico della concorrenza tramite `expectedRevision` (`409 CONFLICT` se obsoleta) e riconciliazione dello scheduler senza sovrascrivere lo storico dei tentativi.

3. **Memory, Palaces & Spatial/Media Engine v2 (`/v1/palaces`, `/v1/loci`, `/v1/mnemonics`)**
   - Versionamento immutabile della scena (`palace_scene_versions`), anchor spaziali vincolati a `scene_version` (`locus_anchors`) e posizionamento multi-oggetto 2D/video/GLB animato (`locus_placements`).
   - Revisioni storiche delle associazioni mnemoniche (`association_revisions`) e varianti multimediali (`media_variants`).

4. **Learning, Blind Recall & SRS (`/v1/reviews/due`, `/v1/review-attempts`)**
   - **Blind Recall**: `GET /v1/reviews/due` non espone mai la risposta prima del tentativo.
   - **Idempotenza**: `POST /v1/review-attempts` deduplica per `(owner_id, idempotency_key)`.
   - **Guardrail SRS (`src/srs.ts`)**: se `viewedAnswerBeforeAttempt = true` il voto viene forzato a `again` (`forgot`); se `hintCount > 0` il voto massimo è `hard` (`partial`). Supporta `simple-v1` e `fsrs-7`.

5. **Training, 18 Metriche Versionate & Interventi Adattivi Spiegabili (`/v1/training/*`, `/v1/me/learning-profile`)**
   - Motore di calcolo (`src/memoryMetrics.ts`) per tutte le **18 famiglie metriche** distribuite nelle 5 dashboard del Memory Profile (`overview`, `memorySkills`, `techniqueMastery`, `learningAnalytics`, `recordsRankings`), sempre accompagnate da `sampleSize`, `windowDays`, `formulaVersion` e `confidenceLevel`.
   - Statistiche granulari per singolo stimolo e direzione (`user_skill_item_stats`, es. Major `00–99` `number_to_image` separato da `image_to_number`) e matrice di confusione tra loci adiacenti (`locus_confusion_stats`).
   - Motore decisionale spiegabile (`src/adaptiveRecommendations.ts`) con `rationale_code`, evidenze e valutazione post-intervento (`intervention_outcomes`, con esito `inconclusive` quando le prove pre/post non sono comparabili).

6. **Arena — Challenges & Leaderboards (`/v1/challenges`, `/v1/challenge-versions/:id/*`)**
   - Versioni immutabili delle sfide, **1 tentativo ranked per utente per versione** (`409 CONFLICT` al secondo tentativo), allenamenti illimitati fuori classifica (`isRanked: false`).
   - Scoring deterministico lato server (`src/challengeScoring.ts`: `accuracy_time` e `perfect_speed`), verifica `nonce` e `deadline`, calcolo `rank()` ufficiale a pari merito con tie-breaker visuale `achieved_at`.

## Struttura dei File

- `app/server/db/001_schema.sql` .. `007_performance_adaptivity.sql`: 54 tabelle PostgreSQL 15+ proposte (37 v1 + 17 v2 Addendum) + policy RLS opzionali (`002_rls_optional.sql`).
- `app/server/src/models.ts` e `app/server/src/models.v2.ts`: contratti TypeScript v1 e v2.
- `app/server/src/challengeScoring.ts`: scorer deterministico e builder classifica.
- `app/server/src/srs.ts`: scheduler versionato `simple-v1` e `fsrs-7`.
- `app/server/src/memoryMetrics.ts`: calcolo delle 18 famiglie metriche, delay buckets e diagnostica per direzione/loci.
- `app/server/src/adaptiveRecommendations.ts`: motore di raccomandazioni spiegabili e verifica di comparabilità.
- `app/server/api/openapi.yaml`: specifica OpenAPI 3.1 per `/v1`.
- `app/server/docs/`: documentazione tecnica (`API_V2.md`, `PERFORMANCE_V2.md`, `MEDIA_SPATIAL_V2.md`, `ERD_V2.mmd`).
- `app/server/tests/`: suite di test (`api.test.mjs`, `metrics.test.mjs`, `v2-api.test.mjs`).

## Esecuzione Test

Dalla cartella `app/`:
```sh
npm run test:local
```
