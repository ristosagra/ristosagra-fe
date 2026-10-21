//Parametro dell'indirizzo con cui è stato aperto il sito (es. ?tavolo=T-3 del QR code)
export const getUrlParam = (name: string) =>
  new URLSearchParams(window.location.search).get(name);

//Toglie dall'indirizzo i parametri già letti, così non restano nei preferiti o nei link condivisi
export const removeUrlParams = (...names: string[]) => {
  const url = new URL(window.location.href);
  names.forEach((n) => url.searchParams.delete(n));
  if (url.href !== window.location.href)
    window.history.replaceState(window.history.state, "", url);
};
