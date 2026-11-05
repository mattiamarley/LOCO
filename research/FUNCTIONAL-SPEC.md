# LOCO — struttura del funzionamento

Bozza operativa del 4 novembre 2026, ricavata dai materiali originali e dalle evidenze sulle tecniche di memoria. Definisce il comportamento prima dell’integrazione delle API. Le proposte aggiuntive sono distinte dal progetto documentato.

## 1. Che cosa abbiamo trovato della web app

Il sorgente InDesign prevede un portale/area riservata su computer e un’esperienza mobile, con modalità VR come estensione del mobile. Entrambi devono consentire di costruire e ripercorrere i percorsi. Il sito pubblico spiega il servizio, presenta i piani e porta all’accesso. Fonti: `media/idml-stories.txt`, storie `u49f5` e `u65bf`; `PROJECT-AUDIT.md`; `media/MEDIA-STUDY.md`.

Sono stati trovati documentazione, schermate nei mockup/book e il video dimostrativo mobile/VR. Il riferimento Figma definitivo confermato dall’utente è [loco-nuovo](https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887), file `FeZKyO6xCZtjmQ1uEef4kx`, nodo iniziale `310:887`. Sostituisce il collegamento storico gruppoSEDICI. È ora verificata la presenza della pagina `Portale / Area riservata`, distinta da `sito` e `App mobile`; il file è leggibile nel browser. La copertura dettagliata dei frame desktop è ancora in corso. Nei materiali locali inventariati non è stato trovato codice originale eseguibile o un URL verificato di una web app attiva. La cartella `app/` è uno scaffold creato durante questa ricostruzione, non un’app originale recuperata.

Questa distinzione riguarda ciò che è stato verificato, non dimostra che altri sorgenti non esistano altrove.

## 2. Obiettivo del prodotto

L’utente porta il materiale che vuole ricordare e lo trasforma in associazioni collocate in luoghi ordinati e riconoscibili. Loco lo accompagna fino al richiamo e al ripasso: non basta creare immagini.

Il percorso centrale è:

**Materiale → concetti verificati → ambiente → loci ordinati → associazioni personali → studio → richiamo senza risposta visibile → feedback → ripasso.**

Si può anche partire dall’ambiente e aggiungere il materiale dopo: il modello dati deve supportare entrambi gli ingressi senza due editor incompatibili.

## 3. Una web app, tre modalità d’uso

| Contesto | Compito principale | Stessi dati |
|---|---|---|
| Desktop | Preparare materiale, costruire e modificare percorsi, confrontare nozione e associazione | Percorsi, loci, contenuti e cronologia dell’utente |
| Telefono | Creare/modificare, esplorare, dettare e ripassare | Gli stessi percorsi, senza copie separate |
| Modalità immersiva compatibile | Ripercorrere luoghi e interagire con comandi adatti al dispositivo | Gli stessi loci e avanzamenti |

Desktop e telefono devono entrambi completare il ciclo centrale. Le specializzazioni migliorano l’esperienza, senza obbligare a cambiare dispositivo per salvare o studiare.

La VR e la scansione 3D sono requisiti del concept da mantenere nell’inventario. Le capacità realmente disponibili devono essere esplicite: una foto non equivale a una scansione, una vista a schermo intero non equivale a VR.

## 4. Navigazione dell’area riservata

1. **Home:** riprendi l’ultimo percorso; ripassi in scadenza; azione «Crea percorso»; accesso alle lezioni. Nessuna percentuale di memoria generica.
2. **I miei percorsi:** ricerca, bozze, percorsi pronti e archiviati; etichette materia/obiettivo; tipo di ambiente e numero di loci.
3. **Crea / Editor:** preparazione materiale, scelta ambiente, tappe, associazioni e verifica prima dello studio.
4. **Studia e ripassa:** studio guidato, tentativo di richiamo, feedback, coda dei prossimi ripassi.
5. **Tecniche:** brevi lezioni con esercizi su loci, collegamenti e numeri, disponibili anche fuori dal percorso.
6. **Profilo e impostazioni:** preferenze, accessibilità, esportazione dei dati, account e consumo disponibile.

Il sito pubblico resta distinto dall’area di lavoro: Home, come funziona, tecniche, FAQ e accesso. I piani commerciali diventano operativi solo dopo aver definito quote e costi reali.

## 5. Flusso completo e risultati di ogni passaggio

### A. Crea il progetto di studio

Input minimo: titolo e obiettivo libero. Esempi: tavola periodica, esposizione della tesi, date storiche, lista di informazioni.

L’utente incolla testo o inserisce direttamente coppie domanda/risposta. L’importazione di file può arrivare dopo, mantenendo lo stesso formato finale. Il materiale originale resta consultabile.

Output: una bozza salvata, anche se l’utente non ha ancora scelto un luogo.

### B. Prepara i concetti

Il contenuto viene suddiviso in unità abbastanza piccole da poter essere richiamate e corrette. Ogni unità contiene:

- domanda o indizio di richiamo;
- risposta corretta;
- eventuale fonte/riferimento al materiale;
- ordine, se necessario.

