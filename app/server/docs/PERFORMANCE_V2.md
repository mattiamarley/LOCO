# LOCO — Backend Blueprint v2: Performance & 18 Metric Families (`PERFORMANCE_V2.md`)

## 1. Le 5 Dashboard del Memory Profile

Ogni indicatore esposto da `GET /v1/me/learning-profile` e `GET /v1/me/skill-profiles` dichiara sempre:
- `sampleSize`, `nValid`, `nUnassisted` e `minSampleSize`
- `windowDays` (default `28` giorni)
- `formulaVersion` (`v2.0`)
- `confidenceLevel` (`insufficient` | `low` | `medium` | `high`)

Quando `sampleSize < minSampleSize`, il backend restituisce `confidenceLevel: "insufficient"` e `rawValue: null`, evitando qualsiasi stima fuorviante o pseudoscientifica ("QI mnemonico").

## 2. Le 18 Famiglie Metriche Versionate

1. **`immediate_recall_accuracy`**: risposte corrette senza aiuti / prove immediate valide (`recall_delay_seconds < 86400`).
2. **`delayed_recall_accuracy`**: risposte corrette senza aiuti a distanza (`recall_delay_seconds >= 86400`).
3. **`encoding_speed`**: mediana in ms del tempo di codifica su compiti comparabili.
4. **`retrieval_speed`**: mediana (e `p90`) in ms del tempo di risposta su tentativi corretti e autonomi.
5. **`retention_efficiency`**: elementi ricordati correttamente a distanza per minuto attivo di studio.
6. **`learning_rate`**: variazione di accuratezza autonoma tra prima e seconda metà della finestra.
7. **`error_rate`**: quota complessiva e distribuzione per `error_category` (`position`, `decoding`, `conceptual`, `order`, `timeout`).
8. **`hint_dependency`**: quota di tentativi con `hint_count > 0`, tenuta distinta da `viewed_answer_before_attempt`.
9. **`memory_stability`**: mediana della stabilità stimata in giorni (`review_schedules.stability`).
10. **`recall_consistency`**: stabilità dei tempi/esiti (`1 - IQR normalizzato`) su prove equivalenti.
11. **`training_volume`**: conteggio sessioni, prove valide e minuti attivi (polarità neutra, mai confuso con apprendimento).
12. **`review_efficiency`**: tentativi medi necessari per raggiungere 3 richiami autonomi consecutivi.
13. **`spatial_memory`**: accuratezza spaziale nei loci senza errori di posizione.
14. **`visual_encoding`**: rapidità e correttezza su prove visive, immagini e scene 3D.
15. **`numerical_memory`**: cifre corrette e conversioni Major/PAO separate per direzione (`number_to_image` vs `image_to_number`).
16. **`conceptual_association`**: decodifica dell'immagine mnemonica e spiegazione corretta del concetto.
17. **`sequential_memory`**: accuratezza dell'ordine sequenziale e assenza di salti nei loci.
18. **`technique_mastery`**: progresso specifico per tecnica (`major`, `pao`, `loci`, `faces`, `speech`, `abstract`).

## 3. Interventi Adattivi Spiegabili (`learning_interventions`)

Il motore decisionale (`src/adaptiveRecommendations.ts`) emette raccomandazioni verificabili con `rationale_code`, `algorithm_version`, `evidence` e `confidence_level`. La valutazione post-intervento (`intervention_outcomes`) restituisce `inconclusive` se le prove pre/post non appartengono allo stesso `comparability_group`, `skill` e `direction` o non raggiungono il campione minimo.
