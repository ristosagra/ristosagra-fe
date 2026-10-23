import { OrderType, type Order } from "../types/orders";

//Dove va l'ordine: "Asporto · ritiro 19:30", "Tavolo T-3" o "Sul posto"
export const orderPlace = (order: Order) =>
  order.type === OrderType.Takeaway
    ? `Asporto${order.pickupTime ? ` · ritiro ${order.pickupTime}` : ""}`
    : order.table
      ? `Tavolo ${order.table}`
      : "Sul posto";

//Ricerca negli ordini (cucina e cassa): per numero, nome del cliente o tavolo
export const matchesSearch = (order: Order, search: string) => {
  const q = search.trim().toLowerCase();
  return (
    !q ||
    String(order.orderNumber).includes(q) ||
    (order.customerName ?? "").toLowerCase().includes(q) ||
    (order.table ?? "").toLowerCase().includes(q)
  );
};
