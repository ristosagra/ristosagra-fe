import { API_URL } from "../../constant/env";
import { clearSession, getToken } from "../auth/session";
import { sagraSlug } from "../../helpers/site";

//Oltre questo tempo la richiesta viene interrotta (reti mobili lente o assenti)
const TIMEOUT_MS = 15000;

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Errore: ${status}`);
    this.name = "HttpError";
    this.status = status;
  }
}

interface RequestOptions {
  body?: unknown;
  //false per le chiamate che non devono inviare il token (es. login)
  auth?: boolean;
}

const request = async <T>(
  method: string,
  endpoint: string,
  { body, auth = true }: RequestOptions = {},
): Promise<T> => {
  const token = auth ? getToken() : null;
  const headers: Record<string, string> = {};
  // Content-Type solo se c'è un corpo: sulle GET pubbliche evita la richiesta preliminare CORS
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  //La sagra del sottodominio: il backend sceglie i suoi dati da qui (per il personale
  //vale quella del token, che deve coincidere)
  if (sagraSlug) headers["X-Sagra"] = sagraSlug;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal:
      typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(TIMEOUT_MS)
        : undefined,
  });

  //Sessione scaduta: si torna al login (ricaricando la pagina si svuota anche la cache dei dati)
  if (res.status === 401 && token) {
    clearSession();
    globalThis.location.replace("/login");
  }
  if (!res.ok) throw new HttpError(res.status);

  // le risposte senza corpo (es. 204) diventano undefined
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
};

export const httpClient = {
  get: <T>(endpoint: string) => request<T>("GET", endpoint),

  post: <T>(endpoint: string, body: unknown, options?: { auth?: boolean }) =>
    request<T>("POST", endpoint, { body, ...options }),

  patch: <T>(endpoint: string, body: unknown) =>
    request<T>("PATCH", endpoint, { body }),

  delete: <T = void>(endpoint: string) => request<T>("DELETE", endpoint),
};
