import { Link } from "react-router-dom";
import { ThemeVariants } from "../../../../constant/colors";
import { DEMO_URL } from "../../../../constant/env";
import { EDITION_PRICE } from "../../../../constant/platform";
import { cn } from "../../../../helpers/cn";
import {
  primaryLinkClass,
  secondaryLinkClass,
} from "../../utils/landingStyles";
import { AppPreviews } from "./AppPreviews";

//Prima schermata: cosa fa Ristosagra in una frase, i due inviti e le anteprime dell'app
export const Hero = () => (
  <section className="px-4 sm:px-6 pt-10 pb-16 sm:pt-16 sm:pb-24">
    <div className="mx-auto max-w-6xl grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
      <div>
        <h1
          className={cn(
            "text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl",
            ThemeVariants.fontFamily.display,
          )}
        >
          La tua sagra senza coda alla cassa e senza comande di carta
        </h1>
        <p
          className={cn(
            "mt-6 max-w-xl text-lg sm:text-xl",
            ThemeVariants.colors.text.secondary,
          )}
        >
          Menù sul telefono, ordini dal telefono o in cassa, cucina sugli
          schermi, numeri pronti sulla TV. Dal browser, senza installare nulla.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to="/registrati" className={primaryLinkClass}>
            Attiva la tua sagra · €{EDITION_PRICE}
          </Link>
          {DEMO_URL && (
            <a href={DEMO_URL} className={secondaryLinkClass}>
              Prova la demo
            </a>
          )}
        </div>
        <p className={cn("mt-4 text-sm", ThemeVariants.colors.text.secondary)}>
          Prepari tutto gratis, paghi solo per andare online.
        </p>
      </div>
      <AppPreviews />
    </div>
  </section>
);
