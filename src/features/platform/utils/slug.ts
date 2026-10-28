//Indirizzo della sagra (lo "slug" di pesce.ristosagra.it). Funzioni pure: il dominio
//principale arriva come parametro

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
