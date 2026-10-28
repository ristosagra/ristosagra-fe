# Usare Ristosagra senza internet

> Analisi e proposta, ottobre 2026. Nessuna modifica al codice: qui si descrive cosa servirebbe e cosa cambierebbe. Prezzi e tempi sono **stime**; i punti tecnici non certi sono segnati **da verificare**.

## In breve

- Il problema vero non è il browser senza internet: è che **cassa, cucina, banco ritiro e schermo `/pronti` si parlano solo attraverso il backend**. Oggi il backend è previsto in cloud (`VITE_API_URL`): se cade il 4G della sagra si fermano tutti insieme, anche se ogni tablet resta acceso e collegato al Wi-Fi.
- Per farli continuare a parlarsi senza internet serve qualcosa **dentro** la rete della sagra: un piccolo computer (mini-PC o portatile) che fa girare backend e database e serve il sito. È quello che fanno SagraGo, SagraFacile "Locale" e StandFacile.
- **Raccomandazione per la sagra pilota: opzione A (server locale) + opzione D (procedura su carta)**. Copre tutto il flusso "paga prima + ritiro al banco", costa poco lavoro in più del backend che va scritto comunque e quasi nessuna modifica al frontend. Gli ordini dal 4G dei clienti e il pagamento online (opzione C) si rimandano a dopo la pilota.
- Proposta per il pitch, al posto di "Serve una connessione internet": _"Non serve internet: cassa, cucina e schermo dei numeri funzionano sulla rete Wi-Fi della sagra, con un piccolo computer che portiamo noi. E se si ferma anche quello, c'è la procedura su carta già pronta."_

---

## 1. Cosa succede oggi quando cade la rete

Con il backend in cloud e il sito su Netlify, così come è scritto il codice:

| Situazione                                                  | Cosa vede chi lavora                                                                                                                                                                                                                                                   | Dove                                                                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Pagina già aperta                                           | Restano gli ultimi dati letti (cache di React Query, solo in memoria). Gli aggiornamenti automatici falliscono: la cucina (ogni 10 s), il banco e `/pronti` (ogni 5 s) non vedono più niente di nuovo                                                                  | [`useOrders.ts`](../src/features/orders/hook/useOrders.ts), [`Kitchen.tsx:33`](../src/pages/Cashier/Kitchen.tsx)   |
| Wi-Fi acceso ma senza internet (il caso tipico: 4G giù)     | Ogni azione (nuovo ordine, pagato, pronto, consegnato) fallisce subito o dopo **15 s** di attesa. In Nuovo ordine il `Loader` copre lo schermo per tutto quel tempo, poi "Errore nella creazione dell'ordine"                                                          | [`httpClient.ts:5`](../src/services/client/httpClient.ts), [`NewOrder.tsx:207`](../src/pages/Cashier/NewOrder.tsx) |
| Il dispositivo perde proprio il Wi-Fi                       | React Query (v5.104, `networkMode: "online"` predefinito) mette l'azione **in pausa** invece di farla fallire: nessun errore, il `Loader` resta finché la rete non torna (comportamento della libreria verificato nel sorgente; l'effetto sulla pagina **da provare**) | [`main.tsx`](../src/main.tsx)                                                                                      |
| Bigliettino                                                 | Si stampa solo dopo che il backend ha dato il numero d'ordine: niente rete, niente numero, niente bigliettino                                                                                                                                                          | [`NewOrder.tsx:184`](../src/pages/Cashier/NewOrder.tsx)                                                            |
| Ricaricare la pagina, aprirne una nuova, riaprire il tablet | Non c'è service worker: errore del browser, l'app non si apre                                                                                                                                                                                                          | —                                                                                                                  |
| Login                                                       | Impossibile. Con un token scaduto (`hasSession()`) si viene mandati su `/login` e si resta fuori                                                                                                                                                                       | [`session.ts:82`](../src/services/auth/session.ts), [`ProtectedRoute.tsx`](../src/components/ProtectedRoute.tsx)   |

In pratica oggi, senza internet, la sagra passa alla carta senza averlo deciso prima.

---

## 2. Le opzioni

### A) Server locale nella rete della sagra

**Come funziona.** Un mini-PC (o un portatile) collegato al router della sagra fa girare il backend, il database e serve il sito compilato. Tutti i dispositivi del personale si collegano al Wi-Fi della sagra e aprono l'indirizzo del mini-PC. Internet non serve: se c'è, non cambia niente.

```
            Router Wi-Fi della sagra  (internet facoltativo)
                       │ cavo di rete
               ┌───────┴────────┐
               │    mini-PC     │  backend + database (SQLite) + sito compilato (dist/)
               │  192.168.1.10  │
               └────────────────┘
  Wi-Fi "Sagra-Staff" (con password):
     cassa (+ stampante 80 mm)   cucina / postazioni   banco ritiro   TV con /pronti
```

Il frontend è quello di oggi compilato con `VITE_MOCKING=false` e `VITE_API_URL` vuoto: sito e API stanno sullo stesso indirizzo, quindi niente CORS e niente modifica a [`env.ts`](../src/constant/env.ts). Le API del browser usate dall'app funzionano anche in `http://` su un IP locale (vedi [§4.7](#47-https-in-rete-locale)): non serve HTTPS per la pilota.

**Come si monta alla sagra.**

