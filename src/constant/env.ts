//Dati finti (Faker + localStorage) al posto del backend. È una costante nota in fase di build:
//con VITE_MOCKING diverso da "true" il codice dei mock viene escluso dal bundle di produzione.
export const IS_MOCKING = import.meta.env.VITE_MOCKING === "true";

//Indirizzo del backend; vuoto = stessa origine (in sviluppo passa dal proxy /api di Vite)
export const API_URL = import.meta.env.VITE_API_URL ?? "";

//Dominio della piattaforma (es. ristosagra.it, in sviluppo localhost): lì c'è la landing,
//ogni sagra ha il suo sottodominio. Vuoto = una sola sagra, come prima della piattaforma
export const ROOT_DOMAIN = (
  import.meta.env.VITE_ROOT_DOMAIN ?? ""
).toLowerCase();

//Indirizzo della demo con i dati finti; vuoto = il bottone "Prova la demo" non c'è
export const DEMO_URL = import.meta.env.VITE_DEMO_URL ?? "";
