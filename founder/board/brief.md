# Brief per il board: Ristosagra

Questo documento è tutto ciò che il board sa dell'idea. Contiene i fatti forniti dal fondatore e quelli verificabili nel codice del prodotto, senza giudizi.

## L'idea (da `founder/idea.md`)

- **Cos'è**: un sito web per le sagre che unisce il lato cliente (menù, ordini dal telefono, asporto, prenotazioni) e la gestione interna (cassa, comande, cucina, ritiro al banco), dove il titolare accende e spegne le funzioni che gli servono.
- **Per chi è**: chi organizza la sagra e paga. Il fondatore punta a tutti questi: Pro Loco e associazioni di volontari, sagre grandi (migliaia di coperti, cucina divisa in postazioni), anche ristoranti, feste ed eventi privati (parrocchiali, di partito, aziendali).
- **Cosa vende, a che prezzo**: l'uso del software per una sagra, a forfait per ogni edizione. La cifra non è ancora decisa.
- **Dove e come**: online (sito web su telefono e PC, nessuna app da installare), in Italia. I primi clienti arrivano da contatti diretti del fondatore nel mondo delle sagre; c'è già una sagra pronta a usarlo alla prossima edizione.
- **Budget e vincoli**: il fondatore lavora da solo, nel tempo libero. Budget non indicato.

## Contesto: cos'è una sagra

In Italia una sagra è una festa popolare, spesso di paese, legata a un piatto o a un prodotto, che dura da un weekend a un paio di settimane, una o poche volte l'anno. Molte sono organizzate da Pro Loco o associazioni con personale volontario. Il modello tipico: il cliente fa la coda alla cassa, ordina e paga, riceve un bigliettino con un numero, si siede, e la cucina prepara gli ordini nell'ordine in cui sono stati pagati.

## Stato del prodotto (fatti dal codice)

- **Fatto**: il frontend (React, sito web responsive, pensato per il telefono). Sviluppo iniziato il 26 febbraio 2026, circa 19.000 righe di codice. Il fondatore stima il prodotto al 90%.
- **Manca**: il backend e il database. Oggi l'app funziona solo in modalità dimostrativa, con dati finti salvati nel browser. Esiste un documento di contratto (`API.md`, circa 900 righe) che descrive tutti gli endpoint e le regole che il backend dovrà rispettare.
- **Un locale per backend**: il contratto attuale prevede un solo ristorante/sagra per backend (non c'è un identificativo della sagra nelle chiamate). Servire più sagre richiede o un'installazione per sagra o di aggiungere la gestione di più sagre al backend.
- **Non presenti nel codice**: integrazione con registratori di cassa telematici / scontrino fiscale; funzionamento offline (nessuna app installabile né cache offline: senza rete l'app non va). Il pagamento online è previsto ma l'integrazione con il servizio di pagamento (es. Stripe, SumUp, Satispay) va fatta nel backend.

### Cosa fa l'app

**Lato cliente** (sito pubblico, dal telefono):
- menù del giorno con categorie e allergeni; più menù per giorni della settimana diversi;
- carrello e ordine dal telefono, se il titolare lo permette;
- asporto con orario di ritiro (orario fisso o fascia, per pranzo/cena), se attivo;
- prenotazione del tavolo;
- QR code sul tavolo che compila il tavolo da solo;
- stato dell'ordine sul telefono e schermo pubblico "/pronti" (per una TV) con i numeri degli ordini pronti al banco.

**Lato gestione** (area protetta, con login per persona):
- **ruoli**: titolare, vice, cassa, caposala, cameriere, capo cucina, cucina (postazione), banco ritiro; ognuno vede solo le sue pagine;
- **cassa**: nuovo ordine, lista ordini, segna pagato, conti per tavolo, stampa del bigliettino con il numero (per stampanti da 80 mm);
- **cucina**: lista ordini in coda con timer (rosso quando in ritardo); in alternativa il capo cucina smista le righe dell'ordine alle postazioni (es. griglia, primi, fritti) e ogni postazione segna pronto il suo pezzo;
- **ritiro al banco**: consegna degli ordini pronti;
- **piantina** della sala con tavoli disegnabili;
- **profilo del titolare**: nome, tema chiaro/scuro e colore, orari di apertura, asporto, modalità di ordine, cucina, personale, menù.

### Le funzioni che il titolare accende e spegne

- **Modalità di ordine**: solo menù (ordina la cassa), ordine dal sito e pagamento alla cassa, ordine e pagamento online.
- **Quando si paga**: prima di mangiare ("tipo sagra": la cucina vede solo gli ordini pagati) o a fine pasto ("tipo ristorante": conti per tavolo).
- **Servizio**: al tavolo o ritiro al banco.
- **Asporto** sì/no e come; **QR code** ai tavoli sì/no; **smistamento in cucina** sì/no e con quali postazioni; **orari**; **menù**; **personale** e ruoli.
- Le combinazioni che non hanno senso sono bloccate con il motivo spiegato.

## Cosa il fondatore non ha ancora (domande aperte)

- La cifra del forfait per edizione.
- Dimensione del mercato (quante sagre in Italia, quante pagherebbero), concorrenti diretti e loro prezzi, costo per acquisire una sagra: nessun dato raccolto finora.
