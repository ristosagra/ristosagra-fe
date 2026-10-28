# Fonti dei numeri del CFO

Ogni numero in `numbers.json`, con da dove viene. **Fonte** = prezzo pubblico verificabile; **Stima** = mio calcolo, da sostituire con un preventivo vero; **Tu** = risposta del fondatore.

## Prezzo

| voce | valore | origine |
|---|---:|---|
| Prezzo per edizione | €99 | **Tu**, da [pricing.md](pricing.md) e [pitch.md](pitch.md) |

## Costi per edizione

| voce | valore | origine |
|---|---:|---|
| Tasse e contributi forfettario | €23,76 (24% di €99) | **Stima** sui dati di siti di settore, non ufficiali. Imposta sostitutiva 5% nei primi cinque anni, poi 15%; contributi INPS Gestione Separata intorno al 26% (le fonti dicono 26,07% o 26,23% per il 2026); coefficiente di redditività 67% o 78%: le fonti non sono d'accordo su quale valga per il codice ATECO 62.01 ([guida forfettario 2026](https://fiscoinvestimenti.it/regime-forfettario-2026-guida-completa/), [coefficienti 2026](https://centrofiscale.com/tag/coefficienti-redditivita-2026/)). Calcolo: 78% × (5% + 26,07%) ≈ 24%; con il 67% sarebbe circa 21%. Da verificare con il commercialista e con l'INPS. |
| Trasporto del kit andata e ritorno | €20 | **Stima**: carburante per una sagra nella tua zona. Vale solo se il kit è tuo |
| Commissioni di pagamento online | non incluse | Nella pilota si paga in cassa. Se si attiva il pagamento online, le commissioni del servizio di pagamento vanno decise: chi le paga, la sagra o tu |

## Costi fissi al mese

| voce | valore | origine |
|---|---:|---|
| Commercialista online forfettario | €33,25 (€399 l'anno, IVA inclusa) | **Fonte**: [FlexTax](https://flextax.it/costo-commercialista-online-regime-forfettario/), dal rinnovo; il primo anno €366 con apertura partita IVA inclusa per un professionista, €560 se serve l'iscrizione in Camera di Commercio. Alternative: [Fidocommercialista](https://fidocommercialista.it/commercialista-forfettario) €264 l'anno + IVA, [Fiscozen](https://www.fiscozen.it/guide/quanto-costa-un-commercialista-annualmente/) da €300 + IVA |
| Server cloud | €7,31 (€5,99 + IVA 22%) | **Fonte**: [Hetzner Cloud](https://www.hetzner.com/cloud/), piano più economico, "a partire da" €5,99 al mese IVA esclusa. Con il forfettario l'IVA che paghi non si recupera, quindi è un costo |
| Dominio | €1,25 (€15 l'anno) | **Stima** |

## Spese iniziali

| voce | valore | origine |
|---|---:|---|
| 2 kit offline (mini-PC, router, gruppo di continuità, cavi) | €850 | **Stima**: 2 × €425, il punto medio della fascia €250–600 di [docs/offline.md](../docs/offline.md), anch'essa una stima. Due kit perché puoi seguire 2–3 sagre nello stesso weekend |
| Visite e demo ai contatti | €150 | **Stima**: carburante per circa 20 visite |
| Trasporto del kit per l'edizione pilota gratuita | €20 | **Stima**, come sopra |
| Sviluppo del backend | €0 in contanti | Lo fai tu: costa tempo, non soldi |

## Volumi

| voce | valore | origine |
|---|---:|---|
| Contatti per il 2027 | 10–30, uso 20 | **Tu** |
| Edizioni pagate nel 2027, scenario base | 2 (a giugno e ad agosto) | **Stima**: 20 contatti × 10%. Il panel simulato dava il 5%, che va letto come tetto massimo ([results.md](panel/results.md)); raddoppiarlo presuppone che la pilota vada bene e faccia da referenza. I mesi sono una stima: non abbiamo dati sulle date delle sagre dei tuoi contatti |
| Scenario panel | 1 edizione | 20 contatti × 5% |
| Scenario ottimista | 6 edizioni | 30 contatti × 20%, **stima** |
| Volume "a regime" (`plan_per_day`) | 1 edizione al mese, cioè 12 l'anno | **Ipotesi** per gli anni dopo il primo, solo per calcolare il margine a regime |
| Capacità | 8 edizioni al mese | **Tu** (2–3 sagre per weekend) e 2 kit: 2 sagre × 4 weekend |
| Ore per edizione | circa 20 | **Stima**: 4 serate × 4 ore di reperibilità (**Tu**) + circa 4 ore di preparazione |

Nota sul modello: lo strumento ragiona "al giorno". Qui `days_per_month` è 1, quindi ogni "per giorno" nel report vale "al mese".
