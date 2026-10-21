import { ThemeVariants } from "../constant/colors";
import { Toggle } from "./core/Toogle";

interface SettingSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  isEditMode: boolean;
  onChange: (value: boolean) => void;
}

//Impostazione sì/no del profilo: interruttore in modifica, "Sì"/"No" in lettura
export const SettingSwitch = ({
  label,
  description,
  value,
  isEditMode,
  onChange,
}: SettingSwitchProps) => (
  <div className="flex items-center justify-between gap-4">
    <div className="min-w-0">
      <p className="text-sm font-semibold">{label}</p>
      {description && (
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {description}
        </p>
      )}
    </div>
    {isEditMode ? (
      <Toggle
        value={value}
        onChange={() => onChange(!value)}
        ariaLabel={label}
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
