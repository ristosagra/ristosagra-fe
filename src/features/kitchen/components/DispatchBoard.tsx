import { useState } from "react";
import { Check, Clock, Send, X } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { useRecallTicket, useSendToStation } from "../../orders/hook/useOrders";
import type { Order } from "../../orders/types/orders";
import type {
  KitchenStation,
  RestaurantProfile,
} from "../../restaurant/types/restaurant";
import {
  BUSY_STATION_BACKLOG,
  byQueue,
  liveTickets,
  queueTime,
  stationBacklog,
  unsentLines,
} from "../utils/kitchen";
import { OrderHeader } from "./TicketParts";
import { ticketCardClass } from "../utils/ticketStyle";

const isBusy = (backlog: number) => backlog >= BUSY_STATION_BACKLOG;

//Comande già mandate di un ordine: postazione e stato; quelle non pronte si possono ritirare
//(le righe tornano da smistare), es. se mandate alla postazione sbagliata
const SentTickets = ({
  order,
  stations,
}: {
  order: Order;
  stations: KitchenStation[];
}) => {
  const { mutate: recall, isPending } = useRecallTicket();
  const showNotification = useNotification();

  return (
    <ul className="flex flex-wrap gap-2">
      {liveTickets(order, stations).map((t) => {
        const station = stations.find((s) => s.id === t.stationId);
        const lines = t.items
          .map((i) => order.items[i])
          .filter(Boolean)
          .map((it) => `${it.quantity}× ${it.dish.name}`)
          .join(", ");
        return (
          <li
            key={t.id}
            title={lines}
            className={cn(
              "flex items-center gap-1.5 pl-3 text-sm font-semibold",
              t.readyAt ? "pr-3 py-1" : "pr-1 py-0.5",
              ThemeVariants.borderRadius.full,
              t.readyAt
                ? `${ThemeVariants.colors.border.all.success} ${ThemeVariants.colors.text.success}`
                : ThemeVariants.colors.border.all.default,
            )}
          >
            {t.readyAt ? <Check size={14} /> : <Clock size={14} />}
            {station?.name}
            {!t.readyAt && (
              <button
                type="button"
                onClick={() =>
                  recall(
                    { id: order.id, ticketId: t.id },
                    {
                      onError: () =>
                        showNotification(
                          "Errore nel ritiro della comanda",
                          NotificationType.Err,
                        ),
                    },
                  )
                }
                disabled={isPending}
                aria-label={`Ritira la comanda da ${station?.name}`}
                title="Ritira (le righe tornano da smistare)"
                className={`w-7 h-7 flex items-center justify-center cursor-pointer ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.text.secondary}`}
              >
                <X size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

interface DispatchCardProps {
  order: Order;
  stations: KitchenStation[];
  backlog: Record<string, number>;
  queuedAt: string;
}

//Ordine da smistare: si scelgono le righe (all'inizio tutte) e la postazione a cui mandarle
const DispatchCard = ({
  order,
  stations,
  backlog,
  queuedAt,
}: DispatchCardProps) => {
  const lines = unsentLines(order, stations);
  const [selected, setSelected] = useState<number[]>(lines);
  const { mutate: send, isPending } = useSendToStation();
  const showNotification = useNotification();
  const chosen = selected.filter((i) => lines.includes(i));

  const toggleLine = (i: number) =>
    setSelected((s) =>
      s.includes(i)
        ? s.filter((x) => x !== i)
        : [...s, i].sort((a, b) => a - b),
    );

  const sendTo = (station: KitchenStation) =>
    send(
      { id: order.id, stationId: station.id, items: chosen },
      {
        onError: () =>
          showNotification(
            `Errore nell'invio a ${station.name}`,
            NotificationType.Err,
          ),
      },
    );

  return (
    <article className={ticketCardClass(false)}>
      <OrderHeader order={order} time={queuedAt} timeTitle="In coda dalle" />

      <ul
        className={`flex flex-col py-1 ${ThemeVariants.colors.border.top.default}`}
      >
        {lines.map((i) => {
          const it = order.items[i];
          return (
            <li key={i}>
              <label className="flex items-center gap-3 py-1.5 text-lg cursor-pointer select-none [overflow-wrap:anywhere]">
                <input
                  type="checkbox"
                  checked={selected.includes(i)}
                  onChange={() => toggleLine(i)}
                  className="w-5 h-5 shrink-0 cursor-pointer accent-[var(--brand)]"
                />
                <span>
                  <span
                    className={`font-bold ${ThemeVariants.colors.text.brand}`}
                  >
                    {it.quantity}×
                  </span>{" "}
                  {it.dish.name}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {liveTickets(order, stations).length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
            Già mandato a:
          </p>
          <SentTickets order={order} stations={stations} />
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-auto">
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {chosen.length === 0
            ? "Scegli le righe da mandare"
            : chosen.length === lines.length
              ? "Manda tutto a:"
              : `Manda ${chosen.length === 1 ? "la riga scelta" : `le ${chosen.length} righe scelte`} a:`}
        </p>
        <div className="flex flex-wrap gap-2">
          {stations.map((s) => (
            <Button
              key={s.id}
              iconLeft={<Send size={14} />}
              label={
                <span className="text-sm ml-1.5">
                  {s.name}{" "}
                  <span
                    className={
                      isBusy(backlog[s.id])
                        ? ThemeVariants.colors.text.danger
                        : ThemeVariants.colors.text.secondary
                    }
                  >
                    · {backlog[s.id]}
                  </span>
                </span>
              }
              onClick={() => sendTo(s)}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              disabled={chosen.length === 0 || isPending}
              ariaLabel={`Manda a ${s.name} (${backlog[s.id]} in coda)`}
              className={cn(
                "px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed",
                isBusy(backlog[s.id]) && ThemeVariants.colors.border.all.danger,
              )}
            />
          ))}
        </div>
      </div>
    </article>
  );
};

//Smistamento del capo cucina: il carico di ogni postazione, gli ordini da smistare (da chi ha
//ordinato per primo) e quelli già smistati in preparazione
export const DispatchBoard = ({
  orders,
  stations,
  profile,
}: {
  orders: Order[];
  stations: KitchenStation[];
  profile: RestaurantProfile | undefined;
}) => {
  const backlog = Object.fromEntries(
    stations.map((s) => [s.id, stationBacklog(orders, s.id)]),
  );
  const open = orders.filter((o) => !o.readyAt).sort(byQueue(profile));
  const toDispatch = open.filter((o) => unsentLines(o, stations).length > 0);
  const inProgress = open.filter(
    (o) =>
      unsentLines(o, stations).length === 0 &&
      liveTickets(o, stations).length > 0,
  );

  return (
    //Il carico di ogni postazione è sulle schede in alto e sui pulsanti per mandare
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="font-bold text-lg">Da smistare ({toDispatch.length})</h2>
        {toDispatch.length === 0 ? (
          <p
            className={`py-6 text-center ${ThemeVariants.colors.text.secondary}`}
          >
            Nessuna comanda da smistare
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {toDispatch.map((o) => (
              <DispatchCard
                //righe ancora da mandare cambiate: si riparte con tutte selezionate
                key={`${o.id}:${unsentLines(o, stations).join(",")}`}
                order={o}
                stations={stations}
                backlog={backlog}
                queuedAt={queueTime(o, profile)}
              />
            ))}
          </div>
        )}
      </section>

      {inProgress.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-bold text-lg">
            In preparazione ({inProgress.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {inProgress.map((o) => (
              <li
                key={o.id}
                className={cn(
                  "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3",
                  ThemeVariants.borderRadius.lg,
                  ThemeVariants.colors.bg.surface,
                  ThemeVariants.colors.border.all.default,
                )}
              >
                <span className="font-bold">
                  <span className={ThemeVariants.colors.text.brand}>
                    #{o.orderNumber}
                  </span>
                  <span
                    className={`font-normal text-sm ${ThemeVariants.colors.text.secondary}`}
                  >
                    {" "}
                    · {o.table ? `Tavolo ${o.table}` : (o.customerName ?? "")}
                  </span>
                </span>
                <SentTickets order={o} stations={stations} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
