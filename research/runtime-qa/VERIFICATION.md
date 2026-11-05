# Prova applicazione con database — 5 novembre 2026

Test automatici: sei casi superati, incluso il flusso HTTP con due account, accesso negato fra utenti, riordino, ripassi e persistenza alla riapertura SQLite. Gli altri cinque casi riguardano backup del laboratorio, intervalli, carte, portabilità dei contesti Figma e dati profilo esemplificativi.

Nel browser: creato un account di collaudo locale con indirizzo example.test; creato La stanza di prova; inserito Porta, domanda, risposta e associazione; aperto ripasso; verificato che la scena non fosse nel DOM prima di Mostra risposta; autovalutato Ricordato; verificato il riepilogo con un tentativo e zero elementi attualmente in scadenza dopo ricaricamento. Marcata una lezione letta e verificato il conteggio persistente in Home.

Vista telefono provata tramite override 390×844 (larghezza CSS effettiva 419 per lo zoom della sessione): nessuno scorrimento orizzontale, nessuna immagine fallita nella Home. Override ripristinato. Screenshot desktop e mobile allegati. Non è una verifica su telefono fisico né di fedeltà integrale al Figma.

Il DB di collaudo e le sessioni sono in app/runtime/, escluso da Git. Non sono pubblicati né sincronizzati. Le schermate operative aggiunte sono una base per provare dati reali; integrazione completa con i frame definitivi e servizi esterni ancora da terminare.

## Collaudo loci 3D

Verificato: avanzamento mediante pulsante, attivazione Aggiungi locus qui, clic sulla parete, nome superficie proposto, salvataggio domanda/risposta/associazione, ricaricamento e presenza del comando Vai al punto 3D sul locus salvato. Test automatico aggiunto su coordinate mondo, scena/versione valida, rifiuto di coordinate non finite, conservazione del punto dopo modifica testo e riapertura del database. Sette test complessivi superati. Viewport telefono: canvas e controlli disponibili, nessuno scorrimento orizzontale alla larghezza CSS effettiva 419. Screenshot locus-3d-desktop.jpg e locus-3d-mobile.jpg. È una scena di prova, non una scansione.

## Correzione del flusso all'interno del castello

Riferimento confermato dall'autore: DEF MOBILE.mov. Verificati i passaggi di selezione e gli input contestuali sul video locale. La nuova prova #castle avvia il viewer a tutta scena e conserva i pannelli all'interno dell'esperienza. Collaudo: passo a destra, scelta del punto guardato, nozione Sodio, associazione con uovo sodo, salvataggio nel database, permanenza nella scena. Su viewport telefono nessun modulo esterno al castello nel DOM; pannello visibile e nessuno scorrimento orizzontale (419 px CSS effettivi). Annullamento verificato. Screenshot castle-context.jpg e castle-context-mobile.jpg. Microfono non attivato nei test: voce predisposta, verifica end-to-end ancora necessaria. Grafica delle icone e degli stati non dichiarata identica al video/Figma; VR non implementata.
