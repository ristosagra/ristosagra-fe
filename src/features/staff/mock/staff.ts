import { createMockStore, fakeDelay } from "../../../mock/store";
import { clearSession, getToken } from "../../../services/auth/session";
import { HttpError } from "../../../services/client/httpClient";
import {
  StaffRole,
  type NewStaffMember,
  type StaffMember,
  type StaffUpdate,
} from "../types/staff";
import {
  assignableRoles,
  canEditMember,
  canManageMember,
  isManager,
} from "../utils/permissions";

//Personale finto salvato nel browser. Solo nei dati finti le password sono in chiaro:
//il backend le deve salvare cifrate (hash) e non restituirle mai
type MockStaff = NewStaffMember & { id: string };

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
  seed("s-cameriere", "Marco", StaffRole.Waiter, "cameriere"),
  seed("s-capocucina", "Chef", StaffRole.Chef, "capocucina"),
  seed("s-cucina", "Cucina", StaffRole.Kitchen, "cucina"),
  seed("s-banco", "Banco", StaffRole.Counter, "banco"),
];

//la versione cambia quando si aggiungono ruoli: si riparte dalle credenziali di prova
export const staffStore = createMockStore<MockStaff[]>("staff.v3", () => SEED);

//Il token finto contiene l'id della persona
export const mockToken = (id: string) => `mock-token-${id}`;

const withoutPassword = ({
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

//Solo titolare e vice gestiscono il personale
const requireManager = () => {
  const actor = currentMockUser();
  if (!isManager(actor.role)) throw new HttpError(403);
  return actor;
};

const sameUsername = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

const checkUsername = (member: MockStaff, all: MockStaff[]) => {
  if (
    all.some(
      (m) => m.id !== member.id && sameUsername(m.username, member.username),
    )
  )
    throw new HttpError(409);
};

//Regole che il backend deve applicare al personale (vedi API.md)
export const fakeStaffApi = {
  getStaff: async (): Promise<StaffMember[]> => {
    await fakeDelay(300);
    requireManager();
    return staffStore.get().map(withoutPassword);
  },

  createStaff: async (member: NewStaffMember): Promise<StaffMember> => {
    await fakeDelay();
    const actor = requireManager();
    //un solo titolare; i vice li nomina solo lui
    if (!assignableRoles(actor.role).includes(member.role))
      throw new HttpError(403);
    const all = staffStore.get();
    const created: MockStaff = { ...member, id: `s-${Date.now()}` };
    checkUsername(created, all);
    staffStore.set([...all, created]);
    return withoutPassword(created);
  },

  updateStaff: async (
    id: string,
    changes: StaffUpdate,
  ): Promise<StaffMember> => {
    await fakeDelay();
    const actor = requireManager();
    const all = staffStore.get();
    const current = all.find((m) => m.id === id);
    if (!current) throw new HttpError(404);
    const member = withoutPassword(current);
    if (!canEditMember(actor, member)) throw new HttpError(403);
    //ruolo e accesso: mai al titolare né a se stessi, e solo verso ruoli che si possono dare
    const changesAccess =
      (changes.role !== undefined && changes.role !== current.role) ||
      (changes.enabled !== undefined && changes.enabled !== current.enabled);
    if (
      changesAccess &&
      (!canManageMember(actor, member) ||
        !assignableRoles(actor.role).includes(changes.role ?? current.role))
    )
      throw new HttpError(403);
    const updated = { ...current, ...changes };
    checkUsername(updated, all);
    staffStore.set(all.map((m) => (m.id === id ? updated : m)));
    return withoutPassword(updated);
  },

  deleteStaff: async (id: string): Promise<void> => {
    await fakeDelay();
    const actor = requireManager();
    const all = staffStore.get();
    const current = all.find((m) => m.id === id);
    if (!current) throw new HttpError(404);
    if (!canManageMember(actor, withoutPassword(current)))
      throw new HttpError(403);
    staffStore.set(all.filter((m) => m.id !== id));
  },
};
