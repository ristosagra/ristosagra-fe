import { useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "./core/Button";
import { ButtonDimensions } from "../constant/button";

interface PrintButtonProps {
  //foglio da stampare (un elemento con la classe print-sheet, vedi index.css)
  sheet: React.ReactNode;
  //testo del pulsante; senza testo resta la sola icona (allora serve ariaLabel)
  label?: string;
  ariaLabel?: string;
  className?: string;
  iconSize?: number;
}

//Stampa un foglio largo come la carta delle stampanti da cassa (80 mm): il foglio esiste nella
//pagina solo mentre si stampa, e durante la stampa il resto del sito è nascosto. Il browser
//non sceglie da solo la stampante: si sceglie nella finestra di stampa del dispositivo
export const PrintButton = ({
  sheet,
  label,
  ariaLabel,
  className,
  iconSize = 15,
}: PrintButtonProps) => {
  const [printing, setPrinting] = useState(false);

  const print = () => {
    //il foglio deve essere già nella pagina quando si apre la stampa
    flushSync(() => setPrinting(true));
    window.addEventListener("afterprint", () => setPrinting(false), {
      once: true,
    });
    window.print();
  };

  return (
    <>
      <Button
        iconLeft={<Printer size={iconSize} />}
        label={label}
        onClick={print}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        className={className}
        ariaLabel={ariaLabel}
      />
      {printing && createPortal(sheet, document.body)}
    </>
  );
};
