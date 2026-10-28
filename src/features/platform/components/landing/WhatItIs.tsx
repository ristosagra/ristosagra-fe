import { ChefHat, ConciergeBell, Smartphone, Wallet } from "lucide-react";
import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";
import { LandingSection } from "./LandingSection";

const PARTS = [
  {
    icon: <Smartphone size={26} />,
    title: "Clienti",
    text: "Sfogliano il menù, ordinano e pagano dal telefono, prenotano l'asporto o un tavolo.",
  },
  {
    icon: <Wallet size={26} />,
    title: "Cassa",
    text: "Batte gli ordini al banco in pochi tocchi e stampa il bigliettino col numero.",
  },
  {
    icon: <ChefHat size={26} />,
    title: "Cucina",
    text: "Schermi al posto delle comande: solo gli ordini pagati, nell'ordine in cui arrivano.",
  },
  {
    icon: <ConciergeBell size={26} />,
    title: "Ritiro",
    text: "Uno schermo con i numeri pronti: il cliente sa quando andare al banco.",
  },
];

//Cos'è: le quattro parti della sagra che Ristosagra tiene insieme
export const WhatItIs = () => (
  <LandingSection
    title="Un solo sito per tutta la sagra"
    intro="Clienti, cassa, cucina e banco del ritiro vedono gli stessi ordini, ognuno dal suo schermo."
  >
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {PARTS.map((p) => (
        <li
          key={p.title}
          className={cn(
            "pt-5 flex flex-col gap-2",
            ThemeVariants.colors.border.top.brand,
          )}
        >
          <span className={ThemeVariants.colors.text.brand}>{p.icon}</span>
          <h3 className="text-xl font-semibold">{p.title}</h3>
          <p className={ThemeVariants.colors.text.secondary}>{p.text}</p>
        </li>
      ))}
    </ul>
  </LandingSection>
);
