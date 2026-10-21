import { useState } from "react";
import { HandCoins, MapPin, User } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { useOrderPayment } from "../hook/useOrders";
import { OrderType, type Order } from "../types/orders";

//Conto di un tavolo (o di un ordine senza tavolo): tutto quello che hanno preso e quanto devono
interface Bill {
  key: string;
  table?: string;
  orders: Order[];
  items: { key: string; name: string; quantity: number; amount: number }[];
  total: number;
}

//Ordini sul posto non pagati, raggruppati per tavolo; quelli senza tavolo restano uno per uno.
//I tavoli in ordine di nome (T-2 prima di T-10), poi gli ordini senza tavolo
const buildBills = (orders: Order[]): Bill[] => {
  const groups = new Map<string, Order[]>();
  for (const o of orders) {
    if (o.paid || o.type === OrderType.Takeaway) continue;
    const key = o.table ? `table:${o.table}` : `order:${o.id}`;
    groups.set(key, [...(groups.get(key) ?? []), o]);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      //stesso piatto allo stesso prezzo in più ordini: una riga sola
      const items = new Map<string, Bill["items"][number]>();
      for (const { dish, quantity } of list.flatMap((o) => o.items)) {
        const itemKey = `${dish.id}-${dish.price}`;
        const prev = items.get(itemKey);
        items.set(itemKey, {
          key: itemKey,
          name: dish.name,
          quantity: (prev?.quantity ?? 0) + quantity,
          amount: (prev?.amount ?? 0) + dish.price * quantity,
        });
      }
      return {
        key,
        table: list[0].table,
        orders: list.sort((a, b) => a.orderNumber - b.orderNumber),
        items: [...items.values()],
        //il totale è quello calcolato dal backend per ogni ordine
        total: list.reduce((s, o) => s + o.total, 0),
      };
    })
    .sort((a, b) =>
      a.table && b.table
        ? a.table.localeCompare(b.table, "it", { numeric: true })
        : a.table
          ? -1
          : b.table
            ? 1
            : a.orders[0].orderNumber - b.orders[0].orderNumber,
    );
};

const BillCard = ({ bill }: { bill: Bill }) => {
  const { mutateAsync: updatePayment } = useOrderPayment();
  const showNotification = useNotification();
  const [isPaying, setIsPaying] = useState(false);
  const title = bill.table
    ? `Tavolo ${bill.table}`
    : `Ordine #${bill.orders[0].orderNumber}`;
  const names = [
    ...new Set(bill.orders.map((o) => o.customerName).filter(Boolean)),
  ].join(", ");
  const total = `€${bill.total.toFixed(2)}`;

  //Incassa tutto il conto: segna pagati tutti i suoi ordini
  const pay = async () => {
    setIsPaying(true);
    const results = await Promise.allSettled(
      bill.orders.map((o) => updatePayment({ id: o.id, paid: true })),
    );
    setIsPaying(false);
    if (results.some((r) => r.status === "rejected"))
      return showNotification(
        `${title}: errore nell'incasso, riprova`,
        NotificationType.Err,
      );
    showNotification(`${title}: incassati ${total}`, NotificationType.Ok);
  };

  return (
    <article
      className={cn(
        "flex flex-col gap-3 p-4",
        ThemeVariants.borderRadius.xl,
        ThemeVariants.colors.bg.surface,
        ThemeVariants.colors.border.all.default,
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xl font-bold [overflow-wrap:anywhere]">
            {bill.table ? (
              <MapPin size={18} className="shrink-0" />
            ) : (
              <User size={18} className="shrink-0" />
            )}
            {title}
          </p>
          <p
            className={`text-sm [overflow-wrap:anywhere] ${ThemeVariants.colors.text.secondary}`}
          >
            {[
              names,
              `${bill.orders.length === 1 ? "ordine" : "ordini"} ${bill.orders.map((o) => `#${o.orderNumber}`).join(", ")}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <p
          className={`text-xl font-bold tabular-nums shrink-0 ${ThemeVariants.colors.text.brand}`}
        >
          {total}
        </p>
      </header>

      <ul
        className={`flex flex-col gap-1 pt-2 text-sm ${ThemeVariants.colors.border.top.default}`}
      >
        {bill.items.map((it) => (
          <li key={it.key} className="flex justify-between gap-3">
            <span className="min-w-0 [overflow-wrap:anywhere]">
              <span className={`font-bold ${ThemeVariants.colors.text.brand}`}>
                {it.quantity}×
              </span>{" "}
              {it.name}
            </span>
            <span className="tabular-nums shrink-0">
              €{it.amount.toFixed(2)}
            </span>
          </li>
        ))}
      </ul>

      <Button
        iconLeft={<HandCoins size={18} />}
        label={`Incassa ${total}`}
        onClick={pay}
        dimension={ButtonDimensions.auto}
        variant="primary"
        disabled={isPaying}
        fullWidth
        className="h-11 mt-auto disabled:opacity-50 disabled:cursor-wait"
      />
    </article>
  );
};

//Conti da incassare alla cassa: per ogni tavolo dove sono seduti, cosa hanno preso e quanto devono
export const TableBills = ({ orders }: { orders: Order[] }) => {
  const bills = buildBills(orders);

  if (bills.length === 0)
    return (
      <p className={`py-10 text-center ${ThemeVariants.colors.text.secondary}`}>
        Nessun conto da incassare
      </p>
    );

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
      {bills.map((b) => (
        <BillCard key={b.key} bill={b} />
      ))}
    </div>
  );
};
