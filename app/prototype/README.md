# LOCO · Prototipo Interattivo Locale

Questa cartella conserva i moduli di riferimento interattivi 2D/3D di LOCO (come definito in `docs/DECISIONS.md` — ADR-006):

- `workspace.html` + `workspace.mjs` + `castle.mjs` + `room3d.mjs`: laboratorio 3D Three.js e castello della memoria collegati al backend SQLite locale (`app/server/dev.mjs`).
- `laboratory.html` + `app.mjs` + `model.mjs`: prototipo 2D offline nel browser (pianta schematica, richiamo cieco, 8 lezioni e allenamento con mazzo da 52 carte).
- `index.html`: hub locale leggero per accedere alle due modalità di prototipo.

## Avvio con backend SQLite locale

Dalla cartella `app/`:

```bash
npm run dev:local
```

## Verifica test

```bash
npm run test:local
```
