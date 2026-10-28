import { SLUG_MAX, SLUG_MIN } from "../../../constant/limits";

//Indirizzo della sagra (lo "slug" di pesce.ristosagra.it). Funzioni pure: il dominio
//principale arriva come parametro

//Sottodomini che non possono essere sagre (il backend ha l'elenco definitivo)
export const RESERVED_SLUGS: readonly string[] = [
  "www",
  "demo",
  "api",
  "app",
  "admin",
  "mail",
  "assets",
  "static",
];

//Indirizzo suggerito dal nome della sagra: minuscolo, senza accenti, parole unite da "-"
//("Festa dell'Unità – 2027!" → "festa-dell-unita-2027")
export const slugify = (name: string): string =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");

//Perché l'indirizzo non va bene (null = va bene)
export const slugError = (slug: string): string | null => {
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX)
    return `Da ${SLUG_MIN} a ${SLUG_MAX} caratteri`;
  if (!/^[a-z0-9-]+$/.test(slug))
    return "Solo lettere minuscole, numeri e trattini";
  if (slug.startsWith("-") || slug.endsWith("-"))
    return "Non può iniziare o finire con un trattino";
  if (RESERVED_SLUGS.includes(slug))
    return "Indirizzo riservato, scegline un altro";
  return null;
};

//Quello che si scrive o si incolla nel campo dell'indirizzo, ridotto allo slug: minuscolo,
//senza spazi e, se è un indirizzo intero, senza protocollo, percorso, porta e dominio
//("https://Pesce.ristosagra.it/login" → "pesce")
export const normalizeSlugInput = (
  value: string,
  rootDomain: string,
): string => {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/\s+/g, "");
  const suffix = `.${rootDomain.toLowerCase()}`;
  return rootDomain && host.endsWith(suffix)
    ? host.slice(0, -suffix.length)
    : host;
};
