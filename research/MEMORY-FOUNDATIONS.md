# LOCO — Fondamenti di memoria e specifica didattica

Ricerca del 4 novembre 2026. Scopo: tradurre risultati sperimentali in una web app per percorsi mnemonici, senza confondere la qualità di una scena AI con l’apprendimento. Le indicazioni di prodotto sotto sono **proposte progettuali**, non protocolli clinici né dimostrazioni già ottenute da LOCO. Il pubblico previsto è 14–25 anni; molti studi citati riguardano universitari o adulti, quindi l’efficacia sui più giovani va verificata separatamente.

## 1. Che cosa vogliamo migliorare

Distinguere quattro risultati: **ricordo degli elementi**, **ricordo del loro ordine**, **comprensione**, **applicazione in problemi nuovi**. Una persona può ricordare la sequenza dei pianeti senza saper spiegare un’orbita. Una schermata vista, un’immagine riconosciuta o una lezione aperta non dimostrano apprendimento.

In LOCO il ciclo didattico è: comprendere la fonte → selezionare concetti → costruire indizi personali → tentare il richiamo senza soluzione → ricevere feedback → ripetere a distanza → applicare in un contesto diverso. Questo ciclo combina risultati diversi; la combinazione specifica LOCO deve ancora essere valutata.

## 2. Evidenze essenziali e limiti

