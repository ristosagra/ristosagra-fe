# Nota del CFO: Ristosagra

Non è una consulenza fiscale, contabile o legale. Prima di aprire la partita IVA e incassare, un commercialista deve verificare il regime, i contributi INPS e le tasse. Sotto, il report generato da `numbers.json`; fonti in [cfo-sources.md](cfo-sources.md). Il modello lavora **al mese**: "a month" = edizioni al mese.

**Il margine**
- Ogni edizione da €99 lascia **€55,24** (56%) dopo tasse e contributi stimati (€23,76) e trasporto del kit (€20).
- I costi fissi sono **€42 al mese**, cioè €502 l'anno, quasi tutti del commercialista (€399 l'anno).
- A regime, con 12 edizioni l'anno, il margine è **14%**.
- Il tuo tempo non è nel conto. Con circa 20 ore per edizione (4 serate × 4 ore + preparazione, stima), €55 fanno **circa €2,80 l'ora**.

**Il 2027, scenario base: 2 edizioni pagate più la pilota gratuita**
- Ricavi €198, risultato operativo **−€391**.
- Dopo le spese iniziali (€1.020, di cui €850 per 2 kit): **−€1.411**.
- Soldi che servono prima che si ripaghi: **€1.411**. Nel primo anno non si recuperano.

**La riga da guardare: quante edizioni vendi**
- Per coprire solo i costi fissi servono **9,1 edizioni pagate l'anno** (€502 ÷ €55,24). Per recuperare anche le spese iniziali nello stesso anno, **27,5**.
- Hai 10–30 contatti, e il panel stima il 5% (1 edizione). Con 1 edizione il primo anno fa −€446 di risultato operativo; con 6 edizioni −€170.
- Prezzo −10% e volume −20% spostano il risultato solo di €20 l'anno: a questa scala conta il numero di sagre, non i decimali.

**Cassa:** €1.411 se i kit sono tuoi; **€501** se il kit lo compra la sagra.

**Tre modi per migliorare il margine** (what-if eseguiti, i numeri vengono dallo strumento)
1. **Il kit lo compra la sagra**, o usa un portatile suo. Contribuzione da €55,24 a **€75,24**; spese iniziali da €1.020 a €150; cassa necessaria da €1.411 a **€501**; edizioni per coprire i fissi da 9,1 a **6,7**. Il prezzo da pagare è che il kit diventa un'obiezione in più per chi compra ("dobbiamo comprare tablet e stampanti?").
2. **Prezzo €149**, il gradino "Sagra pronta" di pricing.md. Contribuzione da €55,24 a **€93,24**, con le tasse ricalcolate al 24% di €149 (il what-if dello strumento le lascia fisse e dà €105,24, troppo ottimista). Edizioni per coprire i fissi da 9,1 a **5,4**.
3. **Più sagre, insieme al prezzo.** 6 edizioni a €149 con i kit tuoi: risultato operativo del 2027 circa **+€58** (6 × €93,24 − €502), il primo anno positivo. Resta −€962 dopo le spese iniziali.

Una quarta leva, da chiedere al commercialista e non da dare per scontata: se per la prima stagione si può lavorare senza partita IVA (prestazione occasionale), il costo fisso di €399 l'anno sparisce. Se invece l'attività va iscritta in Camera di Commercio come commerciale, i contributi INPS possono avere un minimo fisso annuo indipendente dagli incassi, e i conti peggiorano molto.

**Le condizioni del board sui soldi** ([board.md](board.md))
- *"Un prezzo detto ad alta voce prima di costruire altro"*: **fatto**, €99 a edizione.
- *"Assistenza durante le serate e una garanzia che puoi permetterti"*: **parzialmente**. La garanzia sulla prima serata costa al massimo una contribuzione (€55–75) più il trasporto. Si può permettere solo se la usano poche sagre: con 2 edizioni l'anno, una garanzia usata dimezza i ricavi.
- *"Almeno un'altra sagra fuori dalla cerchia che paga il forfait, soglia da fissare dopo il CFO"*: proposta di soglia. **Almeno 3 sagre pagate nel 2027 oltre alla pilota** per andare avanti, e un percorso verso **almeno 9 edizioni l'anno a €99** (o 6 a €149) per coprire i costi fissi. Sotto queste soglie è un hobby che costa, non un'attività.

**Le imposte:** i ricavi qui non includono IVA. Nel regime forfettario di norma non si addebita IVA in fattura: da confermare con il commercialista.

---

# Unit economics: Ristosagra (scenario base: 2 kit offline tuoi, prestati alle sagre)

Every number below comes from the input file. Nothing is looked up or guessed.

## One edizione

| line | per edizione |
| --- | ---: |
| Price | €99.00 |
| Tasse e contributi forfettario, ~24% del prezzo (stima, da verificare col commercialista) | -€23.76 |
| Trasporto del kit alla sagra e ritorno (stima) | -€20.00 |
| **Contribution** (what each edizione leaves to pay the fixed costs) | **€55.24** (56%) |

## The margin that matters

Fixed costs: €42 a month (Commercialista online forfettario (FlexTax, 399 euro/anno IVA inclusa) €33, Server cloud Hetzner (5,99 euro/mese + IVA 22%) €7, Dominio (stima, 15 euro/anno) €1).

- **Break-even: 1 edizioni a month.** Below that you lose money every month.
- **Profit margin at your plan** (1 a month): **14%** of every sale, after every cost.
- Capacity: 8 a month.

## Year 1, month by month

| month | edizioni a month | revenue | profit | cumulative (after €1,020 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | €0 | -€42 | -€1,062 |
| 2 | 0 | €0 | -€42 | -€1,104 |
| 3 | 0 | €0 | -€42 | -€1,145 |
| 4 | 0 | €0 | -€42 | -€1,187 |
| 5 | 0 | €0 | -€42 | -€1,229 |
| 6 | 1 | €99 | €13 | -€1,216 |
| 7 | 0 | €0 | -€42 | -€1,257 |
| 8 | 1 | €99 | €13 | -€1,244 |
| 9 | 0 | €0 | -€42 | -€1,286 |
| 10 | 0 | €0 | -€42 | -€1,328 |
| 11 | 0 | €0 | -€42 | -€1,369 |
| 12 | 0 | €0 | -€42 | -€1,411 |

- **Year 1 operating profit: -€391** on €198 of revenue.
- After the €1,020 startup spend: -€1,411.
- Startup money earned back: not within year 1.
- Cash you need before it pays for itself: **€1,411**.

## What if

| scenario | margin at plan | break-even a month | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 14% | 1 | -€391 |
| Price -10% | 4% | 1 | -€411 |
| Volume -20% | 3% | 1 | -€413 |
| Unit costs +15% | 7% | 1 | -€404 |

## Red flags

- Year 1 loses money on operations (-€391).
- The startup spend is not earned back within year 1.
