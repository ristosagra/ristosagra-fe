//Sessione della cassa: unico punto in cui si legge e scrive il token.
//Nota: un token nel localStorage è leggibile da eventuali script iniettati (XSS); quando il backend
//lo supporterà conviene passare a un cookie httpOnly e togliere il token da qui.
const TOKEN_KEY = "auth_token";

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

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
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