L’AI può proporre la suddivisione, ma l’utente verifica e modifica le unità. Una scena inventata non è una fonte e non modifica la risposta corretta.

### C. Scegli e impara l’ambiente

Opzioni del progetto: percorso reale in Street View o ambiente personale scansionato. Prima implementazione da rendere completa: un percorso con punti selezionabili, ordinabili e persistenti; le integrazioni disponibili determinano come è visualizzato.

Prima di associare i concetti, l’utente deve riconoscere il tragitto e distinguere i punti: ingresso, scala, vetrina, fontana, ecc. Un luogo nuovo richiede familiarizzazione. La quantità di punti si adatta al contenuto; iniziare con pochi punti è una scelta didattica, non un limite rigido del modello.

Output: ambiente e lista di loci stabili, con nome, posizione e ordine. Cambiare il punto di vista non deve spostare casualmente un’associazione.

### D. Crea un’associazione per locus

Per ciascun punto l’editor separa chiaramente:

**Nozione corretta | Locus | Associazione immaginaria | Immagine opzionale.**

Esempio dal video: la nozione «sodio» viene collegata all’associazione «uovo sodo». La somiglianza può aiutare a ricordare il nome, ma non insegna da sola proprietà e significato del sodio. Questi richiedono unità di contenuto specifiche.

L’utente può scrivere o dettare, chiedere suggerimenti, scegliere una proposta e modificarla. L’immagine è generata solo dopo che l’associazione testuale ha senso per lui. Non deve essere necessario rigenerare immagini per correggere una parola.

Output: associazione confermata e salvata nel locus, con collegamento alla nozione originale.

### E. Studia

L’utente percorre i loci in ordine, osserva la scena e ricostruisce la nozione. Può ascoltare/leggere spiegazioni, modificare un’associazione debole e provare a visualizzarla mentalmente.

L’avanzamento di questo passaggio misura tappe studiate, non informazioni già ricordate a distanza.

### F. Tenta il richiamo

Le risposte e le scene che suggeriscono direttamente la risposta sono nascoste. L’utente vede il locus o un indizio spaziale e prova a rispondere. Solo dopo può aprire risposta e associazione.

Esiti distinti: ricordato senza aiuto, ricordato con aiuto, dimenticato. Conservare anche la risposta effettiva quando presente. Il primo rilascio può usare autovalutazione esplicita; un giudizio AI semantico è un supporto correggibile, non un verdetto automatico.

Output: risultato per unità e sessione, errori da rivedere, nessuna confusione fra «ho aperto la soluzione» e «ho ricordato».

### G. Ripassa e migliora

Proposta aggiuntiva rispetto al dettaglio del prototipo: una coda di ripasso aggiornata dai risultati. Intervalli iniziali semplici e documentati, poi adattamento basato sulla cronologia. Gli intervalli non vanno presentati come ottimali per ogni persona.

Se l’errore ricorre, proporre di correggere la scena, ridurre il contenuto per locus o controllare la comprensione. Non rispondere a ogni errore aumentando effetti e immagini.

Output: prossimo ripasso per unità, riepilogo chiaro e azione «riprendi».

## 6. Stati e salvataggio

| Oggetto | Stati utili | Regola |
|---|---|---|
| Percorso | Bozza, pronto per studiare, archiviato | Una bozza incompleta si salva; «pronto» richiede almeno un locus con contenuto confermato |
| Contenuto | Da verificare, confermato | Il contenuto AI non viene confermato da solo |
| Associazione | Da creare, proposta, confermata | La generazione non sostituisce la scelta personale |
| Operazione AI | In coda/in corso, completata, fallita | Un errore non cancella il lavoro precedente; retry esplicito |
| Ripasso | Da fare, completato | Aprire una schermata non completa il ripasso |

Il ciclo di apprendimento è per singola unità: un percorso può contenere contemporaneamente elementi nuovi e già ripassati. Evitare un unico stato globale «imparato».

Modifiche sostanziali alla risposta corretta rendono necessaria una nuova verifica e devono restare distinguibili dalla cronologia precedente. Rimuovere un locus non deve cancellare silenziosamente il materiale: offrire riassegnazione o rimozione esplicita. Riordinare conserva l’identità dei punti e segnala l’effetto sul tragitto mentale.

## 7. Ruolo delle funzionalità AI

| Funzione | Input | Risultato controllabile |
|---|---|---|
| Suddivisione del materiale | Testo fornito dall’utente | Unità domanda/risposta con riferimento al testo |
| Suggerimenti mnemonici | Nozione + locus + preferenze | Poche associazioni distinte, modificabili |
| Immagine | Associazione confermata | Asset associato al locus, con errore/rigenerazione gestiti |
| Voce | Dettatura avviata volontariamente | Trascrizione correggibile prima del salvataggio |
| Tutor | Contenuto e difficoltà esplicita | Spiegazione/esercizio contestuale |
| Feedback sul richiamo | Risposta attesa e risposta data | Suggerimento motivato, contestabile dall’utente |

Il ciclo manuale deve essere completo: scrittura, associazione, salvataggio, studio e richiamo funzionano anche quando un’API non è disponibile. Le API aggiungono assistenza e media.

