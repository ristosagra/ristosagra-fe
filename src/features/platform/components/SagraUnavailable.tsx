import { ThemeVariants } from "../../../constant/colors";
import { ROOT_DOMAIN } from "../../../constant/env";
import { cn } from "../../../helpers/cn";
import { platformUrl } from "../../../helpers/site";

interface SagraUnavailableProps {
  //"missing": l'indirizzo non è di nessuna sagra; "offline": registrata ma non attiva
  reason: "missing" | "offline";
  name?: string;
}

//Al posto del sito di una sagra che non esiste o non è ancora online
export const SagraUnavailable = ({ reason, name }: SagraUnavailableProps) => (
  <main
    className={cn(
      "h-full flex flex-col items-center justify-center gap-3 p-6 text-center",
      ThemeVariants.colors.bg.base,
    )}
  >
    {reason === "offline" && name && (
      <p
        className={cn(
          "text-3xl italic",
          ThemeVariants.colors.text.brand,
          ThemeVariants.fontFamily.display,
        )}
      >
        {name}
      </p>
    )}
    <h1 className="text-xl font-bold">
      {reason === "missing"
        ? "Questa sagra non esiste"
        : "Questa sagra non è ancora online"}
    </h1>
    <p className={ThemeVariants.colors.text.secondary}>
      {reason === "missing"
        ? "Controlla l'indirizzo."
        : "Torna a trovarci durante la sagra."}
    </p>
    {ROOT_DOMAIN && (
      <a
        href={platformUrl("/")}
        className={cn(
          "mt-4 text-sm underline underline-offset-4",
          ThemeVariants.colors.text.secondary,
        )}
      >
        Scopri Ristosagra
      </a>
    )}
  </main>
);
