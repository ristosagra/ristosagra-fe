import type { SignupRequest } from "../types/platform";

//Solo dati finti: ogni sottodominio ha il suo localStorage, quindi la registrazione fatta su
//ristosagra.it passa i dati alla nuova sagra nel frammento dell'indirizzo (#…), che il
//browser non manda mai ai server. La password è in chiaro solo qui, nei dati finti
export const MOCK_SIGNUP_KEY = "mock-signup";

export type MockHandoff = Pick<
  SignupRequest,
  "restaurantName" | "owner" | "billing"
>;

const toBase64Url = (text: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), (c) =>
      c.charCodeAt(0),
    ),
  );

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const allStrings = (v: unknown, keys: string[]) =>
  isRecord(v) && keys.every((k) => typeof v[k] === "string");

const isOptionalString = (v: unknown) =>
  v === undefined || typeof v === "string";

const isHandoff = (v: unknown): v is MockHandoff =>
  isRecord(v) &&
  typeof v.restaurantName === "string" &&
  allStrings(v.owner, ["name", "email", "phone", "password"]) &&
  allStrings(v.billing, ["holder", "taxCode"]) &&
  isRecord(v.billing) &&
  isOptionalString(v.billing.sdiCode) &&
  isOptionalString(v.billing.pec) &&
  allStrings(v.billing.address, ["street", "zip", "city", "province"]);

//Frammento da aggiungere all'indirizzo della login della nuova sagra
export const encodeHandoff = (h: MockHandoff): string =>
  `#${MOCK_SIGNUP_KEY}=${toBase64Url(JSON.stringify(h))}`;

//Dati della registrazione nel frammento, se ci sono e sono validi
export const readHandoff = (hash: string): MockHandoff | null => {
  const prefix = `#${MOCK_SIGNUP_KEY}=`;
  if (!hash.startsWith(prefix)) return null;
  try {
    const parsed: unknown = JSON.parse(
      fromBase64Url(hash.slice(prefix.length)),
    );
    return isHandoff(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
