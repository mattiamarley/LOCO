# Prima stanza: acquisizione e costi

Decisione: prova locale con pianta manuale, senza API e senza acquisti. iPhone indicato come “altro iPhone”: assumiamo per ora assenza di LiDAR; verificare il modello prima di scegliere una scansione specifica.

## Ripresa

Una sequenza video può fornire fotogrammi per la fotogrammetria. Non basta ruotare da un unico punto: spostarsi lentamente nella stanza, riprendere gli stessi dettagli da posizioni diverse, con sovrapposizione. Usare luce diffusa, lente fissa senza zoom, evitare persone in movimento e sfocatura. Specchi, vetri e pareti uniformi possono compromettere la ricostruzione. La qualità va verificata su un campione prima di promettere un modello navigabile. Preferire fotografie nitide quando il video perde dettaglio.

Fonte: https://meshroom-manual.readthedocs.io/en/latest/capturing/capturing.html

RoomPlan usa LiDAR ed è un’API Apple nativa: non è la soluzione web diretta per un iPhone senza LiDAR. Fonte: https://developer.apple.com/augmented-reality/roomplan/

## Modello per il web

Formato previsto GLB/glTF 2.0, con texture ottimizzate; USDZ eventuale derivato per AR Apple. Prima di posizionare i loci, fissare unità, scala, origine e orientamento. Conservare separatamente modello/versione, punti xyz e camera, ordine del percorso, contenuti e ripassi. Una nuova scansione richiederà verifica o migrazione degli ancoraggi; cambiare scala senza migrare i loci li disallinea. La pianta iniziale usa coordinate normalizzate: non si convertono automaticamente in metri del modello. Il flusso di ricostruzione, ottimizzazione e importazione non è implementato nel prototipo.

Le riprese della casa e gli archivi personali vanno in `user-data/`, escluso dal repository pubblico. Il costo di un servizio di ricostruzione cloud va preventivato separatamente; nessun servizio è stato acquistato.

## Costi verificati il 4 novembre 2026

Listini USD, imposte e conversione EUR escluse. Nessuna spesa avviata.

- Dynamic Street View: 5.000 eventi fatturabili mensili gratuiti; poi $14 per 1.000 nella prima fascia. Esempi: 6.000 eventi = $14; 10.000 = $70. Non equivalgono a utenti o passi. Altre API Maps/Places hanno conteggi separati. È richiesta configurazione della fatturazione Google per usarle.
- AI testuale, scenario GPT-6 Luna: $0,10 input e $0,50 output per milione di token. Mille richieste di 1.000 token input + 300 output ciascuna costerebbero $0,25, esclusi strumenti, immagini, ulteriori token e tentativi.
- Immagini GPT Image 2.5: output immagine $30/milione token. Uno scenario di 1.000–3.000 token di output per immagine comporta $0,03–0,09 più input; non è un prezzo fisso per immagine o risoluzione. Qualità, dimensioni e consumo effettivo vanno misurati su una prova prima di fissare quote.

Fonti: https://developers.google.com/maps/billing-and-pricing/pricing ; https://developers.google.com/maps/documentation/javascript/usage-and-billing ; https://developers.openai.com/api/docs/pricing

Budget operativo proposto entro €100: iniziare con stanza locale e nessuna immagine automatica; successivamente attivare AI su richiesta, registrare consumi sul server e fermare nuove richieste al limite configurato. Gli avvisi di fatturazione non sostituiscono un blocco applicativo. Questi limiti non sono ancora implementati; il prototipo invece non chiama API.
