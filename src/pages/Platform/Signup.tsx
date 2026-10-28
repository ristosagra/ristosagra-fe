import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Container } from "../../components/core/Container";
import { ThemeVariants } from "../../constant/colors";
import { EDITION_MONTHS, EDITION_PRICE } from "../../constant/platform";
import { cn } from "../../helpers/cn";
import { SignupForm } from "../../features/platform/components/SignupForm";

//Registrazione di una nuova sagra, dal dominio principale
export const Signup = () => {
  useEffect(() => {
    document.title = "Registra la tua sagra · Ristosagra";
  }, []);

  return (
    <Container>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12 pb-[calc(2rem+env(safe-area-inset-bottom))] text-base">
        <Link
          to="/"
          className={cn(
            "text-2xl",
            ThemeVariants.colors.text.brand,
            ThemeVariants.fontFamily.display,
          )}
        >
          Ristosagra
        </Link>
        <h1
          className={cn(
            "mt-8 text-4xl sm:text-5xl leading-tight",
            ThemeVariants.fontFamily.display,
          )}
        >
          Registra la tua sagra
        </h1>
        <p
          className={cn(
            "mt-3 mb-10 text-lg",
            ThemeVariants.colors.text.secondary,
          )}
        >
          Dopo la registrazione vai al pagamento dell'edizione: €{EDITION_PRICE}
          , valida {EDITION_MONTHS} mesi. Se preferisci pagare più tardi,
          intanto puoi preparare menù, volontari e impostazioni.
        </p>
        <SignupForm />
      </div>
    </Container>
  );
};
