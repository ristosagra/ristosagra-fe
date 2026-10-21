import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";

//Ora (HH:MM) di un istante ISO
export const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

//Scheda di una comanda in cucina: bordo verde quando è pronta
export const ticketCardClass = (done: boolean) =>
  cn(
    "flex flex-col gap-3 p-4",
    ThemeVariants.borderRadius.xl,
    ThemeVariants.colors.bg.surface,
    done
      ? ThemeVariants.colors.border.all.success
      : ThemeVariants.colors.border.all.brand,
  );
