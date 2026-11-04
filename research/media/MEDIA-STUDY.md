# LOCO — studio dei materiali locali prima di Figma

Analisi del 4 novembre 2026. Questo documento integra e corregge `research/PROJECT-AUDIT.md`, basato sul primo PDF Drive. La cartella `PROJECT START FOLDER` è stata inventariata integralmente: 58 file, circa 1,4 GB. Nessun originale modificato. Il catalogo `index.html` permette di aprire tutti i materiali, i video e i singoli fotogrammi. Metadati, dimensioni e SHA-256 sono in `inventory.json`.

## 1. Copertura effettiva

| Materiale | Quantità | Lavoro svolto |
|---|---:|---|
| ADV e gadget PNG | 34 | Tutte le immagini ispezionate tramite tavole di contatto; originali collegati nel catalogo. |
| Mockup PNG | 12 | Tutti ispezionati: affissioni, social, bici/sticker, pagina piani. |
| Video | 2 | Intera durata campionata: 57 fotogrammi per lo spot, 77 per il demo mobile. Audio trascritto localmente con Whisper small; confronto con testo/scene e limiti di riconoscimento annotati. |
| PDF gadget | 1 | Unica pagina renderizzata e ispezionata. |
| Sorgente IDML | 1 | 142 pagine dichiarate, 519 storie testuali estratte, circa 108 mila caratteri; struttura, font, colori e link estratti. Non è stato renderizzato come un PDF finale. |
| Font | 8 | Nomi e metadati identificati; 6 TTF e 2 OTF. |
| PDF precedente | 146 pagine | Già renderizzato, OCR locale e audit separato. Non coincide con l’IDML locale. |

Le screenshot dei video sono campioni a intervalli regolari, non tutti i singoli frame: lo spot è campionato ogni secondo, il demo mobile ogni tre secondi. I passaggi importanti sono documentati anche in immagini individuali. Un filmato dimostrativo prova l’intento progettuale, non l’esistenza di un’app già implementata.

## 2. La scoperta principale: due versioni del progetto

Il primo PDF e gli asset locali non vanno fusi alla cieca. Il PDF utilizza viola/lime/arancione e un’oca bianca più organica, inserita nella C del marchio. La cartella locale ADV/Mockup e il demo mobile condividono invece un sistema riconoscibile:

- giallo molto saturo, viola e lilla, bianco e nero;
- logo LOCO nero, con la **L trasformata in oca**, becco arancione e profilo nero;
- persone stilizzate, oche, gatto nero, libri, cuffie, lampada e altri oggetti con contorno scuro;
- fondi a macchie morbide e forme irregolari, pattern di oche, nuvole e foglie;
- interfaccia mobile con card lilla, indicatori gialli e azioni viola;
- tono ironico, colloquiale, volutamente provocatorio nelle campagne.

Questa famiglia locale è internamente coerente fra pubblicità e demo. Per la successiva ricostruzione è la base visiva più forte da confrontare con Figma. È un’inferenza dalla coerenza dei materiali, non una cronologia delle versioni certificata.

Il sorgente IDML conferma codici testuali `#ffd114`, `#bcb0d7`, `#4e4a99`, `#d9d9d9`, `#ffffff`, `#000000`. Questi sono token dichiarati nel documento, non una misurazione di ogni PNG: il viola nelle esportazioni non è sempre identico. Per evitare deriva cromatica si dovranno verificare i token usati realmente nelle schermate Figma. Non utilizzare il lime del primo PDF come accento principale della nuova famiglia senza questa verifica.

## 3. ADV: ogni famiglia ha una funzione diversa

### Prelancio — «Che è sta papera»

Pattern di oche, dettagli isolati del personaggio, gatto con becco, nuvole e foglie. Materiali visibili: `Frame 2.png`, `Frame 4.png`, `Frame 7.png`, gadget `A4 - 4.png`, mockup `papera01.png`, `papera05.png`, `stcker.png`, `sticker02.png`. L’assenza di spiegazioni è intenzionale: il sorgente descrive una diffusione del visual prima della rivelazione del servizio.

