import { Link } from "react-router-dom";
import { ThemeVariants } from "../../../../constant/colors";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "../../../../constant/platform";
import { cn } from "../../../../helpers/cn";
import { primaryLinkClass } from "../../utils/landingStyles";

//Chiusura: ultimo invito a iniziare e piè di pagina con contatti (solo quelli impostati)
export const LandingFooter = () => (
  <>
    <section className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl flex flex-col items-start gap-6">
        <h2
          className={cn(
            "max-w-2xl text-3xl sm:text-5xl leading-tight",
            ThemeVariants.fontFamily.display,
          )}
        >
          Prepara la tua sagra oggi, vai online quando sei pronto.
        </h2>
        <Link to="/registrati" className={primaryLinkClass}>
          Inizia
        </Link>
      </div>
    </section>
    <footer
      className={cn(
        "px-4 sm:px-6 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))]",
        ThemeVariants.colors.border.top.default,
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl flex flex-col sm:flex-row gap-4 sm:items-center",
          ThemeVariants.colors.text.secondary,
        )}
      >
        <span
          className={cn(
            "text-xl mr-auto",
            ThemeVariants.colors.text.brand,
            ThemeVariants.fontFamily.display,
          )}
        >
          Ristosagra
        </span>
        {SUPPORT_PHONE && (
          <a
            href={`tel:${SUPPORT_PHONE.replace(/\s/g, "")}`}
            className="hover:underline"
          >
            {SUPPORT_PHONE}
          </a>
        )}
        {SUPPORT_EMAIL && (
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:underline">
            {SUPPORT_EMAIL}
          </a>
        )}
        <Link to="/accedi" className="hover:underline">
          Accedi alla tua sagra
        </Link>
      </div>
    </footer>
  </>
);
