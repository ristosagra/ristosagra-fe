import { ThemeVariants } from "../../constant/colors";
import { cn } from "../../helpers/cn";

interface ToggleProps {
  value: boolean;
  onChange: () => void;
  variant?: "primary" | "secondary";
  //cosa attiva/disattiva l'interruttore, per i lettori di schermo
  ariaLabel?: string;
  //non si può cambiare (es. un'impostazione che non vale con le altre scelte)
  disabled?: boolean;
}

export const Toggle = ({
  value,
  onChange,
  variant = "primary",
  ariaLabel,
  disabled = false,
}: ToggleProps) => {
  const variantClass = {
    primary: value
      ? `${ThemeVariants.colors.bg.brand} ${ThemeVariants.colors.border.all.default}`
      : `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.default}`,
    secondary: `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`,
  }[variant];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative w-12 h-6 shrink-0 rounded-full transition-colors",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        //area da toccare più grande dell'interruttore, comoda sul cellulare
        "after:absolute after:-inset-2",
        variantClass,
      )}
    >
      <span
        className={cn(
          "absolute top-[2.75px] w-4 h-4 rounded-full shadow transition-all",
          ThemeVariants.colors.bg.white,
          value ? "left-7" : "left-1",
        )}
      />
    </button>
  );
};
