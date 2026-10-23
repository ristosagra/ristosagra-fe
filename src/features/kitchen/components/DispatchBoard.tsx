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
import { matchesSearch, orderPlace } from "../../orders/utils/orderPlace";
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
import { KitchenTimer, OrderHeader, TicketLines } from "./TicketParts";
import { ticketCardClass, timeOf } from "../utils/ticketStyle";

const isBusy = (backlog: number) => backlog >= BUSY_STATION_BACKLOG;

//Comande già mandate di un ordine, una riga per postazione: i piatti e se sono pronti, così si
//vede cosa manca. Quelle non pronte si possono ritirare (le righe tornano da smistare), es. se
//mandate alla postazione sbagliata; in sola lettura (caposala) no
const SentTickets = ({
  order,
  stations,
  readOnly,
}: {
  order: Order;
  stations: KitchenStation[];
  readOnly: boolean;
}) => {
  const { mutate: recall, isPending } = useRecallTicket();
  const showNotification = useNotification();

  return (
    <ul className="flex flex-col gap-1.5">
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
            className={cn(
              "flex items-center gap-2 pl-3 pr-1 py-1 text-sm",
              ThemeVariants.borderRadius.md,
              t.readyAt
                ? `${ThemeVariants.colors.border.all.success} ${ThemeVariants.colors.text.success}`
                : ThemeVariants.colors.border.all.default,
            )}
          >
            {t.readyAt ? (
              <Check size={15} className="shrink-0" aria-label="Pronto" />
            ) : (
              <Clock
                size={15}
                className="shrink-0"
                aria-label="In preparazione"
              />
            )}
            <span className="flex-1 min-w-0 py-1 [overflow-wrap:anywhere]">
              <span className="font-bold">{station?.name}</span> · {lines}
            </span>
            {t.readyAt ? (
              <span className="pr-2 font-semibold shrink-0">Pronto</span>
            ) : readOnly ? (
              <span
                className={`pr-2 shrink-0 ${ThemeVariants.colors.text.secondary}`}
              >
                In preparazione
              </span>
            ) : (
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
                className={`w-8 h-8 shrink-0 flex items-center justify-center cursor-pointer ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.text.secondary}`}
              >
                <X size={15} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

//Ordine smistato tutto, non ancora pronto: per postazione cosa è pronto e cosa manca
const InProgressCard = ({
  order,
  stations,
  queuedAt,
  readOnly,
}: {
  order: Order;
  stations: KitchenStation[];
  queuedAt: string;
  readOnly: boolean;
}) => {
  const missing = liveTickets(order, stations)
    .filter((t) => !t.readyAt)
    .map((t) => stations.find((s) => s.id === t.stationId)?.name);

  return (
    <article className={ticketCardClass(false)}>
      <OrderHeader order={order} queuedAt={queuedAt} />
      <div
        className={`flex flex-col gap-2 pt-3 ${ThemeVariants.colors.border.top.default}`}
      >
        <SentTickets order={order} stations={stations} readOnly={readOnly} />
        <p
          className={`text-sm font-semibold ${ThemeVariants.colors.text.brand}`}
        >
          {missing.length === 1 ? "Manca" : "Mancano"}: {missing.join(", ")}
        </p>
      </div>
    </article>
  );
};

//Ordine pronto (tutte le postazioni hanno finito): può andare al tavolo o al banco.
//Il timer dice da quanto aspetta
const ReadyRow = ({ order }: { order: Order }) => (
  <li
    className={cn(
      "flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3",
      ThemeVariants.borderRadius.lg,
      ThemeVariants.colors.bg.surface,
      ThemeVariants.colors.border.all.success,
    )}
  >
    <span className="flex-1 min-w-40 [overflow-wrap:anywhere]">
      <span className={`font-bold text-lg ${ThemeVariants.colors.text.brand}`}>
        #{order.orderNumber}
      </span>
      <span className="font-semibold"> · {orderPlace(order)}</span>
      <span className={`block text-sm ${ThemeVariants.colors.text.secondary}`}>
        {order.items.map((it) => `${it.quantity}× ${it.dish.name}`).join(", ")}
      </span>
    </span>
    {order.readyAt && (
      <span className="flex flex-col items-end gap-1 shrink-0">
        <KitchenTimer since={order.readyAt} title="Pronto da" />
        <span
          className={`text-xs tabular-nums ${ThemeVariants.colors.text.secondary}`}
        >
          pronto alle {timeOf(order.readyAt)}
        </span>
      </span>
    )}
  </li>
);

interface DispatchCardProps {
  order: Order;
  stations: KitchenStation[];
  backlog: Record<string, number>;
  queuedAt: string;
}

//Ordine da smistare: si spuntano le righe (all'inizio nessuna, o tutte con un tocco) e si
//sceglie la postazione a cui mandarle
const DispatchCard = ({
  order,
  stations,
  backlog,
  queuedAt,
}: DispatchCardProps) => {
  const lines = unsentLines(order, stations);
  const [selected, setSelected] = useState<number[]>([]);
  const { mutate: send, isPending } = useSendToStation();
  const showNotification = useNotification();
  const chosen = selected.filter((i) => lines.includes(i));
  const allChosen = chosen.length === lines.length;

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
      <OrderHeader order={order} queuedAt={queuedAt} />

      <div className={`pt-1 ${ThemeVariants.colors.border.top.default}`}>
        {lines.length > 1 && (
          <button
            type="button"
            onClick={() => setSelected(allChosen ? [] : lines)}
            className={`min-h-9 text-sm font-semibold cursor-pointer ${ThemeVariants.colors.text.brand}`}
          >
            {allChosen ? "Deseleziona tutte" : "Seleziona tutte"}
          </button>
        )}
        <ul className="flex flex-col pb-1">
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
      </div>

      {liveTickets(order, stations).length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
            Già mandato a:
          </p>
          <SentTickets order={order} stations={stations} readOnly={false} />
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-auto">
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {chosen.length === 0
            ? "Spunta le righe da mandare, poi scegli la postazione"
            : allChosen
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

//Ordine da smistare visto in sola lettura (caposala): le righe ancora da mandare e quelle già
//mandate, senza pulsanti
const WaitingCard = ({
  order,
  stations,
  queuedAt,
}: {
  order: Order;
  stations: KitchenStation[];
  queuedAt: string;
}) => (
  <article className={ticketCardClass(false)}>
    <OrderHeader order={order} queuedAt={queuedAt} />
    <TicketLines order={order} lines={unsentLines(order, stations)} />
    {liveTickets(order, stations).length > 0 && (
      <div className="flex flex-col gap-1.5">
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          Già mandato a:
        </p>
        <SentTickets order={order} stations={stations} readOnly />
      </div>
    )}
  </article>
);

const GRID = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

//Pronti mostrati al capo cucina: i più recenti (quelli sul posto non si segnano consegnati)
const RECENT_READY = 15;

const SectionTitle = ({ label, count }: { label: string; count: number }) => (
  <h2 className="font-bold text-lg">
    {label} ({count})
  </h2>
);

const Empty = ({ label }: { label: string }) => (
  <p className={`py-6 text-center ${ThemeVariants.colors.text.secondary}`}>
    {label}
  </p>
);

//Smistamento del capo cucina, in tre sezioni: da smistare (da chi ha ordinato per primo),
//smistati (per postazione cosa è pronto e cosa manca) e pronti (possono andare). Il carico di
//ogni postazione è sulle schede in alto e sui pulsanti per mandare. La ricerca filtra per
//nome, tavolo o numero; il caposala lo vede in sola lettura
export const DispatchBoard = ({
  orders,
  stations,
  profile,
  search,
  readOnly,
}: {
  orders: Order[];
  stations: KitchenStation[];
  profile: RestaurantProfile | undefined;
  search: string;
  readOnly: boolean;
}) => {
  //il carico conta tutte le comande, anche quelle escluse dalla ricerca
  const backlog = Object.fromEntries(
    stations.map((s) => [s.id, stationBacklog(orders, s.id)]),
  );
  const found = orders.filter((o) => matchesSearch(o, search));
  const open = found.filter((o) => !o.readyAt).sort(byQueue(profile));
  const toDispatch = open.filter((o) => unsentLines(o, stations).length > 0);
  const dispatched = open.filter(
    (o) =>
      unsentLines(o, stations).length === 0 &&
      liveTickets(o, stations).length > 0,
  );
  //i consegnati al banco sono già andati
  const ready = found
    .filter((o) => o.readyAt && !o.deliveredAt)
    .sort((a, b) => (b.readyAt ?? "").localeCompare(a.readyAt ?? ""))
    .slice(0, RECENT_READY);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionTitle label="Da smistare" count={toDispatch.length} />
        {toDispatch.length === 0 ? (
          <Empty label="Nessuna comanda da smistare" />
        ) : (
          <div className={GRID}>
            {toDispatch.map((o) =>
              readOnly ? (
                <WaitingCard
                  key={o.id}
                  order={o}
                  stations={stations}
                  queuedAt={queueTime(o, profile)}
                />
              ) : (
                <DispatchCard
                  //righe ancora da mandare cambiate: si riparte senza righe spuntate
                  key={`${o.id}:${unsentLines(o, stations).join(",")}`}
                  order={o}
                  stations={stations}
                  backlog={backlog}
                  queuedAt={queueTime(o, profile)}
                />
              ),
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle label="Smistati" count={dispatched.length} />
        {dispatched.length === 0 ? (
          <Empty label="Nessun ordine in preparazione nelle postazioni" />
        ) : (
          <div className={cn(GRID, "items-start")}>
            {dispatched.map((o) => (
              <InProgressCard
                key={o.id}
                order={o}
                stations={stations}
                queuedAt={queueTime(o, profile)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle label="Pronti" count={ready.length} />
        {ready.length === 0 ? (
          <Empty label="Nessun ordine pronto" />
        ) : (
          <ul className="flex flex-col gap-2">
            {ready.map((o) => (
              <ReadyRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