Budget indicativo concordato: 100 €/mese complessivi. Progettare generazione su richiesta, riuso degli asset già creati, limiti configurati e visibilità dei consumi. Il limite applicativo non equivale a un tetto garantito sulla fatturazione di tutti i fornitori.

## 8. Progressi da mostrare

- Loci preparati e tappe studiate: completamento del lavoro.
- Risposte corrette senza aiuto sul totale tentato: risultato osservato di richiamo.
- Uso di aiuti ed errori ricorrenti: bisogno di intervento.
- Prestazione a distanza e cronologia: ritenzione osservata, sempre con data e campione.
- Ripassi da fare: pianificazione.

Non sommare questi indicatori in una percentuale indistinta di «potenza della memoria». Nessun miglioramento percentuale promesso senza misurazione.

## 9. Verifica del primo ciclo completo

Il primo incremento sarà considerato funzionante quando un utente può:

1. creare una bozza e ritrovarla dopo la chiusura;
2. inserire concetti, creare/ordinare loci e confermare associazioni;
3. riaprire il percorso ritrovando ordine, posizioni e dati;
4. studiare e svolgere una sessione di richiamo con risposte inizialmente nascoste;
5. registrare risultati e ritrovare i ripassi;
6. completare le stesse operazioni principali da desktop e telefono;
7. distinguere errori di salvataggio e servizi non disponibili senza perdere contenuti;
8. esportare i propri dati e accedere solo ai propri percorsi.

Questi criteri verificano il prodotto, non ancora l’efficacia educativa di Loco nel suo complesso. Quest’ultima richiederà valutazioni separate con prove a distanza.

## 10. Confronto Figma da svolgere

Mappare i frame a Home, biblioteca/Recapape, editor, studio, richiamo, lezioni e profilo. Identificare specificamente l’area riservata desktop, separandola da Home/About/Piani/FAQ pubbliche. Annotare stati vuoti, bozze, errori, salvataggio, uscita e ritorno: i frame mancanti sono requisiti da progettare, non funzioni già documentate.

Restano da verificare sui prototipi: percorso desktop completo, comportamento del + centrale, comandi contestuali esatti, creazione vs sola visita VR, acquisizione stanza, pairing e differenze fra piani. La costruzione del nucleo non dipende dall’attivazione immediata delle API.

## 11. Conferma dal Figma definitivo — portale desktop

La pagina Portale / Area riservata è stata esportata e letta. I frame coerenti con la famiglia visiva locale mostrano dashboard, wizard su Maps, bozze, Recapete, corsi e profilo. Il wizard segue **Posizione → Tracciato → Anagrafica → Fine**: scelta modalità, ricerca posizione, conferma zona, tracciamento, titolo/descrizione/argomento, salvataggio e avvio. Esiste anche l’uscita con proposta di salvare la bozza.

Questi passaggi sono ora requisiti documentati, non solo proposte della ricostruzione. Il file contiene inoltre varianti precedenti e riferimenti esterni: l’esportazione di 129 frame non equivale a 129 schermate definitive. Per l’indice delle evidenze vedere `figma/FINAL-DESIGN-AUDIT.md`.

### Selezione della versione definitiva confermata dall’autore

Usare esclusivamente il gruppo **in basso a destra di Portale / Area riservata** per la web app finale e i caricamenti **in alto a sinistra** della stessa pagina. Le altre soluzioni sono prove. La mappatura dei flussi estratti dal PDF va confermata rispetto a questi gruppi; la posizione nel PDF e lo stile visivo non sono criteri sufficienti per dichiarare un frame definitivo.

## Correzione vincolante dell'autore: interazione dall'interno del castello

Il castello viene prima avviato. L'utente si trova già al suo interno e, mentre esplora, interagisce con l'ambiente per aggiungere i loci. La voce è una modalità possibile, non obbligatoria. Il flusso principale non deve costringere a uscire dalla scena per compilare un editor separato con lista e modulo. Le implementazioni tecniche precedenti hanno interpretato male questa centralità e non sono il riferimento UX.

Prima della prossima modifica di UX sono da chiarire con l'autore: scelta del punto tramite sguardo/tocco/comando o riconoscimento dell'oggetto nominato; contenuti creati in scena oppure pre-caricati; frame/video esatto dei controlli da riprodurre. Non trattare le opzioni proposte nelle domande come scelte già approvate.

### Risposte confermate dall'autore

- Il punto è scelto con sguardo/tocco; Aggiungi locus o il comando vocale confermano la selezione.
- Nozione e associazione sono inserite con voce o testo durante l'esperienza, restando nell'ambiente.
- Il riferimento per l'interazione è il video locale `PROJECT START FOLDER/Video/DEF MOBILE.mov`.

Riesaminati i fotogrammi 01:21, 01:30, 01:42 e 03:15: selezione spaziale con puntatore/indicatore, strumenti contestuali, campo sovrapposto alla scena e alternanza nozione/associazione. Il viewer non deve essere ridotto a un riquadro sopra un modulo esterno. Il portale gestisce accesso, scelta/avvio e archivio; il castello aperto è il luogo in cui si creano i loci.
