import { createMockStore } from "../../../mock/store";
import { clearSession, getToken } from "../../../services/auth/session";
import { HttpError } from "../../../services/client/httpClient";
import {
  StaffRole,
  type NewStaffMember,
  type StaffMember,
  type StaffRoleConst,
} from "../types/staff";
import { isManager } from "../utils/permissions";

//Personale finto salvato nel browser e chi ha fatto l'accesso, per tutti i dati finti: ogni
//chiamata del personale controlla il ruolo come farà il backend (colonna Accesso di API.md),
//anche per l'amministratore. Solo nei dati finti le password sono in chiaro: il backend le
//deve salvare cifrate (hash) e non restituirle mai
export type MockStaff = NewStaffMember & { id: string };

const seed = (
  id: string,
  name: string,
  role: StaffMember["role"],
  username: string,
): MockStaff => ({
  id,
  name,
  role,
  username,
  password: username,
  enabled: true,
});

//Credenziali di prova, una per ruolo (password = username)
const SEED: MockStaff[] = [
  seed("s-admin", "Titolare", StaffRole.Admin, "admin"),
  seed("s-vice", "Laura", StaffRole.Deputy, "vice"),
  seed("s-cassa", "Cassa 1", StaffRole.Cashier, "cassa"),
  seed("s-caposala", "Giulia", StaffRole.HeadWaiter, "caposala"),
  seed("s-cameriere", "Marco", StaffRole.Waiter, "cameriere"),
  seed("s-capocucina", "Chef", StaffRole.Chef, "capocucina"),
  seed("s-cucina", "Cucina", StaffRole.Kitchen, "cucina"),
  seed("s-banco", "Banco", StaffRole.Counter, "banco"),
];

//la versione cambia quando si aggiungono ruoli: si riparte dalle credenziali di prova
export const staffStore = createMockStore<MockStaff[]>("staff.v4", () => SEED);

//Il token finto contiene l'id della persona
export const mockToken = (id: string) => `mock-token-${id}`;

export const withoutPassword = ({
  id,
  name,
  role,
  username,
  enabled,
}: MockStaff): StaffMember => ({ id, name, role, username, enabled });

//Chi ha fatto l'accesso secondo il token. Se non c'è più o non può accedere, come farebbe
//il backend con un 401 si chiude la sessione e si torna al login
export const currentMockUser = (): StaffMember => {
  const token = getToken();
  const member = staffStore
    .get()
    .find((m) => token === mockToken(m.id) && m.enabled);
  if (!member) {
    clearSession();
    globalThis.location.replace("/login");
    throw new HttpError(401);
  }
  return withoutPassword(member);
};

//Gruppi di ruoli usati nella colonna Accesso: i gestori sono sempre compresi
export const MANAGERS: StaffRoleConst[] = [StaffRole.Admin, StaffRole.Deputy];

//La chiamata è ammessa solo per i gestori e i ruoli indicati, altrimenti 403
export const requireRole = (...roles: StaffRoleConst[]) => {
  const actor = currentMockUser();
  if (!isManager(actor.role) && !roles.includes(actor.role))
    throw new HttpError(403);
  return actor;
};

//Solo titolare e vice
export const requireManager = () => requireRole();
