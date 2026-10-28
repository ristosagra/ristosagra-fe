import { useEffect } from "react";
import { Benefits } from "../../features/platform/components/landing/Benefits";
import { Faq } from "../../features/platform/components/landing/Faq";
import { Hero } from "../../features/platform/components/landing/Hero";
import { HowItWorks } from "../../features/platform/components/landing/HowItWorks";
import { LandingFooter } from "../../features/platform/components/landing/LandingFooter";
import { LandingHeader } from "../../features/platform/components/landing/LandingHeader";
import { Pricing } from "../../features/platform/components/landing/Pricing";
import { Trust } from "../../features/platform/components/landing/Trust";
import { WhatItIs } from "../../features/platform/components/landing/WhatItIs";

//Presentazione di Ristosagra per chi organizza una sagra: cos'è, come funziona, perché
//conviene, quanto costa e perché fidarsi; ogni invito porta alla registrazione.
//La pagina scorre da sola: html e body sono bloccati per le altre pagine dell'app
export const Landing = () => {
  useEffect(() => {
    document.title = "Ristosagra · Il gestionale per la tua sagra";
  }, []);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden motion-safe:scroll-smooth text-base sm:text-[17px] leading-relaxed">
      <LandingHeader />
      <main>
        <Hero />
        <WhatItIs />
        <HowItWorks />
        <Benefits />
        <Pricing />
        <Trust />
        <Faq />
      </main>
      <LandingFooter />
    </div>
  );
};
