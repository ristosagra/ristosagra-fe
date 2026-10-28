import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/core/Button";
import { Spinner } from "../../../components/core/Spinner";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { EDITION_MONTHS, EDITION_PRICE } from "../../../constant/platform";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import { useNow } from "../../../hooks/useNow";
import { NotificationType } from "../../../types/notification";
import { useRestaurant } from "../../restaurant/hook/useRestaurant";
import { useStartActivation } from "../hook/useStartActivation";
import {
  ACTIVATION_POLL_MS,
  ACTIVATION_WAIT_MS,
  activationPendingSince,
  clearActivationPending,
} from "../utils/activationReturn";

//In cima all'area del personale, per titolare e vice, finché la sagra non è attiva: invito
//a pagare l'edizione oppure, appena tornati dal pagamento, attesa della conferma
export const ActivationBanner = () => {
  const now = useNow(ACTIVATION_POLL_MS);
  const since = activationPendingSince();
  const pending = since !== null && now - since < ACTIVATION_WAIT_MS;
  //mentre si aspetta la conferma il profilo si ricontrolla spesso
  const { data: restaurant } = useRestaurant({
    refetchInterval: pending ? ACTIVATION_POLL_MS : false,
  });
  const active = restaurant?.active;
  const showNotification = useNotification();
  const queryClient = useQueryClient();
  const { start, sending } = useStartActivation();

  //Conferma arrivata mentre si aspettava: anche la scadenza nel Profilo va riletta
  useEffect(() => {
    if (!active || activationPendingSince() === null) return;
    clearActivationPending();
    queryClient.invalidateQueries({ queryKey: ["billing"] });
    showNotification("La sagra è online", NotificationType.Ok);
  }, [active, showNotification, queryClient]);

  if (!restaurant || active) return null;

  return (
    <div
      role="status"
      className={cn(
        "shrink-0 flex flex-wrap items-center gap-x-4 gap-y-2 px-4 sm:px-6 py-3",
        "pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3",
        ThemeVariants.colors.bg.surface,
        ThemeVariants.colors.border.bottom.default,
      )}
    >
      {pending ? (
        <span className="flex items-center gap-3 font-semibold">
          <Spinner size={20} className="py-0" />
          Pagamento in verifica…
        </span>
      ) : (
        <>
          <span className="flex-1 min-w-48 font-semibold">
            La sagra non è online · Attivala per €{EDITION_PRICE} (
            {EDITION_MONTHS} mesi)
          </span>
          <Button
            label={sending ? "Attendi…" : "Attiva"}
            onClick={start}
            disabled={sending}
            dimension={ButtonDimensions.auto}
            variant="primary"
            className="px-4 h-10 disabled:opacity-60 disabled:cursor-wait"
          />
        </>
      )}
    </div>
  );
};
