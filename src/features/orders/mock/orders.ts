import { faker } from "@faker-js/faker";
import { generateFakeDish } from "../../menu/mock/menu";
import { readProfile } from "../../restaurant/mock/restaurant";
import { OrderingMode } from "../../restaurant/types/restaurant";
import {
  customerAsksTable,
  isPayFirstAtCashier,
  usesCounterPickup,
} from "../../restaurant/utils/ordering";
import { byQueue, kitchenOrders } from "../../kitchen/utils/kitchen";
import { currentMockUser } from "../../staff/mock/staff";
import { StaffRole } from "../../staff/types/staff";
import { calcTotal } from "../../../helpers/calcTotal";
import { createMockStore, fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { PAYMENT_PARAM, PaymentOutcome } from "../utils/onlinePayment";
import {
  OrderType,
  PickupMode,
  type CartType,
  type CashierOrder,
  type NewOrder,
  type Order,
  type OrderCreated,
  type PickupBoard,
  type StationTicket,
  type TakeawaySettings,
} from "../types/orders";

export const generateFakeOrders = (count = 20): Order[] =>
  Array.from({ length: count }, (_, i) => {
    const items: CartType[] = Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => {
        const quantity = faker.number.int({ min: 1, max: 4 });
        return {
          dish: generateFakeDish(),
          quantity,
        };
      },
    );
    const takeaway = i % 3 === 0;
    const createdAt = faker.date.recent();
    const paid = faker.datatype.boolean();
    return {
      id: i + 1,
      orderNumber: 100 + i,
      total: calcTotal(items),
      paid,
      ...(paid && {
        paidAt: new Date(createdAt.getTime() + 5 * 60_000).toISOString(),
      }),
      items,
      createdAt: createdAt.toISOString(),
      type: takeaway ? OrderType.Takeaway : OrderType.DineIn,
      customerName: faker.person.lastName(),
      //alcuni la cucina li ha già preparati
      ...(i % 4 === 1 && { readyAt: new Date().toISOString() }),
      ...(takeaway
        ? {
            pickupTime: `${faker.number.int({ min: 19, max: 21 })}:${faker.helpers.arrayElement(["00", "15", "30", "45"])}`,
          }
        : // i tavoli della piantina finta
          i % 2 === 0 && {
            table: `T-${faker.number.int({ min: 1, max: 6 })}`,
          }),
    };
  });

const DEFAULT_TAKEAWAY: TakeawaySettings = {
  enabled: true,
  mode: PickupMode.Custom,
  fixedTimes: { lunch: "12:30", dinner: "19:30" },
  ranges: {
    lunch: { from: "12:00", to: "14:30" },
    dinner: { from: "19:00", to: "22:30" },
  },
};

//Ordini e impostazioni dell'asporto finti, salvati nel browser
const ordersStore = createMockStore("orders", () => generateFakeOrders(12));
const takeawayStore = createMockStore<TakeawaySettings>(
  "takeaway",
  () => DEFAULT_TAKEAWAY,
);

//le impostazioni salvate prima di alcuni campi (pranzo e cena, attivo/disattivo) non li hanno: si usano quelli predefiniti
const readTakeaway = (): TakeawaySettings => {
  const { enabled, mode, fixedTimes, ranges } = {
    ...DEFAULT_TAKEAWAY,
    ...takeawayStore.get(),
  };
  return { enabled, mode, fixedTimes, ranges };
};

//Salva un nuovo ordine col primo numero libero (dal 100 in su)
const addOrder = (order: NewOrder, paid: boolean): number => {
  const orders = ordersStore.get();
  const orderNumber = Math.max(99, ...orders.map((o) => o.orderNumber)) + 1;
  const now = new Date().toISOString();
  ordersStore.set([
    ...orders,
    {
      ...order,
      id: Math.max(0, ...orders.map((o) => o.id)) + 1,
      orderNumber,
      total: calcTotal(order.items),
      paid,
      ...(paid && { paidAt: now }),
      createdAt: now,
    },
  ]);
  return orderNumber;
};

//Modifica un ordine salvato
const updateOrder = (id: number, change: (o: Order) => Order) => {
  const orders = ordersStore.get();
  const order = orders.find((o) => o.id === id);
  if (!order) throw new HttpError(404);
  const updated = change(order);
  ordersStore.set(orders.map((o) => (o.id === id ? updated : o)));
  return updated;
};

//Con lo smistamento l'ordine è pronto quando tutte le righe sono state mandate alle
//postazioni e tutte le loro comande sono pronte (lo calcola il backend)
const withReadyFromTickets = (o: Order): Order => {
  const tickets = o.tickets ?? [];
  const sent = new Set(tickets.flatMap((t) => t.items));
  const ready =
    tickets.length > 0 &&
    o.items.every((_, i) => sent.has(i)) &&
    tickets.every((t) => t.readyAt);
  return {
    ...o,
    readyAt: ready
      ? tickets
          .map((t) => t.readyAt ?? "")
          .sort()
          .at(-1)
      : undefined,
  };
};

//Regole che il backend deve applicare agli ordini dei clienti (vedi API.md)
const checkCustomerOrder = (order: NewOrder) => {
  const profile = readProfile();
  if (profile.orderingMode === OrderingMode.MenuOnly) throw new HttpError(403);
  if (order.type === OrderType.Takeaway && !readTakeaway().enabled)
    throw new HttpError(400);
  if (!order.customerName?.trim()) throw new HttpError(400);
  if (
    order.type === OrderType.DineIn &&
    customerAsksTable(profile) &&
    !order.table?.trim()
  )
    throw new HttpError(400);
  return profile;
};

