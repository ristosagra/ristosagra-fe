import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";

interface FormFieldProps {
  label: string;
  //errore del campo, mostrato sotto in rosso
  error?: string;
  //aiuto sotto al campo quando non c'è un errore
  hint?: React.ReactNode;
  className?: string;
  //il campo (Input): dentro la <label>, così è collegato all'etichetta
  children: React.ReactNode;
}

//Campo di un form con etichetta visibile, aiuto ed errore
export const FormField = ({
  label,
  error,
  hint,
  className,
  children,
}: FormFieldProps) => (
  <div className={cn("flex flex-col gap-1", className)}>
    <label className="flex flex-col gap-1">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
    {error ? (
      <p
        role="alert"
        className={cn(
          "text-sm font-semibold",
          ThemeVariants.colors.text.danger,
        )}
      >
        {error}
      </p>
    ) : (
      hint && (
        <p className={cn("text-sm", ThemeVariants.colors.text.secondary)}>
          {hint}
        </p>
      )
    )}
  </div>
);
