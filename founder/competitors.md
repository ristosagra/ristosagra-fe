# Concorrenti: Ristosagra

Ricerca del 27 ottobre 2026, solo fonti pubbliche. Dati grezzi in [competitors.csv](competitors.csv).

**In breve: il mercato c'è ed è affollato.** Ho trovato almeno 12 prodotti fatti apposta per le sagre, più i gestionali da ristorante e la carta. Tre sono gratuiti, almeno uno funziona senza internet, almeno quattro fanno lo scontrino fiscale o il documento commerciale, e tre pubblicano un prezzo per una sagra con ordini dal telefono inclusi: €69, €139 e €196.

Contesto: in Italia si fanno circa **20.000 sagre l'anno**, con 48 milioni di visitatori. Il dato è attribuito al sistema Pro Loco ([QuiFinanza, 10 luglio 2026](https://quifinanza.it/lifestyle/travel-economy/sagre-2026-indottoquant-valgono-borghi-ristoranti-turismo-locale/996871/)).

## 1. Chi c'è (dal più diretto al meno diretto)

| Nome | Tipo | Prezzo per una sagra | Ordini dal telefono | Senza internet | Fiscale |
|---|---|---|---|---|---|
| [SagraFacile](https://www.sagrafacile.it/) | Diretto | Cloud da €49 al giorno di evento ([fonte](https://www.sagrafacile.it/gestione-stand-gastronomico)); Locale €0 | Sì (Cloud; add-on per Locale) | Sì, versione Locale | Sì, modulo su Cloud |
| [SagraGo](https://www.sagrago.it/) | Diretto | €139 una volta per sagra; €490 a vita; €790 multi-sagra ([prezzi](https://www.sagrago.it/prezzi.html)) | Sì, incluso | Sì, è il suo punto di forza | In sviluppo |
| [MySagra](https://mysagra.com/en) | Diretto | Cloud €69/settimana o €207/mese; self-hosted gratis | Sì, si paga al banco | No, serve internet stabile | Non dichiarato |
| [Sagriamo](https://www.sagriamo.it/gestisci-al-meglio-il-tuo-evento-con-sagriamo/) (+ Ge.Sa.) | Diretto | Non pubblicato | Sì, **con pagamento online** e prenotazione tavoli | Non dichiarato | Non dichiarato |
| [Sagra Touch](https://www.gestionecasse.it/index.html) | Diretto | Non pubblicato (licenza o noleggio su preventivo) | Sì (QR, Sagriamo, cassa self con Satispay) | Solo il preordine QR | Sì, stampanti telematiche a noleggio |
| [Festa di Paese](https://www.festadipaese.it/) | Diretto | €5,99–17,99 al giorno in base all'incasso | Non menzionati | Non dichiarato | Non menzionato |
| [Vulcano Team](https://www.vulcanoteam.it/news/gestisci-la-tua-sagra-a-360-con-il-nostro-software-per-la-ristorazione/) | Diretto | Non pubblicato (noleggio) | Sì, app "Salta la fila" (paga in cassa) | Non dichiarato | Sì |
| [Fast And Fest](https://www.fastandfest.it/numerazione-ordini-gestione-code-sagra/) | Diretto | Non pubblicato (noleggio) | Prenotazioni online | Non dichiarato | Sì, elettronico |
| [xFast](https://www.xfast.it/funzionalita/) | Diretto | Non pubblicato | Ordini via web e self-service | Non dichiarato | Non dichiarato |
| [Tech Center](https://www.tech-center.it/servizi/software-sagre/) | Diretto | Non pubblicato | Non menzionati | Rete locale | Non chiaro |
| [StandFacile](https://www.standfacile.org/) | Diretto | Gratis | Preordini QR su accordo | Rete locale | No, nessun valore fiscale |
| [MisterPOS / Spriz](https://www.misterpos.it/it/) | Diretto | **Non verificato**: sito non raggiungibile (certificato non valido); dai risultati di ricerca la versione base è gratis | Self-order nella versione PRO (non verificato) | ? | ? |
| [Cassa in Cloud](https://www.teamsystem.com/horeca/cassa-in-cloud/prezzi/) (TeamSystem) | Indiretto | Prezzi dei piani non trovati; scontrini + registratore telematico €30 + IVA/mese | App comande, monitor cucina | Riprende le stampe quando torna il Wi-Fi | Sì |
| Carta, bigliettini, calcolatrice | Sostituto | Quasi zero | No | Sì | Col registratore che già si ha |

Altri nomi visti nelle ricerche ma non letti: easySagra, Sprint (gestionesagra.biz), GestiFEST, il programma gratuito "Sagre" di [Claudio Maccherani](https://claudiomaccherani.altervista.org/SwSagra.htm).

Quanti clienti dichiarano: Sagra Touch "oltre 500 feste" e circa 100 noleggi l'anno; SagraFacile "200.000+ ordini" e attiva dal 2019; SagraGo un solo caso pubblico (4 serate, circa 1.900 ordini). Un articolo del Gazzettino attribuirebbe a Sagriamo oltre 400 sagre in Veneto e Friuli, ma [la pagina](https://www.ilgazzettino.it/nordest/treviso/app_sagre_prenotazioni_posti_ordinazioni-8240634.html) non si è aperta: dato non verificato.

## 2. Fascia di prezzo

Prodotto confrontabile: il software per **una sagra di 4 serate**, hardware escluso. Solo prezzi pubblicati.

| | Prezzo | Chi |
|---|---|---|
| Minimo | **€0** | SagraFacile Locale, StandFacile, MySagra self-hosted (fai da te, senza ordini online o con server tuo) |
| Mediana dei prezzi a pagamento | **€72** | (€24, €69, €72, €139, €196) |
| Massimo pubblicato | **da €196** | SagraFacile Cloud (4 × €49) |

Con **ordini dal telefono inclusi** i prezzi pubblicati sono tre: **€69** (MySagra), **€139** (SagraGo), **da €196** (SagraFacile). Il noleggio chiavi in mano (Sagra Touch, Vulcano Team, Fast And Fest) non pubblica prezzi.

Servizi in sala, dove pubblicati: SagraGo chiede €150 a serata per la presenza al banco e €200 per la configurazione sul posto.

## 3. Mappa di posizionamento

Assi: **prezzo per edizione** (verticale) e **quanto fa la sagra da sola** (orizzontale: tutto da sola ↔ tecnico, hardware e fiscale forniti).

```
 prezzo
 alto  │                                   Sagra Touch · Vulcano Team · Fast And Fest
 (non  │                                   (noleggio, prezzo su preventivo)
 pubbl.)│
 ~€200 │              SagraFacile Cloud
       │                                SagraGo (+€150/serata in sala)
 ~€140 │
 ~€70  │   MySagra cloud · Festa di Paese (grande)
 ~€25  │   Festa di Paese (piccola)
   €0  │   StandFacile · SagraFacile Locale · MySagra self-hosted
       └──────────────────────────────────────────────────────────────►
         tutto da sola                                   chiavi in mano

 Ristosagra oggi: tutto da sola, prezzo da decidere, senza offline né fiscale.
```

## 4. Cosa dicono i clienti

**Le recensioni pubbliche sono quasi inesistenti.** Nessuno dei software da sagra ha recensioni su Capterra, Google o Trustpilot che io abbia potuto leggere. L'unica pagina con recensioni è Sagriamo sull'App Store (4,2 su 29 valutazioni), e quelle visibili sono tutte positive. Tutti i temi qui sotto sono quindi **deboli** (meno di tre recensioni ciascuno), e i primi tre vengono dai fornitori, che descrivono i problemi delle sagre per vendere.

1. **Le code al picco** (debole, fonte fornitori). Alle 20:00 arrivano cento persone in un quarto d'ora; con 40 secondi a cliente una cassa ne serve circa 90 l'ora ([SagraGo](https://sagrago.it/guide/cassa-sagra-evitare-code.html)). Dal lato cliente, l'unica voce trovata: ordinare dal telefono "saltando code chilometriche" (recensione di Sagriamo, [App Store](https://apps.apple.com/it/app/sagriamo/id1475125353)).
2. **La rete che cade** (debole, fonte fornitori). SagraGo costruisce tutta la sua offerta su questo ([home](https://www.sagrago.it/)); MySagra dichiara che il suo cloud richiede internet stabile ([sito](https://mysagra.com/en)).
3. **Numeri d'ordine doppi con più casse** e caos nella consegna (debole, fonte fornitori: [Fast And Fest](https://www.fastandfest.it/numerazione-ordini-gestione-code-sagra/)).
4. **Assistenza lenta** nei gestionali da ristorante (debole, concorrente indiretto). Cassa in Cloud ha 3,6/5 su 69 recensioni Capterra e 3,1 per l'assistenza, secondo i risultati di ricerca. La [pagina delle recensioni](https://www.capterra.com/p/230839/Cassa-In-Cloud/reviews/) ha bloccato la lettura, quindi non riporto citazioni.

Chi può dare le lamentele vere: i volontari e i presidenti di Pro Loco, nei gruppi Facebook e di persona. La sagra pilota è il posto giusto per chiederlo.

## 5. Il buco

**Sulle funzioni non c'è un buco evidente.** Cassa, cucina per reparto, preordine dal telefono, schermo dei numeri e report ce li hanno in tanti. In più i concorrenti offrono cose che Ristosagra non ha:

- **Funzionamento senza internet**: SagraGo, SagraFacile Locale, StandFacile.
- **Scontrino fiscale o documento commerciale**: SagraFacile, Sagra Touch, Vulcano Team, Fast And Fest.
- **Stampa delle comande per reparto**: quasi tutti. Ristosagra usa gli schermi in cucina e stampa solo il bigliettino.
- **Magazzino e piatti esauriti**: SagraFacile, SagraGo, xFast, Tech Center. In Ristosagra non ho trovato una gestione dei piatti esauriti.
- **Report di fine serata e incassi**: quasi tutti.
- **Hardware e tecnico in sala**: SagraGo, Sagra Touch, Vulcano Team.

**C'è però un buco stretto, con prove deboli**: ordinare **e pagare** dal telefono, così che il cliente salti del tutto la cassa e la cucina veda solo gli ordini pagati, con un prezzo pubblico e senza installare nulla.

- Tra i prodotti letti, il pagamento online dichiarato c'è solo in **Sagriamo**, che non pubblica il prezzo. Sagra Touch lo fa con Satispay, ma solo alla cassa self-service.
- MySagra, Vulcano Team e SagraGo fanno ordinare dal telefono ma **pagare al banco**: la coda alla cassa resta.
- In Ristosagra questo flusso è già disegnato (`payOnline`), ma il pagamento va ancora collegato nel backend.

**Cosa non sappiamo**: se le sagre vogliono davvero il pagamento online (commissioni, clienti anziani, contanti), e quanto vale per loro. È la domanda per `/founder-consumer`.

Ristoranti ed eventi privati non li ho analizzati: hanno già i loro gestionali (Cassa in Cloud e simili), e aprire quel fronte vorrebbe dire scontrarsi con TeamSystem.

## 6. La minaccia

- **SagraFacile** è il più vicino: è già cloud, ha preordine, schermo dei numeri e fiscale, e un prezzo pubblico. Gli basterebbe aggiungere il pagamento online per coprire il buco.
- **Sagriamo** ha già pagamento online, prenotazione tavoli e soprattutto **un'app che il pubblico usa per trovare le sagre**. È l'unico con un effetto rete: più sagre ci sono, più clienti la scaricano. Ha già il buco, e il suo prezzo non si vede.
- **SagraGo** potrebbe aggiungere il pagamento online sopra il suo locale, e ha già il messaggio più forte del mercato ("non si ferma se cade internet") e un prezzo una tantum basso.
- **MySagra** ha codice pubblico, ma la licenza PolyForm Shield vieta di usarlo per fare concorrenza: copiarlo non è un'opzione legale.

Detto chiaramente: oggi è Ristosagra a dover recuperare (offline, fiscale, stampa per reparto, esauriti, report). Copiare Ristosagra non servirebbe a nessuno.
