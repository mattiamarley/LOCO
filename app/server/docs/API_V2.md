# LOCO — Backend Blueprint v2: Contratto API `/v1` (`API_V2.md`)

## Convenzioni e Guardrail

1. **Autenticazione e Ownership**: Tutte le route `/v1/*` (eccetto `/v1/health`) richiedono sessione valida (`loco_session`). `owner_id` / `user_id` deriva sempre dalla sessione lato server. L'accesso a un oggetto privato altrui restituisce `404 NOT_FOUND` senza rivelarne l'esistenza.
2. **Protezione CSRF e Origin**: Ogni mutazione (`POST`, `PUT`, `PATCH`, `DELETE`) richiede l'header `X-Loco-Request: 1` e verifica `Origin` se presente.
3. **Formato Errori Standard**:
   ```json
   {
     "error": {
       "code": "CONFLICT",
       "message": "Descrizione leggibile dell'errore",
       "requestId": "b9a66a39-6142-4815-9362-f64160368a6f"
     }
   }
   ```
4. **Idempotenza**: Le mutazioni non ripetibili (`POST /v1/review-attempts`, `POST /v1/challenge-versions/:id/runs`, `POST /v1/me/exports`) supportano `Idempotency-Key` (o `idempotencyKey` nel body).
5. **Integrità Studio e Arena**:
   - Nessuna proposta AI (`state = 'proposed'`) diventa automaticamente un `learning_target` finché l'utente non chiama `POST /v1/knowledge/:id/confirm`.
   - `GET /v1/reviews/due` non espone mai la risposta prima del tentativo.
   - In `POST /v1/review-attempts`, se `viewedAnswerBeforeAttempt = true` il voto effettivo è forzato a `again` (`forgot`); se `hintCount > 0`, il voto massimo attribuibile è `hard` (`partial`).
   - In `POST /v1/challenge-runs/:id/submit`, `score`, `correctCount` ed `eligible` sono calcolati esclusivamente dal server.
