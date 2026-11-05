# Verifica ricostruzione LOCO — 5 novembre 2026

Riferimento: file FeZKyO6xCZtjmQ1uEef4kx, pagina Portale / Area riservata, gruppo definitivo in basso a destra. Home 473:1088, canvas 1280 × 832. I caricamenti sono nel gruppo in alto a sinistra.

## Lavoro eseguito

Acquisiti 15 contesti strutturati ad alta fedeltà con screenshot, asset originali scaricati localmente e font Inter Tight / Baloo 2. Home, catalogo, corso, Recappete, creazione, posizione vuota/compilata, conferma, tracciato, anagrafica, fine, bozze, login, profilo e caricamento VR sono navigabili nell'anteprima locale. Il generatore converte gli export React/Tailwind in HTML/CSS per la prova senza dipendenze; i componenti connessi nel materiale non hanno un'implementazione importabile nello stack vanilla, quindi i controlli sono adattati a elementi nativi.

Corretti: componenti helper non espansi, JSX residuo, trasformazioni su display:contents, maschere delle illustrazioni, font, logo originale trasparente, geometria dei campi, hit area delle schede e immagini decorative che intercettavano i clic sul salvataggio. Separato il laboratorio precedente in laboratory.html. Dati profilo resi esemplificativi prima della pubblicazione.

## Verifiche effettuate

- Tutte le 15 viste aperte a viewport desktop e telefono; screenshot in qa/. I risultati DOM sono nei due file *-results.json.
- Nessuno scorrimento orizzontale nelle viste provate; nessun asset locale mancante rilevato.
- Flusso desktop verificato tramite clic: Crea → maps → posizione → conferma → tracciato → anagrafica. Salvataggio con nome → Fine; uscita → Bozze → salvataggio → Recappete → recupero dei campi.
- Salvataggio mobile verificato fino a Fine; ricerca mobile filtra le schede.
- Test automatici su portabilità degli export, assenza di dipendenze remote a runtime, asset non vuoti, dati profilo pubblicabili, backup, intervalli e mazzo carte.
- L'override browser 1280/390 ha prodotto larghezze CSS effettive 1376/419 per lo zoom della sessione; queste dimensioni effettive sono registrate nei risultati. Non sono test su dispositivi fisici.

## Conformità ancora da completare

Questa versione NON è certificata identica in ogni schermata al Figma. Il 5 novembre il server MCP Figma ha risposto con il limite di chiamate del piano Starter, impedendo nuovi recuperi e il confronto finale aggiornato.

- Conferma posizione 539:577: il contesto recuperato espone il contenitore mappa 539:880 senza riempimento/asset. La zona resta vuota; occorre recuperare il contesto di quel nodo prima di completarla, evitando immagini sostitutive.
- Alcune icone di pulsanti connessi non sono esportate come asset nel contesto. Non sono state sostituite con icone inventate; restano da recuperare.
- Il frame corso 849:900 contiene intestazione Tecnica dei Loci ma descrizioni delle lezioni di conversione fonetica. Il testo di riferimento è conservato nella vista originale; va confermata la correzione editoriale.
- Il riadattamento mobile usa il marchio, i colori e gli asset originali, ma è un layout responsive costruito per la web app. Non è una replica verificata di frame mobile definitivi: alcune illustrazioni e la composizione delle finestre non sono ancora riportate integralmente.
- Profilo: valori personali e carta sostituiti con esempi. Account, pagamenti, Google Maps/Street View, generazione AI, ricostruzione 3D e VR non sono integrati. I numeri della Home sono dati dimostrativi del progetto.

Nessuna API a pagamento è stata chiamata. Le bozze sono locali al browser e non sincronizzate. Il laboratorio conserva la precedente prova della stanza, loci, lezioni e ripassi.

## Riproduzione

`python3 scripts/build-figma-views.py` ricostruisce le viste dai contesti pubblicati. Nessun file della cartella privata è necessario. `node --test app/prototype/tests/*.test.mjs` esegue i controlli. Avvio: `python3 -m http.server 8780 --bind 127.0.0.1 --directory app/prototype`.

## Correzione dopo il riscontro dell'autore sulla UX

L'area workspace.html e il successivo editor 3D hanno introdotto una nuova UX (sidebar di dimensioni diverse, Home a schede, lista loci e modulo sotto la scena) non approvata dall'autore. Non erano una riproduzione fedele e non vanno presentati come versione definitiva. La correzione ripristina index.html, derivato dai contesti Figma, come ingresso principale anche del server con database su porta 8781. workspace.html rimane soltanto un laboratorio tecnico esplicitamente etichettato, accessibile tramite indirizzo diretto. Database, ancoraggi e viewer sono conservati per collegarli in seguito alle schermate approvate.

Il portale ripristinato mantiene i dati dimostrativi dichiarati: questo cambio di ingresso non integra automaticamente le API nelle schermate Figma. Tale integrazione rimane da fare. Non si deve ricostruire un nuovo editor collocando arbitrariamente pannelli e controlli. L'esplorazione 3D e la creazione dei loci vanno inserite nei frame originali corrispondenti quando sono disponibili i relativi contesti. Il nuovo tentativo di lettura Figma ha confermato il limite MCP del piano Starter.

## Confronto con i quattro screenshot allegati dall'autore

Archiviati in author-references/ i riferimenti di tracciato, anagrafica/fine, Recappete e corsi. Usati per correggere l'apertura del corso in base alla posizione visuale del pulsante Inizia, l'aggiornamento dell'intestazione e delle tre lezioni, i testi esatti della Tecnica dei Loci, il verso della freccia, il bordo nero del campo ricerca, il segno di avvio nel pulsante Ripassa e l'overlay di riproduzione sulla prima miniatura (assente nel riferimento dell'autore). Il problema di intestazione/lezioni miste era nel collegamento runtime dei corsi: non una scelta editoriale da attribuire al Figma.

Nel browser verificati tutti e tre i collegamenti: Corso 1/Tecnica dei Loci, Corso 2/Linked method, Corso 3/Conversione fonetica. Acquisiti screenshot delle sei viste confrontate in qa/author-*-verified.jpg. Il portale conserva il layout originale e i dati dimostrativi dichiarati; non è ancora collegato integralmente al database. I riferimenti non autorizzano a ridisegnare il portale. Il laboratorio/castello rimane distinto, con le limitazioni già documentate.
