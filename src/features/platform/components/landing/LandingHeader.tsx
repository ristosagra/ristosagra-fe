import { Link } from "react-router-dom";
import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";
import { primaryLinkClass } from "../../utils/landingStyles";

const ANCHORS = [
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#prezzo", label: "Prezzo" },
  { href: "#domande", label: "Domande" },
];

//Barra in alto della landing: le ancore solo da tablet in su, Accedi e Inizia sempre
export const LandingHeader = () => (
  <header
    className={cn(
      "sticky top-0 z-20 px-4 sm:px-6 pt-[env(safe-area-inset-top)]",
      ThemeVariants.colors.bg.base,
      ThemeVariants.colors.border.bottom.default,
    )}
  >
    <div className="mx-auto max-w-6xl h-16 flex items-center gap-4">
      <Link
        to="/"
        className={cn(
          "text-2xl mr-auto",
          ThemeVariants.colors.text.brand,
          ThemeVariants.fontFamily.display,
        )}
      >
        Ristosagra
      </Link>
      <nav aria-label="Sezioni" className="hidden md:flex items-center gap-6">
        {ANCHORS.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className={cn(
              "hover:underline",
              ThemeVariants.colors.text.secondary,
            )}
          >
            {a.label}
          </a>
        ))}
      </nav>
      <Link to="/accedi" className="px-2 h-10 flex items-center font-semibold">
        Accedi
      </Link>
      <Link to="/registrati" className={cn(primaryLinkClass, "h-10 px-4")}>
        Inizia
      </Link>
    </div>
  </header>
);
