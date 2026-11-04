# LOCO · prova locale gratuita

Avvio dalla radice del repository:

```sh
python3 -m http.server 8780 --bind 127.0.0.1 --directory app/prototype
```

Aprire http://127.0.0.1:8780 . Nessuna installazione, chiave API o chiamata AI/Maps. Tutti gli asset sono locali; le connessioni da script sono vietate dalla Content Security Policy.

Funzioni: pianta schematica, punti ordinati e contenuti personali, richiamo con risposta nascosta e autovalutazione, intervalli iniziali euristici, otto lezioni, cinque carte casuali con confronto per posizione, salvataggio nel browser, esportazione/importazione JSON validata. Una modifica a domanda o risposta azzera la progressione del punto. Il richiamo percorre tutti i contenuti, anche quelli non ancora in scadenza; il cruscotto distingue il numero da ripassare.

I dati sono locali a browser e origine: cancellare i dati del browser o cambiare indirizzo/porta rende l’archivio indisponibile. Esportare periodicamente; nessuna sincronizzazione o autenticazione. La spunta delle lezioni indica lettura, non competenza verificata. La valutazione del richiamo è personale.

È un prototipo di funzionamento, non la riproduzione completa del Figma definitivo. Scansione video/3D, AI, Street View, pagamenti e account non sono implementati. Le illustrazioni/font provengono dai materiali originali. Non aggiungere riprese personali al repository pubblico: usare `user-data/` ignorato da Git.

Verifica: `node --test app/prototype/tests/model.test.mjs`.
