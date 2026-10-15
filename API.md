# API di Ristosagra

Contratto tra il frontend (questo repository) e il backend: tutti gli endpoint chiamati dall'app, i dati che si aspetta e le regole che oggi sono simulate dai dati finti (`VITE_MOCKING=true`) e che il backend dovrà implementare.

Le chiamate sono definite in `src/features/<feature>/api/*.ts` e `src/services/api/auth.ts`; i tipi in `src/features/<feature>/types/` e `src/types/menuOrder.ts`. Se si modifica un endpoint, aggiornare anche questo file.

---

## Convenzioni generali

| Voce | Valore |
|---|---|
| Base URL | `VITE_API_URL` (es. `https://tuo-backend.railway.app`). Vuoto = stessa origine; in sviluppo Vite inoltra `/api` a `http://localhost:8080` |
| Formato | JSON (`Content-Type: application/json`), UTF-8. Il frontend invia `Content-Type` solo nelle richieste con corpo |
| Autenticazione | `Authorization: Bearer <token>` sulle chiamate della cassa (vedi colonna **Accesso**) |
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

**Pubblica** = usata dai clienti senza login. **Cassa** = richiede il token.

| Metodo | Percorso | Accesso | Sezione |
|---|---|---|---|
| POST | `/api/auth/login` | pubblica | [Login](#login) |
| GET | `/api/restaurant` | pubblica | [Ristorante](#ristorante) |
| PATCH | `/api/restaurant` | cassa | [Ristorante](#ristorante) |
| GET | `/api/menu` | pubblica | [Menù](#menù) |
| POST | `/api/menu` | cassa | [Menù](#menù) |
| PATCH | `/api/menu` | cassa | [Menù](#menù) |
| POST | `/api/order` | pubblica | [Ordini](#ordini) |
| GET | `/api/orders` | cassa | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/payment` | cassa | [Ordini](#ordini) |
| PATCH | `/api/orders/:id/items` | cassa | [Ordini](#ordini) |
| GET | `/api/takeaway/settings` | pubblica | [Asporto](#impostazioni-asporto) |
| PATCH | `/api/takeaway/settings` | cassa | [Asporto](#impostazioni-asporto) |
| GET | `/api/reservations/availability` | pubblica | [Prenotazioni](#prenotazioni) |
| POST | `/api/reservations` | pubblica | [Prenotazioni](#prenotazioni) |
| GET | `/api/reservations` | cassa | [Prenotazioni](#prenotazioni) |
| PATCH | `/api/reservations/:id` | cassa | [Prenotazioni](#prenotazioni) |
| DELETE | `/api/reservations/:id` | cassa | [Prenotazioni](#prenotazioni) |
| GET | `/api/floor-plan` | cassa | [Piantina](#piantina) |
| POST | `/api/floor-plan` | cassa | [Piantina](#piantina) |

> ⚠️ La creazione dell'ordine usa `/api/order` (singolare), tutte le altre chiamate sugli ordini `/api/orders`. Se il backend preferisce `POST /api/orders`, va cambiato anche in `src/features/orders/api/orders.ts`.

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
{ "success": true, "token": "eyJhbGciOi..." }
```

- Credenziali errate: `200` con `{ "success": false }` **oppure** `401`/`403`.
- Il token viene salvato e inviato come `Bearer`. Se è un JWT con `exp`, il frontend considera scaduta la sessione dopo quella data.
- Non esiste un endpoint di logout: il frontend cancella il token da solo. Se serve invalidarlo lato server, va aggiunto.
- Limiti nel form: username max 100 caratteri, password max 200.

---

## Ristorante

### `GET /api/restaurant` — pubblica

Profilo mostrato a cassa e clienti (nome nella home, tema e colore di tutto il sito).

Risposta `200`: [`RestaurantProfile`](#restaurantprofile)

```json
{ "name": "Sagra del Borgo", "theme": "dark", "brandColor": "orange" }
```

### `PATCH /api/restaurant` — cassa

Richiesta: solo i campi modificati (uno o più di `name`, `theme`, `brandColor`).

```json
{ "theme": "light" }
```

Risposta `200`: il [`RestaurantProfile`](#restaurantprofile) completo aggiornato (il frontend lo usa al posto di quello in memoria).

---

## Menù

### `GET /api/menu` — pubblica

Risposta `200`: [`Dish[]`](#dish). Array vuoto se il menù non è ancora configurato.

- **L'ordine dell'array conta**: le categorie compaiono nell'ordine del loro primo piatto e i piatti nell'ordine dell'array. Il backend deve conservarlo.

### `POST /api/menu` — cassa

Usata quando il menù è vuoto (primo salvataggio). Richiesta: `Dish[]` con **tutti** i piatti.

### `PATCH /api/menu` — cassa

Usata quando il menù esiste già. Richiesta: `Dish[]` con il **menù completo** (sostituisce quello precedente: i piatti assenti sono stati eliminati).

Per entrambe:

- Risposta `200`: `Dish[]` salvati, che il frontend usa come nuovo menù.
- **I piatti nuovi hanno `id` negativo** (`-1`, `-2`, …), provvisorio: il backend deve assegnare l'id definitivo e restituirlo nella risposta.
- Validare lato server: `name` 1–80 caratteri, `description` max 300, `category` max 40, `price` tra 0 e 10000 (centesimi), `allergens` solo valori dell'[elenco ufficiale](#allergeni).

---

## Ordini

### `POST /api/order` — pubblica

Ordine inviato dal cliente. Richiesta: [`NewOrder`](#neworder)

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

- `type: "dinein"` (sul posto) non ha `customerName` né `pickupTime`.
- Risposta `200`: `{ "orderNumber": 112 }` — numero da mostrare alla cassa.
- **Il backend non deve fidarsi dei prezzi inviati**: totale e prezzi vanno ricalcolati dal menù salvato usando `dish.id` e `quantity`. Verificare anche che i piatti esistano e che `quantity` sia un intero > 0.
- Il numero d'ordine è assegnato dal backend (i dati finti partono da 100 e incrementano).

### `GET /api/orders` — cassa

Risposta `200`: [`Order[]`](#order). Il frontend la ripete ogni **30 s**.

### `PATCH /api/orders/:id/payment` — cassa

Segna l'ordine come pagato o da pagare. Richiesta: `{ "paid": true }`. Risposta: nessun corpo richiesto.

### `PATCH /api/orders/:id/items` — cassa

Modifica i piatti di un ordine da asporto. Richiesta: `{ "items": CartType[] }` con l'elenco **completo** dei piatti dopo la modifica. Risposta: nessun corpo richiesto.

- Il backend deve ricalcolare `total` (il frontend lo legge da `GET /api/orders`).

---

## Impostazioni asporto

### `GET /api/takeaway/settings` — pubblica

Risposta `200`: [`TakeawaySettings`](#takeawaysettings)

```json
{ "mode": "fixed", "fixedTime": "19:30" }
```

- `mode: "fixed"`: tutti ritirano a `fixedTime`; passato quell'orario il frontend non propone più l'asporto.
- `mode: "custom"`: il cliente sceglie l'orario (`pickupTime` dell'ordine).

### `PATCH /api/takeaway/settings` — cassa

Richiesta: `TakeawaySettings` completo. Risposta `200`: `TakeawaySettings` salvato.

---

## Prenotazioni

I clienti prenotano posti senza vedere la piantina; la cassa poi le "sistema" sui tavoli (vedi [Piantina](#piantina)).

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
- Validare: `name` 1–60 caratteri, `people` intero ≥ 1, `arrivalTime` `HH:MM`, `notes` max 200, `seatRequests` solo [valori ammessi](#seatrequest).

### `GET /api/reservations` — cassa

Risposta `200`: [`Reservation[]`](#reservation). Il frontend la ripete ogni **15 s** per vedere quelle nuove.

### `PATCH /api/reservations/:id` — cassa

Richiesta: campi modificati; oggi la cassa invia sempre:

```json
{ "name": "Colombo", "people": 5, "arrivalTime": "20:15" }
```

Risposta `200`: la [`Reservation`](#reservation) aggiornata.

### `DELETE /api/reservations/:id` — cassa

Risposta: nessun corpo richiesto. Il frontend toglie poi la prenotazione dalla piantina e la salva.

L'`id` nei percorsi è codificato con `encodeURIComponent`.

---

## Piantina

La piantina è un unico documento JSON con tavoli, sedie (e relative prenotazioni) e muri. Il backend può salvarla così com'è; l'unica parte che deve leggere è `chairs[].booking` (per i posti disponibili).

### `GET /api/floor-plan` — cassa

Risposta `200`: [`FloorPlanData`](#floorplandata), oppure `null` se non è ancora stata creata.

### `POST /api/floor-plan` — cassa

Richiesta: [`FloorPlanData`](#floorplandata) **completa**. Al primo salvataggio `id` è assente: lo assegna il backend.

Risposta `200`: `FloorPlanData` salvata (con `id` e `updatedAt`).

- Chiamata **spesso**: oltre al pulsante Salva della modalità Modifica, ogni volta che la cassa prenota, toglie o segna come arrivati dei posti, il frontend salva automaticamente dopo circa 600 ms.

### Come sono collegate prenotazioni e piantina

- Tutte le sedie con lo stesso `booking.id` appartengono alla stessa prenotazione.
- Prenotazione online sistemata: `booking.id` = `id` della [`Reservation`](#reservation).
- Prenotazione fatta direttamente in cassa (senza prenotazione online): `booking.id` generato dal frontend (`"b-<timestamp>"`), esiste solo nella piantina.
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
  customerName?: string; // solo asporto, max 60
  pickupTime?: string;   // solo asporto, "HH:MM"
}
```

### Order

```ts
interface Order {
  id: number;
  orderNumber: number;    // numero mostrato a cliente e cassa
  total: number;          // euro, calcolato dal backend
  paid: boolean;
  items: CartType[];
  createdAt: string;      // ISO 8601
  type?: "dinein" | "takeaway"; // assente = sul posto
  customerName?: string;  // solo asporto
  pickupTime?: string;    // solo asporto, "HH:MM"
}
```

### TakeawaySettings

```ts
interface TakeawaySettings {
  mode: "fixed" | "custom";
  fixedTime: string; // "HH:MM", usato con mode "fixed"
}
```

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
}
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
- Validare tutti i campi con i limiti indicati sopra: quelli del frontend si possono aggirare.
- Proteggere tutte le chiamate **cassa** col token e limitare i tentativi di login.
- Valutare un cookie `httpOnly` al posto del token restituito nel corpo: richiede anche una piccola modifica a `src/services/auth/session.ts` e `credentials: "include"` nel client HTTP.
- Quando il dominio del backend è definitivo, restringere `connect-src` nella Content-Security-Policy di `netlify.toml`.
