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
import { SettingSwitch } from "../../../components/SettingSwitch";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { PERSON_NAME_MAX } from "../../../constant/limits";
import { cn } from "../../../helpers/cn";
import { useTakeawaySettings } from "../../orders/hook/useOrders";
import { useRestaurant } from "../../restaurant/hook/useRestaurant";
import { NEW_MEMBER, type StaffDraft } from "../hook/useStaffDraft";
import {
  PASSWORD_MAX,
  StaffRole,
  USERNAME_MAX,
  type NewStaffMember,
  type SessionUser,
  type StaffMember,
  type StaffRoleConst,
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
  roleUnavailableReason,
  staffRoleLabel,
} from "../utils/permissions";

//Ruoli secondo le impostazioni del ristorante: nome (es. Banco ritiro asporto) e se servono
interface RoleInfo {
  label: (role: StaffRoleConst) => string;
  unavailable: (role: StaffRoleConst) => string | null;
}

interface StaffFormProps {
  //chi sta facendo le modifiche (titolare o vice)
  actor: SessionUser;
  //assente = persona nuova
  member?: StaffMember;
  //persona aggiunta in questa modifica (la password serve ancora)
  isNew: boolean;
  //password già scritta in bozza
  initialPassword: string;
  //ruolo salvato: si può tenere anche se con le impostazioni attuali non serve
  savedRole?: StaffRoleConst;
  roleInfo: RoleInfo;
  usernameTaken: (username: string) => boolean;
  onConfirm: (values: NewStaffMember) => void;
  onCancel: () => void;
}

//Dati di una persona: nome, ruolo, username, password e accesso. Conferma li mette nella bozza
//della sezione, che si salva con Salva. Modificando una persona la password si cambia solo se se
//ne scrive una nuova. Ruolo e accesso solo se chi modifica può gestirla (non il titolare, non se
//stessi, i vice solo dal titolare). I ruoli che con le impostazioni del ristorante non servono
//non si possono dare (chi li ha già li tiene)
const StaffForm = ({
  actor,
  member,
  isNew,
  initialPassword,
  savedRole,
  roleInfo,
  usernameTaken,
  onConfirm,
  onCancel,
}: StaffFormProps) => {
  const manageable = !member || canManageMember(actor, member);
  const roles = assignableRoles(actor.role);

  const [name, setName] = useState(member?.name ?? "");
  const [role, setRole] = useState<StaffRoleConst>(
    member?.role ?? StaffRole.Cashier,
  );
  const [username, setUsername] = useState(member?.username ?? "");
  const [password, setPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(
    isNew || initialPassword !== "",
  );
  const [enabled, setEnabled] = useState(member?.enabled ?? true);

  //ruoli che non servono: bloccati, tranne quello che la persona ha già
  const blockedRoles = roles.filter(
    (r) => r !== savedRole && roleInfo.unavailable(r),
  );
  const formError =
    (!name.trim() && "Nome mancante") ||
    usernameError(username) ||
    (usernameTaken(username) &&
      "Questo username è già usato da un'altra persona") ||
    passwordError(password, isNew);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formError) return;
    onConfirm({
      name: name.trim(),
      role,
      username: username.trim(),
      enabled,
      password,
    });
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
        {member ? `Modifica ${member.name}` : "Nuova persona"}
      </p>
      <Input
        type="text"
        placeholder="Nome (es. Marco)"
        value={name}
        setValue={setName}
        maxLength={PERSON_NAME_MAX}
        variant="secondary"
        className="w-full text-sm"
        ariaLabel="Nome"
        autoComplete="off"
      />

      {!manageable ? (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          Ruolo: <span className="font-semibold">{roleInfo.label(role)}</span>
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div
            role="radiogroup"
            aria-label="Ruolo"
            className="flex flex-wrap gap-2"
          >
            {roles.map((r) => (
              <Button
                key={r}
                label={<span className="text-sm">{roleInfo.label(r)}</span>}
                onClick={() => setRole(r)}
                dimension={ButtonDimensions.auto}
                variant={role === r ? "primary" : "secondary"}
                disabled={blockedRoles.includes(r)}
                className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            ))}
          </div>
          {blockedRoles.map((r) => (
            <p
              key={r}
              className={`text-sm ${ThemeVariants.colors.text.secondary}`}
            >
              <span className="font-semibold">{roleInfo.label(r)}</span>:{" "}
              {roleInfo.unavailable(r)}
            </p>
          ))}
        </div>
      )}

      <Input
        type="text"
        placeholder="Username per accedere"
        value={username}
        setValue={setUsername}
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
          setValue={setPassword}
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
            setPassword(generatePassword());
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

      {formError && (
        <p
          role="alert"
          className={`text-sm ${ThemeVariants.colors.text.secondary}`}
        >
          {formError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          iconLeft={<X size={15} />}
          label={<span className="text-sm ml-1">Annulla</span>}
          onClick={onCancel}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="px-3 py-2"
        />
        <Button
          type="submit"
          iconLeft={<Check size={15} />}
          label={
            <span className="text-sm ml-1">
              {member ? "Conferma" : "Aggiungi"}
            </span>
          }
          dimension={ButtonDimensions.auto}
          variant="primary"
          disabled={!!formError}
          className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>
    </form>
  );
};

interface StaffRowProps {
  actor: SessionUser;
  member: StaffMember;
  roleInfo: RoleInfo;
  isEditMode: boolean;
  //non ancora salvata (nuova o cambiata)
  pending: boolean;
  //salvataggio non riuscito
  error?: string;
  //altro form aperto: si conferma o annulla prima quello
  locked: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

//Una persona nell'elenco. In modifica, quando chi guarda può farlo (vedi canEditMember /
//canManageMember), si cambia o si toglie. Chi non può accedere si vede spento, ma i pulsanti
//restano normali
const StaffRow = ({
  actor,
  member,
  roleInfo,
  isEditMode,
  pending,
  error,
  locked,
  onEdit,
  onDelete,
}: StaffRowProps) => {
  const isMe = member.id === actor.id;
  const editable = isEditMode && canEditMember(actor, member);
  const manageable = isEditMode && canManageMember(actor, member);
  const roleUnused = roleInfo.unavailable(member.role);

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-2 p-3",
        ThemeVariants.borderRadius.md,
        member.enabled
          ? ThemeVariants.colors.border.all.default
          : "border border-dashed border-[var(--border)]",
      )}
    >
      <div className="flex-1 min-w-40">
        <div className={cn(!member.enabled && "opacity-50")}>
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
            <span
              className={
                member.enabled ? ThemeVariants.colors.text.brand : undefined
              }
            >
              {roleInfo.label(member.role)}
            </span>{" "}
            · utente <span className="font-semibold">{member.username}</span>
            {!member.enabled && " · accesso bloccato"}
          </p>
          {roleUnused && (
            <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
              Ruolo non usato con le impostazioni attuali: {roleUnused}
            </p>
          )}
        </div>
        {(error || pending) && (
          <p
            className={`text-sm ${error ? ThemeVariants.colors.text.danger : ThemeVariants.colors.text.brand}`}
          >
            {error ?? "Da salvare"}
          </p>
        )}
      </div>

      {(editable || manageable) && (
        <div className="flex items-center gap-2 ml-auto">
          {editable && (
            <Button
              iconLeft={<Pencil size={15} />}
              onClick={onEdit}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              disabled={locked}
              className="w-9 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
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
              onClick={onDelete}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              disabled={locked}
              className="w-9 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
              ariaLabel={`Elimina ${member.name}`}
            />
          )}
        </div>
      )}
    </li>
  );
};

