import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";

interface LandingSectionProps {
  id?: string;
  title: string;
  //una frase sotto al titolo
  intro?: string;
  //fondo diverso per staccare la sezione da quelle vicine
  tinted?: boolean;
  children: React.ReactNode;
}

//Sezione della landing: titolo a sinistra, contenuto sotto, larghezza di lettura limitata
export const LandingSection = ({
  id,
  title,
  intro,
  tinted,
  children,
}: LandingSectionProps) => (
  <section
    id={id}
    className={cn(
      "scroll-mt-16 px-4 py-16 sm:px-6 sm:py-24",
      tinted && "bg-[var(--bg-raised)]",
    )}
  >
    <div className="mx-auto max-w-6xl">
      <h2
        className={cn(
          "text-3xl sm:text-4xl leading-tight max-w-2xl",
          ThemeVariants.fontFamily.display,
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-3 max-w-2xl text-lg",
            ThemeVariants.colors.text.secondary,
          )}
        >
          {intro}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </div>
  </section>
);
