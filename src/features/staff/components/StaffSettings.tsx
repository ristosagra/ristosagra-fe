import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Shuffle,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { Toggle } from "../../../components/core/Toogle";
import { SettingSwitch } from "../../../components/SettingSwitch";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { PERSON_NAME_MAX } from "../../../constant/limits";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import { HttpError } from "../../../services/client/httpClient";
import { NotificationType } from "../../../types/notification";
import {
  useCreateStaff,
  useDeleteStaff,
  useStaff,
  useUpdateStaff,
} from "../hook/useStaff";
import {
  PASSWORD_MAX,
  STAFF_ROLE_LABELS,
  StaffRole,
  USERNAME_MAX,
  type SessionUser,
  type StaffMember,
  type StaffRoleConst,
  type StaffUpdate,
} from "../types/staff";
import {
  generatePassword,
  passwordError,
  sortStaff,
  usernameError,
} from "../utils/staffForm";
import {
  assignableRoles,
  canEditMember,
  canManageMember,
} from "../utils/permissions";

const saveErrorMessage = (err: unknown) =>
  err instanceof HttpError && err.status === 409
    ? "Questo username è già usato da un'altra persona"
    : "Errore nel salvataggio, riprova";

interface StaffFormProps {
  //chi sta facendo le modifiche (titolare o vice)
  actor: SessionUser;
  //assente = persona nuova
  member?: StaffMember;
  onDone: () => void;
}

