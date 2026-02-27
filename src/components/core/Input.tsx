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
      className="border p-2 rounded bg-white"
    />
  );
};
