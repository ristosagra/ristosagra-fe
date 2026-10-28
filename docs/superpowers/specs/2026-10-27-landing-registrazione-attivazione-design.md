# Landing, registrazione e attivazione delle sagre

> Design concordato il 27/10/2026. Riguarda solo il frontend (questo repository) e il contratto con il backend (`API.md`); il backend non esiste ancora e qui viene solo descritto.

## Obiettivo

Chi organizza una sagra arriva su `ristosagra.it`, capisce in un minuto cos'è Ristosagra, come funziona, perché conviene, quanto costa e perché fidarsi; si registra, paga e si ritrova nell'area del ristorante a configurare la sua sagra. Solo una sagra pagata va online (sito clienti, ordini, schermo `/pronti`).

**Riuscito quando**: dalla landing si completa registrazione → pagamento → login → Profilo senza aiuto; una sagra non pagata si può preparare ma non riceve ordini; tutto funziona anche con i dati finti (`VITE_MOCKING=true`).

## Decisioni prese

| Tema | Decisione |
|---|---|
| Più sagre | Ogni sagra ha un **sottodominio**: `ristosagra.it` = piattaforma (landing, registrazione, accesso), `<slug>.ristosagra.it` = sito della sagra (clienti, `/login`, `/dashboard`, `/pronti` come oggi) |
| Frontend | **Una sola app** che sceglie le rotte in base all'host; le pagine della piattaforma sono un chunk lazy |
| Flusso | **Registra → paga → login**: la registrazione crea sagra e titolare e porta al pagamento, il pagamento rimanda alla login della sagra |
| Non pagata | Titolare e vice **preparano tutto** (Profilo, Piantina) ma la sagra **non va online**: niente ordini, niente sito clienti, lo staff non ha pagine |
| Prezzo | **€99 a edizione**, tutto incluso, **valida 12 mesi dal pagamento**, nessun abbonamento né rinnovo automatico |
| Fattura | Dati per la fattura elettronica **nella registrazione**, modificabili poi nel Profilo |
| Garanzie in pagina | Solo **assistenza al telefono durante le serate** e **demo gratuita**. Niente testimonianze, numeri o garanzie inventate |

## Fuori scope

- Backend multi-sagra, integrazione col servizio di pagamento (Stripe Checkout o simile), emissione della fattura elettronica.
- Testi legali (privacy, termini) e relativa casella di consenso: vanno scritti dal fondatore **prima del lancio reale** (vedi in fondo).
- Recupero password, cambio dell'indirizzo (slug) dopo la registrazione, rinnovo prima della scadenza, codici sconto.
- Funzionamento senza internet (analizzato a parte in `docs/offline.md`).

---

## Architettura

### Host e ambiente

- Nuova variabile `VITE_ROOT_DOMAIN` (letta solo in `src/constant/env.ts` come `ROOT_DOMAIN`), es. `ristosagra.it`; in sviluppo `localhost`.
- **Vuota = comportamento di oggi**: una sola sagra, nessuna landing, nessun `X-Sagra`. Serve per il deploy pilota e per la demo.
- `src/helpers/site.ts` (puro, calcolato una volta da `window.location`):
  - `sagraSlug: string | null` — con `ROOT_DOMAIN` impostato, l'etichetta prima di `.${ROOT_DOMAIN}` (`www` conta come dominio principale → `null`); senza `ROOT_DOMAIN` sempre `null`.
  - `isPlatformHost: boolean` — `ROOT_DOMAIN` impostato e nessuna sagra nell'host.
  - `sagraUrl(slug, path)` e `platformUrl(path)` — indirizzi assoluti che mantengono protocollo e porta (in sviluppo `http://pesce.localhost:5199/login`).
- Nuova variabile `VITE_DEMO_URL` (es. `https://demo.ristosagra.it`): se vuota il bottone "Prova la demo" non compare.

### Rotte (`App.tsx`)

- `isPlatformHost` → `PlatformApp` (lazy): `/` Landing, `/registrati` Registrazione, `/accedi` Accedi alla tua sagra, altro → `/`.
- Altrimenti → le rotte di oggi (`/`, `/login`, `/pronti`, `/dashboard`). `useTheme` si chiama solo qui: sul dominio principale non c'è un ristorante da leggere.
- La piattaforma usa un aspetto fisso: tema chiaro e colore predefinito di Ristosagra (`DEFAULT_BRAND_COLOR`), applicati con la stessa funzione di `useTheme` (da esportare/estrarre).