Applicazione al prodotto: riconoscibilità e leggerezza nelle illustrazioni. L’incompletezza informativa appartiene alla campagna teaser; non deve diventare una caratteristica dell’onboarding o delle impostazioni.

### Rivelazione — «LOCO è…»

`Frame 15.png`, `Frame 17.png`, `Frame 18.png`, `Frame 21.png`, `Tabloid - 4.png`, mockup `locoè02.png`. Titolo sospeso, moduli apparentemente in caricamento o contenuto coperto. L’IDML descrive esplicitamente output «disturbati e corrotti» per generare curiosità. Quindi `Frame 18.png` quasi vuoto con spinner e i blocchi grigi in `Frame 21.png` non sono automaticamente esportazioni danneggiate.

Il mockup `locoè02.png` include una copertura fisica con un altro messaggio: va letto come rappresentazione della strategia provocatoria, non come funzione della piattaforma né come contenuto da importare nella web app.

### Spiegazione — «LOCOnosci»

`Frame 26.png`–`29.png`, `Frame 33.png`, `Frame 35.png`–`38.png`, `Tabloid - 6.png`, mockup `Loconosci04.png`, `cel.png`. Tre pilastri espliciti: **percorsi virtuali**, **associazioni generative**, **tecniche mnemoniche**. Lo stesso schema torna con fondo giallo o viola. Il carosello descrive luoghi familiari, immagini da prompt e guida all’uso delle tecniche.

Da preservare: messaggio comprensibile, titoli brevi, una funzione per schermata, progressione «cosa fa → come → prova». Da riformulare per il prodotto: «efficacia senza precedenti», «qualsiasi informazione», «senza nemmeno doverle studiare» sono copy promozionali del concept, non risultati dimostrati.

### Posizionamento — «Come Duolingo»

`Frame 44.png`, `Frame 47.png`, `Frame 49.png`, mockup `ComeDuolingo01.png`, `ComeDuolingo03.png`, `ComeDuolingo04.png`. Le varianti collegano un riferimento familiare a esami universitari, numeri e memoria generale. Il progetto dichiara nel sorgente che il riferimento serve a rendere riconoscibile la categoria del servizio.

Implicazione funzionale: esercizi brevi e ritorno regolare possono essere coerenti, ma il servizio resta un tool per il materiale scelto dall’utente. Non trasformarlo in una sequenza obbligata di corsi disciplinari.

### Mantenimento — «Memeoria» e provocazioni

`Frame 50.png`, `Frame 51.png`, `Frame 54.png`. Autoironia, meme su loci e associazioni assurde. Il riferimento a una «battaglia legale con MemoryOS» in `Frame 50.png` è testo presente nella creatività: non è stato verificato come evento reale e non può diventare una dichiarazione fattuale del sito. Lo stesso vale per disponibilità su App Store/Google Play: gli asset documentano una promessa, non app pubblicate verificabili.

### Poster di conversione e gadget

`Frame 8.png`, `Frame 9.png`, `Frame 11.png`: giochi di parole («l’occasione», «PROLOCO», «ca-zoo-volo»), CTA, QR e persona/oca illustrata. I QR restano parte dell’archivio; prima di usarli nel sito servirà verificarne la destinazione. Il catalogo non li apre automaticamente.

`A4 - 7.png`, `11.png`, `12.png`, `13.png`, `15.png`, `18.png` estendono il sistema a lettura, cuffie, studio, tablet e marchio. `Banda VR.pdf` contiene soltanto il titolo «Banda VR» su una pagina molto larga: non contiene un modello 3D, istruzioni per un visore o un esecutivo completo di packaging.

## 4. Mockup: contesto e priorità visive

Le affissioni mostrano che il messaggio deve essere leggibile da lontano: poche righe grandi, forte contrasto, visual centrale, piccolo logo e QR. I post mobile riprendono la stessa gerarchia. Bici e sticker documentano una campagna fisica diffusa e un pattern distintivo, non integrazioni da sviluppare.

