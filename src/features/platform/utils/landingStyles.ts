import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";

//Link con l'aspetto dei pulsanti dell'app (vedi Button): portano a un'altra pagina, quindi
//sono <a>/<Link> e non <button>
const base =
  "inline-flex items-center justify-center gap-2 px-5 h-12 font-bold text-base rounded-md transition-colors";

export const primaryLinkClass = cn(
  base,
  ThemeVariants.colors.bg.brand,
  ThemeVariants.colors.text.white,
  "hover:bg-[var(--brand-dim)]",
);

export const secondaryLinkClass = cn(
  base,
  ThemeVariants.colors.bg.surface,
  ThemeVariants.colors.border.all.default,
  "hover:bg-[var(--bg-hover)]",
);