//Regole sugli ordini creati dal personale: il cameriere prende solo ordini al tavolo, da
//pagare alla cassa, e solo se si paga a fine pasto
const checkStaffOrder = (order: CashierOrder) => {
  const profile = readProfile();
  if (profile.orderingMode === OrderingMode.PayOnline) throw new HttpError(403);
  if (order.type === OrderType.Takeaway && !readTakeaway().enabled)
    throw new HttpError(400);
  if (currentMockUser().role !== StaffRole.Waiter) return;
  if (isPayFirstAtCashier(profile)) throw new HttpError(403);
  if (order.paid || order.type !== OrderType.DineIn || !order.table?.trim())
    throw new HttpError(400);
};

export const fakeOrdersApi = {
  getOrders: async (): Promise<Order[]> => {
    await fakeDelay();
    return ordersStore.get();
  },

  createOrder: async (order: NewOrder): Promise<OrderCreated> => {
    await fakeDelay(1000);
    const profile = checkCustomerOrder(order);
    if (profile.orderingMode !== OrderingMode.PayOnline)
      return { orderNumber: addOrder(order, false) };
    //Pagamento online: non c'è un vero servizio di pagamento, si torna subito al sito
    //come dopo un pagamento riuscito (il backend segnerebbe l'ordine pagato alla sua conferma)
    return {
      orderNumber: addOrder(order, true),
      checkoutUrl: `/?${PAYMENT_PARAM}=${PaymentOutcome.Ok}`,
    };
  },

  createCashierOrder: async (
    cashierOrder: CashierOrder,
  ): Promise<{ orderNumber: number }> => {
    await fakeDelay();
    checkStaffOrder(cashierOrder);
    const { paid, ...order } = cashierOrder;
    return { orderNumber: addOrder(order, paid) };
  },

  updatePayment: async (id: number, paid: boolean): Promise<void> => {
    await fakeDelay();
    updateOrder(id, (o) => ({
      ...o,
      paid,
      paidAt: paid ? (o.paidAt ?? new Date().toISOString()) : undefined,
    }));
  },

  updateReady: async (id: number, ready: boolean): Promise<void> => {
    await fakeDelay(250);
    updateOrder(id, (o) => ({
      ...o,
      readyAt: ready ? new Date().toISOString() : undefined,
    }));
  },

  //cambiando i piatti le comande già mandate alle postazioni non valgono più: si rismista
  updateItems: async (id: number, items: CartType[]): Promise<void> => {
    await fakeDelay();
    updateOrder(id, (o) => ({
      ...o,
      items,
      total: calcTotal(items),
      tickets: undefined,
      readyAt: undefined,
    }));
  },

  updateDelivered: async (id: number, delivered: boolean): Promise<void> => {
    await fakeDelay(250);
    updateOrder(id, (o) => ({
      ...o,
      deliveredAt: delivered ? new Date().toISOString() : undefined,
    }));
  },

  //Solo col ritiro al banco; come la cucina: se si paga prima, solo gli ordini pagati
  getPickupBoard: async (): Promise<PickupBoard> => {
    await fakeDelay(150);
    const profile = readProfile();
    if (!usesCounterPickup(profile)) throw new HttpError(404);
    const open = kitchenOrders(ordersStore.get(), profile).filter(
      (o) => !o.deliveredAt,
    );
    return {
      preparing: open
        .filter((o) => !o.readyAt)
        .sort(byQueue(profile))
        .map((o) => o.orderNumber),
      ready: open
        .filter((o) => o.readyAt)
        .sort((a, b) => (b.readyAt ?? "").localeCompare(a.readyAt ?? ""))
        .map((o) => o.orderNumber),
    };
  },

  sendToStation: async (
    id: number,
    stationId: string,
    items: number[],
  ): Promise<StationTicket> => {
    await fakeDelay(250);
    if (!readProfile().kitchenStations.some((s) => s.id === stationId))
      throw new HttpError(400);
    const ticket: StationTicket = {
      id: `k-${Date.now()}`,
      stationId,
      items,
      sentAt: new Date().toISOString(),
    };
    updateOrder(id, (o) => {
      const sent = new Set((o.tickets ?? []).flatMap((t) => t.items));
      //righe esistenti e non ancora mandate
      if (items.length === 0 || items.some((i) => !o.items[i] || sent.has(i)))
        throw new HttpError(400);
      return withReadyFromTickets({
        ...o,
        tickets: [...(o.tickets ?? []), ticket],
      });
    });
    return ticket;
  },

  recallTicket: async (id: number, ticketId: string): Promise<void> => {
    await fakeDelay(250);
    updateOrder(id, (o) =>
      withReadyFromTickets({
        ...o,
        tickets: (o.tickets ?? []).filter((t) => t.id !== ticketId),
      }),
    );
  },

  updateTicketReady: async (
    id: number,
    ticketId: string,
    ready: boolean,
  ): Promise<void> => {
    await fakeDelay(250);
    updateOrder(id, (o) =>
      withReadyFromTickets({
        ...o,
        tickets: (o.tickets ?? []).map((t) =>
          t.id === ticketId
            ? { ...t, readyAt: ready ? new Date().toISOString() : undefined }
            : t,
        ),
      }),
    );
  },

  getTakeawaySettings: async (): Promise<TakeawaySettings> => {
    await fakeDelay(200);
    return readTakeaway();
  },

  saveTakeawaySettings: async (
    settings: TakeawaySettings,
  ): Promise<TakeawaySettings> => {
    await fakeDelay(200);
    takeawayStore.set(settings);
    return settings;
  },
};
