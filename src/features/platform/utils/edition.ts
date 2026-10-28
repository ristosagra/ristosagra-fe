import { EDITION_MONTHS } from "../../../constant/platform";

//Fine dell'edizione dopo un pagamento: 12 mesi dalla scadenza attuale se è ancora valida,
//altrimenti da adesso (regola del backend, simulata dai dati finti)
export const addEdition = (fromIso: string | null, now: Date): string => {
  const from = fromIso ? new Date(fromIso) : null;
  const start = from && from > now ? from : now;
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + EDITION_MONTHS);
  return end.toISOString();
};

//Scadenza da mostrare (es. "12/10/2027")
export const formatPaidUntil = (iso: string): string =>
  new Date(iso).toLocaleDateString("it-IT");
