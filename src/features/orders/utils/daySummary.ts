import { kitchenOrders, queueTime } from "../../kitchen/utils/kitchen";
import type { RestaurantProfile } from "../../restaurant/types/restaurant";
import {
  paysBeforeKitchen,
  usesCounterPickup,
} from "../../restaurant/utils/ordering";
import { OrderType, type Order } from "../types/orders";

//Riepilogo della giornata per titolare e vice (fine serata, o per misurare un'edizione):
//calcolato dagli ordini di GET /api/orders, con le stesse regole della cucina

export interface DishSold {
  id: number;
  name: string;
  quantity: number;
  //euro, dai prezzi salvati negli ordini
  revenue: number;
}

export interface HourCount {
  //ora d'inizio della fascia (0–23)
  hour: number;
  orders: number;
}

export interface DaySummary {
  //ordini che contano: se si paga prima solo quelli pagati (gli altri non sono mai arrivati in cucina)
  orders: number;
  dineIn: number;
  takeaway: number;
  //euro incassati: ordini pagati
  revenue: number;
  //euro ancora da incassare: ordini a fine pasto non ancora pagati
  toCollect: number;
  //se si paga prima: ordini inviati e mai pagati (non contano)
  neverPaid: number;
  //piatti venduti, dal più venduto
  dishes: DishSold[];
  //ordini per fascia oraria (da quando sono in coda), dalla prima all'ultima ora con ordini
  byHour: HourCount[];
  //la fascia con più ordini
  peak: HourCount | null;
  //minuti dalla coda (pagamento o invio) a pronto, sugli ordini pronti
  avgPrepMinutes: number | null;
  maxPrepMinutes: number | null;
  //col ritiro al banco: minuti da pronto a consegnato (quanto aspetta al banco)
  avgPickupMinutes: number | null;
}

//Stesso giorno di calendario (ora locale)
const sameDay = (iso: string, day: Date) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  );
};

//Minuti tra due istanti ISO (mai negativi)
const minutesBetween = (from: string, to: string) =>
  Math.max(0, (Date.parse(to) - Date.parse(from)) / 60000);

const average = (values: number[]) =>
  values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null;

export const daySummary = (
  orders: Order[],
  profile: RestaurantProfile | undefined,
  day = new Date(),
): DaySummary => {
  const today = orders.filter((o) => sameDay(o.createdAt, day));
  const counted = kitchenOrders(today, profile);
  const takeaway = counted.filter((o) => o.type === OrderType.Takeaway).length;

  const dishes = new Map<number, DishSold>();
  for (const o of counted)
    for (const { dish, quantity } of o.items) {
      const sold = dishes.get(dish.id) ?? {
        id: dish.id,
        name: dish.name,
        quantity: 0,
        revenue: 0,
      };
      dishes.set(dish.id, {
        ...sold,
        quantity: sold.quantity + quantity,
        revenue: sold.revenue + dish.price * quantity,
      });
    }

  const hours = counted.map((o) => new Date(queueTime(o, profile)).getHours());
  const byHour =
    hours.length === 0
      ? []
      : Array.from(
          { length: Math.max(...hours) - Math.min(...hours) + 1 },
          (_, i) => {
            const hour = Math.min(...hours) + i;
            return { hour, orders: hours.filter((h) => h === hour).length };
          },
        );
  const peak = byHour.reduce<HourCount | null>(
    (best, h) => (!best || h.orders > best.orders ? h : best),
    null,
  );

  const prepTimes = counted
    .filter((o) => o.readyAt)
    .map((o) => minutesBetween(queueTime(o, profile), o.readyAt ?? ""));
  const pickupTimes = usesCounterPickup(profile)
    ? counted
        .filter((o) => o.readyAt && o.deliveredAt)
        .map((o) => minutesBetween(o.readyAt ?? "", o.deliveredAt ?? ""))
    : [];

  return {
    orders: counted.length,
    dineIn: counted.length - takeaway,
    takeaway,
    revenue: counted.filter((o) => o.paid).reduce((s, o) => s + o.total, 0),
    toCollect: counted.filter((o) => !o.paid).reduce((s, o) => s + o.total, 0),
    neverPaid: paysBeforeKitchen(profile) ? today.length - counted.length : 0,
    dishes: [...dishes.values()].sort(
      (a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name),
    ),
    byHour,
    peak,
    avgPrepMinutes: average(prepTimes),
    maxPrepMinutes: prepTimes.length
      ? Math.round(Math.max(...prepTimes))
      : null,
    avgPickupMinutes: average(pickupTimes),
  };
};

//Fascia oraria, es. "19:00–20:00"
export const hourLabel = (hour: number) =>
  `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