1. _Prima della sagra, a casa (il fondatore, una volta):_ installare il server sul mini-PC (immagine Docker o programma unico, da decidere con lo stack del backend), caricare menù, personale e impostazioni, fare una prova con tutti i dispositivi.
2. _Al montaggio (il fondatore per la pilota; poi un volontario con una checklist di una pagina):_
   - router al centro tra cassa, cucina e banco; mini-PC accanto al router **col cavo**, entrambi sotto un gruppo di continuità (alle sagre ci sono generatori e prolunghe);
   - nel router: indirizzo fisso per il mini-PC (es. `192.168.1.10`, prenotazione DHCP);
   - su ogni dispositivo: collegarsi a "Sagra-Staff", aprire `http://192.168.1.10` (un foglio col QR dell'indirizzo appeso alla cassa aiuta), fare il login;
   - tablet del personale: **dati mobili spenti** o tablet solo Wi-Fi (vedi [§4.10](#410-telefoni-e-tablet-su-un-wi-fi-senza-internet));
   - TV di `/pronti`: standby disattivato dalle impostazioni della TV (su `http` il browser non può tenere acceso lo schermo da solo);
   - controllare che l'ora del mini-PC sia giusta (vedi [§4.9](#49-lora-del-server-e-dei-dispositivi)).
3. _A fine serata:_ copia del database su chiavetta USB (con SQLite è un file), spegnimento ordinato.
4. _Prova generale:_ una sera prima dell'apertura staccare internet e poi spegnere il mini-PC, per provare anche il passaggio alla carta (D).

**Hardware (stima, prezzi indicativi da verificare).**

| Cosa                                               | Costo indicativo                                              | Note                                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Mini-PC x86 (classe Intel N100/N150, 8–16 GB, SSD) | 150–250 €                                                     | Oppure un portatile usato già disponibile: la batteria fa da gruppo di continuità                       |
| Router o access point Wi-Fi                        | 50–150 €                                                      | Per aree grandi o all'aperto uno o due access point in più (mesh o da esterno), 80–250 € l'uno          |
| Gruppo di continuità piccolo (mini-PC + router)    | 60–120 €                                                      |                                                                                                         |
| Cavi di rete, switch, prolunghe                    | 20–60 €                                                       |                                                                                                         |
| Stampanti termiche, tablet, TV                     | —                                                             | Servono già oggi, non sono un costo dell'offline                                                        |
| **Totale**                                         | **circa 250–600 €** oltre ai dispositivi già presenti (stima) | Un Raspberry Pi costa meno ma senza batteria dell'orologio perde l'ora: sconsigliato per la prima volta |

**Lavoro di sviluppo rispetto a oggi.** Il backend non esiste ancora e va scritto comunque; l'opzione A chiede di scriverlo in modo che giri da solo su un mini-PC:

- un solo processo + SQLite (niente server di database separato, niente servizi esterni durante l'evento);
- servire `dist/` con il ritorno a `index.html` per `/dashboard`, `/login`, `/pronti` (oggi lo fa il `[[redirects]]` di [`netlify.toml`](../netlify.toml)) e intestazioni di sicurezza adatte a `http` (vedi [§4.6](#46-content-security-policy-e-netlifytoml));
- pacchetto d'installazione (Docker Compose o binario unico), comando di backup/ripristino, ora e fuso orario `Europe/Rome`;
- numero d'ordine unico per serata e chiave di idempotenza sugli ordini (vedi [§4.1](#41-numero-dordine) e [§4.4](#44-timeout-di-15-s-401-e-ordini-doppi)).

Frontend: in pratica nessuna modifica obbligatoria. Utili ma rimandabili: un avviso "server non raggiungibile" al posto del `Loader` che blocca la cassa, l'ora del server nel profilo.

**Dimensione: piccola** in aggiunta al backend.

**Pro:** cassa, cucina, smistamento, banco e `/pronti` funzionano senza internet; risposte immediate (rete locale); nessun aggiornamento a sorpresa durante l'evento; il contratto attuale "un locale per backend" va già bene.

**Contro:** dal 4G i clienti non raggiungono il server (niente ordini da casa o dal proprio telefono senza Wi-Fi, niente pagamento online, niente prenotazioni durante l'evento); il mini-PC è un punto unico di guasto (→ D e backup); la copertura Wi-Fi dell'area va provata.

### B) Backend in cloud + frontend "offline-first"

**Come funziona.** Il backend resta in cloud. Il frontend diventa una PWA: un service worker tiene sul dispositivo tutti i file dell'app (compresi i pezzi caricati a richiesta `CashierHome`, `CashierLogin`, `PickupScreen` di [`App.tsx`](../src/App.tsx)), menù e impostazioni restano salvati sul dispositivo, e le azioni del personale finiscono in una **coda** (IndexedDB) che si svuota quando torna la rete.

**Il limite che decide:** senza un server raggiungibile i dispositivi **non si parlano**. La cassa continua a prendere ordini e a stampare bigliettini (con un numero generato sul posto), ma la cucina non riceve quegli ordini finché non torna internet, il banco non sa cosa è pronto, `/pronti` è fermo. Durante il buco la cucina deve lavorare dalla copia di carta: B è "la carta (D) con una cassa più comoda", a un costo di sviluppo alto.

**Come si monta:** niente di nuovo alla sagra. Ogni dispositivo deve aver aperto l'app **con internet** prima dell'evento (per scaricarla e fare il login) e il token deve durare tutto l'evento.

**Hardware (stima):** 0 €; eventualmente un router 4G migliore (80–250 €).

**Lavoro di sviluppo: grande.** Service worker e manifest (es. con un plugin PWA per Vite, da valutare), persistenza della cache di React Query, coda delle scritture con identificativi e nuovi tentativi, numeri d'ordine generati sul dispositivo, ora di pagamento presa dal dispositivo, gestione dei conflitti (es. la cucina segna pronta una comanda che il capo cucina ha intanto ritirato), interfaccia "offline, N ordini in coda", endpoint di sincronizzazione nel backend, prove su Safari iOS (che può cancellare i dati dei siti non usati per giorni: **da verificare** per i tablet usati solo nei weekend della sagra).

**Pro:** nessun hardware; la cassa non si ferma mai; il sito si apre anche senza rete.

**Contro:** non risolve la comunicazione cassa → cucina → banco, cioè il cuore del flusso "paga prima + ritiro al banco"; complessità alta; HTTPS obbligatorio (ok su Netlify).

### C) Ibrido: server locale principale + cloud

**Come funziona.** Durante l'evento comanda il server locale (come A). In cloud ci sono il sito pubblico e un backend "gemello" che:

- mostra il menù e accetta prenotazioni da casa prima dell'evento;
- riceve gli ordini dai telefoni dei clienti col loro 4G e i pagamenti online (il servizio di pagamento manda la conferma, il webhook, a un indirizzo pubblico: un server locale dietro un router 4G non è raggiungibile da fuori);
- conserva configurazione, storico e report.

Il server locale, quando c'è internet, **apre lui** la connessione verso il cloud (nessuna porta da aprire nel router): scarica ordini dei clienti, conferme di pagamento, prenotazioni e configurazione; carica stati degli ordini (per il telefono del cliente) e incassi. Quando internet cade il personale non se ne accorge; il cloud, non sentendo più il server locale, **sospende gli ordini dal telefono** ("Ordina alla cassa") invece di accettare ordini che la cucina non vedrebbe.

**Come si monta:** come A, più un'uscita internet (router 4G/5G con SIM o la linea della sagra). Opzionale: un nome unico (es. `ordina.miasagra.it`) che sul Wi-Fi della sagra porta al mini-PC (DNS locale) e fuori porta al cloud, così i QR sui tavoli funzionano in entrambi i casi (richiede HTTPS locale, vedi [§4.7](#47-https-in-rete-locale)).

**Hardware (stima):** come A + router 4G/5G 80–250 € + SIM dati: circa **350–850 €**.

**Lavoro di sviluppo: molto grande.** Tutto A, più il deploy cloud, la sincronizzazione nei due sensi con i conflitti, numeri d'ordine da due fonti, più sagre sullo stesso cloud (oggi il contratto ne prevede una sola, [§4.8](#48-un-solo-locale-per-backend)), l'eventuale HTTPS locale.

**Pro:** il meglio dei due mondi quando internet c'è; senza internet il personale lavora come in A.

**Contro:** costo di sviluppo e di manutenzione; ordini dal telefono e pagamento online restano comunque legati a internet.

### D) Ripiego su carta deciso prima

**Come funziona.** Una procedura scritta, provata col personale, e una "busta d'emergenza" alla cassa. Da sola (con il cloud di oggi) o, meglio, insieme ad A o C come rete di sicurezza per quando si ferma il mini-PC o il Wi-Fi.

**Cosa c'è nella busta:**

- blocchetti di biglietti numerati in **due copie** (cliente e cucina) con una **serie diversa da quella dell'app** (es. dal 5001, o con lettera "C"), così al ritorno dell'app i numeri non si confondono;
- listino con prezzi e totali rapidi (combinazioni frequenti), calcolatrice, pennarelli;
- una lavagna o un cartellone per i numeri pronti (al posto di `/pronti`), oppure chiamata a voce;
- la procedura su un foglio plastificato.

**La procedura (bozza):**

1. _Chi decide:_ il responsabile di cassa. _Quando:_ l'app non risponde per più di 2 minuti o il mini-PC è spento.
2. _Cassa:_ scrive i piatti sul blocchetto, incassa, dà una copia al cliente, l'altra va in cucina (filo con mollette, in ordine di arrivo = ordine di pagamento).
3. _Cucina:_ lavora dai bigliettini come nella modalità "senza smistamento" dell'app; il capo cucina divide a mano tra le postazioni.
4. _Banco:_ chiama il numero a voce o lo scrive sulla lavagna; consegna e barra il bigliettino.
5. _Ritorno all'app:_ gli ordini già su carta finiscono su carta; quelli nuovi vanno nell'app. I biglietti di carta si contano a parte per gli incassi della serata.
6. _Prova:_ 5 minuti di simulazione col personale prima dell'apertura.

**Hardware:** blocchetti e materiale, circa 20–50 € a evento (stima).

**Lavoro di sviluppo: nessuno.** Utili più avanti: stampa del "listino d'emergenza" dal profilo; un modo per registrare dopo gli ordini di carta senza mandarli in cucina (vedi [§5](#5-cosa-cambia-in-apimd-e-nel-backend)).

**Pro:** costa quasi niente, funziona sempre, risponde alla richiesta del board e del panel ("carta di riserva che non perde gli ordini").

**Contro:** lento nei momenti di punta, errori di calcolo, niente schermo né statistiche durante il buco.

### Confronto rapido

|                                       | A — locale                           | B — offline-first          | C — ibrido              | D — carta             |
| ------------------------------------- | ------------------------------------ | -------------------------- | ----------------------- | --------------------- |
| Hardware nuovo (stima)                | 250–600 €                            | 0–250 €                    | 350–850 €               | 20–50 € a evento      |
| Sviluppo in più rispetto al backend   | piccolo                              | grande                     | molto grande            | nessuno               |
| Cassa → cucina → banco senza internet | sì                                   | no (la cucina va su carta) | sì                      | sì, su carta          |
| Ordini dal 4G dei clienti             | no                                   | sì, quando c'è internet    | sì, quando c'è internet | no                    |
| Chi monta                             | fondatore / volontario con checklist | nessuno                    | fondatore               | responsabile di cassa |
| Punto debole                          | il mini-PC (→ D)                     | cucina e banco ciechi      | complessità             | lentezza ed errori    |

---

## 3. Funzione per funzione: cosa resta in piedi quando cade internet

✅ funziona · ⚠️ funziona in parte · ❌ non funziona. "Oggi" = backend in cloud senza accorgimenti.

| Funzione                                    | Oggi                                               | A — locale                                                     | B — offline-first                                              | C — ibrido                                                                                 | D — carta                  |
| ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------- |
| Ordine dal telefono del cliente, col suo 4G | ❌ arriva al cloud ma cassa e cucina non lo vedono | ❌ il server locale non è raggiungibile da fuori               | ⚠️ arriva al cloud, la sagra lo vede solo quando torna la rete | ⚠️ solo se il server locale è collegato al cloud; altrimenti sospeso ("ordina alla cassa") | ❌                         |
| Ordine dal telefono col Wi-Fi della sagra   | ❌                                                 | ✅ se il Wi-Fi ospiti raggiunge il mini-PC (¹)                 | ❌                                                             | ✅ come A (¹)                                                                              | ❌                         |
| Pagamento online (`payOnline`)              | ❌                                                 | ❌ non previsto                                                | ❌                                                             | ⚠️ con il 4G del cliente; la conferma arriva alla cucina quando torna la rete              | ❌                         |
| Cassa e Nuovo ordine                        | ❌ errore dopo max 15 s                            | ✅                                                             | ✅ sul dispositivo, ordine in coda                             | ✅                                                                                         | ✅ blocchetto              |
| Stampa del bigliettino                      | ❌ manca il numero                                 | ✅ stampante USB o di rete locale (²)                          | ✅ con numero generato sul dispositivo                         | ✅                                                                                         | ✅ biglietti prenumerati   |
| Cucina e smistamento alle postazioni        | ❌ niente ordini nuovi                             | ✅                                                             | ❌ non riceve gli ordini fatti offline                         | ✅                                                                                         | ✅ a mano, coi bigliettini |
| Ritiro al banco                             | ❌                                                 | ✅                                                             | ❌ non sa cosa è pronto                                        | ✅                                                                                         | ✅ a voce                  |
| Schermo `/pronti`                           | ❌ fermo; ricaricato non si apre                   | ✅ (standby della TV da disattivare a mano)                    | ❌                                                             | ✅                                                                                         | ⚠️ lavagna                 |
| Stato dell'ordine sul telefono del cliente  | ❌                                                 | ⚠️ solo sul Wi-Fi della sagra                                  | ❌                                                             | ⚠️ sul Wi-Fi della sagra; dal 4G con ritardo                                               | ❌                         |
| QR sui tavoli (³)                           | ❌                                                 | ⚠️ solo QR stampati con l'indirizzo locale e cliente sul Wi-Fi | ⚠️ portano al cloud: serve il 4G del cliente                   | ✅ con un nome unico e DNS locale                                                          | ❌                         |
| Prenotazioni dei clienti (da casa)          | ✅ il cloud le riceve, ma il personale non le vede | ❌ server non raggiungibile da fuori (anche con internet)      | ✅ il personale le vede quando torna la rete                   | ✅ arrivano al server locale quando torna la rete                                          | ❌                         |
| Prenotazioni lato personale (piantina)      | ❌                                                 | ✅ quelle già nel server                                       | ⚠️ ultima copia, modifiche in coda                             | ✅ quelle già sincronizzate                                                                | registro di carta          |
| Login del personale                         | ❌                                                 | ✅ sul server locale                                           | ⚠️ solo chi era già entrato, con token non scaduto             | ✅ credenziali copiate sul server locale                                                   | —                          |
| Aprire o ricaricare l'app                   | ❌                                                 | ✅                                                             | ✅ dal service worker                                          | ✅                                                                                         | —                          |

(¹) Molti router isolano la rete ospiti dalla rete interna: va scelto un router che permetta agli ospiti di raggiungere solo il mini-PC (**da verificare** col modello). E il telefono del cliente potrebbe passare da solo al 4G (vedi [§4.10](#410-telefoni-e-tablet-su-un-wi-fi-senza-internet)).

(²) `window.print()` usa la stampa del sistema operativo: va bene una stampante USB o di rete locale (AirPrint/IPP), non una che stampa via cloud.

(³) Nel flusso della pilota (ritiro al banco) il tavolo non si chiede (`customerAsksTable` in [`ordering.ts`](../src/features/restaurant/utils/ordering.ts)): i QR sui tavoli non servono. Il QR contiene `window.location.origin` ([`tableQr.ts:15`](../src/features/orders/utils/tableQr.ts)), cioè l'indirizzo da cui l'amministratore li ha stampati.

---

## 4. Problemi tecnici di questo codice e come risolverli

### 4.1 Numero d'ordine

Oggi il numero lo assegna il backend (API.md: "Il numero d'ordine è assegnato dal backend") e la cassa lo mostra e lo stampa solo dalla risposta ([`NewOrder.tsx:184`](../src/pages/Cashier/NewOrder.tsx)).

- **A e C:** un solo server assegna i numeri, nessun doppione. Da decidere: il numero riparte ogni serata? da quale valore? API.md non lo dice.
- **B:** più casse offline generano numeri da sole → doppioni. Soluzioni: una **serie per cassa** (cassa 1: 1000–1999, cassa 2: 2000–2999) che lascia `orderNumber: number` com'è; oppure un prefisso ("A12"), che però cambia il tipo in stringa e tocca `PickupBoard`, la ricerca (`matchesSearch`), il bigliettino, `/pronti`. In più serve un identificativo dell'ordine generato sul dispositivo per non duplicarlo all'invio.
- **C:** gli ordini nati in cloud (telefoni col 4G) prendono numeri da una serie separata da quelli del server locale.
- **D:** la carta usa una serie che l'app non assegna mai (es. dal 5001).

### 4.2 La cucina vede solo gli ordini pagati, in ordine di `paidAt`

Pagando prima (`paysBeforeKitchen`) la cucina vede solo ordini pagati, in ordine di `paidAt` impostato dal server ([`kitchen.ts`](../src/features/kitchen/utils/kitchen.ts), API.md "Modalità di ordine").

- **A e C:** nessun problema: pagamento e cucina passano dallo stesso server.
- **B:** l'ordine fatto offline è già pagato in contanti, ma il server lo vedrebbe pagato solo all'invio della coda → `paidAt` sbagliato e coda della cucina fuori ordine. Il backend dovrebbe accettare `createdAt`/`paidAt` dal dispositivo per gli ordini sincronizzati (solo da cassa e gestori, con un limite, es. stessa giornata). Resta che la cucina non li vede finché non tornano online.
- **C:** un ordine pagato online mentre il server locale è scollegato arriva in cucina in ritardo: per questo il cloud deve sospendere gli ordini dal telefono quando non sente il server locale.

### 4.3 Token JWT e `hasSession()`

[`hasSession()`](../src/services/auth/session.ts) rifiuta il token se `exp` è passato secondo l'**orologio del dispositivo**; [`ProtectedRoute`](../src/components/ProtectedRoute.tsx) manda allora a `/login`, e il login richiede il backend. [`useCurrentUser`](../src/hooks/useAuth.ts) richiama `/api/auth/me` all'apertura: se fallisce per la rete l'utente resta quello salvato (solo un `401` chiude la sessione), bene.

- **A e C:** il login funziona in locale. Il token deve durare almeno un'intera serata (es. 12–24 h, da decidere) così nessuno viene buttato fuori nel momento di punta; attenzione agli orologi sbagliati dei tablet ([§4.9](#49-lora-del-server-e-dei-dispositivi)).
- **B:** senza rete il login è impossibile: token valido per tutto l'evento o un endpoint di rinnovo usato quando c'è rete; mai rimandare a `/login` mentre si è offline con ordini in coda.

### 4.4 Timeout di 15 s, `401` e ordini doppi

In [`httpClient.ts`](../src/services/client/httpClient.ts): ogni richiesta si interrompe dopo 15 s; un `401` con token cancella la sessione e fa `location.replace("/login")`, che ricarica la pagina e perde tutto ciò che è solo in memoria (in Nuovo ordine il carrello è `useState`).

- Con il 4G che "va e viene" una richiesta può arrivare al server ma la risposta perdersi: la cassa riprova e crea **due ordini**. Serve una **chiave di idempotenza** (un `clientOrderId` casuale nel corpo o un'intestazione `Idempotency-Key`): stesso valore → stesso ordine e stessa risposta. Utile in A, indispensabile in B e C. Va generata con `crypto.getRandomValues` (come già fa [`staffForm.ts:43`](../src/features/staff/utils/staffForm.ts)), non con `crypto.randomUUID`, che su `http://192.168.x.x` non c'è.
- **A:** il server locale risponde in millisecondi: il timeout scatta solo con un Wi-Fi debole. Basta un messaggio chiaro ("server non raggiungibile") al posto del `Loader` che blocca la cassa.
- **B:** distinguere "rete assente" (errore di `fetch` o timeout) da un `HttpError`; la coda va salvata (IndexedDB) e un `401` durante la sincronizzazione deve chiedere il login senza buttare la coda.

### 4.5 React Query e azioni fatte offline

Verificato nel sorgente della versione installata (5.104.3): l'`onlineManager` parte "online" e cambia solo con gli eventi `online`/`offline` del browser; le mutazioni hanno `networkMode: "online"`. Quindi:

- dispositivo che perde il Wi-Fi → la mutazione resta `isPending` con `isPaused: true`, senza errore: in Nuovo ordine il `Loader` resta a tutto schermo finché la rete non torna (**da provare** sul campo);
- Wi-Fi collegato ma senza internet (il caso tipico) → il browser si crede online, la richiesta fallisce o va in timeout → errore;
- la cache è solo in memoria: ricaricando la pagina si perde tutto, anche le mutazioni in pausa.

**A:** basta gestire i due stati nell'interfaccia (avviso invece del `Loader` che blocca). **B:** persistenza della cache (`@tanstack/react-query-persist-client` con un persister IndexedDB), `setMutationDefaults` per poter riprendere le mutazioni dopo un ricaricamento (`resumePausedMutations`), oppure, più controllabile per gli ordini, una coda propria con gli identificativi del §4.4 (dettagli **da verificare** sulla documentazione della versione usata).

### 4.6 Content-Security-Policy e `netlify.toml`

[`netlify.toml:11`](../netlify.toml) ha `connect-src 'self' https:`, `upgrade-insecure-requests` e HSTS. Vale solo per il sito servito da Netlify.

- **A:** il mini-PC manda le sue intestazioni. Se si copia la CSP, **togliere `upgrade-insecure-requests`**: su una pagina `http://192.168.1.10` il browser trasformerebbe in `https://` anche le richieste allo stesso sito (`/assets/…`, `/api/…`) e non si caricherebbe niente. HSTS su `http` viene ignorata: inutile mandarla. `connect-src 'self'` basta (API sulla stessa origine).
- **B:** la CSP attuale va bene (il service worker è sulla stessa origine, `worker-src` ricade su `script-src 'self'`); quando il dominio del backend è definitivo, restringere `https:` come già previsto.
- **C:** regola semplice: **ogni pagina parla solo col server che l'ha servita** (`VITE_API_URL` vuoto). Una pagina servita da Netlify non deve chiamare il mini-PC: la CSP lo bloccherebbe (`http`), il browser pure (contenuto misto), e Chrome chiede un permesso per le richieste da un sito pubblico verso indirizzi della rete locale ("Local Network Access", in versione stabile da Chrome 142 secondo fonti non ufficiali: **da verificare**).

### 4.7 HTTPS in rete locale

Un "contesto sicuro" è una pagina `https://` oppure `http://localhost`/`127.0.0.1`. **`http://192.168.x.x` non lo è.** Cosa comporta, controllato sulle API del browser che il codice usa oggi:

| API                                                         | Su `http://192.168.x.x`                    | Dove nel codice                                                          | Conseguenza                                                            |
| ----------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `fetch`, `localStorage`, `sessionStorage`, `window.print()` | ✅                                         | ovunque                                                                  | nessuna                                                                |
| `crypto.getRandomValues`                                    | ✅                                         | [`staffForm.ts:43`](../src/features/staff/utils/staffForm.ts)            | nessuna                                                                |
| `navigator.vibrate`                                         | ✅ (Android; iOS non lo supporta comunque) | [`PickupStatus.tsx`](../src/features/orders/components/PickupStatus.tsx) | nessuna                                                                |
| Screen Wake Lock (`navigator.wakeLock`)                     | ❌ solo contesti sicuri (MDN)              | [`PickupScreen.tsx`](../src/pages/PickupScreen.tsx), con `?.` e `catch`  | `/pronti` non tiene acceso lo schermo: disattivare lo standby della TV |
| Service worker, installazione PWA                           | ❌                                         | non usati oggi                                                           | l'opzione B su IP locale non è possibile                               |
| `crypto.randomUUID`, `crypto.subtle`                        | ❌                                         | non usati oggi                                                           | non introdurli nel codice che deve girare in locale                    |

Quindi **A funziona su `http`** con il codice di oggi. Il prezzo è che le password del personale viaggiano in chiaro sul Wi-Fi: si mitiga con la password WPA2/WPA3 sulla rete "Sagra-Staff" e una rete ospiti separata (da accettare consapevolmente per la pilota).

Se in futuro serve HTTPS in locale (C con nome unico, o B):

- **Dominio proprio + certificato Let's Encrypt con verifica DNS** (non serve che il mini-PC sia raggiungibile da fuori) per un nome come `cassa.miasagra.it`, più un **DNS locale** che risponda `192.168.1.10` (router che permette nomi personalizzati, oppure dnsmasq sul mini-PC). Funziona senza internet finché il certificato è valido; il rinnovo (ogni 90 giorni o meno: Let's Encrypt sta accorciando la durata, **da verificare**) va fatto quando c'è rete. Attenzione ai router con "protezione DNS rebinding", che bloccano nomi pubblici che puntano a IP privati.
- **Autorità di certificazione propria** (es. mkcert) installata su ogni dispositivo: fattibile per i tablet del personale (su iOS serve installare un profilo e abilitarne la fiducia nelle impostazioni, **da verificare** per versione), impossibile per i telefoni dei clienti.
- Nomi `.local` (mDNS): supporto non uniforme sui telefoni Android, **da verificare**; meglio l'IP fisso.

### 4.8 Un solo locale per backend

Il contratto non ha l'identificativo del locale nei percorsi (`/api/restaurant`, `/api/menu`, `/api/orders`): un backend = una sagra.

- **A:** va benissimo, un mini-PC per sagra.
- **B e C (cloud):** per più sagre servono o un deploy per sagra (semplice, più costoso da gestire) o il multi-tenant con l'identificativo nel percorso (`/api/r/:slug/…`), nel sottodominio o nel token. Cambia il contratto e `httpClient`.

### 4.9 L'ora del server e dei dispositivi

Molte regole dipendono dall'ora del **server**: ordini sul posto solo negli orari di apertura (altrimenti `400`), menù del giorno, asporto, `paidAt`/`readyAt`. Senza internet il mini-PC non sincronizza l'orologio: se è sbagliato rifiuta gli ordini come "locale chiuso" o mostra il menù di un altro giorno. Un Raspberry Pi senza batteria dell'orologio riparte con l'ora vecchia. Servono un mini-PC con orologio a batteria, fuso `Europe/Rome` e un controllo all'apertura.

Anche i tablet contano: [`NewOrder.tsx`](../src/pages/Cashier/NewOrder.tsx) decide "aperto/chiuso" con l'ora del dispositivo (`isOpenNow`) e `hasSession()` confronta `exp` con `Date.now()`. Utile più avanti: ora del server in `GET /api/health` e un avviso se il dispositivo è sfasato.

### 4.10 Telefoni e tablet su un Wi-Fi senza internet

Android e iOS si accorgono che il Wi-Fi "non ha internet" e possono mandare il traffico sui dati mobili: allora il mini-PC risulta irraggiungibile o a tratti (**da verificare** sui dispositivi usati). Per il personale: tablet solo Wi-Fi o dati mobili spenti, e rispondere "Mantieni la connessione" se il telefono lo chiede. Per i clienti non lo si può controllare: è un motivo in più per non basare la pilota sugli ordini dal telefono.

### 4.11 Altri dettagli

- **Pezzi caricati a richiesta:** `CashierHome`, `CashierLogin` e `PickupScreen` sono `React.lazy` ([`App.tsx`](../src/App.tsx)): con il sito in cloud un tablet che non li ha ancora aperti non li carica senza rete. In A li serve il mini-PC; in B vanno messi tutti nella cache del service worker.
- **Dati del cliente per origine:** l'ultimo ordine del cliente è salvato in `localStorage` (12 h, [`storedOrder.ts`](../src/features/orders/utils/storedOrder.ts)) per indirizzo: chi ordina su `http://192.168.1.10` non lo ritrova aprendo il sito in cloud. In C si risolve col nome unico.
- **Copertura Wi-Fi:** con molti telefoni dei clienti la rete del personale va tenuta separata (meglio sulla banda 5 GHz); dove si può, cavo per cassa e mini-PC.

---

## 5. Cosa cambia in `API.md` e nel backend

Proposte, da applicare a [`API.md`](../API.md) quando si sceglie l'opzione.

### Con A (server locale)

- **Nuova sezione "Installazione in rete locale":** il backend gira senza servizi esterni; serve anche il sito (`dist/`) con il ritorno a `index.html` per i percorsi non `/api`; intestazioni di sicurezza per `http` (CSP senza `upgrade-insecure-requests`, niente HSTS); ora e giorno dall'orologio del server (`Europe/Rome`); database in un file con backup a fine serata.
- **Convenzioni generali:** "Base URL vuoto = il sito è servito dallo stesso server" diventa il caso normale; CORS non serve.
- **Ordini:** regola per il numero (riparte ogni serata? da quale valore?) e una serie riservata alla carta che il backend non assegna mai (es. ≥ 5001).
- **`POST /api/orders` e `POST /api/order`:** campo facoltativo `clientOrderId` (o intestazione `Idempotency-Key`): stesso valore entro la serata → nessun nuovo ordine, stessa risposta.
- **Login:** durata minima del token (es. una serata intera).
- **Facoltativo:** `GET /api/health` pubblica → `{ "serverTime": "…" }` per l'indicatore "collegato" e il controllo dell'ora; `GET /api/orders/export` (gestori) per gli incassi della serata.

### Con B (cloud + offline-first), in più

- `clientOrderId` **obbligatorio** negli ordini del personale.
- `orderNumber` scelto dal dispositivo dentro la serie della sua cassa (il backend controlla che sia libero: `409`), oppure numero con prefisso (cambia il tipo `Order.orderNumber`).
- `createdAt`/`paidAt` dal dispositivo per gli ordini fatti offline (`offline: true`), accettati solo da cassa e gestori, entro la giornata; il controllo degli orari di apertura e del menù va fatto su `createdAt`, non sull'ora di arrivo.
- Facoltativo `POST /api/orders/batch` per svuotare la coda in una volta.
- Rinnovo del token (`POST /api/auth/refresh`) o token valido per tutto l'evento.
- Regole sui conflitti per cucina e banco (es. comanda già ritirata: `409`, ultima scrittura vince o rifiuto).

### Con C (ibrido), in più rispetto ad A

- Due backend con **lo stesso contratto** verso il frontend (cloud e locale), più un'API di sincronizzazione tra loro che il frontend non usa: il locale scarica (`GET /api/sync/pull?since=…`: ordini dai telefoni, conferme di pagamento, prenotazioni, configurazione) e carica (`POST /api/sync/push`: stati e incassi), autenticato con una chiave del dispositivo.
- `RestaurantProfile`: un campo tipo `phoneOrdersOpen: boolean` (o `localServer: "online" | "offline"`) perché il sito dei clienti sospenda gli ordini dal telefono quando il cloud non sente il server locale.
- `Order.source: "local" | "cloud"` e serie di numeri separate.
- Identificativo del locale nei percorsi del cloud (multi-tenant, [§4.8](#48-un-solo-locale-per-backend)).
- Il webhook del pagamento online resta sul cloud; il locale riceve `paid`/`paidAt` dalla sincronizzazione.

### Con D (carta)

- Nessuna modifica necessaria. Facoltativo più avanti: registrare dopo gli ordini di carta (es. `POST /api/orders` con `source: "carta"` e già consegnati) perché entrino negli incassi **senza** finire in cucina: oggi un ordine pagato creato dalla cassa andrebbe in coda alla cucina.

---

## 6. Raccomandazione per la sagra pilota

**A (server locale) + D (procedura su carta).** Motivi:

1. **Il flusso della pilota sta tutto dentro la sagra.** "Paga prima + ritiro al banco" è cassa → cucina → banco → `/pronti`: tutti dispositivi nella stessa area. Internet non aggiunge niente di essenziale: si paga alla cassa, i numeri si chiamano sullo schermo.
2. **Risponde all'obiezione principale** del panel e del board (il 4G che "va e viene") con il modello che gli organizzatori già conoscono dai concorrenti (SagraGo, SagraFacile Locale, StandFacile).
3. **Costa poco in sviluppo.** Il backend va scritto comunque: scriverlo per girare su un mini-PC (un processo + SQLite) non costa molto di più; il frontend resta com'è (stessa origine, `http` sufficiente). Il contratto "un locale per backend" va già bene.
4. **B non risolve il problema**: la cucina resterebbe cieca senza rete. **C** è l'evoluzione giusta, ma solo quando servono davvero ordini dal 4G e pagamento online.
5. **D è obbligatoria comunque**: il mini-PC è un punto unico di guasto, e il board l'ha posta come condizione.

**Cosa fare per la pilota, in ordine:**

1. Scrivere il backend pensato per girare in locale (un processo, SQLite, serve anche `dist/`), con numeri d'ordine unici per serata e chiave di idempotenza.
2. Pacchetto d'installazione e comando di backup.
3. Kit: mini-PC o portatile, router, gruppo di continuità, cavi; IP fisso; foglio con l'indirizzo e il QR.
4. Piccoli ritocchi al frontend (non bloccanti): avviso "server non raggiungibile" invece del `Loader` che blocca la cassa; ora del server visibile.
5. Procedura su carta scritta, busta d'emergenza pronta, prova col personale.
6. Prova generale sul posto: copertura Wi-Fi, stampanti, TV; "stacca internet" (non deve cambiare niente) e "spegni il mini-PC" (si passa alla carta e si torna).

**Da rimandare a dopo la pilota:** ordini dal telefono dei clienti col loro 4G e pagamento online (C); sincronizzazione col cloud e più sagre sullo stesso cloud; HTTPS in locale con dominio e DNS; PWA e coda offline (B), che serviranno al massimo per far sopravvivere la cassa a un guasto del Wi-Fi; registrazione a posteriori degli ordini di carta.

---

## 7. Punti aperti

**Da decidere con il fondatore:**

- Chi compra e chi possiede il kit (comodato del fornitore o acquisto della sagra) e chi lo monta dopo la pilota.
- Nella pilota i clienti ordinano dal proprio telefono? Con A solo sul Wi-Fi della sagra (rete ospiti, router adatto). Più semplice: `orderingMode: "menuOnly"`, ordini solo alla cassa, e `/pronti` per i numeri.
- Serve che il menù sia visibile da casa durante la pilota? Se sì serve un pezzo di cloud (primo passo verso C) o una pagina statica a parte.
- Numeri d'ordine: ripartono ogni serata? Da quale valore? Quale serie per la carta?
- `http` in chiaro sulla rete del personale accettabile per la pilota?
- Stack del backend: deve girare bene su un mini-PC (es. Node o Go + SQLite) e installarsi con un comando.
- Scontrino fiscale (fuori perimetro): se la sagra usa un registratore telematico, la procedura su carta deve dire come si emette lo scontrino durante il buco (molti registratori lavorano offline e trasmettono dopo: **da verificare** col modello).

**Da verificare sul campo o nella documentazione:**

- Comportamento di Android/iOS su un Wi-Fi senza internet (passaggio automatico ai dati mobili).
- Copertura Wi-Fi dell'area (cassa, cucina, banco, TV) e isolamento della rete ospiti del router scelto.
- Browser della TV per `/pronti` (versione, standby) oppure chiavetta HDMI / vecchio portatile.
- Il `Loader` di Nuovo ordine con una mutazione in pausa (§4.5).
- Prezzi dell'hardware al momento dell'acquisto.

---

## Fonti

- Codice di questo repository (file citati sopra) e [`API.md`](../API.md); React Query 5.104.3 in `node_modules/@tanstack/query-core` (`onlineManager.ts`, `mutation.ts`).
- MDN, [Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API): disponibile solo in contesti sicuri.
- TanStack Query, [Network Mode](https://tanstack.com/query/v5/docs/framework/react/guides/network-mode): modalità predefinita `online`.
- Chrome for Developers, [Local Network Access](https://developer.chrome.com/blog/local-network-access) (giugno 2025); versione stabile di rilascio da verificare sulle note di Chrome.
- Concorrenti (SagraGo, SagraFacile, StandFacile, Cassa in Cloud, MySagra): ricerca della sessione precedente sui siti dei fornitori.
