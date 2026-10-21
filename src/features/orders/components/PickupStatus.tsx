import { useEffect, useRef } from "react";
import { BellRing, ChefHat } from "lucide-react";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { usePickupBoard } from "../hook/useOrders";

type PickupState = "preparing" | "ready" | null;

//Col ritiro al banco, sul telefono del cliente: il suo ordine è in preparazione o pronto
//(dal tabellone pubblico, che ha solo i numeri). Quando diventa pronto il telefono vibra
export const PickupStatus = ({ orderNumber }: { orderNumber: number }) => {
  const { data: board } = usePickupBoard();
  const state: PickupState = board?.ready.includes(orderNumber)
    ? "ready"
    : board?.preparing.includes(orderNumber)
      ? "preparing"
      : null;

  const previous = useRef<PickupState>(state);
  useEffect(() => {
    if (state === "ready" && previous.current !== "ready")
      navigator.vibrate?.([200, 100, 200]);
    previous.current = state;
  }, [state]);

  if (!state) return null;

  const ready = state === "ready";
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 mx-4 px-4 py-2 text-center font-semibold",
        ThemeVariants.borderRadius.lg,
        ready
          ? `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.text.success} ${ThemeVariants.colors.border.all.success} text-lg`
          : `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.secondary}`,
      )}
    >
      {ready ? <BellRing size={20} /> : <ChefHat size={18} />}
      {ready
        ? "Il tuo ordine è pronto: ritiralo al banco!"
        : "In preparazione…"}
    </div>
  );
};
