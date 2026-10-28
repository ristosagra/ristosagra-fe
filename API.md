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
| Sagra | Ogni sagra ha un sottodominio (`<slug>.ristosagra.it`, dominio da `VITE_ROOT_DOMAIN`). Da lì il frontend manda su **ogni** chiamata `X-Sagra: <slug>`: il backend usa i dati di quella sagra. Per le chiamate del personale vale la sagra del token e deve coincidere con l'header, altrimenti `403`. Dal dominio principale (landing) e con `VITE_ROOT_DOMAIN` vuoto (una sola sagra) l'header non c'è. Vedi [Piattaforma](#piattaforma-registrazione-e-attivazione) |
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
| 402 | La sagra non è attiva (edizione non pagata o scaduta, vedi [Piattaforma](#piattaforma-registrazione-e-attivazione)): errore generico, l'interfaccia non offre quelle azioni |
| 403 | Sul login: "Credenziali errate". Altrove: errore generico |
| 409 | Sugli ordini (`POST /api/order`, `POST /api/orders`, `PATCH /api/orders/:id/items`): un piatto è [esaurito](#piatti-esauriti). Il frontend rilegge il menù e segna il piatto da togliere |
| altri 4xx | Errore mostrato all'utente, nessun nuovo tentativo |
| 5xx / rete | Le letture vengono ritentate fino a 2 volte; le scritture no |

### CORS

Se backend e frontend stanno su domini diversi, il backend deve consentire l'origine del frontend (il dominio principale e tutti i sottodomini delle sagre) con i metodi `GET, POST, PATCH, DELETE` e gli header `Authorization, Content-Type, X-Sagra`. Per via di `X-Sagra` anche le GET pubbliche hanno la richiesta preliminare (preflight): rispondere con `Access-Control-Max-Age` alto (es. `86400`). Con l'API sotto lo stesso dominio del sito (proxy di Netlify su `/api/*`) il preflight non c'è.

---

## Riepilogo endpoint

**Pubblica** = usata dai clienti senza login. Le altre richiedono il token e sono ammesse solo per i [ruoli](#personale-e-ruoli) indicati: **gestori** = `admin` (titolare) e `deputy` (vice amministratore), `cashier` (cassa), `headWaiter` (caposala), `waiter` (cameriere), `chef` (capo cucina), `kitchen` (cucina), `counter` (banco ritiro); **personale** = tutti i ruoli.

| Metodo | Percorso | Accesso | Sezione |
|---|---|---|---|
| POST | `/api/auth/login` | pubblica | [Login](#login) |
| GET | `/api/auth/me` | personale | [Login](#login) |
| GET | `/api/signup/slug/:slug` | pubblica (dominio principale) | [Piattaforma](#piattaforma-registrazione-e-attivazione) |
| POST | `/api/signup` | pubblica (dominio principale) | [Piattaforma](#piattaforma-registrazione-e-attivazione) |
| GET | `/api/billing` | gestori | [Piattaforma](#piattaforma-registrazione-e-attivazione) |
| PATCH | `/api/billing` | gestori | [Piattaforma](#piattaforma-registrazione-e-attivazione) |
| POST | `/api/billing/checkout` | gestori | [Piattaforma](#piattaforma-registrazione-e-attivazione) |
| GET | `/api/staff` | gestori | [Personale](#personale-e-ruoli) |
| POST | `/api/staff` | gestori | [Personale](#personale-e-ruoli) |
| PATCH | `/api/staff/:id` | gestori | [Personale](#personale-e-ruoli) |
| DELETE | `/api/staff/:id` | gestori | [Personale](#personale-e-ruoli) |
| GET | `/api/restaurant` | pubblica | [Ristorante](#ristorante) |
| PATCH | `/api/restaurant` | gestori | [Ristorante](#ristorante) |
| GET | `/api/menu` | pubblica | [Menù](#menù) |
| GET | `/api/menus` | gestori | [Menù](#menù) |
| PATCH | `/api/menus` | gestori | [Menù](#menù) |
| PATCH | `/api/menu/:dishId/sold-out` | gestori, cashier, chef | [Piatti esauriti](#piatti-esauriti) |
| POST | `/api/order` | pubblica | [Ordini](#ordini) |
| POST | `/api/orders` | gestori, cashier, headWaiter, waiter | [Ordini](#ordini) |
| GET | `/api/orders` | gestori, cashier, headWaiter, chef, kitchen, counter | [Ordini](#ordini) |
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
| GET | `/api/reservations` | gestori, headWaiter, waiter | [Prenotazioni](#prenotazioni) |
| PATCH | `/api/reservations/:id` | gestori, headWaiter, waiter | [Prenotazioni](#prenotazioni) |
| DELETE | `/api/reservations/:id` | gestori, headWaiter, waiter | [Prenotazioni](#prenotazioni) |
| GET | `/api/floor-plan` | gestori, cashier, headWaiter, waiter | [Piantina](#piantina) |
| POST | `/api/floor-plan` | gestori, headWaiter, waiter | [Piantina](#piantina) |

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
- Sul sottodominio di una sagra (`X-Sagra`) lo username si cerca **solo tra il personale di quella sagra**: `cassa`, `cucina`… si ripetono tra sagre diverse. Il titolare registrato dalla piattaforma ha come username la sua email.

---

## Piattaforma: registrazione e attivazione

Ristosagra serve più sagre. Il dominio principale (`VITE_ROOT_DOMAIN`, es. `ristosagra.it`) ha la presentazione, la registrazione (`/registrati`) e l'accesso (`/accedi`); ogni sagra vive su `<slug>.ristosagra.it` con il sito dei clienti, `/login`, `/dashboard` e `/pronti`. Ogni chiamata dal sottodominio porta `X-Sagra: <slug>` (vedi [Convenzioni](#convenzioni-generali)).

Flusso: registrazione → pagamento dell'edizione (€99, valida 12 mesi, nessun rinnovo automatico) → login della sagra. Una sagra registrata ma non pagata si può preparare (vedi sotto) ma non va online.

### `GET /api/signup/slug/:slug` — pubblica, dominio principale

Risposta `200`: `{ "available": true }` se `<slug>.ristosagra.it` si può registrare. `false` anche per indirizzi non validi o riservati.

- Indirizzo valido: 3–30 caratteri `a-z0-9-`, non inizia né finisce con `-`. Riservati (elenco minimo, il backend può averne altri): `www`, `demo`, `api`, `app`, `admin`, `mail`, `assets`, `static`.
- Il frontend la chiama mentre si scrive (dopo 400 ms senza modifiche): limitare i tentativi per IP.

### `POST /api/signup` — pubblica, dominio principale

Il frontend non invia il token. Richiesta: [`SignupRequest`](#signuprequest).

```json
{
  "restaurantName": "Sagra del Pesce",
  "slug": "sagra-del-pesce",
  "owner": { "name": "Anna Rossi", "email": "anna@esempio.it", "phone": "+39 333 1234567", "password": "••••••••" },
  "billing": {
    "holder": "Pro Loco di Ponte",
    "taxCode": "01234567890",
    "sdiCode": "0000000",
    "address": { "street": "Via Roma 1", "zip": "37100", "city": "Verona", "province": "VR" }
  }
}
```

Risposta `200`: [`SignupResponse`](#signupresponse) `{ "slug": "sagra-del-pesce", "checkoutUrl": "https://checkout.…" }`.

- Il backend crea la sagra **non attiva**, il titolare (`role: "admin"`, username = `owner.email`, password salvata come hash) e i dati per la fattura, poi il pagamento dell'edizione (vedi [Pagamento dell'edizione](#pagamento-delledizione)) e risponde con la sua pagina.
- Regole (le stesse del form, `features/platform/utils/signupForm.ts`): nome della sagra 1–40 caratteri; slug come sopra; nome del titolare 1–60; email valida (max 254); telefono 6–20 caratteri tra cifre, spazi e `+`; password 8–200; intestatario 1–100; `taxCode` 11 cifre o 16 caratteri alfanumerici; `sdiCode` facoltativo, 7 caratteri; `pec` facoltativa, email valida; via 1–100; CAP 5 cifre; comune 1–60; provincia 2 lettere. Altrimenti `400`.
- `409`: indirizzo già preso (il frontend lo mostra sul campo dell'indirizzo). La stessa email può registrare più sagre.
- Limitare i tentativi per IP.
- **Dati finti**: ogni sottodominio ha il suo `localStorage`, quindi `checkoutUrl` è subito la login della nuova sagra (`http://<slug>.localhost:5199/login?attivazione=ok`) con i dati della registrazione nel frammento `#mock-signup=…`, che i dati finti di quella sagra leggono al primo caricamento (`src/mock/signupHandoff.ts`). Il frammento non arriva mai a un server.

### Pagamento dell'edizione

Come il [pagamento online](#pagamento-online) degli ordini, integrato **nel backend** (es. Stripe Checkout): il frontend non tocca mai i dati di pagamento.

1. `POST /api/signup` o `POST /api/billing/checkout` creano il pagamento di €99 presso il servizio e rispondono con `checkoutUrl` (`https`).
2. Il servizio rimanda a `https://<slug>.ristosagra.it/login?attivazione=ok` se ha pagato, a `?attivazione=annullata` se ha annullato. La login mostra l'esito e, con una sessione già aperta, passa all'area del personale.
3. **La sagra diventa attiva solo quando il backend riceve la conferma dal servizio** (webhook firmato), mai per il ritorno su `?attivazione=ok`, che chiunque può aprire. Il frontend, dopo un ritorno `ok`, ricontrolla `GET /api/restaurant` ogni 5 s per circa 2 minuti mostrando "Pagamento in verifica…".
4. Alla conferma: `paidUntil = max(adesso, paidUntil) + 12 mesi`; `active = paidUntil > adesso`. Nessun rinnovo automatico: alla scadenza la sagra torna non attiva e i dati restano.

### Sagra non attiva

Con `active: false` (registrata ma non pagata, o scaduta):

| Chi | Cosa può fare |
|---|---|
| Titolare e vice (gestori) | Preparano la sagra: profilo, menù, personale, piantina, fatturazione, `GET /api/orders` (riepilogo). Nel frontend vedono solo Profilo e Piantina e un invito ad attivarla |
| Altri ruoli | Possono fare il login, ma ogni altra chiamata riceve `402`; nel frontend non hanno pagine |
| Clienti | Il sito e `/pronti` dicono "Questa sagra non è ancora online" |

Il backend rifiuta con **`402`**, anche per i gestori: `POST /api/order`, `POST /api/orders`, tutte le modifiche agli ordini (`PATCH /api/orders/:id/…`, comande `POST`/`DELETE`/`PATCH /api/orders/:id/tickets…`) e `POST /api/reservations`.

### `GET /api/billing` — gestori

Risposta `200`: [`Billing`](#billing)

```json
{
  "active": true,
  "paidUntil": "2027-10-28T10:00:00.000Z",
  "details": {
    "holder": "Pro Loco di Ponte",
    "taxCode": "01234567890",
    "address": { "street": "Via Roma 1", "zip": "37100", "city": "Verona", "province": "VR" }
  }
}
```

### `PATCH /api/billing` — gestori

Richiesta: [`BillingDetails`](#billingdetails) completo, stesse regole della registrazione (altrimenti `400`). Risposta `200`: [`Billing`](#billing).

### `POST /api/billing/checkout` — gestori

Corpo vuoto (`{}`). Risposta `200`: `{ "checkoutUrl": "https://checkout.…" }`, vedi [Pagamento dell'edizione](#pagamento-delledizione). `409` se la sagra è già attiva.

- **Dati finti**: l'edizione si attiva subito e `checkoutUrl` è `/login?attivazione=ok` (stesso sito). Senza sottodominio (`VITE_ROOT_DOMAIN` vuoto: demo e sviluppo) la sagra è sempre attiva; un sottodominio aperto senza registrazione (es. `prova.localhost`) parte non attivo, con le credenziali di prova.

---

## Personale e ruoli

Il titolare (`admin`) decide chi lavora nel ristorante, con quale ruolo, username e password, e se può accedere. Può nominare dei **vice amministratori** (`deputy`) con i suoi stessi poteri. Titolare e vice sono i **gestori**. Ognuno vede solo le pagine del suo ruolo, adattate alle impostazioni del ristorante:

| Ruolo | `role` | Pagine | Note |
|---|---|---|---|
| Amministratore | `admin` | Profilo (impostazioni, personale, menù), Piantina, Nuovo ordine, Ordini, Cucina | Uno solo, sempre attivo |
| Vice amministratore | `deputy` | Come il titolare | Nominato ed eliminabile solo dal titolare |
| Cassa | `cashier` | Nuovo ordine, Ordini (lista e conti per tavolo) | Crea ordini al bancone e incassa; segna i [piatti esauriti](#piatti-esauriti) |
| Caposala | `headWaiter` | Piantina (prenotazioni ai tavoli), Nuovo ordine, Cucina in sola lettura (anche lo smistamento) | Come il cameriere per gli ordini; in cucina vede cosa è pronto e cosa manca ma non segna né smista nulla (niente `PATCH` della cucina) |
| Cameriere | `waiter` | Piantina (prenotazioni ai tavoli), Nuovo ordine | Ordini solo sul posto, con tavolo obbligatorio, da pagare alla cassa (`paid: false`); solo col pagamento a fine pasto |
| Capo cucina | `chef` | Cucina (smistamento e postazioni) | Manda le comande alle postazioni; serve solo con lo smistamento (`kitchenDispatch`); segna i [piatti esauriti](#piatti-esauriti) |
| Cucina | `kitchen` | Cucina (le postazioni) | Prepara le comande e le segna pronte |
| Banco ritiro | `counter` | Ritiro | Col ritiro al banco: chiama i numeri pronti e consegna gli ordini (la pagina Ritiro la vedono anche gestori, cassa e capo cucina). Se l'ordine si porta al tavolo e l'asporto è attivo diventa **Banco ritiro asporto**: stesso ruolo e stesse credenziali, consegna solo l'asporto (vedi [Ritiro al banco](#ritiro-al-banco)) |

- Un ruolo che con le impostazioni del ristorante non serve (capo cucina senza smistamento, banco ritiro senza ritiro al banco né asporto) il frontend non lo propone a chi crea o modifica una persona; chi lo ha già lo tiene, ma non ha pagine. Il backend lo rifiuta (`400`), anche per il titolare.
- Solo i gestori modificano tavoli e muri della piantina; caposala e camerieri gestiscono le prenotazioni ai tavoli.
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
- Un **vice** gestisce `cashier`, `headWaiter`, `waiter`, `chef`, `kitchen` e `counter` (creare, modificare, bloccare, eliminare, assegnare uno di questi ruoli); di se stesso può cambiare solo nome, username e password; non può toccare il titolare né gli altri vice (`403`).
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
  "brandColor": "#e8712a",
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
  "tableQrCode": true,
  "serviceMode": "counter",
  "pickupCall": "screen",
  "kitchenDispatch": true,
  "kitchenStations": [
    { "id": "st-primi", "name": "Primi" },
    { "id": "st-griglia", "name": "Griglia" }
  ],
  "active": true
}
```

- `active`: la sagra ha un'edizione pagata e non scaduta (vedi [Sagra non attiva](#sagra-non-attiva)). Si legge soltanto: `PATCH /api/restaurant` la ignora.
- `404` se la sagra di `X-Sagra` non esiste: sito dei clienti, login e `/pronti` mostrano "Questa sagra non esiste".
- `openingHours` (vedi [`WeeklyHours`](#weeklyhours)): il frontend accetta prenotazioni solo per oggi, negli orari di apertura di oggi e per un orario non ancora passato. Gli stessi giorni e servizi valgono per l'[asporto](#impostazioni-asporto).
- `orderingMode`, `paymentTiming`, `tableQrCode`: cosa possono fare i clienti dal sito e quando pagano, vedi [Modalità di ordine](#modalità-di-ordine).
- `serviceMode`, `pickupCall`: l'ordine si porta al tavolo o si ritira al banco, vedi [Ritiro al banco](#ritiro-al-banco).
- `kitchenDispatch`, `kitchenStations`: come lavora la cucina, vedi [Cucina e smistamento](#cucina-e-smistamento).
- **Modi già pronti** ("Come funziona la tua festa?" nel profilo: Sagra col ritiro al banco, Sagra con servizio al tavolo, Ristorante): esistono solo nel frontend, che con un tocco compila questi campi e `TakeawaySettings.enabled` e li salva con le chiamate di sempre (`PATCH /api/restaurant` e `PATCH /api/takeaway/settings`). Il backend non ne sa nulla.

### `PATCH /api/restaurant` — gestori

Richiesta: solo i campi modificati (uno o più di `name`, `theme`, `brandColor`, `openingHours`, `orderingMode`, `paymentTiming`, `tableQrCode`, `serviceMode`, `pickupCall`, `kitchenDispatch`, `kitchenStations`). `kitchenStations` si invia sempre completo; con `kitchenDispatch: true` serve almeno una postazione, con nomi (max 30) presenti e diversi; gli `id` delle postazioni nuove li genera il frontend (`"st-<timestamp>"`) e il backend li conserva. `openingHours` si invia sempre completo (tutti e 7 i giorni). `brandColor` è un colore esadecimale `"#rrggbb"` (qualunque: il profilo ha una tavolozza e il selettore del dispositivo); il frontend accetta ancora i vecchi nomi.

```json
{ "theme": "light" }
```

Risposta `200`: il [`RestaurantProfile`](#restaurantprofile) completo aggiornato (il frontend lo usa al posto di quello in memoria).

- Il profilo dopo la modifica deve restare valido (nome 1–40, valori ammessi, orari validi per tutti i 7 giorni, postazioni valide con lo smistamento): altrimenti `400`.

---

## Menù

Il ristorante può avere **più menù**, ognuno usato in alcuni giorni della settimana (es. "Settimana" dal lunedì al venerdì e "Weekend" il sabato e la domenica). Un giorno sta in un solo menù. Il menù che ha il giorno di oggi è quello **attivo**: lo vedono i clienti e la cassa. Un menù senza giorni resta salvato ma non si usa.

### `GET /api/menu` — pubblica

Risposta `200`: [`Dish[]`](#dish) del menù attivo oggi, con `soldOut: true` sui [piatti esauriti](#piatti-esauriti). Array vuoto se nessun menù ha il giorno di oggi (o non ci sono menù).

- "Oggi" è il giorno dell'ora locale del ristorante, come per gli [orari](#weeklyhours).
- Il frontend la ripete ogni **60 s** (clienti, cassa, cucina), per vedere presto i piatti finiti.
- **L'ordine dell'array conta**: le categorie compaiono nell'ordine del loro primo piatto e i piatti nell'ordine dell'array. Il backend deve conservarlo.

### `GET /api/menus` — gestori

Risposta `200`: [`RestaurantMenu[]`](#restaurantmenu), tutti i menù con i loro giorni e piatti, nell'ordine in cui li mostra il profilo. Array vuoto se non ce ne sono.

### `PATCH /api/menus` — gestori

Richiesta: `RestaurantMenu[]` con l'**elenco completo** dei menù (sostituisce quello salvato: menù e piatti assenti sono stati eliminati). Risposta `200`: `RestaurantMenu[]` salvati, che il frontend usa al posto di quelli in memoria.

- I menù nuovi hanno un `id` generato dal frontend (`"m-<timestamp>"`), che il backend conserva.
- **I piatti nuovi hanno `id` negativo** (`-1`, `-2`, …), provvisorio: il backend assegna l'id definitivo, **unico tra tutti i menù** (gli ordini indicano i piatti con `dish.id`), e lo restituisce. Duplicando un menù i suoi piatti arrivano come nuovi.
- `soldOut` non fa parte dei menù salvati: se arriva in questa richiesta va ignorato (gli esauriti si cambiano solo con [`PATCH /api/menu/:dishId/sold-out`](#piatti-esauriti)).
- Validare lato server (regole simulate in `src/features/menu/mock/menu.ts`), altrimenti `400`: almeno un menù; `name` 1–40 caratteri, diverso da quello degli altri menù (senza distinguere maiuscole); almeno un piatto per menù; `days` solo `"mon"`…`"sun"` e ogni giorno al massimo in un menù. Piatti: `name` 1–80 caratteri, `description` max 300, `category` max 40, `price` tra 0 e 10000, `allergens` solo valori dell'[elenco ufficiale](#allergeni).

### Piatti esauriti

Durante il servizio chi si accorge che un piatto è finito (cassa, capo cucina, titolare e vice) lo segna **esaurito** con un tocco, dal pulsante "Esauriti" di Nuovo ordine, Ordini e Cucina; con un altro tocco torna disponibile. Basta sì/no: niente quantità né scorte.

#### `PATCH /api/menu/:dishId/sold-out` — gestori, cashier, chef

Richiesta: `{ "soldOut": true }` (esaurito) o `{ "soldOut": false }` (di nuovo disponibile). Risposta: nessun corpo richiesto.

Regole (simulate dai dati finti in `src/features/menu/mock/menu.ts` e `src/features/orders/mock/orders.ts`):

- Solo un piatto del [menù di oggi](#get-apimenu--pubblica), altrimenti `404`. `dishId` è il `Dish.id` (numero).
- Gli esauriti valgono **per la giornata** in cui sono stati segnati: il giorno dopo tornano tutti disponibili da soli (una sagra rifornisce la cucina per la sera dopo, e nessuno deve ricordarsi di riaccenderli). Si salvano a parte dai menù: salvare i menù dal profilo non li cambia.
- [`GET /api/menu`](#get-apimenu--pubblica) li restituisce con `soldOut: true`: i clienti vedono "Esaurito" al posto di "Aggiungi" (anche col solo menù), la cassa non li può toccare in Nuovo ordine.
- Un ordine con un piatto esaurito si rifiuta con **`409`**: [`POST /api/order`](#post-apiorder--pubblica), [`POST /api/orders`](#post-apiorders--gestori-cashier-headwaiter-waiter) e, modificando un asporto ([`PATCH /api/orders/:id/items`](#patch-apiordersiditems--gestori-cashier)), aggiungere il piatto o aumentarne la quantità (se l'ordine lo aveva già lo si può tenere o diminuire).
- Il carrello del cliente o l'ordine in Nuovo ordine che contiene un piatto diventato esaurito lo mostra segnato, con "Togli il piatto finito", e non si invia finché non è tolto.

---

## Ordini

### Modalità di ordine

Il ristorante sceglie nel profilo ([`RestaurantProfile`](#restaurantprofile)) cosa possono fare i clienti dal sito. Il frontend si adatta, il backend deve far rispettare le stesse regole.

| `orderingMode` | Clienti | Cassa |
|---|---|---|
| `"menuOnly"` | Vedono solo il menù, senza carrello | Crea gli ordini con [`POST /api/orders`](#post-apiorders--gestori-cashier-headwaiter-waiter): gli ordini nascono già pagati (`paid: true`); a fine pasto quelli di cameriere e caposala si incassano dai **Conti** |
| `"payAtCashier"` | Ordinano dal sito ([`POST /api/order`](#post-apiorder--pubblica)) e pagano alla cassa | Segna gli ordini come pagati; può anche crearli |
| `"payOnline"` | Ordinano e pagano dal sito ([pagamento online](#pagamento-online)) | Vede in **sola lettura** solo gli ordini pagati (niente pagamento, modifiche o nuovi ordini) |

Il pagato / da pagare di ogni ordine (interruttore ed etichetta nella lista Ordini, scelta "Pagato" in Nuovo ordine) c'è solo con `payAtCashier`: con `payOnline` gli ordini sono già pagati, con `menuOnly` la cassa crea l'ordine quando il cliente paga.

Quando si paga alla cassa (`menuOnly` e `payAtCashier`) conta anche `paymentTiming`, tranne col ritiro al banco (`serviceMode: "counter"`), dove si paga **sempre prima di mangiare** (vale come `"beforeMeal"`, qualunque sia il valore salvato):

| `paymentTiming` | Come funziona | Cucina | Cassa |
|---|---|---|---|
| `"afterMeal"` (tipo ristorante) | Si ordina al tavolo (cameriere o telefono) e si paga a fine pasto | Vede subito ogni ordine | Vista **Conti** per tavolo |
| `"beforeMeal"` (tipo sagra) | Si ordina dal telefono o alla cassa e si paga subito, poi ci si siede | Vede l'ordine **solo dopo il pagamento**, in ordine di pagamento (`paidAt`) | Stampa il **bigliettino** col numero da dare al cliente; niente conti per tavolo |

- Tipo sagra (o col ritiro al banco) il cliente non sa ancora dove si siederà: il sito non chiede il tavolo, caposala e camerieri non prendono ordini e quelli della cassa non hanno né tavolo né nome. Il numero d'ordine (bigliettino e telefono del cliente) è quello con cui gli si porta l'ordine o lo si chiama.
- Anche con `payOnline` la cucina vede solo gli ordini pagati.
- Il cliente che mangia sul posto indica il tavolo (`table`, obbligatorio) quando ordina dal sito già seduto: con `payOnline`, oppure con `payAtCashier` a fine pasto e l'ordine portato al tavolo (chi serve deve sapere dove portarlo). Se si paga alla cassa prima di mangiare (tipo sagra o ritiro al banco) e con `menuOnly` gli ordini dei clienti sul posto non hanno tavolo.
- **Orari di apertura**: sul posto si ordina (clienti e personale, titolare compreso) solo mentre il locale è aperto, cioè dentro un servizio aperto di oggi ([`openingHours`](#weeklyhours)), altrimenti `400`. L'asporto si può prenotare anche prima, per un servizio di oggi non ancora finito.
- `tableQrCode: true` (solo quando l'ordine riporta il tavolo, vedi sopra): il tavolo non lo scrive il cliente, arriva dal QR code sul tavolo. L'amministratore stampa i QR code dal profilo, uno per tavolo della [piantina](#piantina) che ha un nome; ognuno apre il sito su `/?tavolo=<nome del tavolo>` (es. `/?tavolo=T-3`, codificato come parametro URL). Il frontend lo ricorda finché la scheda è aperta e lo toglie dall'indirizzo. Senza QR inquadrato il cliente non può ordinare sul posto (può ancora fare asporto).
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
  - sul posto (`type: "dinein"`): solo mentre il locale è aperto; `table` obbligatorio (1–20 caratteri) quando il cliente ordina già seduto (vedi [Modalità di ordine](#modalità-di-ordine)), altrimenti assente; niente `pickupTime`;
  - piatti: solo del [menù di oggi](#menù), `quantity` intero > 0 (nome e prezzo si prendono dal menù salvato); un piatto [esaurito](#piatti-esauriti): `409`;
  - asporto: solo se l'asporto è attivo ([`enabled`](#impostazioni-asporto)); niente `table`. `pickupTime` non deve essere già passato e deve riguardare un servizio (pranzo o cena) in cui il locale è aperto oggi. Con `mode: "fixed"` deve essere l'orario unico di quel servizio, con `mode: "custom"` deve stare nella sua fascia.
- Risposta `200`: [`OrderCreated`](#ordercreated)
  - pagamento alla cassa: `{ "orderNumber": 112 }` — numero da mostrare alla cassa;
  - pagamento online: `{ "orderNumber": 112, "checkoutUrl": "https://checkout.…" }`, vedi sotto.
- **Il backend non deve fidarsi dei prezzi inviati**: totale e prezzi vanno ricalcolati dal menù salvato usando `dish.id` e `quantity`. Verificare anche che i piatti esistano nel menù attivo oggi e che `quantity` sia un intero > 0.
- Il numero d'ordine è assegnato dal backend (i dati finti partono da 100 e incrementano).

### Pagamento online

Con `orderingMode: "payOnline"` il frontend non tocca mai i dati di pagamento: usa la pagina di pagamento di un servizio esterno (es. Stripe Checkout, SumUp, Satispay), che va integrato **nel backend**.

1. `POST /api/order`: il backend salva l'ordine con `paid: false`, crea il pagamento presso il servizio per il **totale ricalcolato** e risponde con `checkoutUrl`, la pagina dove pagare (deve essere `https`).
2. Il frontend manda il cliente su `checkoutUrl`. Il carrello resta salvato finché il pagamento non va a buon fine.
3. Il servizio rimanda il cliente al sito: su `https://<sito>/?pagamento=ok` se ha pagato, su `https://<sito>/?pagamento=annullato` se ha annullato (indirizzi da configurare nel backend). Con `ok` il frontend svuota il carrello e mostra il numero d'ordine come pagato; con `annullato` torna al carrello.
4. **L'ordine diventa `paid: true` solo quando il backend riceve la conferma dal servizio** (webhook o verifica lato server), mai per il ritorno su `?pagamento=ok`, che chiunque può aprire.

- Gli ordini non pagati restano in `GET /api/orders` con `paid: false` (la cassa non li mostra: online un ordine conta quando è pagato); il backend può cancellarli dopo un po' se il pagamento non arriva.
- Nei dati finti non c'è un servizio di pagamento: l'ordine è subito pagato e `checkoutUrl` è `/?pagamento=ok` (stesso sito).
- Il frontend accetta solo `checkoutUrl` `https` o dello stesso sito.

### `POST /api/orders` — gestori, cashier, headWaiter, waiter

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

- Valgono le regole del profilo come per i clienti, **per tutti i ruoli, titolare compreso**: sul posto solo mentre il locale è aperto; asporto solo se è attivo e oggi resta un servizio. Piatti solo del menù di oggi.
- Sul posto, a fine pasto, `table` è obbligatorio (1–20 caratteri, altrimenti `400`) e `customerName` facoltativo. Se si paga prima (tipo sagra o ritiro al banco) il tavolo non si sa ancora: il frontend non invia né `table` né `customerName` e l'ordine si porta cercando il numero del bigliettino.
- Asporto: `customerName` obbligatorio. Se i clienti ordinano dal sito (`payAtCashier`) `pickupTime` segue le stesse regole dei clienti (orario unico o dentro le fasce, non già passato); con `menuOnly` l'orario si concorda ed è facoltativo.
- `paid`: `true` se il cliente ha già pagato. Solo gestori e `cashier` incassano: per `headWaiter` e `waiter` deve essere `false`. La cassa sceglie pagato o da pagare solo con `payAtCashier` a fine pasto; con `menuOnly` o se si paga prima (tipo sagra, ritiro al banco) deve essere `true`, altrimenti `400`.
- `headWaiter` e `waiter`: solo `type: "dinein"` con `table` obbligatorio, e solo col pagamento a fine pasto (`paymentTiming: "afterMeal"`), altrimenti `403`.
- Risposta `200`: `{ "orderNumber": 114 }`. Stesse verifiche su piatti, prezzi e totale di `POST /api/order` (piatto [esaurito](#piatti-esauriti): `409`).
- Con `orderingMode: "payOnline"` rifiutare (`403`).

### `GET /api/orders` — gestori, cashier, headWaiter, chef, kitchen, counter

Risposta `200`: [`Order[]`](#order). Il frontend la ripete ogni **30 s** (la cucina ogni **10 s**).

- Deve restituire **tutti gli ordini della giornata**, anche quelli pronti, consegnati o pagati, con `paidAt`, `readyAt` e `deliveredAt`: il **Riepilogo di oggi** del profilo (titolare e vice) si calcola da qui, nel frontend (`src/features/orders/utils/daySummary.ts`): incasso degli ordini pagati, ordini sul posto e da asporto, piatti venduti, ordini per fascia oraria e tempi della cucina (dalla coda, `paidAt` se si paga prima o `createdAt`, a `readyAt`; col ritiro al banco da `readyAt` a `deliveredAt`). Se si paga prima contano solo gli ordini pagati, come in cucina. Per un riepilogo di più serate (un'edizione intera) servirà un parametro di data o un endpoint apposito.
- La cassa ha anche la vista **Conti**: gli ordini sul posto non pagati raggruppati per `table` (quelli senza tavolo uno per uno), con i piatti e il totale da incassare; "Incassa" chiama `PATCH /api/orders/:id/payment` su ognuno.

### `PATCH /api/orders/:id/ready` — gestori, chef, kitchen

La cucina segna la comanda pronta (`{ "ready": true }`) o la rimette da preparare (`{ "ready": false }`). Risposta: nessun corpo richiesto.

- Il backend imposta `readyAt` (ora del server) con `true` e lo toglie con `false`.
- Usata solo **senza smistamento** (con lo smistamento `403`): `readyAt` lo calcola il backend dalle comande delle postazioni (vedi [Cucina e smistamento](#cucina-e-smistamento)).
- Se si paga prima (online, tipo sagra, ritiro al banco) solo sugli ordini pagati, altrimenti `400`: la cucina non li vede.
- La cucina vede gli ordini senza `readyAt` da chi ha ordinato per primo; se si paga prima (online o tipo sagra) solo quelli pagati, in ordine di `paidAt`.

### `PATCH /api/orders/:id/payment` — gestori, cashier

Segna l'ordine come pagato o da pagare. Richiesta: `{ "paid": true }`. Risposta: nessun corpo richiesto.

- Il backend imposta `paidAt` (ora del server) la prima volta che l'ordine diventa pagato e lo toglie se torna da pagare: tipo sagra la cucina lavora in ordine di pagamento.

- Con `orderingMode: "payOnline"` il frontend non la usa (sola lettura): il backend la rifiuta (`403`).
- Con `menuOnly` si usa solo per incassare (`{ "paid": true }`, dai Conti): rimettere un ordine da pagare è `400`.

### `PATCH /api/orders/:id/items` — gestori, cashier

Modifica i piatti di un ordine **da asporto** (gli altri: `400`). Si possono tenere i piatti già nell'ordine o aggiungerne dal menù di oggi; un piatto [esaurito](#piatti-esauriti) si può tenere o diminuire, non aggiungere né aumentare (`409`). Richiesta: `{ "items": CartType[] }` con l'elenco **completo** dei piatti dopo la modifica. Risposta: nessun corpo richiesto.

- Il backend deve ricalcolare `total` (il frontend lo legge da `GET /api/orders`).
- Con `orderingMode: "payOnline"` il frontend non la usa (sola lettura): il backend la rifiuta (`403`).

---

## Cucina e smistamento

Senza smistamento (`kitchenDispatch: false`, "con i bigliettini") il lavoro tra le postazioni si divide a mano, con i bigliettini di carta: chi è in cucina vede tutte le comande e segna pronto l'ordine intero con [`PATCH /api/orders/:id/ready`](#patch-apiordersidready--gestori-chef-kitchen). Il capo cucina non serve.

Con lo smistamento (`kitchenDispatch: true` e almeno una postazione in `kitchenStations`) le comande arrivano al **capo cucina** (`chef`, e ai gestori), che le manda alle postazioni (es. Primi, Griglia, Bar): l'ordine intero o solo alcune righe, a postazioni diverse. Vede quante comande ha in coda ogni postazione per non sovraccaricarne nessuna. Ogni postazione (`kitchen`, scelta sul dispositivo) vede solo le sue comande, da chi ha ordinato per primo, e le segna pronte. Il caposala (`headWaiter`) vede smistamento e postazioni in sola lettura.

Le parti mandate stanno in `Order.tickets` ([`StationTicket`](#stationticket)); le righe sono indicate dal loro indice in `items`.

### `POST /api/orders/:id/tickets` — gestori, chef

Manda alcune righe dell'ordine a una postazione. Richiesta:

```json
{ "stationId": "st-griglia", "items": [1, 4] }
```

Risposta `200`: lo [`StationTicket`](#stationticket) creato (con `id` e `sentAt`).

- Tutte le chiamate dello smistamento solo con `kitchenDispatch: true` e almeno una postazione, altrimenti `403`.
- `stationId` deve essere una postazione di `kitchenStations`; `items` non vuoto, indici esistenti e non già mandati ad altre postazioni; se si paga prima, solo ordini pagati: altrimenti `400`.

### `DELETE /api/orders/:id/tickets/:ticketId` — gestori, chef

Ritira una comanda non ancora pronta (es. mandata alla postazione sbagliata): le sue righe tornano da smistare. Una comanda già pronta non si ritira (`400`). Risposta: nessun corpo richiesto.

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

**Ritiro dell'asporto.** Con `serviceMode: "table"` e l'[asporto](#impostazioni-asporto) attivo la pagina Ritiro c'è lo stesso, ma solo per gli ordini da asporto: chi è al banco (il ruolo `counter` si chiama allora "Banco ritiro asporto") li consegna con [`PATCH /api/orders/:id/delivered`](#patch-apiordersiddelivered--gestori-cashier-chef-counter). Niente schermo Pronti né stato sul telefono: `GET /api/pickup-board` resta `404`. Con `"table"` e l'asporto spento il banco non serve.

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
- Solo se c'è un banco (ritiro al banco o asporto attivo, altrimenti `403`); col solo asporto al banco solo gli ordini da asporto; si consegna solo un ordine pronto (`readyAt`): altrimenti `400`.

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
- Con `orderingMode: "menuOnly"` l'asporto lo prende solo la cassa (es. al telefono) e l'orario si concorda: `mode`, `fixedTimes` e `ranges` non si usano (il profilo non li fa modificare).
- **Giorni e servizi**: l'asporto non ha una settimana sua, segue quella del locale ([`RestaurantProfile.openingHours`](#weeklyhours)). Si ritira a pranzo solo nei giorni in cui il locale è aperto a pranzo, a cena solo in quelli aperti a cena. Se oggi non resta un servizio ancora prenotabile il frontend non propone l'asporto.
- `mode: "fixed"`: chi ordina ritira all'orario unico del servizio, `fixedTimes.lunch` o `fixedTimes.dinner` (`ranges` viene ignorato). Il frontend usa il primo servizio aperto di oggi il cui orario unico non è ancora passato.
- `mode: "custom"`: il cliente sceglie l'orario (`pickupTime` dell'ordine) dentro `ranges.lunch` o `ranges.dinner`, solo per i servizi aperti oggi (`fixedTimes` viene ignorato).

### `PATCH /api/takeaway/settings` — gestori

Richiesta: `TakeawaySettings` completo. Risposta `200`: `TakeawaySettings` salvato. Fasce non valide (vedi sotto): `400`.

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
- **Se i posti non bastano** (`people > remainingSeats`) rispondere `409`: il cliente vede "Non ci sono più abbastanza posti liberi".
- Validare: `name` 1–60 caratteri, `people` intero ≥ 1, `arrivalTime` `HH:MM` dentro gli orari di apertura di oggi ([`openingHours`](#weeklyhours)) e non già passato, `notes` max 200, `seatRequests` solo [valori ammessi](#seatrequest).

### `GET /api/reservations` — gestori, headWaiter, waiter

Risposta `200`: [`Reservation[]`](#reservation). Il frontend la ripete ogni **15 s** per vedere quelle nuove.

### `PATCH /api/reservations/:id` — gestori, headWaiter, waiter

Richiesta: campi modificati; oggi il frontend invia sempre:

```json
{ "name": "Colombo", "people": 5, "arrivalTime": "20:15" }
```

Risposta `200`: la [`Reservation`](#reservation) aggiornata.

### `DELETE /api/reservations/:id` — gestori, headWaiter, waiter

Risposta: nessun corpo richiesto. Il frontend toglie poi la prenotazione dalla piantina e la salva.

L'`id` nei percorsi è codificato con `encodeURIComponent`.

---

## Piantina

La piantina è un unico documento JSON con tavoli, sedie (e relative prenotazioni) e muri. Il backend può salvarla così com'è; l'unica parte che deve leggere è `chairs[].booking` (per i posti disponibili).

### `GET /api/floor-plan` — gestori, cashier, headWaiter, waiter

Risposta `200`: [`FloorPlanData`](#floorplandata), oppure `null` se non è ancora stata creata.

- La cassa la legge solo per suggerire i nomi dei tavoli in Nuovo ordine (e l'amministratore per i QR code).

### `POST /api/floor-plan` — gestori, headWaiter, waiter

Richiesta: [`FloorPlanData`](#floorplandata) **completa**. Al primo salvataggio `id` è assente: lo assegna il backend.

Risposta `200`: `FloorPlanData` salvata (con `id` e `updatedAt`).

- Chiamata **spesso**: oltre al pulsante Salva della modalità Modifica, ogni volta che il personale prenota, toglie o segna come arrivati dei posti, il frontend salva automaticamente dopo circa 600 ms.
- La modalità Modifica (tavoli e muri) è solo dell'amministratore; i camerieri salvano la piantina solo per le prenotazioni. Il backend rifiuta (`403`) un `waiter` o `headWaiter` che cambia tavoli o muri (confrontando tutto tranne `chairs[].booking`): così una piantina vecchia salvata per una prenotazione non cancella le modifiche dell'amministratore.

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
  id: number;            // assegnato dal backend, unico tra tutti i menù (negativo = nuovo, vedi Menù)
  name: string;          // max 80
  description: string;   // può essere "", max 300
  price: number;         // euro, 0–10000
  category: string;      // testo libero, max 40 (predefinite: Antipasti, Primi, Secondi, Dolci, Bevande)
  allergens?: string[];  // vedi Allergeni
  soldOut?: boolean;     // solo in GET /api/menu: esaurito per oggi (vedi Piatti esauriti)
}
```

### RestaurantMenu

```ts
interface RestaurantMenu {
  id: string;     // "m-<timestamp>", generato dal frontend per i menù nuovi
  name: string;   // 1–40, diverso dagli altri menù
  days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[]; // giorni in cui si usa; un giorno in un solo menù; [] = non usato
  dishes: Dish[]; // almeno uno, nell'ordine in cui li vedono i clienti
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
  table?: string;        // solo sul posto, max 20; obbligatorio quando il cliente ordina già seduto e negli ordini del personale a fine pasto
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
  brandColor: string; // "#rrggbb" scelto dalla tavolozza (i profili vecchi possono avere "orange", "red", "pink", "violet", "blue", "teal", "green", "brown")
  openingHours: WeeklyHours; // giorni e orari di apertura
  orderingMode: "menuOnly" | "payAtCashier" | "payOnline"; // vedi Modalità di ordine
  paymentTiming: "afterMeal" | "beforeMeal"; // pagando alla cassa: tipo ristorante o tipo sagra
  tableQrCode: boolean;      // quando l'ordine riporta il tavolo, arriva dal QR code invece di essere scritto
  serviceMode: "table" | "counter"; // portato al tavolo o ritiro al banco
  pickupCall: "screen" | "voice";  // col banco: schermo Pronti o chiamata a voce
  kitchenDispatch: boolean;  // le comande passano dal capo cucina alle postazioni
  kitchenStations: KitchenStation[];
  active: boolean;           // sola lettura: edizione pagata e non scaduta (vedi Piattaforma)
}

interface KitchenStation {
  id: string;   // "st-<timestamp>", generato dal frontend
  name: string; // max 30, diverso dalle altre postazioni
}
```

### SignupRequest

```ts
interface SignupRequest {
  restaurantName: string; // max 40
  slug: string;           // <slug>.ristosagra.it, 3–30 caratteri a-z0-9-
  owner: { name: string; email: string; phone: string; password: string };
  billing: BillingDetails;
}
```

### SignupResponse

```ts
interface SignupResponse {
  slug: string;
  checkoutUrl: string; // pagina di pagamento dell'edizione (https)
}
```

### Billing

```ts
interface Billing {
  active: boolean;           // edizione pagata e non scaduta
  paidUntil: string | null;  // ISO, fine dell'edizione pagata; null se mai pagata
  details: BillingDetails;
}
```

### BillingDetails

Dati per la fattura elettronica.

```ts
interface BillingDetails {
  holder: string;    // intestatario, max 100 (es. "Pro Loco di Ponte")
  taxCode: string;   // codice fiscale (16) o P.IVA / CF numerico (11), maiuscolo
  sdiCode?: string;  // codice destinatario, 7 caratteri
  pec?: string;
  address: BillingAddress;
}

interface BillingAddress {
  street: string;    // max 100
  zip: string;       // 5 cifre
  city: string;      // max 60
  province: string;  // 2 lettere maiuscole
}
```

### SessionUser

```ts
interface SessionUser {
  id: string;
  name: string;  // max 60
  role: "admin" | "deputy" | "cashier" | "headWaiter" | "waiter" | "chef" | "kitchen" | "counter";
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

- Ricalcolare prezzi e totali degli ordini dal menù salvato (mai dai dati del client), e rifiutare i piatti [esauriti](#piatti-esauriti) (`409`).
- Far rispettare la [modalità di ordine](#modalità-di-ordine) e tutte le impostazioni del profilo anche lato server, **per ogni ruolo compreso il titolare** (es. niente ordini dei clienti con `menuOnly`, cassa in sola lettura con `payOnline`, ordini sul posto solo negli orari di apertura, smistamento solo se attivo). I dati finti in `src/features/*/mock/` simulano queste regole e i ruoli della colonna **Accesso**.
- Pagamento online: segnare gli ordini come pagati solo alla conferma del servizio di pagamento (webhook firmato o verifica server-to-server), mai dal ritorno del cliente su `?pagamento=ok`. Le chiavi del servizio restano solo nel backend.
- Validare tutti i campi con i limiti indicati sopra: quelli del frontend si possono aggirare.
- Proteggere tutte le chiamate del personale col token, controllando il ruolo (colonna **Accesso**), e limitare i tentativi di login.
- Personale: password solo come hash (bcrypt/argon2), mai restituite; persone bloccate o eliminate ricevono `401` anche con un token ancora valido.
- Valutare un cookie `httpOnly` al posto del token restituito nel corpo: richiede anche una piccola modifica a `src/services/auth/session.ts` e `credentials: "include"` nel client HTTP.
- Quando il dominio del backend è definitivo, restringere `connect-src` nella Content-Security-Policy di `netlify.toml`.
- Più sagre: separare i dati di ogni sagra su **tutte** le chiamate (sagra dal token per il personale, da `X-Sagra` per i clienti); un token di una sagra non deve funzionare su un'altra.
- Attivazione: solo dal webhook firmato del servizio di pagamento, mai dal ritorno su `?attivazione=ok`; rifiutare con `402` ordini e prenotazioni delle sagre non attive (vedi [Sagra non attiva](#sagra-non-attiva)).
- Registrazione: limitare i tentativi su `/api/signup` e `/api/signup/slug/:slug`, tenere l'elenco degli indirizzi riservati, salvare la password del titolare come hash.
