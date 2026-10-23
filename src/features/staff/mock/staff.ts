import { fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { readTakeaway } from "../../orders/mock/takeaway";
import { readProfile } from "../../restaurant/mock/restaurant";
import type {
  NewStaffMember,
  StaffMember,
  StaffRoleConst,
  StaffUpdate,
} from "../types/staff";
import {
  assignableRoles,
  canEditMember,
  canManageMember,
  roleUnavailableReason,
} from "../utils/permissions";
import { passwordError, usernameError } from "../utils/staffForm";
import {
  requireManager,
  staffStore,
  withoutPassword,
  type MockStaff,
} from "./auth";

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

//Un ruolo che con le impostazioni del ristorante non serve non si dà (chi lo ha già lo tiene)
const checkRoleInUse = (role: StaffRoleConst) => {
  if (roleUnavailableReason(role, readProfile(), readTakeaway()))
    throw new HttpError(400);
};

//Campi validi: nome, username e password (se c'è) entro i limiti
const checkFields = (member: Partial<NewStaffMember>, isNew: boolean) => {
  if (member.name !== undefined && !member.name.trim())
    throw new HttpError(400);
  if (member.username !== undefined && usernameError(member.username))
    throw new HttpError(400);
  if (
    (isNew || member.password !== undefined) &&
    passwordError(member.password ?? "", true)
  )
    throw new HttpError(400);
};

//Regole che il backend deve applicare al personale (vedi API.md), per tutti, titolare compreso
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
    checkRoleInUse(member.role);
    checkFields(member, true);
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
    const changesRole =
      changes.role !== undefined && changes.role !== current.role;
    const changesAccess =
      changesRole ||
      (changes.enabled !== undefined && changes.enabled !== current.enabled);
    if (
      changesAccess &&
      (!canManageMember(actor, member) ||
        !assignableRoles(actor.role).includes(changes.role ?? current.role))
    )
      throw new HttpError(403);
    if (changesRole && changes.role) checkRoleInUse(changes.role);
    checkFields(changes, false);
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
