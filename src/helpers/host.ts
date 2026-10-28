//Funzioni pure sull'indirizzo del sito (nessun import: si provano anche fuori dal browser)

//Sagra dell'indirizzo: l'unica etichetta prima del dominio principale
//(pesce.ristosagra.it → "pesce"). Null sul dominio stesso, su www, con più etichette
//o senza dominio principale (una sola sagra, come prima della piattaforma)
export const parseSagraSlug = (
  hostname: string,
  rootDomain: string,
): string | null => {
  const host = hostname.toLowerCase();
  const root = rootDomain.toLowerCase();
  if (!root || !host.endsWith(`.${root}`)) return null;
  const label = host.slice(0, -(root.length + 1));
  if (!label || label.includes(".") || label === "www") return null;
  return label;
};

//Indirizzo assoluto su un altro host, con lo stesso protocollo e la stessa porta
//(in sviluppo http://pesce.localhost:5199/login)
export const hostUrl = (
  protocol: string,
  hostname: string,
  port: string,
  path: string,
): string => `${protocol}//${hostname}${port ? `:${port}` : ""}${path}`;
