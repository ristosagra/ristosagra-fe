import { ThemeVariants } from "../../constant/colors";

interface InputProps {
  type: string;
  placeholder: string;
  value: string;
  setValue: (value: React.SetStateAction<string>) => void;
  variant?: "primary" | "secondary";
  className?: string;
  autoFocus?: boolean;
}

export const Input = ({
  type,
  placeholder,
  value,
  setValue,
  variant = "primary",
  className,
  autoFocus,
}: InputProps) => {
  const variantClass = {
    primary: `${ThemeVariants.colors.border.all.brand} ${ThemeVariants.colors.bg.overlay}`,
    secondary: `${ThemeVariants.colors.border.all.default} ${
      ThemeVariants.colors.bg.surface
    }`,
  }[variant];

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={`p-2 ${variantClass} ${className} ${autoFocus} ${ThemeVariants.borderRadius.sm} `}
    />
  );
};