//Dati di una persona: nome, ruolo, username, password e accesso. Modificando una persona
//la password si cambia solo se se ne scrive una nuova. Ruolo e accesso solo se chi modifica
//può gestirla (non il titolare, non se stessi, i vice solo dal titolare)
const StaffForm = ({ actor, member, onDone }: StaffFormProps) => {
  const isNew = !member;
  const manageable = !member || canManageMember(actor, member);
  const roles = assignableRoles(actor.role);
  const { mutate: create, isPending: isCreating } = useCreateStaff();
  const { mutate: update, isPending: isUpdating } = useUpdateStaff();
  const showNotification = useNotification();

  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState<StaffRoleConst>(
    member?.role ?? StaffRole.Cashier,
  );
  const [username, setUsername] = useState(member?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(isNew);
  const [enabled, setEnabled] = useState(member?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  //cambiando un campo l'errore del salvataggio precedente non vale più
  const edit =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setError(null);
    };

  const isPending = isCreating || isUpdating;
  const formError =
    (!name.trim() && "Nome mancante") ||
    usernameError(username) ||
    passwordError(password, isNew);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formError || isPending) return;
    setError(null);
    const values = {
      name: name.trim(),
      role,
      username: username.trim(),
      enabled,
    };
    const options = {
      onSuccess: () => {
        showNotification(
          isNew ? `${values.name} aggiunto al personale` : "Modifiche salvate",
          NotificationType.Ok,
        );
        onDone();
      },
      onError: (err: unknown) => setError(saveErrorMessage(err)),
    };
    if (!member) return create({ ...values, password }, options);
    //solo i campi cambiati, la password solo se è stata scritta
    const changes: StaffUpdate = {};
    if (values.name !== member.name) changes.name = values.name;
    if (values.role !== member.role) changes.role = values.role;
    if (values.username !== member.username) changes.username = values.username;
    if (values.enabled !== member.enabled) changes.enabled = values.enabled;
    if (password) changes.password = password;
    if (Object.keys(changes).length === 0) return onDone();
    update({ id: member.id, changes }, options);
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex flex-col gap-3 p-3",
        ThemeVariants.borderRadius.md,
        ThemeVariants.colors.bg.hover,
        "border border-[var(--brand)]",
      )}
    >
      <p className="text-sm font-semibold">
        {isNew ? "Nuova persona" : `Modifica ${member.name}`}
      </p>
      <Input
        type="text"
        placeholder="Nome (es. Marco)"
        value={name}
        setValue={edit(setName)}
        maxLength={PERSON_NAME_MAX}
        variant="secondary"
        className="w-full text-sm"
        ariaLabel="Nome"
        autoComplete="off"
      />

      {!manageable ? (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          Ruolo:{" "}
          <span className="font-semibold">{STAFF_ROLE_LABELS[role]}</span>
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-label="Ruolo"
          className="flex flex-wrap gap-2"
        >
          {roles.map((r) => (
            <Button
              key={r}
              label={<span className="text-sm">{STAFF_ROLE_LABELS[r]}</span>}
              onClick={() => edit(setRole)(r)}
              dimension={ButtonDimensions.auto}
              variant={role === r ? "primary" : "secondary"}
              className="px-3 py-2"
            />
          ))}
        </div>
      )}

      <Input
        type="text"
        placeholder="Username per accedere"
        value={username}
        setValue={edit(setUsername)}
        maxLength={USERNAME_MAX}
        variant="secondary"
        className="w-full text-sm"
        ariaLabel="Username"
        autoComplete="off"
      />
      <div className="flex gap-2">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder={
            isNew ? "Password" : "Nuova password (vuota = resta quella)"
          }
          value={password}
          setValue={edit(setPassword)}
          maxLength={PASSWORD_MAX}
          variant="secondary"
          className="flex-1 text-sm"
          ariaLabel={isNew ? "Password" : "Nuova password"}
          autoComplete="new-password"
        />
        <Button
          iconLeft={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          onClick={() => setShowPassword((s) => !s)}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="w-10 shrink-0"
          ariaLabel={
            showPassword ? "Nascondi la password" : "Mostra la password"
          }
        />
        <Button
          iconLeft={<Shuffle size={16} />}
          label={<span className="text-sm ml-1.5 max-sm:hidden">Genera</span>}
          onClick={() => {
            edit(setPassword)(generatePassword());
            setShowPassword(true);
          }}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="px-3 shrink-0"
          ariaLabel="Genera una password"
        />
      </div>

      {manageable && (
        <SettingSwitch
          label="Può accedere"
          description={
            enabled
              ? "Entra con username e password"
              : "Accesso bloccato: i dati restano salvati"
          }
          value={enabled}
          isEditMode
          onChange={setEnabled}
        />
      )}

      {(error || formError) && (
        <p
          role="alert"
          className={`text-sm ${error ? ThemeVariants.colors.text.danger : ThemeVariants.colors.text.secondary}`}
        >
          {error ?? formError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          iconLeft={<X size={15} />}
          label={<span className="text-sm ml-1">Annulla</span>}
          onClick={onDone}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="px-3 py-2"
        />
        <Button
          type="submit"
          iconLeft={<Check size={15} />}
          label={
            <span className="text-sm ml-1">{isNew ? "Aggiungi" : "Salva"}</span>
          }
          dimension={ButtonDimensions.auto}
          variant="primary"
          disabled={!!formError || isPending}
          className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </form>
  );
};

interface StaffRowProps {
  actor: SessionUser;
  member: StaffMember;
  onEdit: () => void;
}

//Una persona nell'elenco: accesso attivabile al volo, modifica ed eliminazione, quando chi
//guarda può farlo (vedi canEditMember / canManageMember)
const StaffRow = ({ actor, member, onEdit }: StaffRowProps) => {
  const { mutate: update, isPending: isUpdating } = useUpdateStaff();
  const { mutate: remove, isPending: isDeleting } = useDeleteStaff();
  const showNotification = useNotification();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isMe = member.id === actor.id;
  const editable = canEditMember(actor, member);
  const manageable = canManageMember(actor, member);

  const toggleAccess = () =>
    update(
      { id: member.id, changes: { enabled: !member.enabled } },
      {
        onError: () =>
          showNotification("Errore nel salvataggio", NotificationType.Err),
      },
    );

  const doDelete = () =>
    remove(member.id, {
      onSuccess: () =>
        showNotification(`${member.name} eliminato`, NotificationType.Ok),
      onError: () =>
        showNotification("Errore nell'eliminazione", NotificationType.Err),
    });

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 p-3",
        ThemeVariants.borderRadius.md,
        ThemeVariants.colors.border.all.default,
        !member.enabled && "opacity-70",
      )}
    >
      <div className="flex-1 min-w-40">
        <p className="font-semibold [overflow-wrap:anywhere]">
          {member.name}
          {isMe && (
            <span
              className={`font-normal ${ThemeVariants.colors.text.secondary}`}
            >
              {" "}
              (tu)
            </span>
          )}
        </p>
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          <span className={ThemeVariants.colors.text.brand}>
            {STAFF_ROLE_LABELS[member.role]}
          </span>{" "}
          · utente <span className="font-semibold">{member.username}</span>
          {!member.enabled && (
            <span className={ThemeVariants.colors.text.danger}>
              {" "}
              · accesso bloccato
            </span>
          )}
        </p>
      </div>

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">Eliminare?</span>
          <Button
            label={<span className="text-sm">Sì</span>}
            onClick={doDelete}
            dimension={ButtonDimensions.auto}
            variant="danger"
            disabled={isDeleting}
            className="px-3 py-2"
          />
          <Button
            label={<span className="text-sm">No</span>}
            onClick={() => setConfirmDelete(false)}
            dimension={ButtonDimensions.auto}
            variant="secondary"
            className="px-3 py-2"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 ml-auto">
          {manageable && (
            <span className="mr-2 flex items-center">
              <Toggle
                value={member.enabled}
                onChange={() => !isUpdating && toggleAccess()}
                ariaLabel={`Accesso di ${member.name}`}
              />
            </span>
          )}
          {editable && (
            <Button
              iconLeft={<Pencil size={15} />}
              onClick={onEdit}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="w-9 h-9"
              ariaLabel={`Modifica ${member.name}`}
            />
          )}
          {manageable && (
            <Button
              iconLeft={
                <Trash2
                  size={15}
                  className={ThemeVariants.colors.text.danger}
                />
              }
              onClick={() => setConfirmDelete(true)}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="w-9 h-9"
              ariaLabel={`Elimina ${member.name}`}
            />
          )}
        </div>
      )}
    </li>
  );
};

