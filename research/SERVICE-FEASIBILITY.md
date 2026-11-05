# Sostenibilità del servizio LOCO

Verifica 5 novembre 2026. Stime di progetto, non preventivo o abbonamenti attivati.

## Prima app

Database e prove locali: nessun canone API. Account, testi, loci e ripassi hanno carichi piccoli rispetto a video e ricostruzione 3D. Il server locale implementato è Node + SQLite; l'eventuale deployment Cloudflare richiede un adattamento D1, non è automaticamente pronto per Workers.

Per un pilota con il budget complessivo di 100 €/mese si può adottare un tetto interno indicativo: 20 € infrastruttura/database/backup, 40 € AI, 20 € Maps, 20 € riserva e prove. Sono allocazioni del budget, non prezzi garantiti dei provider. Dominio, IVA/cambio, email, manutenzione e lavorazione umana vanno considerati a parte. Il servizio per utenti paganti richiede quote per account, contabilità per richiesta e blocco dei consumi, non soltanto notifiche di budget. Queste integrazioni non sono ancora attive.

Cloudflare Workers Paid indica una base di 5 USD/mese con uso incluso; D1 include 5 GB sui piani riportati. Fonti: https://developers.cloudflare.com/workers/platform/pricing/ e https://developers.cloudflare.com/d1/platform/pricing/ . Non è la tariffa di un server Node con disco persistente.

## Street View e 3D

Listino Google globale: Dynamic Street View 5.000 eventi gratuiti al mese, quindi 14 USD per 1.000 eventi nel primo scaglione. Esempio aritmetico: 10.000 eventi mensili della sola SKU = (10.000−5.000)/1.000 × 14 = 70 USD, prima di IVA/cambio e altre SKU. Mappe, geocoding e Places hanno consumi propri. Non equiparare un evento fatturato a un movimento del mouse o a un singolo utente.

Fonte prezzi: https://developers.google.com/maps/billing-and-pricing/pricing . I Photorealistic 3D Tiles sono una SKU distinta (1.000 eventi gratuiti, poi 6 USD/1.000 nel primo scaglione), non un'esportazione del modello personale ottenuto da Street View.

Per un account di fatturazione italiano vanno verificati i termini EEA: https://cloud.google.com/terms/maps-platform/eea . Le sezioni 3.3.2 vietano estrazione/scraping, caching salvo eccezioni e creazione di contenuti basati sui contenuti Maps. Pertanto non impostare il prodotto come downloader di panorami Street View da trasformare e conservare in mesh. Prima di quel flusso serve una licenza/autorizzazione applicabile o una fonte che consenta esplicitamente la ricostruzione.

Separare tre esperienze:
1. Street View via API ufficiale con loci e percorsi, entro termini e quote.
2. Visualizzazione geografica 3D ufficiale ove disponibile, senza promessa di esportare un modello proprietario.
3. Ricostruzione da foto/video originali dell'utente o dati con licenza compatibile. Qui si può produrre un asset 3D e conservarlo.

La terza opzione richiede un job asincrono di elaborazione, file sorgenti in object storage e un risultato verificato (mesh/GLB o splat compatibile con il viewer). Un video non garantisce una ricostruzione utilizzabile: copertura, superfici riflettenti, movimento e qualità incidono. Prima si misura su una stanza propria tempo GPU, dimensioni e tasso di successo. Senza quel benchmark non è fondato promettere costo fisso per scansione o scansioni illimitate nel canone.

Conclusione operativa: 100 €/mese può sostenere sviluppo e un pilota limitato; sostenibilità commerciale da verificare sul costo per utente attivo e per job 3D, mantenendo il 3D a crediti/quote separati fino alla misura reale.
