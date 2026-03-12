import { ThemeVariants } from "../../constant/colors";

interface ToggleProps {
  value: boolean;
  onChange: () => void;
  variant?: "primary" | "secondary";
}

export const Toggle = ({
  value,
  onChange,
  variant = "primary",
}: ToggleProps) => {
  const variantClass = {
    primary: value
      ? `${ThemeVariants.colors.bg.brand} ${ThemeVariants.colors.border.all.default}`
      : `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.default}`,
    secondary: `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`,
  }[variant];

  return (
    <button
      onClick={onChange}
      className={`relative cursor-pointer w-12 h-6 rounded-full transition-colors outline-none focus:outline-none focus-visible:outline-none ${
        variantClass
      }`}
    >
      <span
        className={`absolute top-[2.75px] w-4 h-4 ${ThemeVariants.colors.bg.white} rounded-full shadow transition-all ${
          value ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
};
