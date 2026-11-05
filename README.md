# LOCO

Ricostruzione del progetto LOCO: una web app per computer e telefono che combina percorsi, metodo dei loci, associazioni personali e assistenza AI per studiare e ripassare.

## Stato attuale

Sono stati raccolti e analizzati i materiali originali, preparati un catalogo visivo e una prima specifica funzionale. È disponibile una prima prova locale gratuita in `app/prototype/`: stanza schematica, loci, contenuti, richiamo, lezioni e carte. Non è ancora il prodotto completo e non è pubblicata online. Avvio e limiti in [app/prototype/README.md](app/prototype/README.md).

Il riferimento definitivo di design è [loco nuovo su Figma](https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887). Il file include le pagine `sito`, `Portale / Area riservata`, `App mobile` e le librerie/materiali del progetto. L'analisi dettagliata dei frame è in corso.

## Contenuto

- `PROJECT START FOLDER/`: materiali originali forniti dall'autore, inclusi video, ADV, mockup, sorgente InDesign e font.
- `research/FUNCTIONAL-SPEC.md`: struttura del funzionamento, dati e criteri di accettazione.
- `research/PROJECT-AUDIT.md`: audit del primo book.
- `research/MEMORY-FOUNDATIONS.md`: fondamenti delle tecniche di memoria e implicazioni per le funzionalità.
- `research/media/index.html`: catalogo locale con immagini, video e 134 fotogrammi campionati.
- `research/media/MEDIA-STUDY.md`: studio dei materiali locali, differenze fra versioni e requisiti emersi.
- `research/figma/`: riferimenti e stato di analisi del file definitivo.
- `references/`: book e riferimenti acquisiti durante lo studio.
- `scripts/`: strumenti di catalogazione, OCR, trascrizione locale e anteprima.
- `app/`: scaffold tecnico per la futura web app.

## Clonazione e materiali pesanti

I materiali originali pesanti sono conservati con Git LFS. Installare Git LFS prima del clone oppure eseguire `git lfs pull` dopo la clonazione.

```sh
git clone https://github.com/mattiamarley/LOCO.git
cd LOCO
git lfs pull
```

Per consultare il catalogo in locale:

```sh
python3 scripts/serve-media.py
```

Aprire l'indirizzo locale stampato. Il server è limitato al loopback e serve solo materiali, riferimenti e ricerca.

Le utility OCR/trascrizione dipendono dagli strumenti locali descritti nei rispettivi script; i percorsi temporanei sono quelli della sessione di ricerca, non un'installazione portabile del prodotto.

## Configurazione

Le chiavi API e le configurazioni locali sono escluse da Git. Nessuna credenziale deve essere inserita nel codice, nel README o nei materiali pubblicati. Il budget indicativo concordato per le integrazioni è di 100 euro/mese; provider e quote operative saranno definiti durante l'implementazione.

Non è stata concessa una licenza aggiuntiva tramite questo repository: marchio, materiali e contenuti di terzi conservano le rispettive titolarità.

## Nuova app operativa locale

Avvio: `node app/server/dev.mjs`, quindi http://127.0.0.1:8781 . Account, percorsi, loci, lezioni e ripassi sono ora persistenti in SQLite. I dati locali sono esclusi da Git. Funzioni, limiti e test in [app/server/README.md](app/server/README.md); valutazione economica e vincoli Street View/3D in [research/SERVICE-FEASIBILITY.md](research/SERVICE-FEASIBILITY.md). L'app completa e il deployment pubblico sono ancora da completare.

Correzione UX: l'ingresso su porta 8781 ora mostra il portale derivato dal Figma. La prova operativa con database/3D è separata in `/workspace.html` ed etichettata come laboratorio tecnico; non rappresenta la UX definitiva. Il collegamento dei servizi alle schermate originali è ancora da completare.
