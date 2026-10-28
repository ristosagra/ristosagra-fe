import { getUrlParam, removeUrlParams } from "../../../helpers/urlParams";

//Ritorno dal pagamento dell'edizione: il servizio di pagamento rimanda alla login della sagra
//su /login?attivazione=ok oppure /login?attivazione=annullata
export const ACTIVATION_PARAM = "attivazione";

export const ActivationOutcome = {
  Ok: "ok",
  Cancelled: "annullata",
} as const;
export type ActivationOutcomeConst =
  (typeof ActivationOutcome)[keyof typeof ActivationOutcome];

//Dopo un ritorno "ok" la conferma del servizio può tardare: per un po' si ricontrolla spesso
const PENDING_KEY = "ristosagra.activationPending";
export const ACTIVATION_POLL_MS = 5000;
export const ACTIVATION_WAIT_MS = 120_000;

//Esito del pagamento, se la pagina è stata aperta tornando dal pagamento (solo lettura)
export const readActivationReturn = (): ActivationOutcomeConst | null => {
  const outcome = getUrlParam(ACTIVATION_PARAM);
  return outcome === ActivationOutcome.Ok ||
    outcome === ActivationOutcome.Cancelled
    ? outcome
    : null;
};

//Dopo averlo letto l'esito si toglie dall'indirizzo; con "ok" si ricorda quando, così l'area
//del personale aspetta la conferma (ricaricando la pagina il messaggio non torna)
export const clearActivationReturn = (outcome: ActivationOutcomeConst) => {
  removeUrlParams(ACTIVATION_PARAM);
  if (outcome !== ActivationOutcome.Ok) return;
  try {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {
    // storage non disponibile: l'area del personale non mostrerà "in verifica"
  }
};

//Quando si è tornati dal pagamento con "ok" (ms), se è successo in questa scheda
export const activationPendingSince = (): number | null => {
  try {
    const since = Number(sessionStorage.getItem(PENDING_KEY));
    return since > 0 ? since : null;
  } catch {
    return null;
  }
};

export const clearActivationPending = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // niente da cancellare
  }
};
