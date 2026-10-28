import { Check } from "lucide-react";
import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";
import { LandingSection } from "./LandingSection";

const BENEFITS = [
  {
    title: "Meno coda alla cassa",
    text: "Chi vuole ordina e paga dal telefono, chi preferisce va in cassa come sempre.",
  },
  {
    title: "Niente comande perse o illeggibili",
    text: "Gli ordini arrivano in cucina scritti chiari, uno dopo l'altro.",
  },
  {
    title: "La cucina lavora nell'ordine in cui si paga",
    text: "Vede solo gli ordini pagati, in fila, col tempo di attesa di ognuno.",
  },
  {
    title: "Telefoni, tablet e PC che avete già",
    text: "Funziona dal browser: niente da comprare né da installare.",
  },
  {
    title: "Ogni volontario ha il suo accesso",
    text: "E vede solo le pagine del suo ruolo: cassa, cucina, ritiro.",
  },
];

const OPTIONS = [
  "Asporto con orario di ritiro",
  "QR code sui tavoli",
  "Prenotazioni",
  "Smistamento in cucina per postazioni",
  "Pagare prima o dopo il pasto",
  "Al tavolo o ritiro al banco",
  "Un menù per ogni giorno",
  "Colori e tema della sagra",
];

//Perché conviene, e le scelte con cui si adatta a ogni sagra
export const Benefits = () => (
  <>
    <LandingSection title="Perché conviene">
      <ul className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        {BENEFITS.map((b) => (
          <li key={b.title} className="flex gap-3">
            <Check
              size={22}
              aria-hidden
              className={cn("shrink-0 mt-1", ThemeVariants.colors.text.brand)}
            />
            <span>
              <span className="block text-lg font-semibold">{b.title}</span>
              <span className={ThemeVariants.colors.text.secondary}>
                {b.text}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </LandingSection>
    <LandingSection
      title="Si adatta alla tua sagra"
      intro="Accendi solo quello che ti serve: il resto resta spento e non complica il lavoro dei volontari."
      tinted
    >
      <ul className="flex flex-wrap gap-3">
        {OPTIONS.map((o) => (
          <li
            key={o}
            className={cn(
              "px-4 py-2",
              ThemeVariants.colors.bg.surface,
              ThemeVariants.colors.border.all.default,
              ThemeVariants.borderRadius.full,
            )}
          >
            {o}
          </li>
        ))}
      </ul>
    </LandingSection>
  </>
);
