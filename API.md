# API di Ristosagra

Contratto tra il frontend (questo repository) e il backend: tutti gli endpoint chiamati dall'app, i dati che si aspetta e le regole che oggi sono simulate dai dati finti (`VITE_MOCKING=true`) e che il backend dovrà implementare.

Le chiamate sono definite in `src/features/<feature>/api/*.ts` e `src/services/api/auth.ts`; i tipi in `src/features/<feature>/types/` e `src/types/menuOrder.ts`. Se si modifica un endpoint, aggiornare anche questo file.

---

## Convenzioni generali

| Voce | Valore |
|---|---|
| Base URL | `VITE_API_URL` (es. `https://tuo-backend.railway.app`). Vuoto = stessa origine; in sviluppo Vite inoltra `/api` a `http://localhost:8080` |
| Formato | JSON (`Content-Type: application/json`), UTF-8. Il frontend invia `Content-Type` solo nelle richieste con corpo |
| Autenticazione | `Authorization: Bearer <token>` sulle chiamate del personale; ogni endpoint indica i [ruoli](#personale-e-ruoli) ammessi (colonna **Accesso**), gli altri ricevono `403` |
| Orari | Stringa `"HH:MM"` 24 ore (es. `"20:30"`) |
| Date | ISO 8601 (es. `"2026-10-15T19:42:00.000Z"`) |
| Prezzi e totali | Numero in euro con decimali (es. `6.5`), non in centesimi |
| Risposte senza corpo | Ammesse (`204 No Content` o corpo vuoto) dove indicato "nessun corpo" |
| Timeout | Il frontend interrompe le richieste dopo **15 s** |

### Errori

Il frontend guarda solo lo **status HTTP**, il corpo degli errori viene ignorato.

| Status | Comportamento del frontend |
|---|---|
| 2xx | Successo |
| 401 | Se la richiesta aveva un token: sessione scaduta → cancella il token e torna a `/login`. Sul login: "Credenziali errate" |
| 403 | Sul login: "Credenziali errate". Altrove: errore generico |
| altri 4xx | Errore mostrato all'utente, nessun nuovo tentativo |
| 5xx / rete | Le letture vengono ritentate fino a 2 volte; le scritture no |

### CORS

Se backend e frontend stanno su domini diversi, il backend deve consentire l'origine del frontend con i metodi `GET, POST, PATCH, DELETE` e gli header `Authorization, Content-Type`.

---

## Riepilogo endpoint

**Pubblica** = usata dai clienti senza login. Le altre richiedono il token e sono ammesse solo per i [ruoli](#personale-e-ruoli) indicati: **gestori** = `admin` (titolare) e `deputy` (vice amministratore), `cashier` (cassa), `waiter` (cameriere), `chef` (capo cucina), `kitchen` (cucina), `counter` (banco ritiro); **personale** = tutti i ruoli.

| Metodo | Percorso | Accesso | Sezione |
|---|---|---|---|
| POST | `/api/auth/login` | pubblica | [Login](#login) |
| GET | `/api/auth/me` | personale | [Login](#login) |
| GET | `/api/staff` | gestori | [Personale](#personale-e-ruoli) |
| POST | `/api/staff` | gestori | [Personale](#personale-e-ruoli) |
| PATCH | `/api/staff/:id` | gestori | [Personale](#personale-e-ruoli) |
| DELETE | `/api/staff/:id` | gestori | [Personale](#personale-e-ruoli) |
| GET | `/api/restaurant` | pubblica | [Ristorante](#ristorante) |
| PATCH | `/api/restaurant` | gestori | [Ristorante](#ristorante) |
| GET | `/api/menu` | pubblica | [Menù](#menù) |
| POST | `/api/menu` | gestori | [Menù](#menù) |
| PATCH | `/api/menu` | gestori | [Menù](#menù) |
| POST | `/api/order` | pubblica | [Ordini](#ordini) |
| POST | `/api/orders` | gestori, cashier, waiter | [Ordini](#ordini) |
| GET | `/api/orders` | gestori, cashier, chef, kitchen, counter | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/payment` | gestori, cashier | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/items` | gestori, cashier | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/ready` | gestori, chef, kitchen | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/delivered` | gestori, cashier, chef, counter | [Ritiro al banco](#ritiro-al-banco) |
| GET | `/api/pickup-board` | pubblica | [Ritiro al banco](#ritiro-al-banco) |
| POST | `/api/orders/:id/tickets` | gestori, chef | [Cucina](#cucina-e-smistamento) |
| DELETE | `/api/orders/:id/tickets/:ticketId` | gestori, chef | [Cucina](#cucina-e-smistamento) |
| PATCH | `/api/orders/:id/tickets/:ticketId/ready` | gestori, chef, kitchen | [Cucina](#cucina-e-smistamento) |
| GET | `/api/takeaway/settings` | pubblica | [Asporto](#impostazioni-asporto) |
| PATCH | `/api/takeaway/settings` | gestori | [Asporto](#impostazioni-asporto) |
| GET | `/api/reservations/availability` | pubblica | [Prenotazioni](#prenotazioni) |
| POST | `/api/reservations` | pubblica | [Prenotazioni](#prenotazioni) |
| GET | `/api/reservations` | gestori, waiter | [Prenotazioni](#prenotazioni) |
| PATCH | `/api/reservations/:id` | gestori, waiter | [Prenotazioni](#prenotazioni) |
| DELETE | `/api/reservations/:id` | gestori, waiter | [Prenotazioni](#prenotazioni) |
| GET | `/api/floor-plan` | gestori, cashier, waiter | [Piantina](#piantina) |
| POST | `/api/floor-plan` | gestori, waiter | [Piantina](#piantina) |

> ⚠️ L'ordine inviato dal cliente usa `/api/order` (singolare, pubblica); `POST /api/orders` (plurale) è l'ordine creato dal personale, con il token. Se si cambiano i percorsi, aggiornare anche `src/features/orders/api/orders.ts`.

---

## Login

### `POST /api/auth/login` — pubblica

Il frontend non invia il token su questa chiamata.

Richiesta:

```json
{ "username": "cassa", "password": "••••••" }
```

Risposta `200`:

```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": "s-12", "name": "Cassa 1", "role": "cashier" }
}
```

- Credenziali errate **o persona con `enabled: false`**: `200` con `{ "success": false }` **oppure** `401`/`403`.
- `user` ([`SessionUser`](#sessionuser)): chi è entrato. Il frontend lo usa solo per decidere quali pagine mostrare; se manca lo chiede con `GET /api/auth/me`.
- Username confrontato senza distinguere maiuscole e minuscole.
- Il token viene salvato e inviato come `Bearer`. Se è un JWT con `exp`, il frontend considera scaduta la sessione dopo quella data.
- Non esiste un endpoint di logout: il frontend cancella token e utente da solo. Se serve invalidarlo lato server, va aggiunto.
- Limiti nel form: username max 100 caratteri, password max 200.

### `GET /api/auth/me` — personale

Risposta `200`: [`SessionUser`](#sessionuser) di chi ha il token. Il frontend la chiama all'apertura dell'area del personale (e quando la finestra torna in primo piano), così nome e ruolo cambiati dall'amministratore valgono subito.

- Persona eliminata o con `enabled: false`: `401` (il frontend chiude la sessione e torna al login). Lo stesso `401` va dato da **tutte** le chiamate con il suo token.

---

## Personale e ruoli

Il titolare (`admin`) decide chi lavora nel ristorante, con quale ruolo, username e password, e se può accedere. Può nominare dei **vice amministratori** (`deputy`) con i suoi stessi poteri. Titolare e vice sono i **gestori**. Ognuno vede solo le pagine del suo ruolo, adattate alle impostazioni del ristorante:

| Ruolo | `role` | Pagine | Note |
|---|---|---|---|
| Amministratore | `admin` | Profilo (impostazioni, personale, menù), Piantina, Nuovo ordine, Ordini, Cucina | Uno solo, sempre attivo |
| Vice amministratore | `deputy` | Come il titolare | Nominato ed eliminabile solo dal titolare |
| Cassa | `cashier` | Nuovo ordine, Ordini (lista e conti per tavolo) | Crea ordini al bancone e incassa |
| Cameriere | `waiter` | Piantina (prenotazioni ai tavoli), Nuovo ordine | Ordini solo sul posto, con tavolo obbligatorio, da pagare alla cassa (`paid: false`); solo col pagamento a fine pasto |
| Capo cucina | `chef` | Cucina (smistamento e postazioni) | Manda le comande alle postazioni |
| Cucina | `kitchen` | Cucina (le postazioni) | Prepara le comande e le segna pronte |
| Banco ritiro | `counter` | Ritiro | Col ritiro al banco: chiama i numeri pronti e consegna gli ordini (la pagina Ritiro la vedono anche gestori, cassa e capo cucina) |

- Solo i gestori modificano tavoli e muri della piantina; i camerieri gestiscono le prenotazioni ai tavoli.
- Con `orderingMode: "payOnline"` nessuno crea ordini (Nuovo ordine nascosto) e gli Ordini sono in sola lettura.
- Pagando prima di mangiare (`paymentTiming: "beforeMeal"`, tipo sagra) i camerieri non prendono ordini e la cassa non ha i conti per tavolo (vedi [Modalità di ordine](#modalità-di-ordine)).
- **Il frontend nasconde soltanto**: il backend deve controllare il ruolo su ogni chiamata (colonna **Accesso** del [riepilogo](#riepilogo-endpoint)) e rispondere `403` agli altri.

### `GET /api/staff` — gestori

Risposta `200`: [`StaffMember[]`](#staffmember), **senza password**.

### `POST /api/staff` — gestori

Richiesta: [`NewStaffMember`](#newstaffmember). Risposta `200`: lo [`StaffMember`](#staffmember) creato (con `id`).

```json
{
  "name": "Giulia",
  "role": "waiter",
  "username": "giulia",
  "password": "jyVmaHvdyQ",
  "enabled": true
}
```

### `PATCH /api/staff/:id` — gestori

Richiesta: solo i campi cambiati ([`StaffUpdate`](#staffupdate)); `password` solo se l'amministratore ne ha scritta una nuova. Risposta `200`: lo [`StaffMember`](#staffmember) aggiornato.

### `DELETE /api/staff/:id` — gestori

Risposta: nessun corpo richiesto.

Regole (simulate dai dati finti in `src/features/staff/mock/staff.ts`):

- `username` unico senza distinguere maiuscole e minuscole: altrimenti `409` (il frontend mostra "username già usato"). 3–40 caratteri tra lettere, numeri, `.`, `-` e `_`.
- `password` 8–200 caratteri; va salvata **solo come hash** (bcrypt/argon2) e non restituita mai.
- `name` 1–60 caratteri; `role` tra quelli ammessi.
- Un solo `admin`: non si crea un secondo titolare, e il titolare non si può eliminare, bloccare (`enabled: false`) o cambiare di ruolo (`403`).
- Il **titolare** gestisce tutti e lui solo dà o toglie il ruolo `deputy` ed elimina i vice.
- Un **vice** gestisce `cashier`, `waiter`, `chef` e `kitchen` (creare, modificare, bloccare, eliminare, assegnare uno di questi ruoli); di se stesso può cambiare solo nome, username e password; non può toccare il titolare né gli altri vice (`403`).
- Nessuno cambia il proprio ruolo o il proprio accesso, né elimina se stesso.
- Cambiando password, ruolo o `enabled` conviene invalidare le sessioni aperte di quella persona.
- `id` stringa, codificato con `encodeURIComponent` nei percorsi.

---

## Ristorante

### `GET /api/restaurant` — pubblica

Profilo mostrato a cassa e clienti (nome nella home, tema e colore di tutto il sito, giorni e orari di apertura, come ordinano i clienti).

Risposta `200`: [`RestaurantProfile`](#restaurantprofile)

```json
{
  "name": "Sagra del Borgo",
  "theme": "dark",
  "brandColor": "orange",
  "openingHours": {
    "mon": {
      "open": true,
      "lunch": { "open": false, "from": "12:00", "to": "15:00" },
      "dinner": { "open": true, "from": "19:00", "to": "23:00" }
    },
    "tue": { "open": false, "lunch": { … }, "dinner": { … } },
    …
  },
  "orderingMode": "payAtCashier",
  "paymentTiming": "afterMeal",
  "tableOrdering": true,
  "tableQrCode": true,
  "serviceMode": "counter",
  "pickupCall": "screen",
  "kitchenDispatch": true,
  "kitchenStations": [
    { "id": "st-primi", "name": "Primi" },
    { "id": "st-griglia", "name": "Griglia" }
  ]
}
```

- `openingHours` (vedi [`WeeklyHours`](#weeklyhours)): il frontend accetta prenotazioni solo per oggi, negli orari di apertura di oggi e per un orario non ancora passato. Gli stessi giorni e servizi valgono per l'[asporto](#impostazioni-asporto).
- `orderingMode`, `paymentTiming`, `tableOrdering`, `tableQrCode`: cosa possono fare i clienti dal sito e quando pagano, vedi [Modalità di ordine](#modalità-di-ordine).
- `serviceMode`, `pickupCall`: l'ordine si porta al tavolo o si ritira al banco, vedi [Ritiro al banco](#ritiro-al-banco).
- `kitchenDispatch`, `kitchenStations`: come lavora la cucina, vedi [Cucina e smistamento](#cucina-e-smistamento).

### `PATCH /api/restaurant` — gestori

Richiesta: solo i campi modificati (uno o più di `name`, `theme`, `brandColor`, `openingHours`, `orderingMode`, `paymentTiming`, `tableOrdering`, `tableQrCode`, `serviceMode`, `pickupCall`, `kitchenDispatch`, `kitchenStations`). `kitchenStations` si invia sempre completo; con `kitchenDispatch: true` serve almeno una postazione, con nomi (max 30) presenti e diversi; gli `id` delle postazioni nuove li genera il frontend (`"st-<timestamp>"`) e il backend li conserva. `openingHours` si invia sempre completo (tutti e 7 i giorni).

```json
{ "theme": "light" }
```

Risposta `200`: il [`RestaurantProfile`](#restaurantprofile) completo aggiornato (il frontend lo usa al posto di quello in memoria).

---

## Menù

### `GET /api/menu` — pubblica

Risposta `200`: [`Dish[]`](#dish). Array vuoto se il menù non è ancora configurato.

- **L'ordine dell'array conta**: le categorie compaiono nell'ordine del loro primo piatto e i piatti nell'ordine dell'array. Il backend deve conservarlo.

### `POST /api/menu` — gestori

Usata quando il menù è vuoto (primo salvataggio). Richiesta: `Dish[]` con **tutti** i piatti.

### `PATCH /api/menu` — gestori

Usata quando il menù esiste già. Richiesta: `Dish[]` con il **menù completo** (sostituisce quello precedente: i piatti assenti sono stati eliminati).

Per entrambe:

- Risposta `200`: `Dish[]` salvati, che il frontend usa come nuovo menù.
- **I piatti nuovi hanno `id` negativo** (`-1`, `-2`, …), provvisorio: il backend deve assegnare l'id definitivo e restituirlo nella risposta.
- Validare lato server: `name` 1–80 caratteri, `description` max 300, `category` max 40, `price` tra 0 e 10000 (centesimi), `allergens` solo valori dell'[elenco ufficiale](#allergeni).

---

## Ordini

### Modalità di ordine

Il ristorante sceglie nel profilo ([`RestaurantProfile`](#restaurantprofile)) cosa possono fare i clienti dal sito. Il frontend si adatta, il backend deve far rispettare le stesse regole.

| `orderingMode` | Clienti | Cassa |
|---|---|---|
| `"menuOnly"` | Vedono solo il menù, senza carrello | Crea gli ordini con [`POST /api/orders`](#post-apiorders--gestori-cashier-waiter) e incassa |
| `"payAtCashier"` | Ordinano dal sito ([`POST /api/order`](#post-apiorder--pubblica)) e pagano alla cassa | Segna gli ordini come pagati; può anche crearli |
| `"payOnline"` | Ordinano e pagano dal sito ([pagamento online](#pagamento-online)) | Vede gli ordini in **sola lettura** (niente pagamento, modifiche o nuovi ordini) |

Quando si paga alla cassa (`menuOnly` e `payAtCashier`) conta anche `paymentTiming`:

| `paymentTiming` | Come funziona | Cucina | Cassa |
|---|---|---|---|
| `"afterMeal"` (tipo ristorante) | Si ordina al tavolo (cameriere o telefono) e si paga a fine pasto | Vede subito ogni ordine | Vista **Conti** per tavolo |
| `"beforeMeal"` (tipo sagra) | Si ordina dal telefono o alla cassa e si paga subito, poi ci si siede | Vede l'ordine **solo dopo il pagamento**, in ordine di pagamento (`paidAt`) | Stampa il **bigliettino** col numero da dare al cliente; niente conti per tavolo |

- Tipo sagra il cliente non sa ancora dove si siederà: il sito non chiede il tavolo e i camerieri non prendono ordini. Il numero d'ordine (bigliettino e telefono del cliente) è quello con cui gli si porta l'ordine o lo si chiama.
- Anche con `payOnline` la cucina vede solo gli ordini pagati.
- `tableOrdering: true` (solo con `payOnline` o con `payAtCashier` a fine pasto): il cliente che mangia sul posto ordina seduto e l'ordine riporta il suo tavolo (`table`, obbligatorio). Con `false` gli ordini sul posto non hanno tavolo.
- `tableQrCode: true` (solo con `tableOrdering`): il tavolo non lo scrive il cliente, arriva dal QR code sul tavolo. L'amministratore stampa i QR code dal profilo, uno per tavolo della [piantina](#piantina) che ha un nome; ognuno apre il sito su `/?tavolo=<nome del tavolo>` (es. `/?tavolo=T-3`, codificato come parametro URL). Il frontend lo ricorda finché la scheda è aperta e lo toglie dall'indirizzo. Senza QR inquadrato il cliente non può ordinare sul posto (può ancora fare asporto).
- Il QR code si può falsificare: se serve, il backend può verificare che `table` sia il nome di un tavolo della piantina.

### `POST /api/order` — pubblica

Ordine inviato dal cliente. Richiesta: [`NewOrder`](#neworder)

```json
{
  "type": "dinein",
  "customerName": "Mario Rossi",
  "table": "T-3",
  "items": [ … ]
}
```

```json
{
  "type": "takeaway",
  "customerName": "Mario Rossi",
  "pickupTime": "19:30",
  "items": [
    {
      "quantity": 2,
      "dish": {
        "id": 3,
        "name": "Tortelli di zucca",
        "description": "Burro e salvia",
        "price": 9.5,
        "category": "Primi",
        "allergens": ["Glutine", "Uova", "Latte"]
      }
    }
  ]
}
```

- Regole (il frontend le rispetta, il backend deve rifiutare il resto, es. `400`/`403`):
  - con `orderingMode: "menuOnly"` i clienti non possono ordinare: `403`;
  - `customerName` obbligatorio (1–60 caratteri) per ogni ordine;
  - sul posto (`type: "dinein"`): `table` obbligatorio (1–20 caratteri) se `tableOrdering` è `true`, altrimenti assente; niente `pickupTime`;
  - asporto: solo se l'asporto è attivo ([`enabled`](#impostazioni-asporto)); niente `table`. `pickupTime` non deve essere già passato e deve riguardare un servizio (pranzo o cena) in cui il locale è aperto oggi. Con `mode: "fixed"` deve essere l'orario unico di quel servizio, con `mode: "custom"` deve stare nella sua fascia.
- Risposta `200`: [`OrderCreated`](#ordercreated)
  - pagamento alla cassa: `{ "orderNumber": 112 }` — numero da mostrare alla cassa;
  - pagamento online: `{ "orderNumber": 112, "checkoutUrl": "https://checkout.…" }`, vedi sotto.
- **Il backend non deve fidarsi dei prezzi inviati**: totale e prezzi vanno ricalcolati dal menù salvato usando `dish.id` e `quantity`. Verificare anche che i piatti esistano e che `quantity` sia un intero > 0.
- Il numero d'ordine è assegnato dal backend (i dati finti partono da 100 e incrementano).

### Pagamento online

Con `orderingMode: "payOnline"` il frontend non tocca mai i dati di pagamento: usa la pagina di pagamento di un servizio esterno (es. Stripe Checkout, SumUp, Satispay), che va integrato **nel backend**.

1. `POST /api/order`: il backend salva l'ordine con `paid: false`, crea il pagamento presso il servizio per il **totale ricalcolato** e risponde con `checkoutUrl`, la pagina dove pagare (deve essere `https`).
2. Il frontend manda il cliente su `checkoutUrl`. Il carrello resta salvato finché il pagamento non va a buon fine.
3. Il servizio rimanda il cliente al sito: su `https://<sito>/?pagamento=ok` se ha pagato, su `https://<sito>/?pagamento=annullato` se ha annullato (indirizzi da configurare nel backend). Con `ok` il frontend svuota il carrello e mostra il numero d'ordine come pagato; con `annullato` torna al carrello.
4. **L'ordine diventa `paid: true` solo quando il backend riceve la conferma dal servizio** (webhook o verifica lato server), mai per il ritorno su `?pagamento=ok`, che chiunque può aprire.

- Gli ordini non pagati restano in `GET /api/orders` con `paid: false` (la cassa li vede come "Non pagato"); il backend può cancellarli dopo un po' se il pagamento non arriva.
- Nei dati finti non c'è un servizio di pagamento: l'ordine è subito pagato e `checkoutUrl` è `/?pagamento=ok` (stesso sito).
- Il frontend accetta solo `checkoutUrl` `https` o dello stesso sito.

### `POST /api/orders` — gestori, cashier, waiter

Ordine creato dal personale (modalità `menuOnly` e `payAtCashier`): dalla cassa per un cliente al bancone o dal cameriere al tavolo. Richiesta: [`CashierOrder`](#cashierorder)

```json
{
  "type": "dinein",
  "customerName": "Rossi",
  "table": "T-3",
  "paid": true,
  "items": [ … ]
}
```

- `customerName` e `table` facoltativi; per l'asporto `customerName` è obbligatorio e `pickupTime` facoltativo (la cassa non controlla gli orari).
- `paid`: `true` se il cliente ha già pagato (predefinito nella cassa). Solo gestori e `cashier` incassano: per il `waiter` deve essere `false`.
- `waiter`: solo `type: "dinein"` con `table` obbligatorio, e solo col pagamento a fine pasto (`paymentTiming: "afterMeal"`), altrimenti `403`.
- Risposta `200`: `{ "orderNumber": 114 }`. Stesse verifiche su piatti, prezzi e totale di `POST /api/order`.
- Con `orderingMode: "payOnline"` rifiutare (`403`).

### `GET /api/orders` — gestori, cashier, chef, kitchen, counter

Risposta `200`: [`Order[]`](#order). Il frontend la ripete ogni **30 s** (la cucina ogni **10 s**).

- La cassa ha anche la vista **Conti**: gli ordini sul posto non pagati raggruppati per `table` (quelli senza tavolo uno per uno), con i piatti e il totale da incassare; "Incassa" chiama `PATCH /api/orders/:id/payment` su ognuno.

### `PATCH /api/orders/:id/ready` — gestori, chef, kitchen

La cucina segna la comanda pronta (`{ "ready": true }`) o la rimette da preparare (`{ "ready": false }`). Risposta: nessun corpo richiesto.

- Il backend imposta `readyAt` (ora del server) con `true` e lo toglie con `false`.
- Usata solo **senza smistamento**; con lo smistamento `readyAt` lo calcola il backend dalle comande delle postazioni (vedi [Cucina e smistamento](#cucina-e-smistamento)).
- La cucina vede gli ordini senza `readyAt` da chi ha ordinato per primo; se si paga prima (online o tipo sagra) solo quelli pagati, in ordine di `paidAt`.

### `PATCH /api/orders/:id/payment` — gestori, cashier

Segna l'ordine come pagato o da pagare. Richiesta: `{ "paid": true }`. Risposta: nessun corpo richiesto.

- Il backend imposta `paidAt` (ora del server) la prima volta che l'ordine diventa pagato e lo toglie se torna da pagare: tipo sagra la cucina lavora in ordine di pagamento.

- Con `orderingMode: "payOnline"` il frontend non la usa (sola lettura): il backend dovrebbe rifiutarla (`403`).

### `PATCH /api/orders/:id/items` — gestori, cashier

Modifica i piatti di un ordine da asporto. Richiesta: `{ "items": CartType[] }` con l'elenco **completo** dei piatti dopo la modifica. Risposta: nessun corpo richiesto.

- Il backend deve ricalcolare `total` (il frontend lo legge da `GET /api/orders`).
- Con `orderingMode: "payOnline"` il frontend non la usa (sola lettura): il backend dovrebbe rifiutarla (`403`).

---

## Cucina e smistamento

Senza smistamento (`kitchenDispatch: false`) chi è in cucina vede tutte le comande e segna pronto l'ordine intero con [`PATCH /api/orders/:id/ready`](#patch-apiordersidready--gestori-chef-kitchen).

Con lo smistamento (`kitchenDispatch: true` e almeno una postazione in `kitchenStations`) le comande arrivano al **capo cucina** (`chef`, e ai gestori), che le manda alle postazioni (es. Primi, Griglia, Bar): l'ordine intero o solo alcune righe, a postazioni diverse. Vede quante comande ha in coda ogni postazione per non sovraccaricarne nessuna. Ogni postazione (`kitchen`, scelta sul dispositivo) vede solo le sue comande, da chi ha ordinato per primo, e le segna pronte.

Le parti mandate stanno in `Order.tickets` ([`StationTicket`](#stationticket)); le righe sono indicate dal loro indice in `items`.

### `POST /api/orders/:id/tickets` — gestori, chef

Manda alcune righe dell'ordine a una postazione. Richiesta:

```json
{ "stationId": "st-griglia", "items": [1, 4] }
```

Risposta `200`: lo [`StationTicket`](#stationticket) creato (con `id` e `sentAt`).

- `stationId` deve essere una postazione di `kitchenStations`; `items` non vuoto, indici esistenti e non già mandati ad altre postazioni: altrimenti `400`.

### `DELETE /api/orders/:id/tickets/:ticketId` — gestori, chef

Ritira una comanda non ancora pronta (es. mandata alla postazione sbagliata): le sue righe tornano da smistare. Risposta: nessun corpo richiesto.

### `PATCH /api/orders/:id/tickets/:ticketId/ready` — gestori, chef, kitchen

La postazione segna pronta la sua comanda (`{ "ready": true }`) o la rimette da preparare (`{ "ready": false }`). Risposta: nessun corpo richiesto.

Regole (simulate dai dati finti in `src/features/orders/mock/orders.ts`):

- Il backend imposta `readyAt` della comanda; l'ordine diventa pronto (`readyAt` dell'ordine = l'ultima comanda pronta) quando **tutte** le sue righe sono state mandate e **tutte** le sue comande sono pronte, e torna da preparare se una comanda viene rimessa da preparare o ritirata.
- Modificando i piatti di un ordine ([`PATCH /api/orders/:id/items`](#patch-apiordersiditems--gestori-cashier)) le comande già mandate non valgono più: il backend le cancella e l'ordine torna da smistare.
- Se una postazione viene tolta da `kitchenStations`, le sue comande vanno cancellate (il frontend le ignora e ne rimostra le righe da smistare).
- `ticketId` stringa, codificato con `encodeURIComponent` nei percorsi.

---

## Ritiro al banco

Con `serviceMode: "counter"` il cliente ritira l'ordine al banco quando il suo numero è pronto (con `"table"` glielo portano al tavolo). Come si avvisa lo sceglie `pickupCall`:

- `"screen"`: lo **schermo Pronti** (pagina pubblica `/pronti` del sito, da aprire su una TV o un monitor) mostra i numeri in preparazione e quelli pronti, con l'ultimo in evidenza; si aggiorna ogni 5 s e tiene lo schermo acceso.
- `"voice"`: chi è al banco chiama i numeri a voce leggendoli dalla pagina **Ritiro**.

In entrambi i casi il telefono del cliente (pagina col suo numero) mostra "In preparazione" o "Pronto: ritiralo al banco" e vibra quando è pronto. Chi è al banco (pagina **Ritiro**: ruolo `counter`, gestori, cassa e capo cucina) vede gli ordini pronti con i piatti e li segna consegnati. Se si paga prima (online o tipo sagra) valgono solo gli ordini pagati, come per la cucina.

### `GET /api/pickup-board` — pubblica

Risposta `200`: [`PickupBoard`](#pickupboard), **solo numeri d'ordine** (niente nomi né piatti: è pubblica).

```json
{ "preparing": [110, 111, 108], "ready": [105, 109, 101] }
```

- `preparing`: ordini non pronti e non consegnati, da chi ha ordinato per primo; `ready`: pronti non consegnati, dall'ultimo pronto.
- Con `serviceMode: "table"`: `404` (lo schermo mostra "non attivo").
- Il frontend la ripete ogni **5 s** (schermo e telefono dei clienti): conviene una risposta leggera e cacheabile per qualche secondo.

### `PATCH /api/orders/:id/delivered` — gestori, cashier, chef, counter

Ordine consegnato al cliente (`{ "delivered": true }`) o di nuovo da consegnare (`{ "delivered": false }`, per rimediare a un errore). Risposta: nessun corpo richiesto.

- Il backend imposta `deliveredAt` (ora del server) e lo toglie con `false`; un ordine consegnato sparisce dal tabellone.

---

## Impostazioni asporto

### `GET /api/takeaway/settings` — pubblica

Risposta `200`: [`TakeawaySettings`](#takeawaysettings)

```json
{
  "enabled": true,
  "mode": "fixed",
  "fixedTimes": { "lunch": "12:30", "dinner": "19:30" },
  "ranges": {
    "lunch": { "from": "12:00", "to": "14:30" },
    "dinner": { "from": "19:00", "to": "22:30" }
  }
}
```

- `enabled: false`: niente asporto, in nessun giorno (i clienti non lo vedono e la cassa non lo propone); gli orari restano salvati per quando si riattiva. Rifiutare gli ordini da asporto (`400`).
- **Giorni e servizi**: l'asporto non ha una settimana sua, segue quella del locale ([`RestaurantProfile.openingHours`](#weeklyhours)). Si ritira a pranzo solo nei giorni in cui il locale è aperto a pranzo, a cena solo in quelli aperti a cena. Se oggi non resta un servizio ancora prenotabile il frontend non propone l'asporto.
- `mode: "fixed"`: chi ordina ritira all'orario unico del servizio, `fixedTimes.lunch` o `fixedTimes.dinner` (`ranges` viene ignorato). Il frontend usa il primo servizio aperto di oggi il cui orario unico non è ancora passato.
- `mode: "custom"`: il cliente sceglie l'orario (`pickupTime` dell'ordine) dentro `ranges.lunch` o `ranges.dinner`, solo per i servizi aperti oggi (`fixedTimes` viene ignorato).

### `PATCH /api/takeaway/settings` — gestori

Richiesta: `TakeawaySettings` completo. Risposta `200`: `TakeawaySettings` salvato.

---

## Prenotazioni

I clienti prenotano posti senza vedere la piantina; il personale (amministratore e camerieri) poi le "sistema" sui tavoli (vedi [Piantina](#piantina)).

### `GET /api/reservations/availability` — pubblica

Risposta `200`: `{ "remainingSeats": 14 }`. Il frontend la ripete ogni **30 s**; sotto 10 posti mostra al cliente quanti ne restano.

Calcolo (oggi fatto dai dati finti in `src/features/reservations/mock/reservations.ts`):

```
remainingSeats = max(0, sedie libere in piantina − persone delle prenotazioni non ancora sistemate)
```

- **Sedie libere**: tutte le sedie di tutti i tavoli senza `booking`.
- **Prenotazioni non sistemate**: quelle il cui `id` non compare come `booking.id` su nessuna sedia.

### `POST /api/reservations` — pubblica

Richiesta: [`NewReservation`](#newreservation)

```json
{
  "name": "Colombo",
  "people": 4,
  "arrivalTime": "20:00",
  "seatRequests": ["highchair"],
  "notes": "Se possibile vicino all'uscita"
}
```

- `seatRequests` e `notes` sono facoltativi (assenti se vuoti).
- Risposta `200`: la [`Reservation`](#reservation) creata, con `id` (stringa) e `createdAt`; il frontend la usa per la conferma al cliente.
- **Se i posti non bastano** (`people > remainingSeats`) rispondere con un errore (es. `409`): il cliente vede "Non ci sono più abbastanza posti liberi".
- Validare: `name` 1–60 caratteri, `people` intero ≥ 1, `arrivalTime` `HH:MM` dentro gli orari di apertura di oggi ([`openingHours`](#weeklyhours)) e non già passato, `notes` max 200, `seatRequests` solo [valori ammessi](#seatrequest).

### `GET /api/reservations` — gestori, waiter

Risposta `200`: [`Reservation[]`](#reservation). Il frontend la ripete ogni **15 s** per vedere quelle nuove.

### `PATCH /api/reservations/:id` — gestori, waiter

Richiesta: campi modificati; oggi il frontend invia sempre:

```json
{ "name": "Colombo", "people": 5, "arrivalTime": "20:15" }
```

Risposta `200`: la [`Reservation`](#reservation) aggiornata.

### `DELETE /api/reservations/:id` — gestori, waiter

Risposta: nessun corpo richiesto. Il frontend toglie poi la prenotazione dalla piantina e la salva.

L'`id` nei percorsi è codificato con `encodeURIComponent`.

---

## Piantina

La piantina è un unico documento JSON con tavoli, sedie (e relative prenotazioni) e muri. Il backend può salvarla così com'è; l'unica parte che deve leggere è `chairs[].booking` (per i posti disponibili).

### `GET /api/floor-plan` — gestori, cashier, waiter

Risposta `200`: [`FloorPlanData`](#floorplandata), oppure `null` se non è ancora stata creata.

- La cassa la legge solo per suggerire i nomi dei tavoli in Nuovo ordine (e l'amministratore per i QR code).

### `POST /api/floor-plan` — gestori, waiter

Richiesta: [`FloorPlanData`](#floorplandata) **completa**. Al primo salvataggio `id` è assente: lo assegna il backend.

Risposta `200`: `FloorPlanData` salvata (con `id` e `updatedAt`).

- Chiamata **spesso**: oltre al pulsante Salva della modalità Modifica, ogni volta che il personale prenota, toglie o segna come arrivati dei posti, il frontend salva automaticamente dopo circa 600 ms.
- La modalità Modifica (tavoli e muri) è solo dell'amministratore; i camerieri salvano la piantina solo per le prenotazioni. Se serve, il backend può rifiutare un `waiter` che cambia tavoli o muri (confrontando tutto tranne `chairs[].booking`).

### Come sono collegate prenotazioni e piantina

- Tutte le sedie con lo stesso `booking.id` appartengono alla stessa prenotazione.
- Prenotazione online sistemata: `booking.id` = `id` della [`Reservation`](#reservation).
- Prenotazione fatta direttamente dal personale (senza prenotazione online): `booking.id` generato dal frontend (`"b-<timestamp>"`), esiste solo nella piantina.
- `booking.seatedAt` presente = commensali arrivati e seduti.

---

## Tipi di dati

Notazione TypeScript; `?` = campo facoltativo.

### Dish

```ts
interface Dish {
  id: number;            // assegnato dal backend (negativo = nuovo, vedi Menù)
  name: string;          // max 80
  description: string;   // può essere "", max 300
  price: number;         // euro, 0–10000
  category: string;      // testo libero, max 40 (predefinite: Antipasti, Primi, Secondi, Dolci, Bevande)
  allergens?: string[];  // vedi Allergeni
}
```

### Allergeni

I 14 allergeni del Reg. UE 1169/2011, con questi testi esatti:

`Glutine`, `Crostacei`, `Uova`, `Pesce`, `Arachidi`, `Soia`, `Latte`, `Frutta a guscio`, `Sedano`, `Senape`, `Sesamo`, `Solfiti`, `Lupini`, `Molluschi`

### CartType

```ts
interface CartType {
  dish: Dish;       // piatto completo (prezzo compreso: da non usare per il totale)
  quantity: number; // intero > 0
}
```

### NewOrder

```ts
interface NewOrder {
  items: CartType[];
  type: "dinein" | "takeaway";
  customerName?: string; // max 60; obbligatorio negli ordini dei clienti
  table?: string;        // solo sul posto, max 20; obbligatorio con tableOrdering
  pickupTime?: string;   // solo asporto, "HH:MM"
}
```

### CashierOrder

```ts
interface CashierOrder extends NewOrder {
  paid: boolean; // già pagato alla cassa
}
```

### OrderCreated

```ts
interface OrderCreated {
  orderNumber: number;
  checkoutUrl?: string; // solo con pagamento online: pagina https del servizio di pagamento
}
```

### Order

```ts
interface Order {
  id: number;
  orderNumber: number;    // numero mostrato a cliente e cassa
  total: number;          // euro, calcolato dal backend
  paid: boolean;          // con pagamento online: true solo dopo la conferma del servizio di pagamento
  items: CartType[];
  createdAt: string;      // ISO 8601
  type?: "dinein" | "takeaway"; // assente = sul posto
  customerName?: string;
  table?: string;         // solo sul posto
  pickupTime?: string;    // solo asporto, "HH:MM"
  paidAt?: string;        // ISO 8601, quando è stato pagato (lo imposta il backend)
  readyAt?: string;       // ISO 8601, quando è pronto (assente = da preparare)
  tickets?: StationTicket[]; // solo con lo smistamento: parti mandate alle postazioni
  deliveredAt?: string;   // ISO 8601, col ritiro al banco: quando è stato consegnato
}
```

### PickupBoard

```ts
interface PickupBoard {
  preparing: number[]; // numeri d'ordine in cucina, da chi ha ordinato per primo
  ready: number[];     // numeri pronti da ritirare, dall'ultimo pronto
}
```

### StationTicket

```ts
interface StationTicket {
  id: string;
  stationId: string; // una delle kitchenStations
  items: number[];   // righe dell'ordine (indici in items) preparate da questa postazione
  sentAt: string;    // ISO 8601, quando il capo cucina l'ha mandata
  readyAt?: string;  // ISO 8601, quando la postazione l'ha preparata
}
```

### TakeawaySettings

```ts
interface TakeawaySettings {
  enabled: boolean;      // false = niente asporto
  mode: "fixed" | "custom";
  fixedTimes: { lunch: string; dinner: string };      // "HH:MM", usati con mode "fixed"
  ranges: { lunch: TimeRange; dinner: TimeRange };   // fasce di ritiro, usate con mode "custom"
}

interface TimeRange {
  from: string; // "HH:MM"
  to: string;   // "HH:MM", dopo from
}
```

- Validare `ranges`: `from < to` e `lunch.to ≤ dinner.from`.
- Giorni e servizi dell'asporto sono quelli di apertura del locale (vedi [Impostazioni asporto](#impostazioni-asporto)).

### WeeklyHours

Giorni e orari di apertura del locale (`RestaurantProfile.openingHours`), che valgono anche per i giorni e i servizi dell'asporto.

```ts
type WeeklyHours = Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours>;

interface DayHours {
  open: boolean;        // false = chiuso tutto il giorno
  lunch: ServiceHours;
  dinner: ServiceHours;
}

interface ServiceHours {
  open: boolean; // false = quel giorno il servizio non c'è
  from: string;  // "HH:MM"
  to: string;    // "HH:MM", dopo from (non oltre la mezzanotte)
}
```

- Un servizio è aperto solo se lo sono **sia** il giorno **sia** il servizio. Gli orari restano salvati anche da chiuso, così la cassa li ritrova quando riapre.
- Validare: tutti e 7 i giorni presenti, `from < to`, e se pranzo e cena sono entrambi aperti `lunch.to ≤ dinner.from`.
- Il giorno di "oggi" è quello dell'ora locale del ristorante (il frontend usa l'ora del dispositivo).

### SeatRequest

`"wheelchair"` (carrozzina), `"head"` (capotavola), `"highchair"` (seggiolone).

### NewReservation

```ts
interface NewReservation {
  name: string;          // max 60
  people: number;        // intero ≥ 1
  arrivalTime: string;   // "HH:MM"
  seatRequests?: ("wheelchair" | "head" | "highchair")[];
  notes?: string;        // max 200
}
```

### Reservation

```ts
interface Reservation extends NewReservation {
  id: string;        // stringa, usata anche come booking.id in piantina
  createdAt: string; // ISO 8601
}
```

### RestaurantProfile

```ts
interface RestaurantProfile {
  name: string; // max 40
  theme: "dark" | "light";
  brandColor: "orange" | "red" | "pink" | "violet" | "blue" | "teal" | "green" | "brown";
  openingHours: WeeklyHours; // giorni e orari di apertura
  orderingMode: "menuOnly" | "payAtCashier" | "payOnline"; // vedi Modalità di ordine
  paymentTiming: "afterMeal" | "beforeMeal"; // pagando alla cassa: tipo ristorante o tipo sagra
  tableOrdering: boolean;    // i clienti ordinano dal tavolo e indicano il tavolo
  tableQrCode: boolean;      // il tavolo arriva dal QR code (solo con tableOrdering)
  serviceMode: "table" | "counter"; // portato al tavolo o ritiro al banco
  pickupCall: "screen" | "voice";  // col banco: schermo Pronti o chiamata a voce
  kitchenDispatch: boolean;  // le comande passano dal capo cucina alle postazioni
  kitchenStations: KitchenStation[];
}

interface KitchenStation {
  id: string;   // "st-<timestamp>", generato dal frontend
  name: string; // max 30, diverso dalle altre postazioni
}
```

### SessionUser

```ts
interface SessionUser {
  id: string;
  name: string;  // max 60
  role: "admin" | "deputy" | "cashier" | "waiter" | "chef" | "kitchen" | "counter";
}
```

### StaffMember

```ts
interface StaffMember extends SessionUser {
  username: string; // 3–40, lettere/numeri/._-, unico (senza distinguere maiuscole)
  enabled: boolean; // false = non può accedere
}
```

### NewStaffMember

```ts
interface NewStaffMember extends Omit<StaffMember, "id"> {
  password: string; // 8–200, da salvare solo come hash
}
```

### StaffUpdate

```ts
type StaffUpdate = Partial<NewStaffMember>; // solo i campi cambiati; password solo se va cambiata
```

### FloorPlanData

```ts
interface FloorPlanData {
  id?: string;        // assegnato dal backend
  tables: TableData[];
  walls: WallData[];
  updatedAt?: string; // ISO 8601, impostato dal backend
}

interface TableData {
  id: string;
  name?: string;      // es. "T-1", max 20
  x: number;          // centro del tavolo (coordinate della piantina)
  y: number;
  size: number;       // posti per cui è dimensionato il tavolo
  shape: "round" | "rect";
  heads?: 0 | 1 | 2;  // capotavola compresi (solo rect)
  rotation?: 0 | 90 | 180 | 270;
  groupId?: string;   // tavoli uniti hanno lo stesso groupId
  blockedSides: ("top" | "right" | "bottom" | "left")[]; // lati attaccati ad altri tavoli
  chairs: Chair[];
}

interface Chair {
  side: "top" | "right" | "bottom" | "left" | "round";
  offset: number;     // round: angolo in gradi; rect: posizione lungo il lato (circa -1…1)
  booking?: ChairBooking; // assente = posto libero
}

interface ChairBooking {
  id: string;           // = Reservation.id se viene da una prenotazione online
  name: string;
  seatedAt?: string;    // ISO 8601, commensali arrivati
  wheelchair?: boolean; // posto per carrozzina (capotavola)
  arrivalTime?: string; // "HH:MM"
}

interface WallData {
  id: string;
  points: { x: number; y: number }[]; // spezzata; muro chiuso = primo e ultimo punto uguali
}
```

Esempio ridotto:

```json
{
  "id": "floor-plan-1",
  "updatedAt": "2026-10-15T18:00:00.000Z",
  "tables": [
    {
      "id": "t-1",
      "name": "T-1",
      "x": 180,
      "y": 160,
      "size": 4,
      "shape": "round",
      "blockedSides": [],
      "chairs": [
        { "side": "round", "offset": 0, "booking": { "id": "r-1700000000101", "name": "Colombo", "arrivalTime": "20:00" } },
        { "side": "round", "offset": 90 },
        { "side": "round", "offset": 180, "booking": { "id": "r-1700000000101", "name": "Colombo", "arrivalTime": "20:00" } },
        { "side": "round", "offset": 270 }
      ]
    }
  ],
  "walls": [
    { "id": "w-1", "points": [{ "x": 80, "y": 80 }, { "x": 720, "y": 80 }] }
  ]
}
```

---

## Da fare lato backend (sicurezza)

- Ricalcolare prezzi e totali degli ordini dal menù salvato (mai dai dati del client).
- Far rispettare la [modalità di ordine](#modalità-di-ordine) scelta dal ristorante anche lato server (es. niente ordini dei clienti con `menuOnly`, cassa in sola lettura con `payOnline`).
- Pagamento online: segnare gli ordini come pagati solo alla conferma del servizio di pagamento (webhook firmato o verifica server-to-server), mai dal ritorno del cliente su `?pagamento=ok`. Le chiavi del servizio restano solo nel backend.
- Validare tutti i campi con i limiti indicati sopra: quelli del frontend si possono aggirare.
- Proteggere tutte le chiamate del personale col token, controllando il ruolo (colonna **Accesso**), e limitare i tentativi di login.
- Personale: password solo come hash (bcrypt/argon2), mai restituite; persone bloccate o eliminate ricevono `401` anche con un token ancora valido.
- Valutare un cookie `httpOnly` al posto del token restituito nel corpo: richiede anche una piccola modifica a `src/services/auth/session.ts` e `credentials: "include"` nel client HTTP.
- Quando il dominio del backend è definitivo, restringere `connect-src` nella Content-Security-Policy di `netlify.toml`.
