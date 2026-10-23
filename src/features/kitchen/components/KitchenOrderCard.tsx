import { Check, Undo2 } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { useOrderReady } from "../../orders/hook/useOrders";
import type { Order } from "../../orders/types/orders";
import { OrderHeader, TicketLines } from "./TicketParts";
import { ticketCardClass } from "../utils/ticketStyle";

//Cucina senza smistamento: l'ordine intero, segnato pronto (o rimesso da preparare) con un tocco.
//In sola lettura (caposala) senza pulsante
export const KitchenOrderCard = ({
  order,
  queuedAt,
  readOnly = false,
}: {
  order: Order;
  //da quando è in coda (invio o pagamento)
  queuedAt: string;
  readOnly?: boolean;
}) => {
  const { mutate: setReady, isPending } = useOrderReady();
  const showNotification = useNotification();
  const isReady = !!order.readyAt;

  const toggle = () =>
    setReady(
      { id: order.id, ready: !isReady },
      {
        onError: () =>
          showNotification(
            "Errore nel salvataggio della comanda",
            NotificationType.Err,
          ),
      },
    );

  return (
    <article className={ticketCardClass(isReady)}>
      <OrderHeader
        order={order}
        queuedAt={queuedAt}
        readyAt={order.readyAt}
        dimmed={isReady}
      />
      <TicketLines order={order} lines={order.items.map((_, i) => i)} />
      {!readOnly && (
        <Button
          iconLeft={isReady ? <Undo2 size={18} /> : <Check size={18} />}
          label={isReady ? "Rimetti da preparare" : "Pronto"}
          onClick={toggle}
          dimension={ButtonDimensions.auto}
          variant={isReady ? "secondary" : "primary"}
          disabled={isPending}
          fullWidth
          className="h-12 mt-auto disabled:opacity-50 disabled:cursor-wait"
        />
      )}
    </article>
  );
};
