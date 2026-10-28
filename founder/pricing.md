# Prezzo: Ristosagra

Fonti: [pricing-curve.md](pricing-curve.md) (risposte del panel simulato), [competitors.md](competitors.md) (prezzi pubblici dei concorrenti). **Manca `founder/numbers.json`**: i costi non sono ancora stati calcolati, quindi il margine per edizione non è noto. Va eseguito `/founder-cfo` prima di considerare il prezzo deciso.

## 1. Il prezzo: €99 a edizione, per ora

**Cosa dice il panel** (20 organizzatori simulati, importi in euro per edizione):

| punto | prezzo | significato |
|---|---:|---|
| PMC | €40 | sotto, troppi pensano che sia troppo poco per essere affidabile |
| IPP | €101 | tanti lo chiamano un affare quanti lo chiamano caro |
| OPP | €119 | la minima resistenza in entrambe le direzioni |
| PME | €298 | sopra, troppi non comprano |

Fascia accettabile: **€40 – €298**. €99 sta dentro, quasi sull'IPP.

**Contro i concorrenti** (stesso lavoro: software per una sagra con ordini dal telefono, hardware escluso):

| concorrente | prezzo | cosa include che Ristosagra non ha |
|---|---:|---|
| MySagra cloud | €69 a settimana | stampa automatica per postazione (ma niente offline, si paga al banco) |
| **Ristosagra** | **€99 a edizione** | assistenza al telefono durante le serate |
| SagraGo | €139 una volta per sagra | funziona senza internet, magazzino, assistenza fino a 30 giorni dopo |
| SagraFacile Cloud | da €49 al giorno (circa €196 per 4 serate) | setup guidato, modulo fiscale, versione locale offline |
| Gratuiti | €0 | SagraFacile Locale, StandFacile, MySagra self-hosted |

**Perché €99 e non di più adesso:**
- Ristosagra oggi non funziona senza internet e non fa lo scontrino fiscale; SagraGo e SagraFacile sì. Costare più di loro senza queste cose non si giustifica.
- Il panel dice chiaramente che **il prezzo non è l'ostacolo**: solo 1 su 20 trova €99 troppo caro. Gli altri dicono no per fiducia (12) e abitudine (6). Alzare o abbassare il prezzo non sposta queste persone.
- €99 lascia spazio per salire: OPP €119 e la mediana di "inizia a essere caro" è €250.

**Quando rivederlo:** dopo un'edizione pilota riuscita e con il funzionamento senza internet risolto. A quel punto ha senso provare €149 (vedi punto 4).

**Margine:** non calcolato. Costi da mettere in `/founder-cfo`:
- hosting e database per ogni sagra (il contratto attuale prevede un backend per locale: un'installazione per sagra costa più di una condivisa);
- tempo del fondatore per l'assistenza al telefono durante le serate, e quante sagre può seguire nello stesso weekend;
- commissioni del pagamento online: chi le paga, la sagra o Ristosagra.

## 2. La scala

Una proposta da verificare con il CFO, perché i gradini 2 e 3 costano tempo del fondatore. Il software è lo stesso per tutti: cambia il servizio intorno, non si bloccano funzioni.

| gradino | prezzo | cosa include | perché salire |
|---|---:|---|---|
| **Sagra** | €99 a edizione | tutto il software, preset "Sagra", assistenza al telefono durante le serate | è il punto d'ingresso |
| **Sagra pronta** | €149 a edizione | in più: menù e ruoli caricati da noi, prova generale a distanza con i volontari prima dell'evento | risponde a "i volontari anziani non sapranno usarlo" e alla richiesta del board di una configurazione già pronta |
| **Sagra grande** | €249 a edizione | come Sagra pronta, più lo smistamento in cucina impostato con il capo cucina e l'assistenza con priorità; per sagre oltre circa 1000 coperti a sera | nel panel le sagre grandi trovano €99 sospetto: P001 "troppo poco" sotto €150, P007 sotto €120. €249 resta sotto il PME (€298) |

## 3. L'offerta di lancio

Niente sconti, che abituano ad aspettare. Due cose che rispondono alle richieste del panel, più la sagra pilota:

- **Serata di prova gratuita prima dell'evento.** 7 dei 19 che dicono no chiedono di "provarlo gratis in una serata piccola". Per esempio una cena del direttivo o la prova generale, senza togliere il sistema che hanno.
- **Garanzia sulla prima serata.** Se dopo la prima serata la sagra decide di tornare al suo sistema, non paga l'edizione. Il costo per il fondatore è il rischio di lavorare gratis su una serata: da mettere nel conto del CFO.
- **Scadenza:** vale per le edizioni 2027, con adesione entro una data da fissare prima della stagione. **Data da decidere tu**, in base a quando i direttivi approvano le spese: non lo sappiamo con dati veri.
- **Scarsità vera, non inventata:** "Al massimo N sagre per weekend, perché l'assistenza in serata la fa una persona." N lo dice il CFO.
- **La sagra pilota:** gratis per la prima edizione, in cambio di misure prima e dopo (code, tempi, ordini all'ora) e del permesso di citarla, con il presidente disponibile a rispondere al telefono a chi chiede. È la risposta alla richiesta che il panel ripete di più: "un'altra Pro Loco che l'ha usato". È una scelta tua, non uno sconto pubblico.

## 4. Cosa provare con compratori veri

Due prezzi dentro la fascia: **€99** e **€149**.

Come:
1. Prendi i contatti che hai nel settore e dividili in due gruppi a caso.
2. Dopo la demo, a un gruppo dici €99 e all'altro €149.
3. Misura chi accetta un impegno vero: una lettera d'intenti per l'edizione 2027 o una piccola caparra. Un "sì, interessante" non conta.
4. Alla fine di ogni demo fai le stesse quattro domande del panel (quando è troppo poco, un affare, caro, troppo caro). Risposte di persone vere valgono più di tutto questo file.

Con pochi contatti il risultato sarà indicativo, non statistico. Se a €149 si impegnano quanti a €99, il prezzo può salire.

## 5. Le obiezioni sul prezzo, parola per parola

Dal panel simulato: sono obiezioni da preparare, non testimonianze.

1. **"Perché pagare se c'è il gratis?"** *"Novantanove euro non sono la fine del mondo, ma ogni spesa deve passare dal direttivo e io prima devo dimostrare che non esiste qualcosa di gratis o che non basta il foglio e la penna come sempre."* (P011)
2. **"Troppo poco per fidarsi"**, dalle sagre grandi: *"99 euro mi sembrano pochi per qualcosa da cui dipende tutta la serata."* (P007)
3. **"Le commissioni nascoste"**: *"Se il pagamento online avesse commissioni che mangiano l'utile e nessuno me le dicesse chiaro prima […] dico no."* (P008)

Per il marketing: la risposta alla 1 è la serata di prova e il confronto con le ore di volontari risparmiate. Alla 2 rispondono il gradino "Sagra grande" e la referenza della pilota. Alla 3, scrivere nel pitch chi paga le commissioni e quanto.
