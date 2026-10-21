import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { ThemeVariants } from "../../../constant/colors";
import { OrderType, type Order } from "../../orders/types/orders";
import { timeOf } from "../utils/ticketStyle";

interface OrderHeaderProps {
  order: Order;
  //ora mostrata a destra (es. in coda da, pronto alle)
  time: string;
  timeTitle: string;
  dimmed?: boolean;
}

//Intestazione di una comanda: numero, dove va (tavolo o asporto col ritiro) e nome
export const OrderHeader = ({
  order,
  time,
  timeTitle,
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
          <>
            <ShoppingBag size={16} className="shrink-0" />
            Asporto
            {order.pickupTime && ` · ritiro ${order.pickupTime}`}
          </>
        ) : (
          <>
            <UtensilsCrossed size={16} className="shrink-0" />
            {order.table ? `Tavolo ${order.table}` : "Sul posto"}
          </>
        )}
      </p>
      {order.customerName && (
        <p
          className={`text-sm [overflow-wrap:anywhere] ${ThemeVariants.colors.text.secondary}`}
        >
          {order.customerName}
        </p>
      )}
    </div>
    <span
      className={`text-sm tabular-nums shrink-0 ${ThemeVariants.colors.text.secondary}`}
      title={timeTitle}
    >
      {timeOf(time)}
    </span>
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
