import { getUrlParam, removeUrlParams } from "../../../helpers/urlParams";
import type { ConfirmedOrder } from "../types/orders";
import { isRecentOrder } from "./storedOrder";

//Pagamento online: il cliente va sulla pagina del servizio di pagamento (checkoutUrl) e da lì
//torna al sito su /?pagamento=ok oppure /?pagamento=annullato
export const PAYMENT_PARAM = "pagamento";

export const PaymentOutcome = {
  Ok: "ok",
  Cancelled: "annullato",
} as const;
export type PaymentOutcomeConst =
  (typeof PaymentOutcome)[keyof typeof PaymentOutcome];

//Ordine in attesa di pagamento: finché la scheda è aperta, anche passando dalla pagina di pagamento
const PENDING_KEY = "ristosagra.pendingPayment";

//Accetta solo pagine di pagamento https (o del sito stesso, per i dati finti), mai javascript: o simili
export const safeCheckoutUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === "https:" ||
      parsed.origin === window.location.origin
      ? parsed.href
      : null;
  } catch {
    return null;
  }
};

//Salva l'ordine da pagare e manda il cliente alla pagina di pagamento: al ritorno serve per mostrargli il numero
export const goToCheckout = (order: ConfirmedOrder, checkoutUrl: string) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(order));
  } catch {
    // storage non disponibile: al ritorno il cliente vedrà solo l'esito del pagamento
  }
  window.location.assign(checkoutUrl);
};

const readPendingOrder = (): ConfirmedOrder | null => {
  try {
    const parsed: unknown = JSON.parse(
      sessionStorage.getItem(PENDING_KEY) ?? "null",
    );
    return isRecentOrder(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export interface PaymentReturn {
  outcome: PaymentOutcomeConst;
  //ordine salvato prima di andare a pagare (null se non c'è più)
  order: ConfirmedOrder | null;
}

//Esito del pagamento, se il sito è stato aperto tornando dalla pagina di pagamento.
//Serve solo a cosa mostrare al cliente: l'ordine risulta pagato alla cassa solo quando
//il backend riceve la conferma dal servizio di pagamento
export const readPaymentReturn = (): PaymentReturn | null => {
  const outcome = getUrlParam(PAYMENT_PARAM);
  if (outcome !== PaymentOutcome.Ok && outcome !== PaymentOutcome.Cancelled)
    return null;
  return { outcome, order: readPendingOrder() };
};

//Dopo averlo letto, l'esito si toglie dall'indirizzo e l'ordine in attesa si dimentica
export const clearPaymentReturn = () => {
  removeUrlParams(PAYMENT_PARAM);
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // storage non disponibile: non c'è niente da cancellare
  }
};