Il mockup `piani.png` aggiorna anche il lessico del prodotto: compaiono **LOCO M’PRO DOPO**, **POCO LOCO**, **PRO LOCO**. Questi nomi non coincidono con POCO/SOLO/PRO del primo PDF. Il titolo «Con PROLOCO ti regaliamo anche» continua con «Niente perché in realtà lo paghi» e una battuta sul kit di benvenuto: è una scelta di voce esplicita. Non derivare prezzi o condizioni commerciali definitivi da questo mockup parziale.

## 5. Demo mobile — walkthrough con evidenze temporali

File: `DEF MOBILE.mov`, durata 230,22 s, H.264 2560×1440, audio AAC. Le prime schermate sono registrate ruotate; le copie in `screens/*-portrait.png` sono riorientate per la lettura. Da circa 00:33 il filmato mostra due viste affiancate.

| Tempo indicativo | Cosa si vede | Requisito da conservare |
|---|---|---|
| 00:00 | «Bentornata Vanessa», quattro percorsi con percentuali, corsi e navbar con grande + centrale | Home personale, ripresa, avanzamento reale, creazione subito accessibile. Le percentuali sono esempi del prototipo. |
| 00:03 | «Recapape», ricerca, «Bozze (1)», percorsi con tipo ambiente e numero loci | Biblioteca con ricerca, bozze e distinzione Street View / 3D scan. |
| 00:03–00:06 | «Discussione tesi» 58 loci/discorso, «Tavola periodica» 20 loci/chimica, «Cucina de nonna» 13 loci/lista spesa | Supporto a materiali diversi; metadati per ritrovare il percorso. |
| 00:06 | Dialogo «Visualizza in VR» / «Visualizza normale» | Scelta esplicita della modalità, con alternativa utilizzabile. |
| 00:09–00:27 | Istruzioni Cardboard e uscita dalla modalità immersiva | Preparazione e uscita chiare; il testo sul giroscopio è un’intenzione progettuale da validare su dispositivi reali. |
| 00:30–00:33 | «Calibrazione in corso» e passaggio alla doppia vista | Orientamento e calibrazione; non aggiungere attese artificiali. |
| 00:36–00:51 | Consigli: ruota testa a destra/sinistra, distribuisci nozioni nella stanza, scegli oggetti conosciuti, conversione fonetica | Microlezioni contestuali. Il consiglio fonetico va corretto/validato con il sistema maggiore, prima di diventare didattica. |
| 00:57–01:12 | Esplorazione dell’area del Politecnico di Torino | Percorso in un luogo reale riconoscibile, orientamento e navigazione. |
| 01:15–01:27 | «Le nuvole gialle sono tuoi suggerimenti…», target sulla facciata, apertura strumenti | Gli indizi appartengono allo spazio; selezione contestuale con puntatore. |
| 01:30–01:39 | Campo microfono con «Idrogeno» | Associazione testuale/vocale al locus; trascrizione modificabile e conferma. |
| 01:42–01:51 | «Idrante», poi oggetto rosso vicino all’ingresso | Distinguere nozione da immagine mnemonica; l’oggetto è collegato a una posizione stabile. |
| 02:15–02:33 | «Batteria al Litio» e successivamente «Litio», elementi su un’altra zona del percorso | Più loci, conversione fra concetto e indizio, riapertura contestuale. |
| 03:09–03:21 | Target sotto il passaggio, campo con «Sodio» | Il locus resta leggibile mentre l’utente usa lo strumento. |
| 03:24–03:39 | «Uovo», «Uovo sodo», comparsa dell’immagine | Generazione di scena/immagine da un’associazione, personalizzazione e collocazione. |
| 03:42–03:50 | Chiusura gialla con logo | Uscita/coerenza di marchio; non si vede un esito di ripasso o una valutazione finale. |

