# LOCO: applicazione locale con database

Avvio dalla radice: `node app/server/dev.mjs`. Richiede Node con `node:sqlite` (verificato Node 25.2.1; il modulo SQLite è ancora segnalato sperimentale). Aprire http://127.0.0.1:8781 e creare un account di prova. In alternativa da app/: `npm run dev:local`. Non richiede npm install, chiavi o credito.

Il database SQLite è in `app/runtime/loco.sqlite`, escluso da Git. Schema SQL inizializzato all'avvio: utenti, sessioni, percorsi, loci ordinati, cronologia ripassi e lezioni lette. Password derivate con PBKDF2 e salt, sessioni con token casuale (hash conservato nel DB) e cookie HttpOnly/SameSite. Controlli di proprietà su tutte le operazioni; scritture con header dedicato e verifica Origin. Nessuna chiave AI o contenuto Google viene inviato o memorizzato.

Funzionante: registrazione/accesso/uscita; nome profilo; percorsi e bozze modificabili; loci con domanda, risposta e associazione personale; riordino; studio guidato; risposta nascosta prima del richiamo; autovalutazione e prossima scadenza; otto lezioni testuali con completamento persistente; ricerca percorsi; esportazione JSON. Una modifica a domanda o risposta azzera la progressione del locus. La coda di ripasso volontaria comprende tutti i loci; i contatori distinguono quelli in scadenza.

L'area operativa `workspace.html` usa i materiali LOCO e un layout responsive per provare i dati reali. Il riferimento Figma precedente è ancora in `index.html`; la ricomposizione esatta delle schermate con dati dinamici è da completare. Questa versione non sostituisce la verifica di fedeltà già documentata.

È un ambiente locale di sviluppo, non ancora il servizio pubblico completo. Il server ascolta soltanto su 127.0.0.1: non è accessibile dal telefono fisico. Le prove mobile sono di viewport browser. Per test reali fra dispositivi serve un ambiente HTTPS con database condiviso. Prima dell'esposizione pubblica: server di produzione, cookie Secure, recupero/verifica email, monitoraggio, backup programmati/ripristino, limiti di consumo e trattamento dei dati. Il JSON esportato comprende percorsi e letture, non password/sessioni né l'intera cronologia; il recupero automatico/importazione non è ancora implementato.

Street View, scansione 3D, upload video, generazione AI, VR e pagamenti non sono collegati. Il campo ambiente Street View è soltanto predisposto. Nessuna conversione 3D viene simulata. Il server Node/SQLite locale è distinto dallo scaffold Cloudflare/Vinext: per quel deployment occorre adattare l'accesso SQL a D1 oppure scegliere un hosting Node con disco persistente.

Test dalla radice: `node --test app/server/tests/*.test.mjs app/prototype/tests/*.test.mjs`. L'integrazione apre un server su porta temporanea e crea/elimina un database isolato. Verifica due account, isolamento, ordinamento atomico, ripassi, reset della progressione, coordinate, persistenza riaprendo il DB e rifiuto di origini esterne.

## Loci durante l'esplorazione 3D

L'editor ora comprende una stanza geometrica di prova navigabile con trascinamento per la visuale, WASD/frecce e pulsanti su telefono. Premi Aggiungi locus qui, quindi tocca una superficie: il raycast sceglie la superficie visibile e apre la compilazione del contenuto. La creazione del locus richiede un punto 3D; i loci precedenti senza punto possono essere ancorati tramite Modifica.

Migrazione automatica v2: `loci.anchor_json` conserva identificativo/versione della scena, punto XYZ in metri, normale della superficie e posa della camera. Non sono coordinate sullo schermo. Il riordino e le modifiche del testo conservano il punto. Vai al punto 3D ripristina la vista; studio e ripasso mostrano il locus nel viewer mantenendo nascoste risposta e associazione fino al richiamo. Il database e l'API conservano il dato spaziale anche dopo un riavvio.

La stanza è costruita per il collaudo, non riproduce una scansione personale o Street View. Non è ancora implementato l'import di modelli GLB/splat. Il collegamento a una scansione richiederà un identificativo/versione del modello e trasformazioni coerenti, senza riutilizzare automaticamente coordinate di una scena differente. Three.js 0.180.0 è incluso localmente con licenza MIT; nessuna dipendenza CDN a runtime.