interface StaffSettingsProps {
  actor: SessionUser;
  //bozza della sezione Personale
  draft: StaffDraft;
  isEditMode: boolean;
}

//Personale del ristorante, gestito dal titolare e dai vice: chi lavora, con che ruolo, con quale
//username e password entra e se può accedere. In lettura l'elenco; con Modifica si aggiungono,
//cambiano ed eliminano persone, che si salvano tutte con Salva. I ruoli seguono le impostazioni
//del ristorante (es. Banco ritiro solo se c'è qualcosa da consegnare al banco)
export const StaffSettings = ({
  actor,
  draft,
  isEditMode,
}: StaffSettingsProps) => {
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant();
  const { data: takeaway, isLoading: takeawayLoading } = useTakeawaySettings();
  const { editing, setEditing } = draft;
  const secondary = `text-sm ${ThemeVariants.colors.text.secondary}`;
  const roleInfo: RoleInfo = {
    label: (role) => staffRoleLabel(role, restaurant, takeaway),
    unavailable: (role) => roleUnavailableReason(role, restaurant, takeaway),
  };

  if (draft.isLoading || restaurantLoading || takeawayLoading)
    return <p className={secondary}>Caricamento del personale…</p>;
  if (draft.isError)
    return (
      <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
        Errore nel caricamento del personale
      </p>
    );

  const form = (member?: StaffMember) => (
    <StaffForm
      actor={actor}
      member={member}
      isNew={!member || draft.isNewMember(member.id)}
      initialPassword={member ? draft.pendingPassword(member.id) : ""}
      savedRole={member && draft.savedRole(member.id)}
      roleInfo={roleInfo}
      usernameTaken={(username) =>
        draft.usernameTaken(username, member?.id ?? null)
      }
      onConfirm={draft.confirm}
      onCancel={() => setEditing(null)}
    />
  );

  return (
    <div className="flex flex-col gap-3">
      <p className={secondary}>
        Ognuno entra nell'area del personale con il suo username e vede solo la
        parte del suo ruolo. I vice amministratori hanno gli stessi poteri del
        titolare, ma solo il titolare li nomina e li elimina.{" "}
        {isEditMode
          ? "Le modifiche alle persone si salvano tutte con Salva."
          : "Clicca Modifica per aggiungere, cambiare o eliminare persone."}
      </p>
      <ul className="flex flex-col gap-2">
        {sortStaff(draft.members).map((m) =>
          isEditMode && editing === m.id ? (
            <li key={m.id}>{form(m)}</li>
          ) : (
            <StaffRow
              key={m.id}
              actor={actor}
              member={m}
              roleInfo={roleInfo}
              isEditMode={isEditMode}
              pending={draft.isPending(m.id)}
              error={draft.errors[m.id]}
              locked={editing !== null}
              onEdit={() => setEditing(m.id)}
              onDelete={() => draft.removeMember(m.id)}
            />
          ),
        )}
      </ul>
      {draft.deletedNames.length > 0 && (
        <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
          Da eliminare salvando: {draft.deletedNames.join(", ")}
        </p>
      )}
      {isEditMode &&
        (editing === NEW_MEMBER ? (
          form()
        ) : (
          <Button
            iconLeft={<UserPlus size={15} />}
            label={<span className="text-sm ml-1.5">Aggiungi persona</span>}
            onClick={() => setEditing(NEW_MEMBER)}
            dimension={ButtonDimensions.auto}
            variant="primary"
            disabled={editing !== null}
            className="px-3 py-2 self-start disabled:opacity-40 disabled:cursor-not-allowed"
          />
        ))}
    </div>
  );
};
