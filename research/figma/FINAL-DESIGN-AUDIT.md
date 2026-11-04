# LOCO — riferimento Figma definitivo

Il 4 novembre 2026 l’utente ha confermato come definitivo il file [loco-nuovo](https://www.figma.com/design/FeZKyO6xCZtjmQ1uEef4kx/loco-nuovo?node-id=310-887).

Il precedente file gruppoSEDICI resta una fonte storica, non il riferimento per la fedeltà della ricostruzione.

## Stato verificato

Il file è ora accessibile nel browser in sola lettura. Pagine verificate: Libreria Visual, ADV, Gadget, sito, Portale / Area riservata, App mobile, presentazione esame, book. La pagina Portale / Area riservata è stata aperta al nodo `3:3`: contiene numerosi frame e gruppi. L’inventario dettagliato delle schermate e delle connessioni è ancora in corso.

Il precedente blocco di accesso è superato: riaprendo il link, la sessione del browser ha mostrato direttamente il file. Nessun ulteriore login è stato eseguito dall’agente. Il banner di Figma segnala che il team è bloccato per limiti del piano; la lettura del file è comunque disponibile.

## Inventario da completare dopo l’accesso

- Pagine del file e gruppi di schermate.
- Sito pubblico: Home, About, Piani, FAQ e accesso.
- Area riservata desktop: Home, biblioteca, editor, ambiente, loci, associazioni e salvataggio.
- Mobile: Home, Recapape, bozze, creazione, lezioni e profilo.
- Vista normale, immersiva/VR, strumenti contestuali, input vocale e uscita.
- Connessioni fra frame e punti di ingresso del prototipo.
- Componenti, varianti, palette, font, illustrazioni e asset esportabili.
- Stati vuoti, caricamenti, errori, avanzamento e conferme.

Per ogni schermata: URL/nodo verificato, screenshot, azioni, dati richiesti, comportamento dopo l’azione e relazione con FUNCTIONAL-SPEC.md. Gli stati non disegnati saranno indicati come lavoro da definire, non attribuiti al file.

## Esportazione e prima lettura del portale

La pagina `Portale / Area riservata` è stata esportata da Figma in 129 pagine/frame. Include schermate, varianti, componenti isolati, consigli VR e riferimenti esterni: non sono 129 schermate finali univoche. Numerazione seguente = ordine nel PDF esportato, non ID dei nodi Figma.

### Famiglia coerente con ADV e demo mobile

- Frame esportato 104: accesso con illustrazione a contorno nero.
- 105: dashboard con sidebar lilla, creazione centrale, riepilogo percorsi, corsi, risorse e piano.
- 106: scelta nuovo percorso su Maps / nuovo scan 3D.
- 107-108: ricerca posizione iniziale.
- 109: conferma della zona.
- 110: tracciamento del percorso su mappa.
- 111, 119, 125: anagrafica con titolo, descrizione delle nozioni e argomenti.
- 112: percorso creato e azione per iniziare l’esperienza; testo che rimanda alla sezione di recap per riaprirlo.
- 113: uscita con salvataggio nelle bozze.
- 118: profilo e dati del piano (copia pubblica da minimizzare per i campi personali/di pagamento).
- 122: catalogo dei tre corsi.
- 123: tre lezioni della tecnica dei loci.
- 126: Recapete con ricerca, bozze, modifica/ripresa e avanzamenti.

Il wizard esplicita **Posizione → Tracciato → Anagrafica → Fine**. La struttura funzionale dovrà rispettare questo percorso d’ingresso, lasciando la possibilità di preparare il materiale prima dell’ambiente.

### Varianti e materiale storico nella stessa pagina

I frame 54, 59-63, 68-103 contengono anche la famiglia viola/lime con l’oca organica e soluzioni di navigazione differenti. 43 e 64 mostrano un dashboard in inglese con altro marchio (SETH), da trattare come riferimento, non da implementare come LOCO. I componenti isolati e gli studi intermedi non vanno interpretati come flussi finali.

### Gap operativi ancora da definire

Il salvataggio bozza, l’ingresso su mappa e il tracciamento sono disegnati. Non è ancora ricostruito un grafo verificato delle interazioni del prototipo, né un flusso completo di richiamo con verifica della risposta. Restano da specificare persistenza, gestione errori, distinzione contenuto/associazione, progressi misurati e ripassi: il solo disegno non dimostra che queste parti siano implementate.

### Copie di ricerca

`portale-area-riservata.pdf` e le tavole `portal-contact-*` sono derivati per la lettura. La copia originale resta locale sotto `private/`, esclusa da Git. I campioni di profilo/pagamento dei frame esportati 60, 102 e 118 sono sostituiti nella copia condivisibile con una nota; non vi è testo sottostante di quelle pagine. Le copie non sostituiscono il Figma come sorgente definitiva.

## Identificazione definitiva confermata dall’autore

L’utente ha specificato: nella pagina **Portale / Area riservata**, la **web app definitiva è il gruppo in basso a destra**, mentre i **caricamenti sono in alto a sinistra**. Gli altri gruppi sono prove. Questa indicazione sostituisce ogni precedente inferenza basata su colore, ordine di esportazione o somiglianza con ADV/demo.

L’esportazione PDF resta un inventario dell’intera pagina, non una selezione del prodotto definitivo. La corrispondenza fra il gruppo spaziale in basso a destra e le pagine dell’esportazione va verificata sul canvas prima di attribuire stati o flussi alla versione finale. Anche i precedenti elenchi di frame per famiglia visiva rimangono appunti provvisori, non una certificazione di appartenenza al gruppo finale.

### Nodi verificati nel gruppo finale

- **Home `473:1088`**: selezionata direttamente nel blocco in basso a destra e confrontata con il canvas. Sidebar verticale lilla, logo nero su due righe, riepilogo dei percorsi con cerchi percentuali, banner Crea percorsi, tre corsi, colonna personale con risorse e piano. Screenshot: `final-home-473-1088.jpg`. Corrisponde alla pagina esportata 105.
- **Profilo `774:750`**: nello stesso gruppo, sotto la Home, con dati personali, indirizzo, piano e dati di pagamento esemplificativi. La copia pubblica dell’esportazione omette i campi esemplificativi di profilo/pagamento.
- La Home `108:605`, selezionata durante il confronto, appartiene invece a una prova: non usarla come riferimento finale.

La conferma della Home finale sostituisce la precedente identificazione per sola famiglia visiva. Gli altri nodi del gruppo rimangono da mappare singolarmente.
