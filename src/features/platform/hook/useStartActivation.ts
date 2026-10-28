import { useState } from "react";
import { safeCheckoutUrl } from "../../../helpers/checkoutUrl";
import { useNotification } from "../../../hooks/useNotification";
import { HttpError } from "../../../services/client/httpClient";
import { NotificationType } from "../../../types/notification";
import { useRestaurant } from "../../restaurant/hook/useRestaurant";
import { useActivationCheckout } from "./useBilling";

//Pagamento dell'edizione: va alla pagina di pagamento. `sending` si accende al primo tocco,
//così un secondo tocco ravvicinato trova il bottone già spento; se la sagra risulta già
//attiva (409) si rilegge il profilo
export const useStartActivation = () => {
  const [sending, setSending] = useState(false);
  const { mutate: checkout } = useActivationCheckout();
  const { refetch } = useRestaurant();
  const showNotification = useNotification();

  const start = () => {
    if (sending) return;
    setSending(true);
    checkout(undefined, {
      onSuccess: ({ checkoutUrl }) => {
        const url = safeCheckoutUrl(checkoutUrl);
        if (url) return window.location.assign(url);
        setSending(false);
        showNotification(
          "Pagamento non disponibile, riprova",
          NotificationType.Err,
        );
      },
      onError: (err) => {
        setSending(false);
        if (err instanceof HttpError && err.status === 409) return refetch();
        showNotification(
          "Pagamento non disponibile: controlla la connessione e riprova",
          NotificationType.Err,
        );
      },
    });
  };

  return { start, sending };
};