Le tre icone contestuali si vedono ripetutamente: simbolo di scintille/AI, microfono, nota/lista. I colori giallo/viola comunicano selezione. Non si devono assegnare etichette tecniche definitive alle icone senza il confronto Figma: il filmato mostra l’aspetto e gli esiti, non tutte le regole interne.

Il video non dimostra: salvataggio su server, autenticazione, generazione AI in tempo reale, riconoscimento vocale reale, scansione ricostruttiva 3D, sincronizzazione account o adattamento dei ripassi. Queste rimangono funzionalità da implementare e testare.

## 6. Spot ADV — struttura narrativa

File: `Spot ADV.mov`, 57,27 s, H.264 2560×1440, audio AAC.

| Intervallo | Evidenza visiva | Funzione narrativa |
|---|---|---|
| 00:00–00:02 | Giallo pieno e logo LOCO | Introduzione e riconoscimento. |
| 00:03–00:15 | Aula universitaria, mani irrequiete, docente, studentessa che si alza | Situazione d’esame e tensione iniziale. |
| 00:16–00:23 | Confronto frontale docente/studentessa | Avvio dell’esame orale. La trascrizione automatica riconosce l’avvio della risposta su Foscolo, con errori nei nomi. |
| 00:24–00:33 | Appunti «Storia della letteratura», riferimenti a Foscolo e parole evidenziate | Relazione fra esposizione e contenuto memorizzato. |
| 00:34–00:40 | Reazioni, docente che scrive e ritorno alla studentessa | Costruzione del payoff. |
| 00:41–00:43 | «Impara tutto ciò che vuoi» | Promessa centrale. |
| 00:45–00:47 | Dettaglio degli appunti fino alla riga «Stampato con HP LASERJET» | Indizio visivo della battuta: la memoria comprende anche dettagli estranei alla materia. |
| 00:51–00:53 | «Ma proprio tutto tutto» | Payoff esplicito. |
| 00:54–00:57 | QR, «Scopri di più», logo | Conversione. |

Il sorgente IDML identifica lo spot come «L’esame orale» e dichiara che il volume della musica è volutamente elevato rispetto al parlato. La traccia è stata anche trascritta localmente: il riconoscitore rileva la risposta della studentessa su Foscolo e, alla fine, «stampato con H.P. …». Nomi propri e data finale sono riconosciuti male: la trascrizione grezza conserva tali errori e non è una versione editoriale approvata. Il riferimento HP è corroborato dal foglio visibile. La chiave narrativa è ricordare anche un dettaglio irrilevante: un esempio di tono ironico da conservare, evitando promesse universali di memoria perfetta.

### Audio: verifica e limiti

Le trascrizioni automatiche sono salvate in `spot-adv-transcript.txt` e `demo-mobile-transcript.txt` con i relativi JSON temporali. Elaborazione eseguita localmente con Whisper small, senza inviare i video a servizi AI.

Nello spot il riconoscimento individua la risposta su Foscolo e la coda del testo stampato, confermando la struttura ironica osservata. Rende però male «Foscolo», alcune frasi e la data finale: non si devono copiare queste stringhe come dialoghi corretti. Il demo mobile contiene poche parole dettate, riconosciute approssimativamente come «batteri allitio, etio, sodio, uovo, uovo sodo»; le etichette sullo schermo permettono di verificare «Batteria al Litio», «Litio», «Sodio», «Uovo», «Uovo sodo». Non è una narrazione continua.

La lunga finestra temporale assegnata dal riconoscitore alle parole del demo non è un allineamento puntuale: per le azioni fanno fede i fotogrammi e il video originale. Gli intervalli della tabella sono indicativi e sufficienti a ritrovare il passaggio, non una mappatura al singolo frame.

## 7. Sorgente InDesign: requisiti che il primo PDF non chiariva

