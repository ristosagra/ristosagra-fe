import { useState } from "react";
import {
  ChevronDown,
  HandPlatter,
  LoaderCircle,
  Megaphone,
  MonitorPlay,
  ShoppingBag,
  Undo2,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "../../components/core/Button";
import { Label } from "../../components/core/Label";
import {
  useOrderDelivered,
  useOrders,
} from "../../features/orders/hook/useOrders";
import { OrderType, type Order } from "../../features/orders/types/orders";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { PickupCall } from "../../features/restaurant/types/restaurant";
import { byQueue, kitchenOrders } from "../../features/kitchen/utils/kitchen";
import { timeOf } from "../../features/kitchen/utils/ticketStyle";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { cn } from "../../helpers/cn";
import { useNotification } from "../../hooks/useNotification";
import { NotificationType } from "../../types/notification";

//Il banco deve vedere subito gli ordini appena pronti
const PICKUP_REFRESH_MS = 5000;
//Consegnati recenti mostrati (per rimediare a una consegna segnata per errore)
const RECENT_DELIVERED = 20;

//Dove va l'ordine: asporto con l'orario di ritiro, tavolo o sul posto, e il nome
const whereLabel = (o: Order) =>
  [
    o.type === OrderType.Takeaway
      ? `Asporto${o.pickupTime ? ` · ritiro ${o.pickupTime}` : ""}`
      : o.table
        ? `Tavolo ${o.table}`
        : "Sul posto",
    o.customerName,
  ]
    .filter(Boolean)
    .join(" · ");

//Ordine pronto: numero grande da chiamare, piatti da controllare e "Consegnato"
const ReadyCard = ({ order }: { order: Order }) => {
  const { mutate: setDelivered, isPending } = useOrderDelivered();
  const showNotification = useNotification();

  return (
    <article
      className={cn(
        "flex flex-col gap-3 p-4",
        ThemeVariants.borderRadius.xl,
        ThemeVariants.colors.bg.surface,
        ThemeVariants.colors.border.all.success,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-6xl font-bold leading-none ${ThemeVariants.colors.text.brand}`}
          >
            {order.orderNumber}
          </p>
          <p className="flex items-center gap-1.5 mt-2 text-sm font-semibold [overflow-wrap:anywhere]">
            {order.type === OrderType.Takeaway ? (
              <ShoppingBag size={15} className="shrink-0" />
            ) : (
              <UtensilsCrossed size={15} className="shrink-0" />
            )}
            {whereLabel(order)}
          </p>
        </div>
        {order.readyAt && (
          <span
            className={`text-sm tabular-nums shrink-0 ${ThemeVariants.colors.text.secondary}`}
            title="Pronto alle"
          >
            {timeOf(order.readyAt)}
          </span>
        )}
      </header>
      <ul
        className={`flex flex-col gap-0.5 pt-2 text-sm ${ThemeVariants.colors.border.top.default}`}
      >
        {order.items.map((it, i) => (
          <li key={i} className="[overflow-wrap:anywhere]">
            <span className={`font-bold ${ThemeVariants.colors.text.brand}`}>
              {it.quantity}×
            </span>{" "}
            {it.dish.name}
          </li>
        ))}
      </ul>
      <Button
        iconLeft={<HandPlatter size={18} />}
        label="Consegnato"
        onClick={() =>
          setDelivered(
            { id: order.id, delivered: true },
            {
              onError: () =>
                showNotification(
                  "Errore nel salvataggio della consegna",
                  NotificationType.Err,
                ),
            },
          )
        }
        dimension={ButtonDimensions.auto}
        variant="primary"
        disabled={isPending}
        fullWidth
        className="h-12 mt-auto disabled:opacity-50 disabled:cursor-wait"
      />
    </article>
  );
};

//Consegnato per errore: torna tra i pronti
const UndoDelivery = ({ order }: { order: Order }) => {
  const { mutate: setDelivered, isPending } = useOrderDelivered();
  return (
    <Button
      iconLeft={<Undo2 size={14} />}
      label={<span className="text-sm ml-1">Annulla</span>}
      onClick={() => setDelivered({ id: order.id, delivered: false })}
      dimension={ButtonDimensions.auto}
      variant="secondary"
      disabled={isPending}
      className="px-3 py-1.5"
      ariaLabel={`Annulla la consegna del numero ${order.orderNumber}`}
    />
  );
};

//Banco del ritiro: i numeri pronti da chiamare (sullo schermo Pronti o a voce) e consegnare,
//quelli ancora in cucina e gli ultimi consegnati. Si paga prima? Solo gli ordini pagati
export const Pickup = () => {
  const { data: orders = [], isLoading } = useOrders(PICKUP_REFRESH_MS);
  const { data: restaurant } = useRestaurant();
  const [showDelivered, setShowDelivered] = useState(false);
  const byScreen = restaurant?.pickupCall !== PickupCall.Voice;

  const visible = kitchenOrders(orders, restaurant);
  //chi è pronto da più tempo per primo
  const ready = visible
    .filter((o) => o.readyAt && !o.deliveredAt)
    .sort((a, b) => (a.readyAt ?? "").localeCompare(b.readyAt ?? ""));
  const preparing = visible
    .filter((o) => !o.readyAt && !o.deliveredAt)
    .sort(byQueue(restaurant));
  const delivered = visible
    .filter((o) => o.deliveredAt)
    .sort((a, b) => (b.deliveredAt ?? "").localeCompare(a.deliveredAt ?? ""))
    .slice(0, RECENT_DELIVERED);

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-5 pb-5">
      <div
        className={`sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 -mx-4 px-4 py-4 sm:-mx-5 sm:px-5 ${ThemeVariants.colors.bg.base}`}
      >
        <div>
          <Label
            label="Ritiro"
            tag={LabelTags.h1}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            color={ThemeVariants.colors.text.brand}
            fontFamily={ThemeVariants.fontFamily.display}
            noMargin
          />
          <p
            className={`flex items-center gap-1.5 text-sm ${ThemeVariants.colors.text.secondary}`}
          >
            {byScreen ? <MonitorPlay size={14} /> : <Megaphone size={14} />}
            {byScreen
              ? "I numeri pronti compaiono sullo schermo Pronti"
              : "Chiama a voce i numeri pronti"}
          </p>
        </div>
        {byScreen && (
          //lo schermo si apre a parte, da mettere su una TV o un monitor
          <a
            href="/pronti"
            target="_blank"
            rel="noopener"
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-bold",
              ThemeVariants.borderRadius.md,
              ThemeVariants.colors.bg.hover,
            )}
          >
            <MonitorPlay size={15} />
            Apri lo schermo Pronti
          </a>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <LoaderCircle
            size={32}
            aria-label="Caricamento"
            className={`animate-spin ${ThemeVariants.colors.text.brand}`}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">
              Pronti da consegnare ({ready.length})
            </h2>
            {ready.length === 0 ? (
              <p
                className={`py-6 text-center ${ThemeVariants.colors.text.secondary}`}
              >
                Nessun ordine pronto
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
                {ready.map((o) => (
                  <ReadyCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="font-bold text-lg">
              In preparazione ({preparing.length})
            </h2>
            {preparing.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {preparing.map((o) => (
                  <li
                    key={o.id}
                    title={whereLabel(o)}
                    className={cn(
                      "min-w-14 px-3 py-1.5 text-center text-lg font-bold tabular-nums",
                      ThemeVariants.borderRadius.md,
                      ThemeVariants.colors.bg.surface,
                      ThemeVariants.colors.border.all.default,
                    )}
                  >
                    {o.orderNumber}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {delivered.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowDelivered((s) => !s)}
                aria-expanded={showDelivered}
                className="flex items-center gap-2 py-2 font-bold cursor-pointer"
              >
                Consegnati di recente ({delivered.length})
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={cn(
                    "transition-transform duration-300",
                    showDelivered && "rotate-180",
                  )}
                />
              </button>
              {showDelivered && (
                <ul className="flex flex-col gap-2 mt-2">
                  {delivered.map((o) => (
                    <li
                      key={o.id}
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-2",
                        ThemeVariants.borderRadius.lg,
                        ThemeVariants.colors.bg.surface,
                        ThemeVariants.colors.border.all.default,
                      )}
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        <span className="font-bold">{o.orderNumber}</span>
                        <span
                          className={`text-sm ${ThemeVariants.colors.text.secondary}`}
                        >
                          {" "}
                          · {whereLabel(o)}
                        </span>
                      </span>
                      <UndoDelivery order={o} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
