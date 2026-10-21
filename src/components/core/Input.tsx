import { ThemeVariants } from "../../constant/colors";
import { cn } from "../../helpers/cn";

interface InputProps {
  type: string;
  placeholder: string;
  value: string;
  setValue: (value: string) => void;
  variant?: "primary" | "secondary";
  className?: string;
  autoFocus?: boolean;
  //lunghezza massima del testo (limite anche per i dati inviati al backend)
  maxLength?: number;
  autoComplete?: string;
  name?: string;
  required?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: number;
  step?: number | "any";
  //nome per i lettori di schermo; se manca si usa il placeholder
  ariaLabel?: string;
  //id di un <datalist> con i valori suggeriti
  list?: string;
}

export const Input = ({
  type,
  placeholder,
  value,
  setValue,
  variant = "primary",
  className,
  autoFocus,
  maxLength,
  autoComplete,
  name,
  required,
  inputMode,
  min,
  step,
  ariaLabel,
  list,
}: InputProps) => {
  const variantClass = {
    primary: `${ThemeVariants.colors.border.all.brand} ${ThemeVariants.colors.bg.overlay}`,
    secondary: `${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface}`,
  }[variant];

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus={autoFocus}
      maxLength={maxLength}
      autoComplete={autoComplete}
      name={name}
      required={required}
      inputMode={inputMode}
      min={min}
      step={step}
      list={list}
      aria-label={ariaLabel ?? placeholder}
      className={cn(
        "p-2 min-w-0 transition-colors focus:border-[var(--brand)]",
        variantClass,
        className,
        ThemeVariants.borderRadius.sm,
      )}
    />
  );
};
