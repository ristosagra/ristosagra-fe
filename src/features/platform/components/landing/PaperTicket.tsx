import { ThemeVariants } from "../../../../constant/colors";
import { cn } from "../../../../helpers/cn";

//Bordo a strappo in alto e in basso, come i bigliettini della cassa
const TORN_EDGES =
  "radial-gradient(6px at 50% 0, #0000 98%, #000) 50% 0 / 18px 51% repeat-x, radial-gradient(6px at 50% 100%, #0000 98%, #000) 50% 100% / 18px 51% repeat-x";

interface PaperTicketProps {
  children: React.ReactNode;
  className?: string;
}

//Bigliettino di carta: il motivo della landing (il numero d'ordine che la sagra conosce già)
export const PaperTicket = ({ children, className }: PaperTicketProps) => (
  <div
    className={cn(
      "px-5 py-6 shadow-[0_8px_24px_-12px_rgba(26,22,20,0.35)]",
      ThemeVariants.colors.bg.surface,
      className,
    )}
    style={{ mask: TORN_EDGES, WebkitMask: TORN_EDGES }}
  >
    {children}
  </div>
);
