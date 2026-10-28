import { ROOT_DOMAIN } from "../constant/env";
import { hostUrl, parseSagraSlug } from "./host";

//Sagra di questo indirizzo (pesce.ristosagra.it → "pesce"); null sul dominio principale
//o senza VITE_ROOT_DOMAIN (una sola sagra)
export const sagraSlug = parseSagraSlug(window.location.hostname, ROOT_DOMAIN);

//Dominio principale: landing, registrazione e accesso alle sagre
export const isPlatformHost = ROOT_DOMAIN !== "" && sagraSlug === null;

const urlOn = (hostname: string, path: string) =>
  hostUrl(window.location.protocol, hostname, window.location.port, path);

//Indirizzo di una pagina della sagra (es. la sua login dopo il pagamento)
export const sagraUrl = (slug: string, path: string) =>
  urlOn(`${slug}.${ROOT_DOMAIN}`, path);

//Indirizzo di una pagina della piattaforma (es. la registrazione dalla login di una sagra)
export const platformUrl = (path: string) => urlOn(ROOT_DOMAIN, path);
