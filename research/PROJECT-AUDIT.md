# LOCO — audit del progetto originale

Analisi del 4 novembre 2026. Fonte principale: `references/BOOKESAME_gruppoSEDICI.pdf`, 146 pagine PDF, tutte renderizzate in `references/pages/`; estrazione OCR locale confrontata con le schermate per i punti decisivi. Riferimento di design recuperato da `references/LinkFigma.pdf`: https://www.figma.com/design/vcnvsrrBCEIt3SQYuuvT1a/gruppoSEDICI?node-id=1-4 . Questo audit usa il book; non certifica un'ispezione completa di ogni frame Figma. Le citazioni «p.» indicano il numero fisico del PDF, non la numerazione stampata (diversa e talvolta incoerente).

Decisioni dell'utente: ricostruzione funzionante; prima versione web app desktop e smartphone; budget API indicativo totale di 100 €/mese. La cartella locale iniziale era vuota: il materiale disponibile documenta principalmente concept, brand, UI e comunicazione, non un backend già funzionante.

## 1. Identità e proposta di valore

LOCO insegna e rende praticabili le tecniche mnemoniche, unendo luoghi familiari, percorsi virtuali, associazioni create con AI e Google Street View. Il punto di partenza è il metodo di apprendimento, non una biblioteca di riassunti. La promessa funzionale concreta è associare concetti a punti ordinati di un ambiente e ripercorrerli per ricordare (p.8, 18–19, 50, 54–55, 64, 98).

Target principale: 14–25 anni, senza esclusione di adulti e professionisti. Le tre personas sono una studentessa di medicina di 24 anni, un project manager di 32 anni e un atleta della memoria di 24 anni (p.36–47). Ne derivano tre bisogni distinti: preparazione agli esami, informazioni professionali e allenamento misurabile. Le loro storie e risultati sono scenari progettuali, non testimonianze raccolte.

Il percorso d'uso originale comprende scoperta su social/campagne, visita del sito, prova, registrazione/abbonamento, creazione di un percorso, studio e ritorno all'allenamento. VR e scansione della propria stanza sono estensioni esplicite del concept; non vanno omesse da un inventario che pretenda di rappresentare «tutto il progetto».

## 2. Inventario del sito pubblico

| ID | Requisito del book | Evidenza | Criterio di accettazione del prodotto |
|---|---|---|---|
| S01 | Home a scorrimento con proposta di valore | p.92–101 | Il visitatore capisce cosa memorizza, come usa i luoghi e da dove comincia; ogni CTA porta a un flusso reale. |
| S02 | About con spiegazione tecniche | p.97, 100–101 | Loci, collegamenti e numeri sono spiegati correttamente con esempi eseguibili. |
| S03 | Prova dell'AI generativa | p.97, 100–101 | Input → generazione → risultato applicabile a un locus; errori, limiti e servizio non configurato sono visibili. |
| S04 | Dimostrazione di pin, note e oggetti/animazioni | p.64, 98, 101 | L'utente può creare e ritrovare un'associazione in una posizione stabile. La demo è identificata come tale. |
| S05 | Piani POCO, SOLO e PRO LOCO | p.99, 102–103 | Prezzi, quote e disponibilità corrispondono al sistema realmente attivo; nessun pagamento simulato o promessa di hardware inesistente. |
| S06 | Domande/FAQ | p.92, 102–103 | Risposte accessibili su palazzo della memoria, loci, differenze da un corso e primo utilizzo. |
| S07 | Login e registrazione | p.95, 104, 108–109 | Accesso reale e persistenza personale; logout; l'identità non si riduce a un nickname conservato nel browser. |
| S08 | Supporto, tutorial e guide | p.92 | Chi si blocca trova istruzioni operative; contatti solo se esistenti. |
| S09 | Footer con social, risorse e iscrizione email | p.101, 103 | Link verificati; newsletter solo se collegata a un servizio reale, con esito e consenso. |
| S10 | Storie di successo e indicatori fiducia | p.92, 101 | Solo risultati e testimonianze autentici; materiale del concept marcato come esempio oppure sostituito. |

La navigazione originale distingue Home, About, Piani, Domande e una CTA persistente «Provalo gratis». Lo stile è una navbar viola, sfondi bianchi/panna, CTA lime e contenitori arrotondati. Il sito marketing e la web app sono touchpoint diversi ma collegati (p.60).

