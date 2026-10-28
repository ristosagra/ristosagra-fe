import { Input } from "../../../components/core/Input";
import { ThemeVariants } from "../../../constant/colors";
import { ROOT_DOMAIN } from "../../../constant/env";
import { cn } from "../../../helpers/cn";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { useSlugAvailability } from "../hook/usePlatform";
import { slugError } from "../utils/slug";
import { FormField } from "./FormField";

interface SlugFieldProps {
  value: string;
  onChange: (value: string) => void;
  //errore dell'invio (es. indirizzo preso nel frattempo)
  error?: string;
}

//Indirizzo della sagra (<slug>.ristosagra.it): mentre si scrive dice se va bene e se è libero
export const SlugField = ({ value, onChange, error }: SlugFieldProps) => {
  //si chiede al backend solo quando si smette di scrivere
  const checked = useDebouncedValue(value, 400);
  const { data, isFetching } = useSlugAvailability(checked);
  const formatError = value ? slugError(value) : null;
  const waiting = checked !== value || isFetching;

  const status = formatError ? (
    <span className={ThemeVariants.colors.text.danger}>{formatError}</span>
  ) : !value ? (
    "È l'indirizzo che userete voi e i vostri clienti"
  ) : waiting ? (
    "Controllo l'indirizzo…"
  ) : data?.available === false ? (
    <span className={ThemeVariants.colors.text.danger}>Già in uso</span>
  ) : data?.available ? (
    <span className={ThemeVariants.colors.text.success}>Indirizzo libero</span>
  ) : null;

  return (
    <FormField label="Indirizzo della sagra" error={error} hint={status}>
      <span className="flex items-center gap-2">
        <Input
          type="text"
          name="slug"
          placeholder="sagradelpesce"
          ariaLabel="Indirizzo della sagra"
          value={value}
          setValue={onChange}
          autoComplete="off"
          maxLength={100}
          className="flex-1 min-w-0"
        />
        <span className={cn("shrink-0", ThemeVariants.colors.text.secondary)}>
          .{ROOT_DOMAIN}
        </span>
      </span>
    </FormField>
  );
};