//Personale del ristorante, gestito dal titolare e dai vice: chi lavora, con che ruolo, con quale
//username e password entra e se può accedere. Le modifiche si salvano subito
export const StaffSettings = ({ actor }: { actor: SessionUser }) => {
  const { data: staff = [], isLoading, isError } = useStaff();
  //persona in modifica ("new" = nuova)
  const [editing, setEditing] = useState<string | null>(null);
  const secondary = `text-sm ${ThemeVariants.colors.text.secondary}`;

  if (isLoading) return <p className={secondary}>Caricamento del personale…</p>;
  if (isError)
    return (
      <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
        Errore nel caricamento del personale
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <p className={secondary}>
        Ognuno entra nell'area del personale con il suo username e vede solo la
        parte del suo ruolo. I vice amministratori hanno gli stessi poteri del
        titolare, ma solo il titolare li nomina e li elimina. Le modifiche qui
        si salvano subito.
      </p>
      <ul className="flex flex-col gap-2">
        {sortStaff(staff).map((m) =>
          editing === m.id ? (
            <li key={m.id}>
              <StaffForm
                actor={actor}
                member={m}
                onDone={() => setEditing(null)}
              />
            </li>
          ) : (
            <StaffRow
              key={m.id}
              actor={actor}
              member={m}
              onEdit={() => setEditing(m.id)}
            />
          ),
        )}
      </ul>
      {editing === "new" ? (
        <StaffForm actor={actor} onDone={() => setEditing(null)} />
      ) : (
        <Button
          iconLeft={<UserPlus size={15} />}
          label={<span className="text-sm ml-1.5">Aggiungi persona</span>}
          onClick={() => setEditing("new")}
          dimension={ButtonDimensions.auto}
          variant="primary"
          className="px-3 py-2 self-start"
        />
      )}
    </div>
  );
};