### Piani del concept, verificati visivamente

Questi sono dati del progetto del 2024, non prezzi attuali validati:

| Piano | Prezzo nel mockup | Track salvabili | Scan stanze | Loci | Visore |
|---|---:|---|---:|---|---|
| POCO LOCO | Gratis, €0 | 5/mese | 0 | 10 | Non incluso |
| SOLO LOCO | €4,99/mese | 5/mese | 2 | Illimitati | Non incluso |
| PRO LOCO | €9,99/mese | Illimitati | 10 | Illimitati | Incluso |

Il mockup non chiarisce se i 10 loci siano per percorso o account, né se le scan siano mensili, né cosa succeda ai percorsi quando termina il piano. «Track» e «percorsi» vanno uniformati. Il regalo del visore richiederebbe logistica e margini separati: non può diventare una CTA funzionante per sola fedeltà visiva. Con un budget API di 100 €/mese, le quote «illimitate» non sono un'impostazione tecnica accettabile senza limiti di costo a monte.

## 3. Inventario della web app

| ID | Funzione originale | Evidenza | Criterio di accettazione |
|---|---|---|---|
| A01 | Onboarding e anagrafica | p.66, 104, 108–109 | L'utente accede, comprende il primo esercizio e può proseguire senza dati superflui. |
| A02 | Home personale con scorciatoie | p.110–111 | Stato reale di percorsi e lezioni, accesso a creazione, studio e ripresa dell'attività. |
| A03 | Scelta modalità mappa/3D | p.66–67 | Le modalità disponibili sono esplicite; non vengono promesse capacità assenti. |
| A04 | Inserimento posizione e navigazione mappa | p.64–67 | Posizione cercabile/selezionabile, gestione luoghi senza Street View e credenziali mancanti. |
| A05 | Tracciamento percorso | p.67, 98 | Creazione di tappe ordinate, modifica e salvataggio; ordine invariato dopo riapertura. |
| A06 | Loci e concetti collegati | p.55, 64, 98 | Ogni locus ha identità, nome/indizio spaziale e contenuto recuperabile; le associazioni non si perdono al cambio visuale. |
| A07 | Prompt AI contestuale | p.43, 47, 64, 67, 98 | Il prompt usa concetto e locus, produce un'associazione modificabile; l'utente approva prima di salvarla. |
| A08 | Oggetti digitali nella vista Street View | p.64 | Posizione/orientamento persistenti; l'oggetto non è semplicemente una scheda esterna spacciata per sovrapposizione 3D. |
| A09 | Annotazioni, immagini e animazioni | p.67, 98, 101 | Contenuti associati a un locus, caricamento/errore, riproduzione e modifica verificabili; animazioni riducibili. |
| A10 | Percorsi salvati e ricerca | p.105, 112–113 | Ricerca per nome/parole chiave, riapertura del percorso corretto, stato vuoto, nessuna perdita dopo refresh/accesso successivo. |
| A11 | Editor dei percorsi | p.111 | Modificare titolo, ordine e contenuti; eliminazione controllata e messaggi di salvataggio. |
| A12 | Studio immersivo/ripercorrenza | p.39, 47, 111 | Percorrere tappe in ordine, tentare il richiamo e vedere il contenuto solo dopo la risposta o la richiesta di aiuto. |
| A13 | VR | p.39, 111 | Modalità effettivamente supportata su dispositivo compatibile; altrimenti indicazione onesta di indisponibilità. La vista fullscreen non equivale a VR. |
| A14 | Lezioni e corsi | p.54–55, 105–111 | Lezioni sostanziali con esercizi; stati «Da seguire/Completati», avanzamento persistente e ripresa corretta. |
| A15 | Scan stanza da smartphone | p.43, 107, 112–113 | Acquisizione e importazione di un modello spaziale utilizzabile; il semplice upload di una foto non soddisfa il requisito. |
| A16 | Associazione loci a oggetti della stanza | p.43, 112 | Punti stabili su modello importato, navigazione e recupero contenuti al riavvio. |
| A17 | Collegamento smartphone/computer tramite QR | p.113 | Pairing temporaneo esplicito, conferma del percorso destinatario, scadenza e prevenzione di accessi di altri utenti. |
| A18 | Preferiti | p.112 | Il testo cita accesso ai «percorsi preferiti», ma non mostra un toggle: implementarlo come funzione distinta solo se progettato, non dedurlo come UI già completa. |
| A19 | Notifiche e impostazioni | p.111–113 | Icone nella bottom navigation; comportamento non specificato. Servono definizione e pannelli funzionanti, oppure rimozione dalle superfici attive. |
| A20 | Apprendimento adattivo e progressi | p.9, 45, 98, 111 | Adattamento basato su risposte e cronologia osservabili; percentuali calcolate, non numeri decorativi. |

