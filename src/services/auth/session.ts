import {
  STAFF_ROLES,
  type SessionUser,
} from "../../features/staff/types/staff";

//Sessione del personale: unico punto in cui si leggono e scrivono il token e chi ha fatto l'accesso.
//Nota: un token nel localStorage è leggibile da eventuali script iniettati (XSS); quando il backend
//lo supporterà conviene passare a un cookie httpOnly e togliere il token da qui.
const TOKEN_KEY = "auth_token";
//Nome e ruolo, solo per sapere cosa mostrare: i permessi li controlla il backend col token
const USER_KEY = "auth_user";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage non disponibile (es. navigazione privata): la sessione non viene salvata
  }
};

const isSessionUser = (v: unknown): v is SessionUser => {
  if (typeof v !== "object" || v === null) return false;
  const u = v as Record<string, unknown>;
  return (
    typeof u.id === "string" &&
    typeof u.name === "string" &&
    STAFF_ROLES.includes(u.role as SessionUser["role"])
  );
};

export const getSessionUser = (): SessionUser | null => {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(USER_KEY) ?? "null",
    );
    return isSessionUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const setSessionUser = (user: SessionUser) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // localStorage non disponibile: si richiede al backend a ogni apertura
  }
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // niente da cancellare
  }
};

//Scadenza (ms) di un token JWT, se presente nel payload
const tokenExpiry = (token: string): number | null => {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
};

//Vero se c'è un token non scaduto (la validità vera la decide sempre il backend)
export const hasSession = (): boolean => {
  const token = getToken();
  if (!token) return false;
  const exp = tokenExpiry(token);
  return exp === null || exp > Date.now();
};