### Quale sagra arriva al backend

- `httpClient` aggiunge **`X-Sagra: <slug>`** a ogni richiesta quando `sagraSlug` c'è (un solo punto nel codice). Il backend usa l'header per le chiamate pubbliche; per quelle del personale vale la sagra del token e deve coincidere con l'header (altrimenti `403`).
- Effetto: anche le GET pubbliche diventano richieste CORS con preflight se l'API è su un altro dominio. Il backend deve consentire `X-Sagra` e rispondere al preflight con `Access-Control-Max-Age` alto (es. 86400); con l'API sotto lo stesso dominio (proxy Netlify `/api/*`) il preflight non c'è.
- Il login sul sottodominio cerca lo username **dentro quella sagra**: gli username del personale (`cassa`, `cucina`…) restano per sagra; il titolare entra con la sua **email** come username.

---

## Pagine della piattaforma (`ristosagra.it`)

Nuova feature `src/features/platform/` (`api/`, `hook/`, `mock/`, `components/`, `utils/`, `types/`), pagine in `src/pages/Platform/`.

### Landing (`/`)

Aspetto: tema chiaro e caldo col colore di Ristosagra, font già in uso (`ThemeVariants`), mobile-first. Al posto delle foto, **anteprime dell'app disegnate in CSS** (telefono col menù, schermo cucina, schermo "Pronti" coi numeri). `document.title` della landing: "Ristosagra · Il gestionale per la tua sagra".

Sezioni, in ordine:

1. **Barra**: Ristosagra · Come funziona · Prezzo · Domande · Accedi (`/accedi`) · [Inizia] (`/registrati`). Su telefono: logo + Accedi + Inizia, le ancore restano nel testo.
2. **Apertura**: titolo "La tua sagra senza coda alla cassa e senza comande di carta"; sottotitolo "Menù sul telefono, ordini dal telefono o in cassa, cucina sugli schermi, numeri pronti sulla TV. Dal browser, senza installare nulla."; bottoni [Attiva la tua sagra · €99] e [Prova la demo]; nota "Prepari tutto gratis, paghi solo per andare online".
3. **Cos'è**: quattro schede — *Clienti* (menù, ordini e pagamento dal telefono, asporto, prenotazioni), *Cassa* (ordini al banco, bigliettino stampato), *Cucina* (schermi al posto delle comande, solo ordini pagati, in ordine), *Ritiro* (schermo con i numeri pronti).
4. **Come funziona**: *la serata* — ordina e paga → la cucina vede solo i pagati, in ordine di pagamento → il numero compare sullo schermo → ritiro al banco; *per te* — registra la sagra → prepara menù e volontari → attiva con €99 → stampa i QR e apri.
5. **Perché conviene**: meno coda alla cassa; niente comande perse o illeggibili; la cucina lavora nell'ordine in cui si paga; telefoni, tablet e PC che avete già; ogni volontario ha il suo accesso e vede solo le sue pagine.
6. **Si adatta alla tua sagra**: asporto con orario di ritiro, QR sui tavoli, prenotazioni, smistamento in cucina per postazioni, pagare prima o dopo il pasto, al tavolo o al banco, un menù per giorno, colori e tema.
7. **Prezzo** (`#prezzo`): una scheda — €99 a edizione · valida 12 mesi · tutto incluso · nessun abbonamento, nessun rinnovo automatico · fattura elettronica · assistenza al telefono nelle serate; [Inizia].
8. **Perché affidarti a noi**: assistenza al telefono durante le serate; demo da provare subito; prepari tutto gratis e paghi solo per andare online; nessuna installazione; fatto da chi conosce il mondo delle sagre.
9. **Domande** (`#domande`, `Accordion`), risposte oneste:
   - *Serve internet?* Sì: cassa, cucina e schermo dei numeri si parlano attraverso internet. Consigliamo una connessione dedicata (router 4G/5G con una SIM solo per la sagra). Se la linea cade, gli ordini già registrati restano salvati e si continua con i bigliettini di carta finché torna.
   - *Sostituisce il registratore di cassa?* No: lo scontrino fiscale si fa come sempre.
   - *Bisogna installare un'app?* No, funziona dal browser di telefoni, tablet e PC.
   - *I volontari meno pratici ce la fanno?* Ognuno vede solo le pagine del suo ruolo, con pulsanti grandi; si prova prima con la demo.
   - *Posso provarlo prima di pagare?* Sì: la demo, e dopo la registrazione prepari tutto gratis.
   - *Cosa succede dopo 12 mesi?* La sagra torna offline, i dati restano; per l'edizione successiva si riattiva con €99. Nessun addebito automatico.
   - *Fate fattura?* Sì, elettronica, con i dati inseriti alla registrazione.
