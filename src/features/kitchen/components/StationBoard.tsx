import { Check, Undo2 } from "lucide-react";
import { CollapsibleSection } from "../../../components/core/CollapsibleSection";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { useTicketReady } from "../../orders/hook/useOrders";
import type { Order } from "../../orders/types/orders";
import { matchesSearch } from "../../orders/utils/orderPlace";
import type { RestaurantProfile } from "../../restaurant/types/restaurant";
import {
  byQueue,
  queueTime,
  stationWork,
  type StationWork,
} from "../utils/kitchen";
import { PrintKitchenSlipButton } from "./KitchenSlip";
import { OrderHeader, TicketLines } from "./TicketParts";
import { ticketCardClass } from "../utils/ticketStyle";

//Comanda della postazione: segnata pronta con un tocco, e da stampare su carta
const StationTicketCard = ({
  work: { order, ticket },
  queuedAt,
  stationName,
  readOnly,
}: {
  work: StationWork;
  queuedAt: string;
  stationName?: string;
  //caposala: vede, non segna pronto
  readOnly: boolean;
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
      {/* il timer è quello dell'ordine: da quando è in coda, fino a quando la postazione è pronta */}
      <OrderHeader
        order={order}
        queuedAt={queuedAt}
        readyAt={ticket.readyAt}
        dimmed={isReady}
      />
      <TicketLines order={order} lines={ticket.items} />
      {!readOnly && (
        <div className="flex gap-2 mt-auto">
          <Button
            iconLeft={isReady ? <Undo2 size={18} /> : <Check size={18} />}
            label={isReady ? "Rimetti da preparare" : "Pronto"}
            onClick={toggle}
            dimension={ButtonDimensions.auto}
            variant={isReady ? "secondary" : "primary"}
            disabled={isPending}
            className="flex-1 min-w-0 h-12 disabled:opacity-50 disabled:cursor-wait"
          />
          <PrintKitchenSlipButton
            order={order}
            lines={ticket.items}
            stationName={stationName}
            queuedAt={queuedAt}
          />
        </div>
      )}
    </article>
  );
};

const GRID = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

//Postazione della cucina: le sue comande da chi ha ordinato per primo, poi quelle pronte.
//La ricerca filtra per nome, tavolo o numero
export const StationBoard = ({
  orders,
  stationId,
  profile,
  search,
  readOnly,
}: {
  orders: Order[];
  stationId: string;
  profile: RestaurantProfile | undefined;
  search: string;
  readOnly: boolean;
}) => {
  //nome della postazione, sulla comanda di carta
  const stationName = profile?.kitchenStations.find(
    (s) => s.id === stationId,
  )?.name;
  const work = stationWork(orders, stationId).filter((w) =>
    matchesSearch(w.order, search),
  );
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
              stationName={stationName}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {done.length > 0 && (
        <CollapsibleSection title={`Pronte (${done.length})`}>
          <div className={GRID}>
            {done.map((w) => (
              <StationTicketCard
                key={w.ticket.id}
                work={w}
                queuedAt={queueTime(w.order, profile)}
                stationName={stationName}
                readOnly={readOnly}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};
