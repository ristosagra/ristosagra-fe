import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeVariants } from "../../../../constant/colors";
import { EDITION_MONTHS, EDITION_PRICE } from "../../../../constant/platform";
import { cn } from "../../../../helpers/cn";
import { primaryLinkClass } from "../../utils/landingStyles";
import { LandingSection } from "./LandingSection";
import { PaperTicket } from "./PaperTicket";

const INCLUDED = [
  `Valida ${EDITION_MONTHS} mesi dal pagamento`,
  "Tutte le funzioni, tutti i volontari",
  "Nessun abbonamento, nessun rinnovo automatico",
  "Fattura elettronica",
  "Assistenza al telefono durante le serate",
];

//Prezzo: un solo prezzo per edizione, sul bigliettino
export const Pricing = () => (
  <LandingSection
    id="prezzo"
    title="Quanto costa"
    intro="Un prezzo per edizione, tutto incluso. Prepari la sagra gratis e paghi quando vuoi andare online."
  >
    <PaperTicket className="max-w-md px-6 py-10 sm:px-10">
      <p className="flex items-baseline gap-3">
        <span
          className={cn(
            "text-7xl leading-none tabular-nums",
            ThemeVariants.colors.text.brand,
            ThemeVariants.fontFamily.display,
          )}
        >
          €{EDITION_PRICE}
        </span>
        <span className="text-lg">a edizione</span>
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {INCLUDED.map((i) => (
          <li key={i} className="flex gap-3">
            <Check
              size={20}
              aria-hidden
              className={cn("shrink-0 mt-0.5", ThemeVariants.colors.text.brand)}
            />
            {i}
          </li>
        ))}
      </ul>
      <Link to="/registrati" className={cn(primaryLinkClass, "mt-8 w-full")}>
        Inizia
      </Link>
    </PaperTicket>
  </LandingSection>
);
