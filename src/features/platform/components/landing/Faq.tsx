import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion } from "../../../../components/core/Accordion";
import { ThemeVariants } from "../../../../constant/colors";
import { DEMO_URL } from "../../../../constant/env";
import { cn } from "../../../../helpers/cn";
import { landingFaq } from "../../utils/landingFaq";
import { LandingSection } from "./LandingSection";

//Domande frequenti: una risposta aperta alla volta
export const Faq = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <LandingSection id="domande" title="Domande frequenti">
      <ul className="max-w-3xl">
        {landingFaq(!!DEMO_URL).map((f, i) => {
          const expanded = open === i;
          return (
            <li
              key={f.question}
              className={ThemeVariants.colors.border.bottom.default}
            >
              <Accordion
                onClick={() => setOpen(expanded ? null : i)}
                expanded={expanded}
                controls={`faq-${i}`}
                className="gap-4 py-5 text-lg font-semibold"
              >
                {f.question}
                <ChevronDown
                  size={22}
                  aria-hidden
                  className={cn(
                    "shrink-0 transition-transform motion-reduce:transition-none",
                    expanded && "rotate-180",
                  )}
                />
              </Accordion>
              <p
                id={`faq-${i}`}
                hidden={!expanded}
                className={cn(
                  "pb-5 max-w-2xl",
                  ThemeVariants.colors.text.secondary,
                )}
              >
                {f.answer}
              </p>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
};
