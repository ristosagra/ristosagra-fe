import { LoaderCircle } from "lucide-react";
import { ThemeVariants } from "../../constant/colors";
import { cn } from "../../helpers/cn";

//Caricamento dentro la pagina (Loader invece copre tutto lo schermo)
export const Spinner = ({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) => (
  <div className={cn("flex justify-center py-10", className)}>
    <LoaderCircle
      size={size}
      aria-label="Caricamento"
      className={`animate-spin ${ThemeVariants.colors.text.brand}`}
    />
  </div>
);
