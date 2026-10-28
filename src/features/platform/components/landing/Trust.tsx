import { Globe, MonitorPlay, PhoneCall, Tent, Wrench } from "lucide-react";
import { ThemeVariants } from "../../../../constant/colors";
import { DEMO_URL } from "../../../../constant/env";
import { cn } from "../../../../helpers/cn";
import { LandingSection } from "./LandingSection";

const REASONS = [
  {
    icon: <PhoneCall size={24} />,
    title: "Assistenza al telefono durante le serate",
    text: "Se qualcosa non va mentre la sagra è aperta, chiami e ti rispondiamo.",
  },
  //la demo si promette solo se c'è
  ...(DEMO_URL
    ? [
        {
          icon: <MonitorPlay size={24} />,
          title: "Una demo da provare subito",
          text: "Una sagra d'esempio da usare come cliente e come volontario, senza registrarti.",
        },
      ]
    : []),
  {
    icon: <Wrench size={24} />,
    title: "Prepari tutto gratis",
    text: "Menù, volontari e impostazioni si preparano senza pagare: paghi solo per andare online.",
  },
  {
    icon: <Globe size={24} />,
    title: "Nessuna installazione",
    text: "Si apre dal browser, anche sul telefono di un volontario.",
  },
  {
    icon: <Tent size={24} />,
    title: "Fatto per le sagre",
    text: "Si paga prima, la cucina segue l'ordine di pagamento, i numeri si chiamano al banco: come lavorate già.",
  },
];

//Perché affidarsi a Ristosagra: solo promesse che si possono mantenere
export const Trust = () => (
  <LandingSection title="Perché affidarti a noi" tinted>
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {REASONS.map((r) => (
        <li key={r.title} className="flex flex-col gap-2">
          <span className={ThemeVariants.colors.text.brand}>{r.icon}</span>
          <h3 className="text-lg font-semibold">{r.title}</h3>
          <p className={cn(ThemeVariants.colors.text.secondary)}>{r.text}</p>
        </li>
      ))}
    </ul>
  </LandingSection>
);
