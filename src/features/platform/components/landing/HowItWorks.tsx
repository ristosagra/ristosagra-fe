import { ThemeVariants } from "../../../../constant/colors";
import { EDITION_PRICE } from "../../../../constant/platform";
import { cn } from "../../../../helpers/cn";
import { LandingSection } from "./LandingSection";

const EVENING = [
  "Il cliente ordina e paga, dal telefono o in cassa.",
  "La cucina vede solo gli ordini pagati, nell'ordine di pagamento.",
  "Quando è pronto, il numero compare sullo schermo.",
  "Il cliente ritira al banco.",
];

const SETUP = [
  "Registri la sagra.",
  "Prepari menù, volontari e impostazioni.",
  `Attivi l'edizione con €${EDITION_PRICE}.`,
  "Stampi i QR e apri.",
];

//Passi numerati: qui l'ordine conta davvero
const Steps = ({ title, steps }: { title: string; steps: string[] }) => (
  <div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <ol className="mt-6 flex flex-col gap-5">
      {steps.map((s, i) => (
        <li key={s} className="flex gap-4 items-baseline">
          <span
            className={cn(
              "w-8 shrink-0 text-3xl leading-none tabular-nums",
              ThemeVariants.colors.text.brand,
              ThemeVariants.fontFamily.display,
            )}
          >
            {i + 1}
          </span>
          <span className="text-lg">{s}</span>
        </li>
      ))}
    </ol>
  </div>
);

//Come funziona: la serata vista dal cliente e la preparazione vista dal titolare
export const HowItWorks = () => (
  <LandingSection id="come-funziona" title="Come funziona" tinted>
    <div className="grid gap-12 md:grid-cols-2">
      <Steps title="La serata" steps={EVENING} />
      <Steps title="Per te che organizzi" steps={SETUP} />
    </div>
  </LandingSection>
);