### Flusso completo minimo fedele al nucleo

1. Accedere e completare una breve introduzione alla tecnica.
2. Creare un percorso con un titolo e un ambiente conosciuto.
3. Scegliere tappe distinguibili in ordine stabile e verificarne la familiarità.
4. Inserire il materiale da ricordare e assegnare un concetto per locus.
5. Creare o generare un'immagine/azione mnemonica; personalizzarla e confermarla.
6. Salvare, uscire e riaprire il percorso senza perdere ordine e associazioni.
7. Ripercorrere i loci e tentare un richiamo prima di vedere le risposte.
8. Registrare il risultato e tornare a ripassare ciò che necessita esercizio.

Gli ultimi due punti rendono operativa la promessa di apprendimento adattivo: nel book la struttura tecnica dei ripassi e del punteggio è assente. Vanno descritti come progettazione aggiuntiva, non come dettaglio già definito nell'originale.

## 4. Brand e design system da preservare

### Logo e mascotte

Il logo usa **Baloo Regular**; la C diventa un'oca. Il marchio comunica accessibilità, gioco, movimento e guida (p.76–79). Sono presenti versioni orizzontali, rettangolari, simbolo isolato e declinazioni colore. I PNG originali sono disponibili in `references/brand/loco-1.png`, `loco-2.png`, `loco-3.png`. L'oca è parte riconoscibile dell'identità, non un'emoji sostitutiva.

### Palette

Campionamento delle bande della pagina 85 renderizzata (non token Figma certificati):

| Ruolo | Colore |
|---|---|
| Viola principale | `#613BE0` |
| Lime fluo | `#D8FF45` |
| Arancione | `#FF5E27` |
| Panna | `#FFF3E2` |
| Grigio | `#767676` |
| Nero | `#181818` |

P.88 aggiunge sfumature scure e chiare. Il lime funziona come superficie di CTA con testo scuro; il testo lime su bianco del mockup necessita correzione di contrasto. La fedeltà riguarda identità e gerarchia, non la replica di combinazioni poco leggibili.

### Tipografia dichiarata (p.86–87)

- Titoli: Baloo regular. H1 96/144 px; H2 64/96; H3 56/84; H4 48/84; H5 40/60.
- Testi: Inter Tight. Sottotitoli 28/42 e 24/36 medium; corpo 18/27, 16/24 e 14/21 light; caption 12/18 regular; bottoni 16/24 semibold o regular.
- Queste misure sono documentazione desktop, non una scala mobile pronta. Usare una scala responsive coerente e body sufficientemente leggibile, senza mantenere H1 da 96 px su telefono.

### Componenti e tono

Bottoni a pillola, schede con angoli morbidi, aree panna, sezioni viola, icone semplici. Sono documentati default/hover/disabled e form con stati attivo/errore (p.88–89). Devono essere aggiunti focus da tastiera, caricamento, successo e fallimento.

La voce è italiana, ironica, socievole e incoraggiante: un amico/mentore, non un professore che giudica (p.80–81, 116). L'umorismo deve accompagnare l'esercizio e rispettare chi sbaglia. «Riprendiamo la tua memoria!» è coerente; «memoria debole» è una formulazione del mockup da rivalutare. Evitare promesse assolute come «ricordare tutto» nelle istruzioni funzionali.

## 5. Incongruenze e contenuti da correggere

