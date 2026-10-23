import { useRef, useState } from "react";
import {
  useCreateStaff,
  useDeleteStaff,
  useStaff,
  useUpdateStaff,
} from "./useStaff";
import type { SaveTask } from "../../../hooks/useSectionEdit";
import { HttpError } from "../../../services/client/httpClient";
import type { NewStaffMember, StaffMember, StaffUpdate } from "../types/staff";

//Id della persona nuova nel form (le persone nuove in bozza hanno id provvisori "new-1", "new-2"...)
export const NEW_MEMBER = "new";

//Persona nuova in bozza: l'id vero lo dà il backend al salvataggio
type DraftNewMember = NewStaffMember & { id: string };

const saveErrorMessage = (err: unknown) =>
  err instanceof HttpError && err.status === 409
    ? "Username già usato da un'altra persona"
    : "Errore nel salvataggio, riprova";

const without = <T>(record: Record<string, T>, key: string) =>
  Object.fromEntries(Object.entries(record).filter(([k]) => k !== key));

const sameUsername = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

//Persona con i cambi della bozza (la password non si mostra mai nell'elenco)
const merged = (m: StaffMember, c: StaffUpdate = {}): StaffMember => ({
  id: m.id,
  name: c.name ?? m.name,
  role: c.role ?? m.role,
  username: c.username ?? m.username,
  enabled: c.enabled ?? m.enabled,
});

//Solo i campi cambiati rispetto al salvato, la password solo se è stata scritta
const diff = (m: StaffMember, values: NewStaffMember): StaffUpdate => {
  const changes: StaffUpdate = {};
  if (values.name !== m.name) changes.name = values.name;
  if (values.role !== m.role) changes.role = values.role;
  if (values.username !== m.username) changes.username = values.username;
  if (values.enabled !== m.enabled) changes.enabled = values.enabled;
  if (values.password) changes.password = values.password;
  return changes;
};

//Bozza del personale nella sezione del profilo: persone nuove, modifiche ed eliminazioni
//restano in locale finché non si salva. Si salvano una per volta (prima le eliminazioni, così
//gli username si liberano) e chi non si salva resta in bozza con l'errore sulla sua riga
export const useStaffDraft = () => {
  const { data: staff = [], isLoading, isError } = useStaff();
  const { mutateAsync: create } = useCreateStaff();
  const { mutateAsync: update } = useUpdateStaff();
  const { mutateAsync: remove } = useDeleteStaff();

  const [changes, setChanges] = useState<Record<string, StaffUpdate>>({});
  const [created, setCreated] = useState<DraftNewMember[]>([]);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  //persona col form aperto: il suo id, oppure NEW_MEMBER
  const [editing, setEditing] = useState<string | null>(null);
  const newCounter = useRef(0);

  const saved = (id: string) => staff.find((m) => m.id === id);
  const createdOne = (id: string) => created.find((m) => m.id === id);

  //Elenco come sarà dopo il salvataggio
  const members: StaffMember[] = [
    ...staff
      .filter((m) => !deleted.includes(m.id))
      .map((m) => merged(m, changes[m.id])),
    ...created.map(({ id, name, role, username, enabled }) => ({
      id,
      name,
      role,
      username,
      enabled,
    })),
  ];

  //Username già di un'altra persona dell'elenco (il backend lo ricontrolla)
  const usernameTaken = (username: string, exceptId: string | null) =>
    members.some(
      (m) => m.id !== exceptId && sameUsername(m.username, username),
    );

  //Password scritta in bozza per la persona (per riaprirne il form)
  const pendingPassword = (id: string) =>
    createdOne(id)?.password ?? changes[id]?.password ?? "";

  //Conferma del form: la persona nuova entra nella bozza, delle altre si tengono i soli cambi
  const confirm = (values: NewStaffMember) => {
    const id = editing;
    if (!id) return;
    if (id === NEW_MEMBER) {
      const tempId = `new-${++newCounter.current}`;
      setCreated((c) => [...c, { ...values, id: tempId }]);
    } else if (createdOne(id)) {
      setCreated((c) => c.map((m) => (m.id === id ? { ...values, id } : m)));
    } else {
      const member = saved(id);
      const c = member ? diff(member, values) : {};
      setChanges((all) =>
        Object.keys(c).length > 0 ? { ...all, [id]: c } : without(all, id),
      );
    }
    setErrors((e) => without(e, id));
    setEditing(null);
  };

  const removeMember = (id: string) => {
    if (createdOne(id)) setCreated((c) => c.filter((m) => m.id !== id));
    else {
      setDeleted((d) => [...d, id]);
      setChanges((all) => without(all, id));
    }
    setErrors((e) => without(e, id));
  };

  const reset = () => {
    setChanges({});
    setCreated([]);
    setDeleted([]);
    setErrors({});
    setEditing(null);
  };

  //Se il salvataggio di una persona non va, l'errore si vede sulla sua riga
  const guard = (id: string, run: () => Promise<void>) => async () => {
    try {
      await run();
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: saveErrorMessage(err) }));
      throw err;
    }
  };

  const tasks: SaveTask[] = [
    ...deleted.map((id) => ({
      label: saved(id)?.name ?? id,
      dirty: true,
      run: guard(id, async () => {
        await remove(id);
        setDeleted((d) => d.filter((x) => x !== id));
      }),
    })),
    ...Object.entries(changes).map(([id, c]) => ({
      label: c.name ?? saved(id)?.name ?? id,
      dirty: true,
      run: guard(id, async () => {
        await update({ id, changes: c });
        setChanges((all) => without(all, id));
      }),
    })),
    ...created.map(({ id, ...member }) => ({
      label: member.name,
      dirty: true,
      run: guard(id, async () => {
        await create(member);
        setCreated((c) => c.filter((m) => m.id !== id));
      }),
    })),
  ];

  return {
    members,
    isLoading,
    isError,
    editing,
    setEditing,
    errors,
    //persone che verranno eliminate salvando
    deletedNames: deleted.map((id) => saved(id)?.name ?? id),
    //persona aggiunta in questa modifica
    isNewMember: (id: string) => !!createdOne(id),
    //persona nuova o cambiata, non ancora salvata
    isPending: (id: string) => !!createdOne(id) || id in changes,
    //com'è salvata (per il ruolo che si può tenere anche se non serve più)
    savedRole: (id: string) => saved(id)?.role,
    usernameTaken,
    pendingPassword,
    confirm,
    removeMember,
    reset,
    tasks,
  };
};

export type StaffDraft = ReturnType<typeof useStaffDraft>;
