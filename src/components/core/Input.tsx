import { ThemeVariants } from "../../constant/colors";

interface InputProps {
  type: string;
  placeholder: string;
  value: string;
  setValue: (value: React.SetStateAction<string>) => void;
}

export const Input = ({ type, placeholder, value, setValue }: InputProps) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className={`p-2 ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.sm} ${ThemeVariants.colors.bg.overlay}`}
    />
  );
};
