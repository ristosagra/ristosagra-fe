import { ThemeVariants } from "../constant/colors";
import { cn } from "../helpers/cn";
import { Toggle } from "./core/Toogle";

interface SettingSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  isEditMode: boolean;
  onChange: (value: boolean) => void;
  //perché non si può cambiare con le altre scelte: l'interruttore resta spento e bloccato
  disabledReason?: string | null;
}

//Impostazione sì/no del profilo: interruttore in modifica, "Sì"/"No" in lettura
export const SettingSwitch = ({
  label,
  description,
  value,
  isEditMode,
  onChange,
  disabledReason,
}: SettingSwitchProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className={cn("min-w-0", disabledReason && "opacity-60")}>
      <p className="text-sm font-semibold">{label}</p>
      {(disabledReason || description) && (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {disabledReason ?? description}
        </p>
      )}
    </div>
    {isEditMode ? (
      <Toggle
        value={value && !disabledReason}
        onChange={() => onChange(!value)}
        ariaLabel={label}
        disabled={!!disabledReason}
      />
    ) : (
      <span
        className={`text-sm font-semibold shrink-0 ${value ? ThemeVariants.colors.text.brand : ThemeVariants.colors.text.secondary}`}
      >
        {value ? "Sì" : "No"}
      </span>
    )}
  </div>
);
