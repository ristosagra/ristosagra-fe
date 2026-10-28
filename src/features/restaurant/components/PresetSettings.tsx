import { ChoiceList, type Choice } from "../../../components/ChoiceList";
import { SettingSwitch } from "../../../components/SettingSwitch";
import {
  SettingsSummary,
  SummaryItem,
} from "../../../components/SettingsSummary";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useStaff } from "../../staff/hook/useStaff";
import {
  STAFF_ROLE_LABELS,
  type StaffRoleConst,
} from "../../staff/types/staff";
import type { RestaurantProfile } from "../types/restaurant";
import {
  PRESETS,
  presetOf,
  type FestPresetConst,
  type Preset,
} from "../utils/presets";

const PRESET_CHOICES: Choice<FestPresetConst>[] = PRESETS.map((p) => ({
  value: p.id,
  label: p.label,
  description: p.description,
  badge: p.badge,
}));

//Ruoli che servono col modo scelto: in rosso quelli senza nessuno che può accedere
const NeededRoles = ({ roles }: { roles: StaffRoleConst[] }) => {
  const { data: staff } = useStaff();
  const missing = (role: StaffRoleConst) =>
    !!staff && !staff.some((m) => m.role === role && m.enabled);

  return (
    <span className="flex flex-wrap justify-end gap-1.5">
      {roles.map((role) => (
        <span
          key={role}
          className={cn(
            "px-2.5 py-0.5",
            ThemeVariants.borderRadius.full,
            missing(role)
              ? `${ThemeVariants.colors.border.all.danger} ${ThemeVariants.colors.text.danger}`
              : ThemeVariants.colors.border.all.brand,
          )}
        >
          {STAFF_ROLE_LABELS[role]}
          {missing(role) && ": nessuno"}
        </span>
      ))}
    </span>
  );
};

interface PresetSettingsProps {
  //profilo con la bozza della sezione
  profile: RestaurantProfile;
  takeawayEnabled: boolean;
  isEditMode: boolean;
  //compila la bozza con le impostazioni del modo scelto
  onApply: (preset: Preset) => void;
  onTakeawayChange: (enabled: boolean) => void;
}

//"Come funziona la tua festa?": un modo già pronto (sagra col ritiro al banco, sagra al tavolo,
//ristorante) compila in un tocco le scelte di questa sezione e l'asporto, che restano
//modificabili una per una. Se le scelte non sono quelle di un modo già pronto è "Personalizzato".
//Ricorda anche quali ruoli servono, in rosso quelli che non ha nessuno
export const PresetSettings = ({
  profile,
  takeawayEnabled,
  isEditMode,
  onApply,
  onTakeawayChange,
}: PresetSettingsProps) => {
  const preset = presetOf(profile, takeawayEnabled);
  const roles = preset && (
    <SummaryItem label="Persone che servono">
      <NeededRoles roles={preset.roles} />
    </SummaryItem>
  );

  if (!isEditMode)
    return (
      <div className="flex flex-col gap-2">
        <SettingsSummary>
          <SummaryItem label="Modo">
            {preset ? preset.label : "Personalizzato"}
          </SummaryItem>
          <SummaryItem label="Asporto">
            {takeawayEnabled ? "Attivo" : "Non attivo"}
          </SummaryItem>
          {roles}
        </SettingsSummary>
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {preset
            ? preset.description
            : "Le scelte qui sotto sono fatte a mano. Con Modifica puoi partire da un modo già pronto."}
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        Scegli un modo già pronto: compila le scelte qui sotto. Controlla e
        premi Salva; ogni scelta resta modificabile.
      </p>
      <ChoiceList
        label="Modo già pronto"
        choices={PRESET_CHOICES}
        value={preset?.id ?? null}
        onChange={(id) => {
          const chosen = PRESETS.find((p) => p.id === id);
          if (chosen) onApply(chosen);
        }}
      />
      {!preset && (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          Personalizzato: le scelte qui sotto non sono quelle di un modo già
          pronto.
        </p>
      )}
      <SettingSwitch
        label="Asporto"
        description={
          takeawayEnabled
            ? "Si prendono anche ordini da asporto: gli orari di ritiro sono in Orari e asporto"
            : "Niente asporto: gli orari di ritiro restano salvati"
        }
        value={takeawayEnabled}
        isEditMode
        onChange={onTakeawayChange}
      />
      {roles && <SettingsSummary>{roles}</SettingsSummary>}
    </div>
  );
};
