import { useState } from "react";
import { Check, ChevronDown, Undo2 } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { useTicketReady } from "../../orders/hook/useOrders";
import type { Order } from "../../orders/types/orders";
import type { RestaurantProfile } from "../../restaurant/types/restaurant";
import {
  byQueue,
  queueTime,
  stationWork,
  type StationWork,
} from "../utils/kitchen";
import { OrderHeader, TicketLines } from "./TicketParts";
import { ticketCardClass } from "../utils/ticketStyle";

const StationTicketCard = ({
  work: { order, ticket },
  queuedAt,
}: {
  work: StationWork;
  queuedAt: string;
}) => {
  const { mutate: setReady, isPending } = useTicketReady();
  const showNotification = useNotification();
  const isReady = !!ticket.readyAt;

  const toggle = () =>
    setReady(
      { id: order.id, ticketId: ticket.id, ready: !isReady },
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
        time={ticket.readyAt ?? queuedAt}
        timeTitle={isReady ? "Pronta alle" : "Ordinato alle"}
        dimmed={isReady}
      />
      <TicketLines order={order} lines={ticket.items} />
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
    </article>
  );
};

const GRID = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

//Postazione della cucina: le sue comande da chi ha ordinato per primo, poi quelle pronte
export const StationBoard = ({
  orders,
  stationId,
  profile,
}: {
  orders: Order[];
  stationId: string;
  profile: RestaurantProfile | undefined;
}) => {
  const [showReady, setShowReady] = useState(false);
  const work = stationWork(orders, stationId);
  const sortByQueue = byQueue(profile);
  const toDo = work
    .filter((w) => !w.ticket.readyAt)
    .sort(
      (a, b) =>
        sortByQueue(a.order, b.order) ||
        a.ticket.sentAt.localeCompare(b.ticket.sentAt),
    );
  const done = work
    .filter((w) => w.ticket.readyAt)
    .sort((a, b) =>
      (b.ticket.readyAt ?? "").localeCompare(a.ticket.readyAt ?? ""),
    );

  return (
    <div className="flex flex-col gap-6">
      {toDo.length === 0 ? (
        <p
          className={`py-10 text-center ${ThemeVariants.colors.text.secondary}`}
        >
          Nessuna comanda da preparare
        </p>
      ) : (
        <div className={GRID}>
          {toDo.map((w) => (
            <StationTicketCard
              key={w.ticket.id}
              work={w}
              queuedAt={queueTime(w.order, profile)}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setShowReady((s) => !s)}
            aria-expanded={showReady}
            className="flex items-center gap-2 py-2 font-bold cursor-pointer"
          >
            Pronte ({done.length})
            <ChevronDown
              size={18}
              aria-hidden
              className={cn(
                "transition-transform duration-300",
                showReady && "rotate-180",
              )}
            />
          </button>
          {showReady && (
            <div className={cn(GRID, "mt-2")}>
              {done.map((w) => (
                <StationTicketCard
                  key={w.ticket.id}
                  work={w}
                  queuedAt={queueTime(w.order, profile)}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