10. **Chiusura**: invito finale [Inizia]; footer con telefono ed email (da `src/constant/platform.ts`, una voce vuota non compare) e "Accedi alla tua sagra".

Costanti in `src/constant/platform.ts`: `EDITION_PRICE = 99`, `EDITION_MONTHS = 12`, `SUPPORT_PHONE`, `SUPPORT_EMAIL` (vuoti finché il fondatore non li inserisce: nessun contatto finto).

### Registrazione (`/registrati`)

Una pagina con tre blocchi, un solo invio:

| Blocco | Campi | Regole |
|---|---|---|
| La sagra | Nome della sagra; indirizzo `[slug].ristosagra.it` | Nome obbligatorio. Slug suggerito dal nome finché non lo si modifica a mano (minuscole, accenti tolti, spazi e simboli → `-`); 3–30 caratteri `a-z0-9-`, non inizia/finisce con `-`, non tra i riservati (`www`, `demo`, `api`, `app`, `admin`, `mail`, `assets`, `static`). Disponibilità verificata mentre si scrive (attesa ~400 ms) con `GET /api/signup/slug/:slug`: "libero" / "già in uso" |
| Il titolare | Nome e cognome; email (sarà lo username); telefono; password; conferma password | Email valida; telefono obbligatorio (per l'assistenza in serata); password almeno 8 caratteri e uguale alla conferma |
| Dati per la fattura | Intestatario (es. "Pro Loco di …"); codice fiscale o P.IVA; codice SDI; PEC; via; CAP; comune; provincia | CF/P.IVA: 11 cifre o 16 caratteri alfanumerici; SDI facoltativo, 7 caratteri; PEC facoltativa, email valida; CAP 5 cifre; provincia 2 lettere. Testo d'aiuto: "SDI e PEC: se non li avete, lasciate vuoto" |

- Limiti di lunghezza in `src/constant/limits.ts`, validazione pura in `features/platform/utils/signupForm.ts` (errori mostrati sotto ai campi, il primo errore riceve il focus).
- Bottone **"Registra e paga €99"** → `POST /api/signup` → `location.assign(checkoutUrl)`, accettato solo se passa `safeCheckoutUrl` (oggi in `features/orders/utils/onlinePayment.ts`, da spostare in `src/helpers/` per usarlo in entrambi).
- Errori: `409` → "Questo indirizzo è già in uso" sul campo slug (qualcuno l'ha preso nel frattempo); altri errori → messaggio generale, il form resta compilato. La stessa email può registrare più sagre (gli username sono per sagra), quindi non c'è un errore "email già usata".
- Sotto il bottone: "Hai già una sagra? Accedi".

### Accedi alla tua sagra (`/accedi`)

Un campo "Indirizzo della tua sagra" (`[slug].ristosagra.it`) → `location.assign(sagraUrl(slug, "/login"))`. Slug normalizzato come nella registrazione; formato non valido → errore sul campo. Se la sagra non esiste lo dice la sua login (sotto).

---

## Sito della sagra (`<slug>.ristosagra.it`)

### Login (`/login`)

- In alto il nome della sagra (da `GET /api/restaurant`, pubblica).
- **Ritorno dal pagamento**: `?attivazione=ok` → messaggio "Pagamento ricevuto. Accedi con la tua email e password: la sagra si attiva appena arriva la conferma."; `?attivazione=annullata` → "Pagamento annullato: puoi preparare la sagra e attivarla quando vuoi dal Profilo." Il parametro si legge una volta e si toglie dall'indirizzo; con `ok` si segna in sessionStorage "attivazione in corso" (con l'ora) per la dashboard.
- Con una sessione già aperta si va a `/dashboard` come oggi.
- Solo con `ROOT_DOMAIN` impostato (senza, la login resta identica a oggi): link "Non hai un account? Registra la tua sagra" → `platformUrl("/registrati")` e placeholder del campo "Username (titolare: la tua email)".

### Sagra inesistente

`GET /api/restaurant` → `404`: sito clienti, login e `/pronti` mostrano "Questa sagra non esiste" con link alla landing (`platformUrl("/")`). Componente unico `SagraUnavailable` (variante "non esiste" / "non ancora online").

### Sagra non attiva

`RestaurantProfile.active: boolean` (sola lettura, non in `RestaurantProfileUpdate`): vero se pagata e non scaduta.

| Chi | Cosa vede con `active: false` |
|---|---|
| Clienti (`/`) e `/pronti` | `SagraUnavailable` "Questa sagra non è ancora online" (nome della sagra, nessun menù né carrello) |
| Titolare e vice | Solo **Profilo** e **Piantina** (`staffPages` toglie Nuovo ordine, Ordini, Cucina, Ritiro); banner `ActivationBanner` in cima all'area: "La sagra non è online · Attivala per €99 (12 mesi)" [Attiva] |
| Altri ruoli | Nessuna pagina; il messaggio vuoto di `CashierHome` diventa "La sagra non è ancora attiva: chiedi al titolare di attivarla." |

- [Attiva] → `POST /api/billing/checkout` → `checkoutUrl` → ritorno su `/login?attivazione=ok|annullata` (con la sessione aperta si passa subito alla dashboard).
- **Pagamento in verifica**: se in sessionStorage c'è "attivazione in corso" da meno di 2 minuti e `active` è ancora falso, il banner dice "Pagamento in verifica…" e `useRestaurant`/`useBilling` si ricontrollano ogni 5 s; diventata attiva, toast "La sagra è online" e il flag si cancella. Dopo 2 minuti torna il banner normale.
- Il controllo vero lo fa il backend: con `active: false` rifiuta con **`402`** ordini (`POST /api/order`, `POST /api/orders` e le modifiche agli ordini), prenotazioni dei clienti e ogni chiamata dei ruoli che non sono gestori.

### Profilo: sezione "Edizione e fattura"

Nuova voce in `PagesProfile` (`BILLING`) e `pages/Cashier/profile/BillingSection.tsx`, come le altre sezioni (`ProfileSection` + `useSectionEdit`):

- Riepilogo nella lista: "Attiva fino al 12/10/2027" oppure "Non attiva" (con `warning`).
- Lettura: stato, scadenza, bottone [Attiva per €99] solo se non attiva; dati per la fattura.
- Modifica (Modifica/Salva): solo i dati per la fattura, stesse regole della registrazione, salvati con `PATCH /api/billing`.
- Visibile a titolare e vice.

---

## Contratto API (da aggiungere ad `API.md`)

Convenzioni: header `X-Sagra` (vedi sopra), CORS con `X-Sagra` tra gli header consentiti, nuovo status `402` = "sagra non attiva" (il frontend lo mostra come errore generico: la UI non offre quelle azioni).

| Metodo | Percorso | Accesso | Note |
|---|---|---|---|
| GET | `/api/signup/slug/:slug` | pubblica, dominio principale | `{ "available": boolean }`; `false` anche per slug riservati o non validi. Limitare i tentativi |
| POST | `/api/signup` | pubblica, dominio principale | Corpo `SignupRequest`; crea sagra **non attiva**, titolare (`admin`, username = email) e pagamento da €99; risposta `{ "slug", "checkoutUrl" }`; `409` slug occupato, `400` dati non validi |
| GET | `/api/billing` | gestori | `Billing` |
| PATCH | `/api/billing` | gestori | Corpo `BillingDetails`; risposta `Billing` |
| POST | `/api/billing/checkout` | gestori | `{ "checkoutUrl" }`; `409` se la sagra è già attiva |
| GET | `/api/restaurant` | pubblica | aggiunge `active`; `404` se lo slug di `X-Sagra` non esiste |

Pagamento (come il pagamento online degli ordini): il servizio rimanda a `https://<slug>.ristosagra.it/login?attivazione=ok|annullata`; **la sagra diventa attiva solo alla conferma del servizio** (webhook firmato), mai per il ritorno su `?attivazione=ok`. Al pagamento confermato `paidUntil = max(adesso, paidUntil) + 12 mesi`; `active = paidUntil > adesso`.

Tipi (`src/features/platform/types/platform.ts`):

```ts
interface BillingAddress { street: string; zip: string; city: string; province: string }
interface BillingDetails {
  holder: string;      //intestatario della fattura
  taxCode: string;     //codice fiscale o P.IVA
  sdiCode?: string;    //codice destinatario (7 caratteri)
  pec?: string;
  address: BillingAddress;
}
interface SignupRequest {
  restaurantName: string;
  slug: string;
  owner: { name: string; email: string; phone: string; password: string };
  billing: BillingDetails;
}
interface SignupResponse { slug: string; checkoutUrl: string }
interface Billing { active: boolean; paidUntil: string | null; details: BillingDetails }
```

---

## Dati finti (`VITE_MOCKING=true`)

- `fakePlatformApi` e `fakeBillingApi` in `features/platform/mock/`, caricati con `import()` dietro `IS_MOCKING` come gli altri.
- **Disponibilità slug**: libero se valido e non riservato (i mock non vedono le altre sagre: ogni sottodominio ha il suo `localStorage`).
- **Registrazione → sagra**: poiché `localStorage` è separato per sottodominio, `signup` risponde con `checkoutUrl = sagraUrl(slug, "/login?attivazione=ok") + "#mock-signup=<dati in base64url>"`. In `main.tsx`, solo con `IS_MOCKING`, prima del primo render si importa `src/mock/signupHandoff.ts` che legge il frammento, lo toglie subito dall'indirizzo (`history.replaceState`) e scrive negli store finti: nome della sagra, personale = solo il titolare (username = email, la password scelta), fatturazione **attiva per 12 mesi** (pagamento finto immediato, come per gli ordini online). Il frammento non arriva mai a un server; la password in chiaro c'è solo nei dati finti.
- **Sottodominio aperto senza registrazione** (es. `prova.localhost`): sagra con i dati di prova di oggi (una persona per ruolo) e **non attiva**, per provare il caso "prepara ma non va online". [Attiva] la rende attiva subito e torna su `/login?attivazione=ok`.
- **Senza `ROOT_DOMAIN`** (demo, sviluppo di oggi): sagra sempre attiva, nessuna differenza con oggi.
- Regole simulate: `requireRole` rifiuta con `402` i ruoli non gestori quando la sagra non è attiva; ordini dei clienti, ordini dello staff e prenotazioni rifiutano con `402`; `getProfile` aggiunge `active` dallo store della fatturazione.

## Configurazione e deploy

- `.env.example`: `VITE_ROOT_DOMAIN` (vuoto = una sola sagra; in sviluppo `localhost`) e `VITE_DEMO_URL`, con spiegazione.
- Sviluppo: `localhost:5199` = landing, `<slug>.localhost:5199` = sagra. Chrome e Firefox risolvono `*.localhost` da soli e Vite li accetta già; Safari potrebbe richiedere una riga in `/etc/hosts` (**da verificare**).
- Netlify: dominio `ristosagra.it` + `*.ristosagra.it` sullo stesso sito (wildcard: richiede Netlify DNS, **da verificare** sul piano in uso); `demo.ristosagra.it` è un secondo sito Netlify dello stesso repository con `VITE_MOCKING=true` e `VITE_ROOT_DOMAIN` vuoto. Le regole di `netlify.toml` (SPA, CSP) valgono per tutti gli host; la CSP non cambia.
- Documentazione: `API.md` (sezione "Piattaforma: registrazione e attivazione", convenzioni, riepilogo, `RestaurantProfile.active`, sicurezza), `CLAUDE.md` (host e rotte, feature `platform`, variabili d'ambiente, regole della sagra non attiva).

## Verifica

Nessun test runner: `npm run build` + `npm run lint`, poi nel browser con i dati finti:

1. `localhost:5199`: landing completa a 375 px e a desktop, ancore, demo nascosta senza `VITE_DEMO_URL`, contatti vuoti non mostrati.
2. `/registrati`: errori di validazione, slug suggerito e modificabile, slug riservato rifiutato; invio → `pesce.localhost:5199/login?attivazione=ok` con messaggio, frammento tolto dall'indirizzo.
3. Login con email e password scelte → dashboard attiva con tutte le pagine; Profilo → "Edizione e fattura" con scadenza a 12 mesi e dati modificabili.
4. `prova.localhost:5199`: sito clienti e `/pronti` "non ancora online"; `admin` vede solo Profilo e Piantina + banner; `cassa` vede il messaggio "chiedi al titolare"; [Attiva] → torna attiva.
5. `/accedi` porta alla login del sottodominio; con `VITE_ROOT_DOMAIN` vuoto l'app è identica a oggi.

## Prima del lancio reale (non in questo lavoro)

- Testi di privacy e termini di servizio + casella di consenso nella registrazione (obbligatoria per raccogliere i dati).
- Telefono ed email di assistenza in `src/constant/platform.ts`.
- Account del servizio di pagamento, webhook, emissione della fattura elettronica (backend).
- Confermare la frase "fatto da chi conosce il mondo delle sagre" o sostituirla con un fatto verificabile.
