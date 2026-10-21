import type { Order, StationTicket } from "../../orders/types/orders";
import type {
  KitchenStation,
  RestaurantProfile,
} from "../../restaurant/types/restaurant";
import { paysBeforeKitchen } from "../../restaurant/utils/ordering";

//Regole della cucina, uguali per tutte le viste (comande, smistamento, postazioni)

//Ordini che la cucina deve vedere: se si paga prima (online o tipo sagra) solo quelli pagati
export const kitchenOrders = (
  orders: Order[],
  profile: RestaurantProfile | undefined,
) => orders.filter((o) => !paysBeforeKitchen(profile) || o.paid);

//Da quando un ordine è in coda: dal pagamento se si paga prima, altrimenti dall'invio
export const queueTime = (
  order: Order,
  profile: RestaurantProfile | undefined,
) => (paysBeforeKitchen(profile) && order.paidAt) || order.createdAt;

//Chi ha ordinato per primo viene prima
export const byQueue =
  (profile: RestaurantProfile | undefined) => (a: Order, b: Order) =>
    queueTime(a, profile).localeCompare(queueTime(b, profile));

//Comande mandate a postazioni che esistono ancora (quelle di una postazione eliminata non contano)
export const liveTickets = (order: Order, stations: KitchenStation[]) =>
  (order.tickets ?? []).filter((t) =>
    stations.some((s) => s.id === t.stationId),
  );

//Righe dell'ordine (indici in items) non ancora mandate a una postazione
export const unsentLines = (
  order: Order,
  stations: KitchenStation[],
): number[] => {
  const sent = new Set(liveTickets(order, stations).flatMap((t) => t.items));
  return order.items.map((_, i) => i).filter((i) => !sent.has(i));
};

//Comande ancora da preparare in una postazione: il suo carico di lavoro
export const stationBacklog = (orders: Order[], stationId: string) =>
  orders.reduce(
    (n, o) =>
      n +
      (o.tickets ?? []).filter((t) => t.stationId === stationId && !t.readyAt)
        .length,
    0,
  );

//Da quante comande in coda una postazione è considerata carica
export const BUSY_STATION_BACKLOG = 5;

export interface StationWork {
  order: Order;
  ticket: StationTicket;
}

//Comande di una postazione con il loro ordine
export const stationWork = (
  orders: Order[],
  stationId: string,
): StationWork[] =>
  orders.flatMap((order) =>
    (order.tickets ?? [])
      .filter((t) => t.stationId === stationId)
      .map((ticket) => ({ order, ticket })),
  );