1. **Conversione fonetica** (p.55): il testo descrive trascrizione fonetica di parole, mentre il contesto mnemonico richiede un sistema numeri→suoni→immagini. Deve essere riscritto e verificato nella ricerca metodologica.
2. **Efficacia numerica** (p.101): +60% informazioni, +80% efficacia, 30 giorni, 45% accuratezza non hanno studio, protocollo o campione indicato. Non pubblicarli come risultati del prodotto.
3. **Prova sociale** (p.101): il mockup dichiara 0 download e 6 persone aiutate (il team). Non sono dati d'uso verificati del prodotto; le recensioni illustrate non vanno convertite in testimonianze reali.
4. **Promesse universali**: «100 cifre in 15 minuti», «passare tutti gli esami», «imparare all'infinito» e «100% del cervello» sono headline creative, non criteri di successo scientifici.
5. **Risultati raggiunti** (p.144): il testo ripete una sezione e non presenta misure sperimentali. Non prova benefici causali su concentrazione, creatività o carriera.
6. **Canali**: p.60 cita Instagram/TikTok/LinkedIn; p.58 e p.118–119 Instagram/TikTok/Facebook. È una scelta editoriale non risolta.
7. **Calendario**: dicembre 2024 (p.126–127), materiale storico; non è un calendario corrente da attivare automaticamente.
8. **Piani**: quote e beneficio hardware non sono sufficientemente definiti per una sottoscrizione reale; manca anche un sistema di fatturazione.
9. **Corsi**: i mockup mostrano 3 lezioni loci e 7 linking, durate 8/9h e 12h e avanzamenti 12%/1%. Non costituiscono un curriculum disponibile: occorre scrivere i contenuti e calcolare i progressi.
10. **Scansione/VR**: previste nelle customer journey ma prive di specifiche tecniche e formati; non dichiararle finite per semplice presenza dei pulsanti.

## 6. Cosa manca per un prodotto funzionante

Il book non definisce un modello dati, API, schema autenticazione, autorizzazione per record, salvataggio cross-device, quote dei provider, gestione di errori/retry, caricamenti, cancellazioni, costi e metriche. Mancano inoltre il formato degli oggetti 3D, il sistema di ancoraggio ai panorami, l'importazione dei modelli AR, l'algoritmo adattivo, la valutazione delle risposte e la gestione dei contenuti AI errati.

Una base dati coerente distingue utente, percorso, ambiente, locus ordinato, elemento di studio, associazione mnemonica/versione, tentativo di richiamo, calendario del ripasso, corso/lezione e consumo API. Il materiale originale dell'utente deve rimanere distinguibile dall'immagine inventata per ricordarlo.

Il limite di 100 €/mese riguarda l'intero progetto, non 100 € per utente. Occorrono budget separati AI/mappe, quote operative, stato servizi e arresto preventivo delle generazioni quando la soglia è raggiunta. Un contatore richieste non è una stima esatta di euro se modelli, token o tariffe differiscono. Un tetto del provider e uno applicativo si completano; la tariffa deve essere verificata al momento della configurazione.

## 7. Tracciabilità del completamento

Per ogni requisito S/A sopra, registrare uno dei seguenti stati: **funzionante e verificato**, **implementato ma dipendente da credenziali**, **parziale**, **non implementato**. Distinguere sempre i mockup dalle funzionalità reali.

La prima release web può soddisfare il nucleo A01–A07, A10–A12, A14 e una versione misurabile di A20. Questo non autorizza a dichiarare «progetto integralmente riprodotto» finché Street View con ancoraggi, asset animati, scansione AR, pairing, VR e sottoscrizioni non sono risolti o l'utente ne ha accettato la modifica di ambito.

Verifiche fondamentali: desktop e mobile; tastiera; salvataggio/refresh; isolamento fra utenti; ordinamento dei loci; sessione di richiamo senza risposte visibili in anticipo; statistiche riproducibili; errori AI/mappe; limite costi; nessuna chiave nei bundle client; export dei propri dati; testo non inventato nei corsi e nelle prove sociali.

## 8. Comunicazione e materiali esterni all'app

Il progetto comprende sticker QR, poster/billboard, social, campagne «Che è sta papera?» e «Come Duolingo», teaser e rubriche Study Hacks, Memory Challenges, Success Stories, Memeoriao, Tips & Tricks, LOCO Talks (p.58–63, 118–141). Questi materiali sono asset e piani di comunicazione, non funzioni obbligatorie del backend. Vanno conservati in archivio e, dove opportuno, usati per la landing. Pubblicare campagne o inviare newsletter è un'azione distinta dallo sviluppo e non è implicata dall'analisi del book.

Le Memory Challenges, invece, possono diventare una funzione concreta dell'app: prove brevi su parole/numeri con durata e accuratezza misurate, senza confonderle con conferma di miglioramento generale dell'intelligenza.