| Metodo | Evidenza primaria pertinente | Certezza utilizzabile nel prodotto |
| --- | --- | --- |
| Richiamo attivo | Roediger e Karpicke (2006): due esperimenti su testi; il vantaggio del testing emerge nei test ritardati, mentre la rilettura può sembrare migliore subito. | Forte base sperimentale per inserire prove di richiamo; non promettere un incremento fisso. [Studio](https://pubmed.ncbi.nlm.nih.gov/16507066/) |
| Ripetizione dilazionata | Cepeda et al. (2008): oltre 1.350 partecipanti, intervalli estesi; il distanziamento utile dipende dal tempo di conservazione desiderato. | Forte base per distribuire lo studio; nessuna sequenza universale di giorni è garantita. [Manoscritto degli autori](https://escholarship.org/uc/item/0kp5q19x) |
| Metodo dei loci | Roediger (1980): loci e peg favoriscono soprattutto l’ordine; Dresler et al. (2017): allenamento dei loci per sei settimane, miglioramenti osservati anche al follow-up. | Evidenza su compiti specifici; non equivale ad aumentare l’intelligenza o la memoria in ogni situazione. [Roediger](https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-1980_JEPHLM.pdf), [Dresler](https://pmc.ncbi.nlm.nih.gov/articles/PMC5439266) |
| Ambienti virtuali | Legge et al. (2012): ambienti virtuali studiati brevemente utilizzati per dieci liste di undici parole; prestazioni comparabili alla procedura con luoghi familiari. | Supporta la fattibilità di percorsi virtuali; non dimostra che Street View o VR siano superiori a stanze familiari. [Studio](https://pubmed.ncbi.nlm.nih.gov/23098905/) |
| Produzione personale | Slamecka e Graf (1978): generare parole porta vantaggi rispetto a leggerle in cinque esperimenti. | Evidenza sul generation effect; applicarlo alla personalizzazione di scene AI è un’inferenza, da verificare. [Articolo degli autori](https://www.researchgate.net/profile/Peter-Graf/publication/232485723_The_Generation_Effect_Delineation_of_a_Phenomenon/links/53f5eedf0cf2888a7491f9cb/The-Generation-Effect-Delineation-of-a-Phenomenon.pdf) |
| Pratica intercalata | Rohrer e Taylor (2007): alternare tipi di problemi matematici favorisce il test differito rispetto a blocchi dello stesso tipo. | Utile per imparare a distinguere quando applicare una procedura; non giustifica mescolare arbitrariamente ogni materia. [Studio](https://digitalcommons.usf.edu/psy_facpub/1767/) |
| PAO | Blocki et al.: storie Persona–Azione–Oggetto insieme a ripassi, studiate nel contesto di password; rilevata anche interferenza fra storie. | Evidenza circoscritta: non prova che un dizionario PAO numerico sia migliore dei loci per materie scolastiche. [Ricerca degli autori](https://arxiv.org/abs/1410.1490) |

Le etichette di certezza sono valutazioni di progetto, non una revisione sistematica formale.

## 3. Metodo dei loci: procedura implementabile

Un **locus** è un punto riconoscibile, stabile e distinto; un palazzo è una sequenza ordinata di loci. Le informazioni vengono collegate ai punti tramite immagini o descrizioni interattive. Per iniziare proporre pochi punti, ad esempio cinque: è una scelta di usabilità, non una soglia scientifica.

1. Scegliere un ambiente familiare oppure esplorare un percorso virtuale prima di aggiungere contenuti.
2. Fissare ordine e direzione; assegnare nomi concreti ai punti: portone, fontana, panchina. Evitare cinque finestre praticamente identiche.
3. Provare a ricordare i punti vuoti nell’ordine. Se l’utente si perde già qui, lavorare sul percorso prima delle nozioni.
4. Collegare un concetto principale a ogni punto. Per concetti complessi usare sottopunti espliciti, senza comprimere interi capitoli in un’unica immagine.
5. Costruire un’azione che lega luogo e concetto; l’utente deve poter spiegare il collegamento in una frase.
6. Ripercorrere mentalmente senza mostrare né immagine né risposta. Dopo il tentativo, mostrare la fonte e correggere.
7. Provare anche domande fuori sequenza e senza mappa, per distinguere ricordo dipendente dal percorso e disponibilità del contenuto.

**Esempio originale:** per ricordare che i mitocondri producono ATP, una centrale in miniatura sulla panchina fabbrica batterie etichettate ATP. L’analogia è un indizio, non la spiegazione biologica: affiancare definizione corretta, fonte ed eventuali limiti.

**Regole software proposte:** identificatori persistenti per percorsi e loci; ordine esplicito; niente riordinamenti automatici dopo lo studio; versionare contenuti e scene; segnalare riuso simultaneo dello stesso punto per nozioni facilmente confondibili. Non sostituire in silenzio un’immagine già imparata quando il modello AI cambia.

## 4. Linking, storie e peg

Nel linking ogni elemento produce un’interazione che richiama il successivo. La storia connette i passaggi in una narrazione breve; il peg collega gli elementi a ganci già conosciuti e ordinati. Lo studio di Roediger (1980) mostra che valutare solo gli elementi, ignorandone la posizione, può nascondere differenze fra metodi. [Fonte](https://psychnet.wustl.edu/memory/wp-content/uploads/2018/04/Roediger-1980_JEPHLM.pdf)

**Procedura proposta:** selezionare parole chiave → costruire un legame fra ogni coppia → raccontare la sequenza senza testo → verificare omissioni e inversioni. Se una catena si spezza spesso, suddividerla in capitoli e ancorare i capitoli a loci distinti. L’AI può suggerire collegamenti ma deve conservare tutti gli elementi richiesti, nel loro ordine, evitando dettagli estranei che competono con le risposte.

Una scena dinamica e pertinente vale più di una decorazione complicata. “Bizzarro” non significa automaticamente “memorabile”: la rilevanza dell’indizio va verificata con il richiamo individuale.

## 5. Correzione della conversione fonetica

La descrizione nel book confonde un generico passaggio fra parole e suoni con la mnemotecnica numerica. Il **sistema maggiore** converte le cifre in famiglie di suoni consonantici; aggiungendo vocali si formano parole concrete, poi immagini. Nel recupero si esegue il percorso inverso.

Convenzione italiana proposta per LOCO:

| Cifra | Suoni | Esempio semplice |
| --- | --- | --- |
| 0 | s, z, sc dolce | osso → 0 |
| 1 | t, d | tè → 1 |
| 2 | n, gn | neo → 2 |
| 3 | m | amo → 3 |
| 4 | r | re → 4 |
| 5 | l, gl palatale | ali → 5 |
| 6 | c, g dolci | ciao → 6 |
| 7 | c, g dure, k, q | ago → 7 |
| 8 | f, v | uva → 8 |
| 9 | p, b | boa → 9 |

La tabella è una **convenzione**, non una legge cognitiva; esistono varianti. Un’implementazione italiana documentata dall’autore esplicita famiglie sonore e ambiguità ortografiche. [Implementazione di riferimento](https://github.com/moorada/lelouch)

Per evitare ambiguità didattiche, introdurre prima parole curate e semplici: **toro = 14**, **luna = 52**, **pane = 92**, **mago = 37**, **micio = 36**. Le vocali non codificano cifre; una consonante geminata dello stesso suono vale una sola cifra nella convenzione adottata. La grafia non basta: “c” cambia valore fra “casa” e “ciao”; digrammi, forestierismi e pronunce variabili richiedono controlli.

**Requisito tecnico:** dizionario validato con sequenza fonetica e codice numerico; test bidirezionale parola↔numero. L’AI propone candidati, il validatore controlla; un candidato incerto viene segnalato, non inserito come risposta corretta. Evitare un semplice replace lettera-per-lettera. Una data conserva anche contesto, segno e secolo: se li si omette per brevità, esplicitarlo.

## 6. PAO come livello avanzato

Persona–Azione–Oggetto combina tre elementi distinti in una scena. Per numeri, un dizionario personale può assegnare a ogni coppia di cifre una persona, una sua azione e un oggetto; tre coppie si ricombinano prendendo persona dalla prima, azione dalla seconda e oggetto dalla terza. Questa è una convenzione pratica, non un requisito per tutti.

Proposta: rendere PAO opzionale dopo la padronanza dei collegamenti semplici; mantenere dizionario stabile; scegliere persone riconoscibili dall’utente e azioni non confondibili; verificare separatamente i tre componenti. Lo studio su storie PAO e password mostra fattibilità in quel contesto e interferenze al crescere delle storie, non una garanzia per qualunque sequenza numerica. [Fonte](https://arxiv.org/abs/1410.1490)

## 7. Richiamo e ripassi: nucleo obbligatorio

La schermata di esercizio deve presentare prima **solo la domanda o il locus**. L’utente prova una risposta; solo dopo compare la soluzione. Registrare separatamente risposta, aiuti, accuratezza e autovalutazione. Un successo dopo un indizio non equivale a un recupero autonomo.

Non eliminare definitivamente una nozione dopo il primo successo: Karpicke e Roediger (2008), su vocabolario straniero, osservano benefici del recupero ripetuto anche dopo una prima risposta corretta. [Studio](https://doi.org/10.1126/science.1152408)

Per concetti, includere domande di spiegazione e inferenza: Karpicke e Blunt (2011) rilevano vantaggi del richiamo anche su prove di comprensione di testi scientifici. Questo non prova che un quiz di sola definizione misuri comprensione. [Studio](https://pubmed.ncbi.nlm.nih.gov/21252317/)

**Scheduling iniziale proposto:** dopo errore, feedback e nuovo tentativo nella sessione; successivamente ripasso a distanza crescente se il richiamo resta corretto, accorciando l’intervallo dopo errori. Scadenza d’esame, carico disponibile e recuperi precedenti guidano il calendario. Qualsiasi sequenza iniziale di giorni resta un’euristica dichiarata e modificabile. Cepeda et al. non forniscono una formula universale individuale. [Fonte](https://escholarship.org/uc/item/0kp5q19x)

Modello dati minimo: `itemId`, `contentVersion`, `reviewedAt`, `dueAt`, `outcome`, `hintLevel`, `latency`, `confidence`, `schedulerVersion`. Conservare eventi di ripasso per poter ricalcolare le stime. Nessuna “percentuale di memoria” derivata solo da minuti trascorsi.

## 8. AI che aiuta a imparare

| Funzione | Comportamento necessario | Misura di qualità |
| --- | --- | --- |
| Estrazione concetti | Collega ogni nozione a un frammento del materiale; separa fonte e aggiunte AI. | Fedeltà, omissioni, fatti inventati. |
| Scene mnemoniche | Offre 2–3 proposte concise; utente modifica o sceglie e spiega il nesso. | Recupero differito, non gradimento da solo. |
| Tutor | Indizio graduato prima della soluzione; domanda di spiegazione dopo un errore. | Recupero senza aiuti nelle prove successive. |
| Correzione semantica | Rubrica con concetti essenziali; mostra motivazione, fonte e possibilità di contestare. | Accordo con valutatori umani, falsi positivi. |
| Piano ripassi | Calcolo deterministico verificabile; AI descrive il piano, non inventa scadenze. | Accuratezza prevista/osservata e minuti necessari. |
| Interleaving | Alterna categorie che richiedono scegliere strategie dopo istruzione iniziale. | Prestazioni su problemi nuovi e scelta del metodo. |

La personalizzazione delle scene è un’ipotesi motivata dal generation effect, non un beneficio dell’AI già dimostrato. [Slamecka e Graf](https://www.researchgate.net/profile/Peter-Graf/publication/232485723_The_Generation_Effect_Delineation_of_a_Phenomenon/links/53f5eedf0cf2888a7491f9cb/The-Generation-Effect-Delineation-of-a-Phenomenon.pdf)

Con il budget complessivo di **100 €/mese**, dare priorità a testo, riuso delle generazioni approvate e operazioni su richiesta. Scheduler, conteggi e conversioni validate non richiedono modelli. Immagini, voce e mappe devono avere quote e un consumo visibile; i costi effettivi dipendono dai listini e dall’uso, da verificare prima di attivarli.

## 9. Limiti e anti-pattern

- Niente “usi il 100% del cervello”, memoria fotografica garantita o percentuali universali di miglioramento.
- Niente promessa di trasferimento generale: Owen et al. (2010), in un ampio studio di brain training, osservano miglioramenti sui compiti allenati senza evidenza di trasferimento ai test non allenati. Non è una confutazione dei loci; è un motivo per misurare precisamente ciò che si promette. [Studio](https://pubmed.ncbi.nlm.nih.gov/20407435/)
- Non obbligare immagini mentali vivide: offrire descrizioni verbali, audio e percorsi testuali; verificare quale supporto funziona per la persona senza assegnarle un presunto “stile di apprendimento”.
- Non confondere difficoltà con efficacia: un principiante può aver bisogno di esempi guidati prima di tentativi autonomi.
- Non aggiungere animazioni distraenti durante il richiamo; non nascondere un errore dietro una ricompensa.
- Non generare spiegazioni scolastiche senza fonti verificabili, né trasformare analogie in fatti.

## 10. Come verificare LOCO

**Test funzionali:** stesso contenuto e ordine dopo riapertura; risposta coperta prima del tentativo; eventi salvati una volta sola; date e fusi corretti; errori accorciano il prossimo intervallo secondo algoritmo; modifiche sostanziali del contenuto non ereditano automaticamente la vecchia padronanza; export completo.

**Valutazione didattica proposta:** assegnazione casuale a richiamo+ripassi e loci+richiamo+ripassi, con materiali e tempo comparabili. Questo isola il contributo dei loci invece di confrontare un pacchetto ricco con nessun supporto. Per la personalizzazione confrontare scene AI approvate senza modifica e scene rielaborate, controllando il tempo impiegato. Definire prima ipotesi, risultato principale e criteri di analisi.

Misurare ricordo senza aiuti dopo 24 ore, 7 e 30 giorni; ordine e contenuto separati; una prova di comprensione/applicazione; tempo totale incluso costruzione del percorso; abbandono, carico percepito e falsi ricordi. Queste scadenze sono scelte di valutazione del prodotto, non intervalli di ripasso obbligatori. Riportare incertezze e partecipanti mancanti, senza presentare solo chi completa tutto. Per 14–17 anni serve uno studio adeguato a quella fascia, distinto dalle prove sugli adulti.

La metrica guida proposta è **contenuti correttamente recuperati dopo un ritardo per minuto totale di studio**, accompagnata da comprensione e tasso di errori. Numero di scene generate, minuti nell’app e serie giornaliere restano metriche d’uso.
