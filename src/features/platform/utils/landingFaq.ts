import { EDITION_MONTHS, EDITION_PRICE } from "../../../constant/platform";

export interface FaqItem {
  question: string;
  answer: string;
}

//Domande frequenti della landing: risposte oneste, anche quando la risposta è "no".
//La demo si nomina solo se c'è davvero (VITE_DEMO_URL)
export const landingFaq = (hasDemo: boolean): FaqItem[] => [
  {
    question: "Serve internet?",
    answer:
      "Sì: cassa, cucina e schermo dei numeri si parlano attraverso internet. Consigliamo una connessione dedicata (un router 4G/5G con una SIM solo per la sagra). Se la linea cade, gli ordini già registrati restano salvati e si continua con i bigliettini di carta finché torna.",
  },
  {
    question: "Sostituisce il registratore di cassa?",
    answer: "No: lo scontrino fiscale si fa come sempre.",
  },
  {
    question: "Bisogna installare un'app?",
    answer: "No, funziona dal browser di telefoni, tablet e PC.",
  },
  {
    question: "I volontari meno pratici ce la fanno?",
    answer: `Ognuno vede solo le pagine del suo ruolo, con pulsanti grandi. ${hasDemo ? "Prima della sagra si può provare tutto con la demo." : "Prima della sagra si può provare tutto con i volontari."}`,
  },
  {
    question: "Posso provarlo prima di pagare?",
    answer: `Sì: ${hasDemo ? "c'è la demo, e " : ""}dopo la registrazione prepari menù, volontari e impostazioni gratis. Paghi solo per andare online.`,
  },
  {
    question: `Cosa succede dopo ${EDITION_MONTHS} mesi?`,
    answer: `La sagra torna offline e i dati restano. Per l'edizione successiva si riattiva con €${EDITION_PRICE}. Nessun addebito automatico.`,
  },
  {
    question: "Fate fattura?",
    answer:
      "Sì, elettronica, con i dati che inserisci quando registri la sagra.",
  },
];
