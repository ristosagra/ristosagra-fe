# Landing, registrazione e attivazione — piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** su `ristosagra.it` una landing con registrazione e pagamento da €99 che porta alla login della sagra su `<slug>.ristosagra.it`; una sagra non pagata si prepara ma non va online.

**Architecture:** una sola app React che sceglie le rotte dall'host (`VITE_ROOT_DOMAIN`; vuoto = app di oggi). Le pagine della piattaforma sono un chunk lazy; il sottodominio arriva al backend con l'header `X-Sagra`. L'attivazione è `RestaurantProfile.active` + endpoint `/api/billing`; i dati finti simulano tutto, compreso il passaggio dei dati di registrazione al sottodominio.

**Tech Stack:** React 19 + React Router 7, TanStack Query 5, Tailwind 4 (classi da `ThemeVariants`), Vite 7, TypeScript strict, React Compiler + `eslint-plugin-react-hooks` v7.

**Spec:** `docs/superpowers/specs/2026-10-27-landing-registrazione-attivazione-design.md` — leggerla prima di ogni task: testi, regole e tabelle stanno lì e qui non si ripetono.

## Global Constraints

- Testi dell'interfaccia e commenti in italiano; commenti scritti `//Così` (senza spazio dopo `//`).
- Colori, bordi e raggi solo da `ThemeVariants` (`src/constant/colors.ts`), classi unite con `cn()`.
- Niente `setState` dentro gli effetti, niente lettura/scrittura di ref durante il render, niente `Date.now()` nel render (usare `useNow`); un file `.tsx` esporta solo componenti, gli helper vanno in `utils/` o `helpers/`.
- Enum con il pattern `as const` + `keyof typeof`.
- I moduli finti si caricano solo con `import()` dietro `IS_MOCKING` e l'API finta ha il tipo del servizio vero (`Promise<typeof XService>`).
- `Button` ha `type="button"` di default (`type="submit"` nei form) e `ariaLabel` per i bottoni con sola icona; `Input.setValue` riceve una stringa, limiti con `maxLength` da `src/constant/limits.ts`.
- Touch target ≥ ~36 px su telefono; nessuno scroll orizzontale a 375 px.
- Prezzo e durata solo da `EDITION_PRICE = 99` e `EDITION_MONTHS = 12` (`src/constant/platform.ts`); contatti vuoti = voce nascosta, mai valori inventati.
- Con `VITE_ROOT_DOMAIN` vuoto l'app deve comportarsi esattamente come oggi.
- Formattare solo i file toccati: `npx --yes prettier@3.6.2 --write <file>`.
- Aggiornare `API.md` nello stesso task che cambia un file `api/`, un tipo di payload o una regola dei mock.
- Commit alla fine di ogni task sul branch `feat/landing-attivazione`, messaggio in inglese stile Conventional Commits, chiuso da `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Come si verifica (non c'è un test runner)

- **Funzioni pure**: script di asserzioni `.mts` **fuori dal repository** (es. nella scratchpad della sessione, qui `$SCRATCH`), eseguiti dalla radice del repo con `npx --yes tsx@4.19.2 $SCRATCH/<nome>.mts`; importano i moduli con `await import(\`${process.cwd()}/src/...\`)`. Non si committano. I moduli testati così non devono importare `src/constant/env.ts` (usa `import.meta.env`).
- **Build e lint**: `npm run build` e `npm run lint` devono finire senza errori.
- **Nel browser**: avviare Vite via Bash in background (il preview non riesce a lanciarlo da `~/Desktop`):
  `VITE_MOCKING=true VITE_ROOT_DOMAIN=localhost npx vite --port 5199 --strictPort`
  e aprire `http://localhost:5199` (landing) e `http://pesce.localhost:5199` (sagra). Per il controllo "come oggi" rilanciare senza `VITE_ROOT_DOMAIN`. Chrome/Firefox risolvono `*.localhost` da soli.

## Review Focus

1. **Doppio tocco su "Registra e paga" o su [Attiva]** (telefono): deve partire una sola richiesta → bottone disabilitato e guardia `isPending` (Task 5, Task 7).
2. **Indirizzo già preso tra il controllo e l'invio** (`409` da `POST /api/signup`): errore sul campo indirizzo con focus, resto del form intatto (Task 5).
3. **`VITE_ROOT_DOMAIN` vuoto**: nessun header `X-Sagra`, nessun link "Registra la tua sagra", sagra sempre attiva nei mock, `/` è il sito clienti (Task 1, Task 6, Task 10).
4. **Landing a 375 px**: le anteprime disegnate in CSS non devono allargare la pagina (Task 3).
5. **Ritorno ripetuto su `/login?attivazione=ok`** (ricarica, preferito): il messaggio compare solo alla prima apertura, "Pagamento in verifica" si ferma dopo 2 minuti (Task 7).

---

### Task 0: Branch di lavoro

**Prerequisito:** nella cartella ci sono modifiche non committate di un altro lavoro (sezione Riepilogo, preset, piatti esauriti, bigliettini) che toccano `CashierHome.tsx`, `permissions.ts`, `Profile.tsx`, `pages.ts`, `features/orders/mock/orders.ts`. Devono essere committate dal loro autore **prima** di iniziare: questo piano le dà per presenti.

- [ ] **Step 1:** `git status --short` mostra solo `founder/` e `docs/` non tracciati (nessun file `M`). Altrimenti fermarsi e chiedere.
- [ ] **Step 2:** `git switch -c feat/landing-attivazione` dal `main` aggiornato.

---

### Task 1: Host, variabili d'ambiente e header `X-Sagra`

**Files:**
- Create: `src/helpers/host.ts`, `src/helpers/site.ts`
- Modify: `src/constant/env.ts`, `src/vite-env.d.ts`, `src/services/client/httpClient.ts`, `.env.example`, `API.md` (Convenzioni generali, CORS, Errori)

**Interfaces:**
- Produces:
  - `host.ts` (puro, nessun import): `parseSagraSlug(hostname: string, rootDomain: string): string | null`; `hostUrl(protocol: string, hostname: string, port: string, path: string): string`
  - `env.ts`: `ROOT_DOMAIN: string` (da `VITE_ROOT_DOMAIN`, minuscolo, `""` se assente), `DEMO_URL: string` (da `VITE_DEMO_URL`, `""` se assente)
  - `site.ts`: `sagraSlug: string | null`, `isPlatformHost: boolean`, `sagraUrl(slug: string, path: string): string`, `platformUrl(path: string): string` (calcolati da `window.location` + `ROOT_DOMAIN`)

- [ ] **Step 1: Scrivere `$SCRATCH/check-host.mts`**

```ts
import assert from "node:assert/strict";
const { parseSagraSlug, hostUrl } = await import(`${process.cwd()}/src/helpers/host.ts`);
assert.equal(parseSagraSlug("pesce.localhost", "localhost"), "pesce");
assert.equal(parseSagraSlug("PESCE.Ristosagra.it", "ristosagra.it"), "pesce");
assert.equal(parseSagraSlug("localhost", "localhost"), null);
assert.equal(parseSagraSlug("ristosagra.it", "ristosagra.it"), null);
assert.equal(parseSagraSlug("www.ristosagra.it", "ristosagra.it"), null);
assert.equal(parseSagraSlug("a.b.ristosagra.it", "ristosagra.it"), null);
assert.equal(parseSagraSlug("evilristosagra.it", "ristosagra.it"), null);
assert.equal(parseSagraSlug("pesce.localhost", ""), null);
assert.equal(parseSagraSlug("127.0.0.1", "localhost"), null);
assert.equal(hostUrl("http:", "pesce.localhost", "5199", "/login"), "http://pesce.localhost:5199/login");
assert.equal(hostUrl("https:", "ristosagra.it", "", "/"), "https://ristosagra.it/");
console.log("host ok");
```

- [ ] **Step 2:** `npx --yes tsx@4.19.2 $SCRATCH/check-host.mts` → FAIL (modulo inesistente).
- [ ] **Step 3: Implementare `host.ts`**: slug = l'unica etichetta prima di `.${rootDomain}` (confronto in minuscolo); `null` se `rootDomain` è vuoto, se l'host è il dominio stesso, se l'etichetta è `www` o se ci sono più etichette.
- [ ] **Step 4:** rieseguire lo script → `host ok`.
- [ ] **Step 5: `env.ts`, `vite-env.d.ts`, `site.ts`**: aggiungere `VITE_ROOT_DOMAIN?` e `VITE_DEMO_URL?` a `ImportMetaEnv`. `site.ts`: `sagraSlug = parseSagraSlug(location.hostname, ROOT_DOMAIN)`, `isPlatformHost = ROOT_DOMAIN !== "" && sagraSlug === null`; `sagraUrl` usa l'host `${slug}.${ROOT_DOMAIN}`, `platformUrl` l'host `ROOT_DOMAIN`, entrambi con protocollo e porta correnti via `hostUrl`.
- [ ] **Step 6: `httpClient.ts`**: in `request()` aggiungere `headers["X-Sagra"] = sagraSlug` quando `sagraSlug` non è `null`, con un commento sul perché (il backend sceglie la sagra da qui). Senza sagra nell'host nessun header.
- [ ] **Step 7: `.env.example`**: `VITE_ROOT_DOMAIN=` (commento: vuoto = una sola sagra come oggi; in sviluppo `localhost` → `localhost:5199` landing, `<slug>.localhost:5199` sagra) e `VITE_DEMO_URL=` (commento: indirizzo della demo, vuoto = bottone nascosto).
- [ ] **Step 8: `API.md`**: tra le Convenzioni la riga "Sagra" (`X-Sagra: <slug>` su ogni chiamata dal sottodominio; per il personale vale la sagra del token e deve coincidere, altrimenti `403`); in CORS aggiungere `X-Sagra` agli header consentiti e `Access-Control-Max-Age` alto; in Errori la riga `402` = "sagra non attiva: errore generico, la UI non offre quelle azioni".
- [ ] **Step 9:** `npm run build && npm run lint` → nessun errore. Con i mock non partono richieste, quindi si verifica l'header contro un finto backend che lo stampa: avviare in background `node -e "require('http').createServer((q,s)=>{console.log(q.url,q.headers['x-sagra']);s.setHeader('content-type','application/json');s.end('{}')}).listen(8080)"`, poi Vite con `VITE_MOCKING=false VITE_ROOT_DOMAIN=localhost`. Aprendo `pesce.localhost:5199` il server stampa `/api/restaurant pesce`; rilanciando Vite senza `VITE_ROOT_DOMAIN` e aprendo `localhost:5199` stampa `/api/restaurant undefined`. Chiudere entrambi i processi.
- [ ] **Step 10:** prettier sui file toccati, commit `feat: add host-based sagra detection and X-Sagra header`.

---

### Task 2: Guscio della piattaforma e `/accedi`

**Files:**
- Create: `src/pages/Platform/PlatformApp.tsx`, `src/pages/Platform/AccessSagra.tsx`, `src/features/platform/utils/slug.ts` (solo `normalizeSlugInput`, il resto nel Task 4)
- Modify: `src/App.tsx`, `src/hooks/useTheme.ts`, `src/main.tsx`

**Interfaces:**
- Consumes: `isPlatformHost`, `sagraUrl` (Task 1)
- Produces: `PlatformApp` (export nominato, rotte `/accedi` + `*` → `/`; il Task 3 aggiunge `/`, il Task 5 `/registrati`); `applyPlatformAppearance(): void` in `useTheme.ts`; `normalizeSlugInput(value: string, rootDomain: string): string` — pura (il dominio arriva come parametro): minuscolo, spazi tolti, e se è stato incollato un indirizzo intero toglie protocollo, percorso, porta e il suffisso `.${rootDomain}` (`"https://Pesce.localhost:5199/login"` → `"pesce"`)

- [ ] **Step 1: `useTheme.ts`**: esportare `applyPlatformAppearance()` = `applyAppearance(RestaurantTheme.Light, DEFAULT_BRAND_COLOR)`.
- [ ] **Step 2: `main.tsx`**: `isPlatformHost ? applyPlatformAppearance() : applyCachedAppearance()` al posto della sola chiamata di oggi.
- [ ] **Step 3: `App.tsx`**: estrarre le rotte di oggi in un componente `SagraRoutes` (con dentro `useTheme()`); `App` rende `PlatformApp` (lazy, come gli altri chunk) se `isPlatformHost`, altrimenti `SagraRoutes`. `Toast`, `BrowserRouter` e `Suspense` restano comuni.
- [ ] **Step 4: `AccessSagra.tsx`** (`/accedi`): titolo "Accedi alla tua sagra", un `Input` "Indirizzo della tua sagra" con suffisso visibile `.${ROOT_DOMAIN}`, bottone submit "Vai alla login"; al submit `normalizeSlugInput` → se non rispetta il formato di `slugError` (Task 4: per ora solo non vuoto) errore "Scrivi l'indirizzo della tua sagra" sotto al campo, altrimenti `location.assign(sagraUrl(slug, "/login"))`. Link "Non hai ancora una sagra? Registrala" → `/registrati`, "Torna alla presentazione" → `/`. Layout come `CashierLogin`.
- [ ] **Step 5:** `npm run build && npm run lint`. Browser con `VITE_ROOT_DOMAIN=localhost`: `localhost:5199/accedi` mostra il form in tema chiaro; "Pesce.localhost:5199" incollato porta a `http://pesce.localhost:5199/login`; `pesce.localhost:5199/` è il sito clienti di oggi; senza `VITE_ROOT_DOMAIN`, `localhost:5199/accedi` torna a `/` (sito clienti).
- [ ] **Step 6:** prettier, commit `feat: add platform shell and sagra access page`.

---

### Task 3: Landing

**Files:**
- Create: `src/constant/platform.ts`, `src/pages/Platform/Landing.tsx`, `src/features/platform/components/landing/` → `LandingHeader.tsx`, `Hero.tsx`, `AppPreviews.tsx`, `WhatItIs.tsx`, `HowItWorks.tsx`, `Benefits.tsx` (Perché conviene + Si adatta), `Pricing.tsx`, `Trust.tsx`, `Faq.tsx`, `LandingFooter.tsx`; `src/features/platform/utils/landingFaq.ts` (domande e risposte come dati)
- Modify: `src/pages/Platform/PlatformApp.tsx` (rotta `/`)

**Interfaces:**
- Consumes: `DEMO_URL` (Task 1)
- Produces: `src/constant/platform.ts` → `EDITION_PRICE = 99`, `EDITION_MONTHS = 12`, `SUPPORT_PHONE = ""`, `SUPPORT_EMAIL = ""` (i testi scrivono `€${EDITION_PRICE}`)

Testi, ordine delle sezioni, ancore (`#come-funziona`, `#prezzo`, `#domande`) e FAQ: **esattamente come nella spec**, sezione "Landing". Le anteprime (`AppPreviews`) sono tre riquadri disegnati con elementi HTML/CSS e dati di esempio statici (telefono con 3 piatti e prezzo, schermo cucina con 2 comande, schermo "Pronti" con 4 numeri), `aria-hidden`. Per la direzione visiva l'implementatore può usare la skill `frontend-design:frontend-design`, restando dentro `ThemeVariants` e i font esistenti.

- [ ] **Step 1:** costanti e `landingFaq.ts` (array di `{ question: string; answer: string }` con le 7 FAQ della spec).
- [ ] **Step 2:** sezioni e `Landing.tsx` (imposta `document.title = "Ristosagra · Il gestionale per la tua sagra"` in un effetto); "Prova la demo" solo se `DEMO_URL` non è vuoto (`<a href={DEMO_URL}>`); telefono/email nel footer solo se non vuoti (`tel:`/`mailto:`); FAQ con `Accordion`, una aperta alla volta; tutti i CTA "Inizia"/"Attiva" → `/registrati`, "Accedi" → `/accedi`.
- [ ] **Step 3:** rotta `/` in `PlatformApp`.
- [ ] **Step 4:** `npm run build && npm run lint`.
- [ ] **Step 5: Browser** (`VITE_ROOT_DOMAIN=localhost`, senza `VITE_DEMO_URL`): a 375 px e a 1280 px tutte le 10 sezioni nell'ordine della spec; **a 375 px `document.documentElement.scrollWidth === 375`** (Review Focus 4: verificarlo con `javascript_tool`); i link della barra scorrono alle ancore; nessun bottone "Prova la demo" e nessun contatto nel footer; rilanciando con `VITE_DEMO_URL=https://demo.example` il bottone compare con quell'indirizzo.
- [ ] **Step 6:** prettier, commit `feat: add Ristosagra landing page`.

---

### Task 4: Regole di slug e form di registrazione (funzioni pure)

**Files:**
- Create: `src/features/platform/types/platform.ts`, `src/features/platform/utils/signupForm.ts`
- Modify: `src/features/platform/utils/slug.ts`, `src/constant/limits.ts`

**Interfaces:**
- Produces:
  - Tipi della spec (`BillingAddress`, `BillingDetails`, `SignupRequest`, `SignupResponse`, `Billing`) + `SlugAvailability = { available: boolean }`
  - Form: `BillingDraft` (tutte stringhe: `holder, taxCode, sdiCode, pec, street, zip, city, province`), `SignupDraft` (`restaurantName, slug, ownerName, email, phone, password, passwordConfirm: string; billing: BillingDraft`), `EMPTY_SIGNUP_DRAFT`
  - `slug.ts`: `RESERVED_SLUGS: readonly string[]` (`www, demo, api, app, admin, mail, assets, static`), `slugify(name: string): string`, `slugError(slug: string): string | null`, `normalizeSlugInput` (Task 2)
  - `signupForm.ts`: `type FieldErrors<K extends string> = Partial<Record<K, string>>`; `billingErrors(d: BillingDraft): FieldErrors<keyof BillingDraft>`; `signupErrors(d: SignupDraft): { fields: FieldErrors<Exclude<keyof SignupDraft, "billing">>; billing: FieldErrors<keyof BillingDraft> }`; `hasErrors(e): boolean`; `toBillingDetails(d: BillingDraft): BillingDetails` (trim, `taxCode`/`sdiCode`/`province` maiuscoli, `sdiCode`/`pec` omessi se vuoti); `toBillingDraft(b: BillingDetails): BillingDraft`; `toSignupRequest(d: SignupDraft): SignupRequest` (trim, email e slug minuscoli); `signupRequestValid(r: SignupRequest): boolean` e `billingDetailsValid(b: BillingDetails): boolean` (riusano le stesse regole, per i mock)
  - `limits.ts`: `SLUG_MIN = 3`, `SLUG_MAX = 30`, `EMAIL_MAX = 254`, `PHONE_MAX = 20`, `PASSWORD_MIN = 8`, `PASSWORD_MAX = 200`, `BILLING_HOLDER_MAX = 100`, `STREET_MAX = 100`, `CITY_MAX = 60`; nome sagra = `RESTAURANT_NAME_MAX` (40), nome titolare = `PERSON_NAME_MAX` (60)

Messaggi (esatti): obbligatorio "Campo obbligatorio"; slug lunghezza "Da 3 a 30 caratteri", caratteri "Solo lettere minuscole, numeri e trattini", trattino ai bordi "Non può iniziare o finire con un trattino", riservato "Indirizzo riservato, scegline un altro"; email "Email non valida"; telefono (6–20 tra cifre, spazi, `+`) "Telefono non valido"; password "Almeno 8 caratteri"; conferma "Le password non coincidono"; CF/P.IVA (11 cifre o 16 alfanumerici) "Codice fiscale o P.IVA non valido"; SDI "Il codice SDI ha 7 caratteri"; PEC "PEC non valida"; CAP "CAP di 5 cifre"; provincia "Sigla di 2 lettere (es. VR)".

- [ ] **Step 1: Scrivere `$SCRATCH/check-signup.mts`**

```ts
import assert from "node:assert/strict";
const root = process.cwd();
const { slugify, slugError } = await import(`${root}/src/features/platform/utils/slug.ts`);
const f = await import(`${root}/src/features/platform/utils/signupForm.ts`);

assert.equal(slugify("Sagra del Pesce di Ponte"), "sagra-del-pesce-di-ponte");
assert.equal(slugify("Festa dell'Unità – 2027!"), "festa-dell-unita-2027");
assert.equal(slugify("  Àèìòù  "), "aeiou");
const long = slugify("a".repeat(29) + " b c");
assert.ok(long.length <= 30 && !long.endsWith("-"));
assert.equal(slugError("pesce"), null);
assert.equal(slugError("ab"), "Da 3 a 30 caratteri");
assert.equal(slugError("www"), "Indirizzo riservato, scegline un altro");
assert.equal(slugError("-pesce"), "Non può iniziare o finire con un trattino");
assert.equal(slugError("pe_sce"), "Solo lettere minuscole, numeri e trattini");

const billing = { holder: "Pro Loco di Ponte", taxCode: "01234567890", sdiCode: "", pec: "",
  street: "Via Roma 1", zip: "37100", city: "Verona", province: "vr" };
const ok = { restaurantName: "Sagra del Pesce", slug: "pesce", ownerName: "Anna Rossi",
  email: "Anna@Example.it", phone: "+39 333 1234567", password: "segreta1",
  passwordConfirm: "segreta1", billing };
assert.equal(f.hasErrors(f.signupErrors(ok)), false);
assert.equal(f.signupErrors({ ...ok, passwordConfirm: "x" }).fields.passwordConfirm, "Le password non coincidono");
assert.equal(f.signupErrors({ ...ok, password: "corta", passwordConfirm: "corta" }).fields.password, "Almeno 8 caratteri");
assert.equal(f.signupErrors({ ...ok, email: "anna" }).fields.email, "Email non valida");
assert.equal(f.billingErrors({ ...billing, taxCode: "123" }).taxCode, "Codice fiscale o P.IVA non valido");
assert.equal(f.billingErrors({ ...billing, taxCode: "RSSMRA80A01H501U" }).taxCode, undefined);
assert.equal(f.billingErrors({ ...billing, sdiCode: "ABC" }).sdiCode, "Il codice SDI ha 7 caratteri");
assert.equal(f.billingErrors({ ...billing, sdiCode: "0000000" }).sdiCode, undefined);
assert.equal(f.billingErrors({ ...billing, pec: "x" }).pec, "PEC non valida");
assert.equal(f.billingErrors({ ...billing, zip: "1234" }).zip, "CAP di 5 cifre");
assert.equal(f.billingErrors({ ...billing, province: "Roma" }).province, "Sigla di 2 lettere (es. VR)");
const req = f.toSignupRequest(ok);
assert.equal(req.owner.email, "anna@example.it");
assert.equal(req.billing.address.province, "VR");
assert.equal("sdiCode" in req.billing, false);
assert.equal(f.signupRequestValid(req), true);
assert.equal(f.signupRequestValid({ ...req, slug: "www" }), false);
console.log("signup ok");
```

- [ ] **Step 2:** eseguire → FAIL.
- [ ] **Step 3: Implementare** tipi, limiti, `slug.ts`, `signupForm.ts`. `slugify`: `normalize("NFD")` e rimozione dei segni diacritici, minuscolo, ogni sequenza non `a-z0-9` → `-`, trattini ai bordi tolti, taglio a `SLUG_MAX` e di nuovo trattini finali tolti. `slug.ts` e `signupForm.ts` non importano `env.ts`.
- [ ] **Step 4:** eseguire → `signup ok`; `npm run build && npm run lint`.
- [ ] **Step 5:** prettier, commit `feat: add signup and billing validation rules`.

---

### Task 5: Pagina di registrazione e API della piattaforma

**Files:**
- Create: `src/helpers/checkoutUrl.ts`, `src/hooks/useDebouncedValue.ts`, `src/features/platform/api/platform.ts`, `src/features/platform/hook/usePlatform.ts`, `src/features/platform/mock/platform.ts`, `src/features/platform/mock/handoff.ts`, `src/features/platform/components/SlugField.tsx`, `src/features/platform/components/BillingFields.tsx`, `src/features/platform/components/SignupForm.tsx`, `src/pages/Platform/Signup.tsx`
- Modify: `src/features/orders/utils/onlinePayment.ts` (spostare `safeCheckoutUrl` in `checkoutUrl.ts` e ri-esportarlo da qui: `Cart.tsx` non cambia), `src/pages/Platform/PlatformApp.tsx` (rotta `/registrati`), `API.md`

**Interfaces:**
- Consumes: tipi e funzioni del Task 4, `sagraUrl` (Task 1)
- Produces:
  - `safeCheckoutUrl(url: string): string | null` in `src/helpers/checkoutUrl.ts`
  - `useDebouncedValue<T>(value: T, ms: number): T`
  - `PlatformService = { checkSlug(slug: string): Promise<SlugAvailability>; signup(req: SignupRequest): Promise<SignupResponse> }` — `GET /api/signup/slug/${encodeURIComponent(slug)}`, `POST /api/signup` con `{ auth: false }`
  - Hook: `useSlugAvailability(slug: string)` (query `["slug", slug]`, attiva solo se `slugError(slug) === null`), `useSignup()` (mutation)
  - `handoff.ts`: `MOCK_SIGNUP_KEY = "mock-signup"`, `type MockHandoff = Pick<SignupRequest, "restaurantName" | "owner" | "billing">`, `encodeHandoff(h: MockHandoff): string` (`#mock-signup=` + base64url del JSON UTF-8, con `TextEncoder` + `btoa`), `readHandoff(hash: string): MockHandoff | null` (con type guard)
  - `BillingFields` (props `{ value: BillingDraft; onChange: (v: BillingDraft) => void; errors: FieldErrors<keyof BillingDraft> }`), riusato nel Task 9

- [ ] **Step 1: API e mock**. `fakePlatformApi.checkSlug` → `{ available: slugError(slug) === null }` (i mock non vedono le altre sagre); `signup` → `400` se `!signupRequestValid(req)`, altrimenti `{ slug, checkoutUrl: sagraUrl(slug, "/login?attivazione=ok") + encodeHandoff(...) }`, con `fakeDelay(1000)`. Commento: frammento mai inviato ai server, password in chiaro solo nei dati finti.
- [ ] **Step 2: Form**. Tre blocchi della spec ("La sagra", "Il titolare", "Dati per la fattura"), stato `SignupDraft`; lo slug segue `slugify(nome)` finché l'utente non lo modifica a mano (flag `slugTouched`), l'input dello slug passa da `normalizeSlugInput`; `SlugField` mostra `.${ROOT_DOMAIN}` accanto e, dopo `useDebouncedValue(slug, 400)`, "Indirizzo libero" / "Già in uso" / l'errore di `slugError`. Al submit: `signupErrors` → errori sotto ai campi e focus sul primo campo con errore; altrimenti `signup(toSignupRequest(draft))`.
- [ ] **Step 3: Esito dell'invio**. Successo: `safeCheckoutUrl(checkoutUrl)` → `location.assign`; se `null`, messaggio generale. `409` → errore "Questo indirizzo è già in uso" sul campo slug e focus (Review Focus 2). Altri errori → "Registrazione non riuscita: controlla la connessione e riprova" sopra al bottone, form intatto. Bottone "Registra e paga €99" (`EDITION_PRICE`) disabilitato e "Invio…" mentre `isPending`, con guardia `if (isPending) return` nel submit (Review Focus 1). Sotto: "Hai già una sagra? Accedi" → `/accedi`.
- [ ] **Step 4: `AccessSagra`**: sostituire il controllo provvisorio del Task 2 con `slugError`.
- [ ] **Step 5: `API.md`**: nuova sezione "Piattaforma: registrazione e attivazione" (dopo "Login") con `GET /api/signup/slug/:slug` e `POST /api/signup` come da tabella della spec, tipi `SignupRequest`, `SignupResponse`, `BillingDetails`, `BillingAddress` in "Tipi di dati", righe nel riepilogo endpoint; nota sui mock (frammento `#mock-signup`).
- [ ] **Step 6:** `npm run build && npm run lint`.
- [ ] **Step 7: Browser** (`localhost:5199/registrati`, telefono 375 px e desktop): invio vuoto → errori e focus sul primo; nome "Sagra del Pesce" → indirizzo `sagra-del-pesce`, modificato a mano non segue più il nome; `www` → "Indirizzo riservato…"; doppio clic veloce su invio → una sola chiamata a `signup` (un `console.count` temporaneo nel mock, poi tolto); dati validi con nome "Sagra del Pesce" → si arriva su `http://sagra-del-pesce.localhost:5199/login?attivazione=ok#mock-signup=…` (il frammento lo consuma il Task 6). Per il `409`: forzarlo temporaneamente nel mock e controllare errore e focus, poi ripristinare.
- [ ] **Step 8:** prettier, commit `feat: add sagra signup page with slug check`.

---

### Task 6: Attivazione nei dati e nei mock

**Files:**
- Create: `src/features/platform/api/billing.ts`, `src/features/platform/hook/useBilling.ts`, `src/features/platform/mock/billingStore.ts`, `src/features/platform/mock/billing.ts`, `src/features/platform/utils/edition.ts`, `src/mock/signupHandoff.ts`
- Modify: `src/features/restaurant/types/restaurant.ts`, `src/features/restaurant/mock/restaurant.ts`, `src/features/restaurant/hook/useRestaurant.ts`, `src/features/staff/mock/auth.ts`, `src/features/orders/mock/orders.ts`, `src/features/reservations/mock/reservations.ts`, `src/main.tsx`, `API.md`

**Interfaces:**
- Consumes: tipi e `billingDetailsValid` (Task 4), `readHandoff` (Task 5), `sagraSlug` (Task 1)
- Produces:
  - `RestaurantProfile.active: boolean`; `RestaurantProfileUpdate = Partial<Omit<RestaurantProfile, "active">>`
  - `useRestaurant(options?: { refetchInterval?: number | false })`
  - `BillingService = { getBilling(): Promise<Billing>; updateBilling(details: BillingDetails): Promise<Billing>; checkout(): Promise<{ checkoutUrl: string }> }` (`GET`/`PATCH /api/billing`, `POST /api/billing/checkout` con corpo `{}`)
  - Hook: `useBilling()` (query `["billing"]`), `useUpdateBilling()` (aggiorna la cache `["billing"]`), `useActivationCheckout()` (mutation; al successo non tocca la cache: si esce dalla pagina)
  - `edition.ts`: `addEdition(fromIso: string | null, now: Date): string` → `max(now, from) + EDITION_MONTHS` mesi in ISO; `formatPaidUntil(iso: string): string` → `toLocaleDateString("it-IT")`
  - `billingStore.ts` (nessun import da `staff/mock`): `billingStore` (`createMockStore<{ paidUntil: string | null; details: BillingDetails }>("billing.v1", seed)`), `isSagraActive(): boolean`, `requireActiveSagra(): void` (lancia `HttpError(402)`)
  - `restaurant.ts` mock: esportare `restaurantStore`
  - `consumeSignupHandoff(): void` in `src/mock/signupHandoff.ts`

- [ ] **Step 1: Tipi e hook**: `active` nel profilo; `useRestaurant` accetta `refetchInterval`; `billing.ts` + `useBilling.ts` con il loader `IS_MOCKING` come gli altri.
- [ ] **Step 2: Store finto**: seme attivo per 12 mesi (`addEdition(null, new Date())`) **se `sagraSlug === null`** (nessun sottodominio: demo e sviluppo di oggi), altrimenti `paidUntil: null`; `details` di esempio ("Pro Loco di esempio", `01234567890`, "Via Roma 1", `37100`, "Verona", `VR`). `isSagraActive` = `paidUntil` nel futuro.
- [ ] **Step 3: Regole finte**: `getProfile` restituisce `{ ...readProfile(), active: isSagraActive() }` e `updateProfile` ignora `active` nelle modifiche; `requireRole` lancia `402` per i ruoli non gestori se `!isSagraActive()` (commento: i gestori preparano la sagra anche non attiva); `requireActiveSagra()` all'inizio di `createOrder`, `createCashierOrder` e di ogni mutazione degli ordini (pagato, piatti, pronto, consegnato, comande) e di `createReservation`. `getOrders` resta permesso ai gestori (serve al riepilogo del Profilo).
- [ ] **Step 4: `fakeBillingApi`**: `getBilling` (`requireManager`) → `{ active, paidUntil, details }`; `updateBilling` → `400` se `!billingDetailsValid`; `checkout` → `409` se attiva, altrimenti `paidUntil = addEdition(paidUntil, new Date())` e `{ checkoutUrl: "/login?attivazione=ok" }` (commento: pagamento finto immediato, come per gli ordini online).
- [ ] **Step 5: Passaggio della registrazione**: `consumeSignupHandoff` legge `readHandoff(location.hash)`; se c'è, toglie subito il frammento (`history.replaceState` sull'URL senza hash) e scrive: nome in `restaurantStore`, `staffStore.set([{ id: "s-admin", name: owner.name, role: StaffRole.Admin, username: owner.email, password: owner.password, enabled: true }])`, `billingStore.set({ paidUntil: addEdition(null, new Date()), details: billing })`. In `main.tsx` il render parte dopo `IS_MOCKING ? import("./mock/signupHandoff").then((m) => m.consumeSignupHandoff()) : Promise.resolve()`.
- [ ] **Step 6: `API.md`**: `active` in `RestaurantProfile` e in `GET /api/restaurant` (`404` per slug inesistente); `GET`/`PATCH /api/billing`, `POST /api/billing/checkout` (`409` se attiva), tipo `Billing`; flusso del pagamento con ritorno su `/login?attivazione=ok|annullata`, attivazione solo da webhook, `paidUntil = max(adesso, paidUntil) + 12 mesi`; tabella "sagra non attiva" con le chiamate rifiutate con `402`; in "Da fare lato backend": webhook firmato, slug riservati, limite di tentativi su `/api/signup`; nota sui mock (seme attivo solo senza sottodominio, handoff).
- [ ] **Step 7:** `npm run build && npm run lint`.
- [ ] **Step 8: Browser**: registrazione completa dal Task 5 → su `sagra-del-pesce.localhost:5199/login` il frammento sparisce dall'indirizzo; login con l'email (anche scritta con maiuscole) e la password scelte → dashboard con tutte le pagine del titolare, `admin`/`admin` non entra più; `prova.localhost:5199`: `admin`/`admin` entra, in console `(await (await import("/src/features/restaurant/mock/restaurant.ts")).fakeRestaurantApi.getProfile()).active === false`; senza `VITE_ROOT_DOMAIN` la sagra è attiva e tutto funziona come oggi (Review Focus 3).
- [ ] **Step 9:** prettier, commit `feat: add sagra activation state, billing API and mock rules`.

