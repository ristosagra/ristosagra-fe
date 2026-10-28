import { Fragment } from "react";
import { Ban, Check } from "lucide-react";
import { ThemeVariants } from "../constant/colors";
import { cn } from "../helpers/cn";

export interface Choice<T> {
  value: T;
  label: string;
  description: string;
  //etichetta accanto al nome (es. "Consigliato")
  badge?: string;
}

interface ChoiceListProps<T extends string> {
  label: string;
  choices: Choice<T>[];
  //null = nessuna opzione scelta (es. impostazioni fatte a mano, che non sono un modo già pronto)
  value: T | null;
  onChange: (value: T) => void;
  //perché la scelta non vale con le altre impostazioni: al posto delle opzioni c'è il motivo
  disabledReason?: string | null;
  //impostazioni legate a un'opzione, mostrate subito sotto la sua scheda
  extras?: Partial<Record<T, React.ReactNode>>;
}

//Una scelta tra più opzioni descritte (in modifica): schede selezionabili, una sola scelta
export const ChoiceList = <T extends string>({
  label,
  choices,
  value,
  onChange,
  disabledReason,
  extras,
}: ChoiceListProps<T>) => {
  const current =
    value === null
      ? undefined
      : (choices.find((c) => c.value === value) ?? choices[0]);

  if (disabledReason)
    return (
      <div className="opacity-60">
        <p className="text-sm font-semibold">{label}</p>
        <p
          className={`flex items-start gap-1.5 text-sm ${ThemeVariants.colors.text.secondary}`}
        >
          <Ban size={14} aria-hidden className="mt-0.5 shrink-0" />
          {disabledReason}
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
        {choices.map((c) => {
          const selected = c.value === current?.value;
          return (
            <Fragment key={c.value}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(c.value)}
                className={cn(
                  "flex items-start gap-3 p-3 text-left cursor-pointer transition-colors",
                  ThemeVariants.borderRadius.md,
                  selected
                    ? `${ThemeVariants.colors.bg.hover} border border-[var(--brand)]`
                    : ThemeVariants.colors.border.all.default,
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center",
                    ThemeVariants.borderRadius.full,
                    selected
                      ? `${ThemeVariants.colors.bg.brand} text-white`
                      : ThemeVariants.colors.border.all.default,
                  )}
                >
                  {selected && <Check size={13} />}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold">
                    {c.label}
                    {c.badge && (
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs",
                          ThemeVariants.borderRadius.full,
                          ThemeVariants.colors.border.all.brand,
                          ThemeVariants.colors.text.brand,
                        )}
                      >
                        {c.badge}
                      </span>
                    )}
                  </span>
                  <span
                    className={`block text-sm ${ThemeVariants.colors.text.secondary}`}
                  >
                    {c.description}
                  </span>
                </span>
              </button>
              {extras?.[c.value] && (
                <div className="pl-8 pr-3">{extras[c.value]}</div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