Il file è un archivio IDML, non codice applicativo. Sono presenti 67 riferimenti a 62 nomi di file collegati: 51 dei 62 nomi non hanno un file omonimo nel pacchetto (confronto per nome, non per contenuto). Non è quindi disponibile una cartella completa dei collegamenti necessaria per riprodurre con certezza l’impaginazione originale. Esportazioni PNG e primo PDF restano quindi importanti per il controllo visivo.

Il sorgente specifica che la progettazione deve partire dalla modalità con più vincoli, la VR, e trasferire pattern coerenti a mobile e portale desktop. Distingue tre input:

1. controlli fisici accessibili mentre il telefono è nel visore;
2. **gaze interaction** con puntatore e countdown per prevenire selezioni accidentali;
3. gesti giroscopici da combinare con altri input, perché invasivi e potenzialmente disorientanti.

Il testo propone anche il riuso dei tasti volume: è un desiderio del concept, non una capacità web già verificata. Non si può promettere un controllo dei tasti fisici di sistema senza una prova sulla piattaforma scelta.

Le schermate di caricamento servono a introdurre consigli tecnici senza interrompere l’esperienza. In una web app reale vanno mostrate soltanto durante un’attesa effettiva, con possibilità di rileggere i consigli fuori dal caricamento. La familiarità dell’interfaccia, poche scelte alla volta e strumenti contestuali sono principi ricorrenti.

Sono presenti residui redazionali («Da rifare…», «Copiare pag…»), testi duplicati e descrizioni del logo rimaste alla vecchia versione della C. Il sorgente va letto criticamente: non ogni stringa è copy approvato.

## 8. Conseguenze per la versione funzionante

- **Identità:** assumere come riferimento operativo la famiglia giallo/viola/lilla del demo e delle campagne, da confermare mediante confronto Figma. Separare la vecchia versione del book.
- **Nucleo:** percorso → locus stabile → nozione → associazione personale → scena/immagine → richiamo → ripasso. La generazione da sola non realizza l’apprendimento.
- **AI:** partire da nozione e contesto del locus; suggerire scene distinguibili; farle personalizzare/confermare; separare sempre spiegazione corretta della materia e associazione immaginaria.
- **Immersione:** prima vista normale completa; poi panoramica/VR realmente compatibile, puntatore con permanenza e uscita accessibile. Evitare di chiamare VR una semplice duplicazione dello schermo.
- **Input vocale:** stato di registrazione chiaro, consenso, trascrizione correggibile e alternativa da tastiera. Il filmato non specifica provider o implementazione.
- **Progressi:** distinguere completamento delle tappe, familiarità del percorso e capacità di richiamo. I cerchi percentuali non devono rappresentare genericamente «memoria».
- **Didattica:** lezioni corte, esercizi e suggerimenti nel contesto; correction del sistema maggiore e prove di richiamo senza anticipare la soluzione.
- **Dati:** bozze, salvataggio persistente, ricerca, metadati, riapertura e sincronizzazione sono parti sostanziali del prodotto da verificare.
- **Commerciale:** nomi piani divergenti e promesse hardware richiedono una scelta coerente prima dell’attivazione. Il budget API confermato è 100 €/mese: quote verificabili e nessun consumo illimitato implicito.

## 9. Stato tecnico e prossimi passi

La fase di studio dei materiali locali precede il nuovo esame di Figma, come richiesto. Il catalogo è un artefatto di ricerca locale, non il prodotto Loco pubblicato. L’app contiene ancora lo scaffold iniziale: nessuna ricostruzione funzionante è dichiarata completata.

La chiave API LOCO è salvata nel file locale ignorato approvato dall’utente. Il test ha ricevuto `credit_balance_exhausted` / `insufficient_quota`: l’integrazione live resta da verificare dopo la disponibilità di credito. La chiave selezionata ha durata sette giorni. Il controllo della promozione non ha restituito un’offerta idonea. Nessun acquisto o ricarica eseguito.

Prossimo passaggio: confrontare Figma con questo inventario, assegnare a ogni schermata il flusso reale corrispondente e chiudere i requisiti implementativi, mantenendo esplicite le funzioni non ancora testate.
