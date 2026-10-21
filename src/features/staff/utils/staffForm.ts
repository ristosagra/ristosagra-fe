import {
  PASSWORD_MAX,
  PASSWORD_MIN,
  STAFF_ROLES,
  USERNAME_MAX,
  USERNAME_MIN,
  type StaffMember,
} from "../types/staff";

//Username facili da scrivere sul telefono: lettere senza accenti, numeri, punto, trattino e _
const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const usernameError = (username: string): string | null => {
  const u = username.trim();
  if (u.length < USERNAME_MIN)
    return `Username: almeno ${USERNAME_MIN} caratteri`;
  if (u.length > USERNAME_MAX)
    return `Username: al massimo ${USERNAME_MAX} caratteri`;
  return USERNAME_PATTERN.test(u)
    ? null
    : "Username: solo lettere, numeri, punto, trattino e _";
};

//La password serve per le persone nuove; modificando una persona si può lasciare vuota
export const passwordError = (
  password: string,
  required: boolean,
): string | null => {
  if (!password && !required) return null;
  if (password.length < PASSWORD_MIN)
    return `Password: almeno ${PASSWORD_MIN} caratteri`;
  return password.length > PASSWORD_MAX
    ? `Password: al massimo ${PASSWORD_MAX} caratteri`
    : null;
};

//Senza caratteri che si confondono (0/O, 1/l/I), così si può dettare o copiare a mano
const PASSWORD_CHARS =
  "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

//Password casuale da dare alla persona (generata col generatore sicuro del browser)
export const generatePassword = (length = 10): string => {
  const values = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(
    values,
    (v) => PASSWORD_CHARS[v % PASSWORD_CHARS.length],
  ).join("");
};

//Amministratore prima, poi cassa, camerieri e cucina; dentro il ruolo per nome
export const sortStaff = (staff: StaffMember[]): StaffMember[] =>
  [...staff].sort(
    (a, b) =>
      STAFF_ROLES.indexOf(a.role) - STAFF_ROLES.indexOf(b.role) ||
      a.name.localeCompare(b.name, "it"),
  );
