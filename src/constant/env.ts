//Dati finti (Faker + localStorage) al posto del backend. È una costante nota in fase di build:
//con VITE_MOCKING diverso da "true" il codice dei mock viene escluso dal bundle di produzione.
export const IS_MOCKING = import.meta.env.VITE_MOCKING === "true";

//Indirizzo del backend; vuoto = stessa origine (in sviluppo passa dal proxy /api di Vite)
export const API_URL = import.meta.env.VITE_API_URL ?? "";
