import { ShoppingBag, Timer, UtensilsCrossed } from "lucide-react";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useNow } from "../../../hooks/useNow";
import { OrderType, type Order } from "../../orders/types/orders";
import { orderPlace } from "../../orders/utils/orderPlace";
import { formatMinutes, LATE_MINUTES, minutesSince } from "../utils/kitchen";
import { timeOf } from "../utils/ticketStyle";

interface KitchenTimerProps {
  //da quando conta (es. da quando l'ordine è in coda)
  since: string;
  //quando si è fermato (pronto): resta il tempo che ci è voluto
  until?: string;
  //cosa conta, per chi passa sopra col mouse e i lettori di schermo
  title: string;
}

//Timer della cucina: si aggiorna da solo, diventa rosso quando l'ordine è in ritardo
//e da fermo (pronto) è verde
export const KitchenTimer = ({ since, until, title }: KitchenTimerProps) => {
  const now = useNow();
  const minutes = minutesSince(since, until ? Date.parse(until) : now);
  const late = !until && minutes >= LATE_MINUTES;

  return (
    <span
      title={title}
      aria-label={`${title}: ${formatMinutes(minutes)}`}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-sm font-bold tabular-nums whitespace-nowrap",
        ThemeVariants.borderRadius.full,
        late
          ? "bg-[var(--danger)] text-white"
          : until
            ? `${ThemeVariants.colors.border.all.success} ${ThemeVariants.colors.text.success}`
            : ThemeVariants.colors.bg.hover,
      )}
    >
      <Timer size={14} aria-hidden />
      {formatMinutes(minutes)}
    </span>
  );
};

interface OrderHeaderProps {
  order: Order;
  //da quando l'ordine è in coda in cucina (invio o pagamento)
  queuedAt: string;
  //pronto: il timer si ferma
  readyAt?: string;
  dimmed?: boolean;
}

//Intestazione di una comanda: numero, dove va (tavolo o asporto col ritiro), nome e da
//quanto è in lavorazione
export const OrderHeader = ({
  order,
  queuedAt,
  readyAt,
  dimmed,
}: OrderHeaderProps) => (
  <header className="flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p
        className={`text-3xl font-bold ${dimmed ? ThemeVariants.colors.text.secondary : ThemeVariants.colors.text.brand}`}
      >
        #{order.orderNumber}
      </p>
      <p className="flex items-center gap-1.5 font-semibold [overflow-wrap:anywhere]">
        {order.type === OrderType.Takeaway ? (
          <ShoppingBag size={16} className="shrink-0" />
        ) : (
          <UtensilsCrossed size={16} className="shrink-0" />
        )}
        {orderPlace(order)}
      </p>
      {order.customerName && (
        <p
          className={`text-sm [overflow-wrap:anywhere] ${ThemeVariants.colors.text.secondary}`}
        >
          {order.customerName}
        </p>
      )}
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <KitchenTimer
        since={queuedAt}
        until={readyAt}
        title={readyAt ? "Tempo di preparazione" : "In lavorazione da"}
      />
      <span
        className={`text-xs tabular-nums ${ThemeVariants.colors.text.secondary}`}
      >
        {readyAt
          ? `pronto alle ${timeOf(readyAt)}`
          : `dalle ${timeOf(queuedAt)}`}
      </span>
    </div>
  </header>
);

//Righe di una comanda in grande (indici in order.items)
export const TicketLines = ({
  order,
  lines,
}: {
  order: Order;
  lines: number[];
}) => (
  <ul
    className={`flex flex-col gap-1 py-2 text-lg ${ThemeVariants.colors.border.top.default}`}
  >
    {lines.map((i) => {
      const it = order.items[i];
      return (
        it && (
          <li key={i} className="[overflow-wrap:anywhere]">
            <span className={`font-bold ${ThemeVariants.colors.text.brand}`}>
              {it.quantity}×
            </span>{" "}
            {it.dish.name}
          </li>
        )
      );
    })}
  </ul>
);
