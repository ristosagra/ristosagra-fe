import { ROOT_DOMAIN } from "../constant/env";

//I nostri indirizzi: il sito stesso, il dominio della piattaforma e le sagre sui sottodomini
const isOwnHost = (url: URL) =>
  url.origin === window.location.origin ||
  (ROOT_DOMAIN !== "" &&
    (url.hostname === ROOT_DOMAIN || url.hostname.endsWith(`.${ROOT_DOMAIN}`)));

//Pagina di pagamento ricevuta dal backend: si accetta solo https o un nostro indirizzo
//(i dati finti tornano subito al sito, anche in http durante lo sviluppo), mai javascript:
//o simili
export const safeCheckoutUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url, window.location.origin);
    const web = parsed.protocol === "https:" || parsed.protocol === "http:";
    return parsed.protocol === "https:" || (web && isOwnHost(parsed))
      ? parsed.href
      : null;
  } catch {
    return null;
  }
};