---

### Task 7: Area del personale con la sagra non attiva

**Files:**
- Create: `src/features/platform/utils/activationReturn.ts`, `src/features/platform/components/ActivationBanner.tsx`
- Modify: `src/features/staff/utils/permissions.ts`, `src/pages/Cashier/CashierHome.tsx`, `src/pages/Cashier/CashierLogin.tsx`

**Interfaces:**
- Consumes: `useRestaurant({ refetchInterval })`, `useActivationCheckout` (Task 6), `safeCheckoutUrl` (Task 5), `platformUrl`, `ROOT_DOMAIN` (Task 1), `useNow` (esistente)
- Produces:
  - `activationReturn.ts`: `ACTIVATION_PARAM = "attivazione"`, `ActivationOutcome = { Ok: "ok", Cancelled: "annullata" } as const` (+ tipo), `readActivationReturn(): ActivationOutcomeConst | null` (sola lettura), `clearActivationReturn(outcome): void` (toglie il parametro; con `ok` salva l'ora in sessionStorage `ristosagra.activationPending`), `activationPendingSince(): number | null`, `clearActivationPending(): void`, `ACTIVATION_POLL_MS = 5000`, `ACTIVATION_WAIT_MS = 120000`
  - `staffPages`: con `profile?.active === false` i gestori hanno solo `PROFILE` e `FLORPLAN`, gli altri ruoli `[]`

- [ ] **Step 1: `permissions.ts`**: regola in `staffPages` (aggiornare il commento sopra).
- [ ] **Step 2: `CashierHome.tsx`**: con `restaurant.active === false` il messaggio senza pagine diventa "La sagra non è ancora attiva: chiedi al titolare di attivarla."; per i gestori `ActivationBanner` subito sopra `main`, visibile in cima anche su telefono (controllare le classi `order` di `NavBar`).
- [ ] **Step 3: `ActivationBanner`**: pending = `activationPendingSince()` entro `ACTIVATION_WAIT_MS` da `useNow()`; `useRestaurant({ refetchInterval: pending ? ACTIVATION_POLL_MS : false })`. Testo "La sagra non è online · Attivala per €99 (12 mesi)" + [Attiva] oppure, se pending, "Pagamento in verifica…" con `Spinner`. [Attiva] → `useActivationCheckout`, disabilitato mentre `isPending` (Review Focus 1) → `safeCheckoutUrl` → `location.assign`; `409` → `refetch` del ristorante; altri errori → toast di errore. Effetto: quando `active` diventa vero con un pending in corso → `clearActivationPending()` e toast "La sagra è online".
- [ ] **Step 4: `CashierLogin.tsx`**: `useState(readActivationReturn)` + effetto `clearActivationReturn` (prima dell'eventuale `<Navigate>`); messaggi della spec per `ok` e `annullata` sopra al form; titolo = nome della sagra da `useRestaurant()` se c'è, altrimenti "Accesso personale"; solo con `ROOT_DOMAIN`: placeholder "Username (titolare: la tua email)" e link "Non hai un account? Registra la tua sagra" → `platformUrl("/registrati")`. Senza `ROOT_DOMAIN` la pagina resta identica a oggi.
- [ ] **Step 5:** `npm run build && npm run lint`.
- [ ] **Step 6: Browser** su `prova.localhost:5199`: `admin` vede Profilo + Piantina e il banner (anche a 375 px); `cassa` vede "chiedi al titolare"; [Attiva] con doppio clic → una sola chiamata a `checkout`, si torna alla dashboard con tutte le pagine e il toast; da disconnessi `altra.localhost:5199/login?attivazione=annullata` → messaggio di annullamento e parametro tolto dall'indirizzo; ricaricare `/login` → nessun messaggio (Review Focus 5); con `ristosagra.activationPending` impostato a 3 minuti fa il banner non dice "in verifica".
- [ ] **Step 7:** prettier, commit `feat: gate staff area and add activation banner`.

---

### Task 8: Sito clienti e schermo Pronti per sagre inesistenti o non attive

**Files:**
- Create: `src/features/platform/components/SagraUnavailable.tsx`, `src/features/platform/components/SagraGate.tsx`
- Modify: `src/App.tsx` (dentro `SagraRoutes`)

**Interfaces:**
- Consumes: `useRestaurant` (Task 6), `platformUrl`, `ROOT_DOMAIN` (Task 1)
- Produces: `SagraUnavailable({ reason: "missing" | "offline"; name?: string })`; `SagraGate({ children, allowInactive?: boolean })` — `HttpError` `404` → `missing`; `active === false` e non `allowInactive` → `offline`; durante il caricamento e in ogni altro caso → `children` (nessun ritardo per le sagre attive)

Testi: `missing` → "Questa sagra non esiste" + "Controlla l'indirizzo"; `offline` → nome della sagra + "Questa sagra non è ancora online" + "Torna a trovarci durante la sagra". Link "Scopri Ristosagra" → `platformUrl("/")` solo con `ROOT_DOMAIN`. Centrato, tema della sagra (siamo sul sottodominio).

- [ ] **Step 1:** componenti.
- [ ] **Step 2:** in `SagraRoutes`: `/` e `/pronti` dentro `SagraGate`, `/login` dentro `SagraGate allowInactive`; `/dashboard` invariato (ci pensa il Task 7).
- [ ] **Step 3:** `npm run build && npm run lint`.
- [ ] **Step 4: Browser**: `prova.localhost:5199/` e `/pronti` → "non è ancora online" col nome; dopo [Attiva] (Task 7) → sito clienti normale; nei mock il `404` non esiste: verificarlo forzando temporaneamente `getProfile` a lanciare `HttpError(404)` (sito clienti, `/pronti` e `/login` → "Questa sagra non esiste"), poi ripristinare.
- [ ] **Step 5:** prettier, commit `feat: show unavailable page for missing or inactive sagre`.

---

### Task 9: Profilo → "Edizione e fattura"

**Files:**
- Create: `src/pages/Cashier/profile/BillingSection.tsx`
- Modify: `src/constant/pages.ts` (`PagesProfile.BILLING: "billing"`), `src/pages/Cashier/Profile.tsx`

**Interfaces:**
- Consumes: `useBilling`, `useUpdateBilling`, `useActivationCheckout`, `formatPaidUntil` (Task 6), `BillingFields`, `billingErrors`, `hasErrors`, `toBillingDetails`, `toBillingDraft` (Task 4–5), `ProfileSection`, `SettingsCard`, `useSectionEdit` (esistenti)

- [ ] **Step 1: Voce nel Profilo**: `SectionLink` con icona `Receipt` (lucide), titolo "Edizione e fattura", riepilogo "Attiva fino al <data>" oppure "Non attiva" con `warning`; `case PagesProfile.BILLING` nello switch.
- [ ] **Step 2: Sezione**: box "Edizione" (stato, scadenza, [Attiva per €99] solo se non attiva, stesso comportamento del banner) e box "Dati per la fattura" (lettura: righe di testo; modifica: `BillingFields` su una bozza `BillingDraft`); `useSectionEdit` con un `SaveTask` `{ label: "dati per la fattura", dirty, run: () => updateBilling(toBillingDetails(draft)) }`; `saveError` = primo messaggio di `billingErrors(draft)` se ce ne sono; `canEdit` quando `billing` è caricato.
- [ ] **Step 3:** `npm run build && npm run lint`.
- [ ] **Step 4: Browser**: sagra attiva → "Attiva fino al" la data a 12 mesi; modifica con CAP "123" → Salva spento col motivo; dati validi → salvati, riaprendo la sezione restano; `prova.localhost` non attiva → "Non attiva" in rosso e [Attiva per €99].
- [ ] **Step 5:** prettier, commit `feat: add edition and billing section to profile`.

---

### Task 10: Documentazione e giro completo

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: `CLAUDE.md`**: in Routing gli host (`VITE_ROOT_DOMAIN`, `PlatformApp` con `/`, `/registrati`, `/accedi`; vuoto = una sola sagra), `X-Sagra` in "API & Mocking", la feature `platform` nella struttura, la regola della sagra non attiva (`staffPages`, `SagraGate`, `402`), i mock (seme attivo solo senza sottodominio, handoff `#mock-signup`, `prova.localhost` per il caso non attivo), le variabili in `.env.example`, lo sviluppo con `*.localhost`, il deploy (dominio + `*.dominio` sullo stesso sito Netlify, wildcard da verificare col piano Netlify; demo = secondo sito con `VITE_MOCKING=true` e `VITE_ROOT_DOMAIN` vuoto). Breve, nello stile del file.
- [ ] **Step 2:** `npm run build && npm run lint` → puliti.
- [ ] **Step 3: Giro completo** (i 5 punti di "Verifica" della spec) a 375 px e a desktop, poi Vite **senza** `VITE_ROOT_DOMAIN`: `/` sito clienti, `/login` identica a oggi (nessun link di registrazione), nessuna richiesta con `X-Sagra`, `admin`/`admin` entra con tutte le pagine (Review Focus 3).
- [ ] **Step 4:** prettier su `CLAUDE.md`, commit `docs: document platform hosts, activation and mocks`.
