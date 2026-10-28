import { faker } from "@faker-js/faker";
import {
  generateFakeDish,
  soldOutToday,
  todayDishes,
} from "../../menu/mock/menu";
import { readProfile } from "../../restaurant/mock/restaurant";
import { OrderingMode } from "../../restaurant/types/restaurant";
import {
  customerAsksTable,
  customersOrderOnline,
  hasPickupDesk,
  isPayFirstAtCashier,
  marksOrdersPaid,
  paysBeforeKitchen,
  staffOrderNeedsTable,
  takeawayOnlyDesk,
  usesCounterPickup,
  usesKitchenDispatch,
} from "../../restaurant/utils/ordering";
import { byQueue, kitchenOrders } from "../../kitchen/utils/kitchen";
import { requireManager, requireRole } from "../../staff/mock/auth";
import { requireActiveSagra } from "../../platform/mock/billingStore";
import { StaffRole } from "../../staff/types/staff";
import { takesTableOrders } from "../../staff/utils/permissions";
import { calcTotal } from "../../../helpers/calcTotal";
import { isOpenNow, nowHHMM } from "../../../helpers/openingHours";
import { createMockStore, fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import type { Dish } from "../../../types/menuOrder";
import { PAYMENT_PARAM, PaymentOutcome } from "../utils/onlinePayment";
import {
  pickupTimeValid,
  takeawayError,
  takeawayToday,
} from "../utils/takeawayUtils";
import {
  OrderType,
  type CartType,
  type CashierOrder,
  type NewOrder,
  type Order,
  type OrderCreated,
  type PickupBoard,
  type StationTicket,
  type TakeawaySettings,
} from "../types/orders";
import { readTakeaway, takeawayStore } from "./takeaway";

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

//Ordini finti salvati nel browser
const ordersStore = createMockStore("orders", () => generateFakeOrders(12));

//Salva un nuovo ordine col primo numero libero (dal 100 in su). Il totale si calcola dai
//piatti già ricontrollati sul menù (vedi fromMenu), mai da quello inviato
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

const findOrder = (id: number) => {
  const order = ordersStore.get().find((o) => o.id === id);
  if (!order) throw new HttpError(404);
  return order;
};

//Modifica un ordine salvato
const updateOrder = (id: number, change: (o: Order) => Order) => {
  const updated = change(findOrder(id));
  ordersStore.set(ordersStore.get().map((o) => (o.id === id ? updated : o)));
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

//Piatti ricontrollati: esistono tra quelli ammessi (il menù di oggi), la quantità è un intero
//positivo e nome e prezzo sono quelli salvati, mai quelli inviati dal client. Un piatto esaurito
//non si ordina (409): se ne possono tenere al massimo quanti ne aveva già l'ordine (keep)
const fromMenu = (
  items: CartType[],
  allowed: Dish[],
  keep: CartType[] = [],
): CartType[] => {
  if (items.length === 0) throw new HttpError(400);
  const soldOut = soldOutToday();
  return items.map(({ dish, quantity }) => {
    const saved = allowed.find((d) => d.id === dish.id);
    if (!saved || !Number.isInteger(quantity) || quantity < 1)
      throw new HttpError(400);
    const kept = keep
      .filter((it) => it.dish.id === dish.id)
      .reduce((n, it) => n + it.quantity, 0);
    if (soldOut.includes(dish.id) && quantity > kept) throw new HttpError(409);
    return { dish: saved, quantity };
  });
};

//Sul posto si ordina solo a locale aperto; l'asporto per un servizio di oggi non ancora finito,
//e se i clienti ordinano dal sito all'orario unico o nelle fasce di ritiro
const checkTiming = (order: NewOrder, pickupRules: boolean) => {
  const profile = readProfile();
  const now = nowHHMM();
  if (order.type !== OrderType.Takeaway) {
    if (!isOpenNow(profile.openingHours, now)) throw new HttpError(400);
    return;
  }
  const slot = takeawayToday(profile.openingHours, readTakeaway(), now);
  if (!slot || !order.customerName?.trim()) throw new HttpError(400);
  if (pickupRules && !pickupTimeValid(slot, order.pickupTime, now))
    throw new HttpError(400);
};

//Regole che il backend deve applicare agli ordini dei clienti (vedi API.md)
const customerOrder = (order: NewOrder): NewOrder => {
  const profile = readProfile();
  if (profile.orderingMode === OrderingMode.MenuOnly) throw new HttpError(403);
  if (!order.customerName?.trim()) throw new HttpError(400);
  checkTiming(order, true);
  const isTakeaway = order.type === OrderType.Takeaway;
  const table = order.table?.trim();
  if (!isTakeaway && customerAsksTable(profile) && !table)
    throw new HttpError(400);
  return {
    type: isTakeaway ? OrderType.Takeaway : OrderType.DineIn,
    items: fromMenu(order.items, todayDishes()),
    customerName: order.customerName.trim(),
    //il tavolo solo se si chiede, l'orario solo all'asporto
    ...(isTakeaway
      ? { pickupTime: order.pickupTime }
      : customerAsksTable(profile) && { table }),
  };
};

//Regole sugli ordini creati dal personale, per tutti (titolare compreso): mai col pagamento
//online; sul posto a locale aperto, col tavolo a fine pasto (se si paga prima niente tavolo
//né nome); la cassa crea ordini già pagati, tranne se i clienti ordinano dal sito e pagano
//alla cassa a fine pasto; cameriere e caposala solo ordini al tavolo da pagare alla cassa,
//e solo a fine pasto
const staffOrder = (cashierOrder: CashierOrder): CashierOrder => {
  const actor = requireRole(
    StaffRole.Cashier,
    StaffRole.HeadWaiter,
    StaffRole.Waiter,
  );
  const profile = readProfile();
  if (profile.orderingMode === OrderingMode.PayOnline) throw new HttpError(403);
  const isTakeaway = cashierOrder.type === OrderType.Takeaway;
  const tableStaff = takesTableOrders(actor.role);
  checkTiming(cashierOrder, customersOrderOnline(profile));
  const needsTable = !isTakeaway && staffOrderNeedsTable(profile);
  const table = cashierOrder.table?.trim();
  if (needsTable && !table) throw new HttpError(400);
  if (tableStaff) {
    if (isPayFirstAtCashier(profile)) throw new HttpError(403);
    if (cashierOrder.paid || isTakeaway) throw new HttpError(400);
  } else if (
    !cashierOrder.paid &&
    (!marksOrdersPaid(profile) || isPayFirstAtCashier(profile))
  )
    throw new HttpError(400);
  const name = cashierOrder.customerName?.trim();
  return {
    type: isTakeaway ? OrderType.Takeaway : OrderType.DineIn,
    items: fromMenu(cashierOrder.items, todayDishes()),
    paid: cashierOrder.paid,
    ...((isTakeaway || needsTable) && name && { customerName: name }),
    ...(isTakeaway
      ? cashierOrder.pickupTime && { pickupTime: cashierOrder.pickupTime }
      : needsTable && { table }),
  };
};

//La cucina lavora solo sugli ordini che vede: se si paga prima, quelli pagati
const checkKitchenSees = (order: Order) => {
  if (paysBeforeKitchen(readProfile()) && !order.paid) throw new HttpError(400);
};

//Smistamento: solo se è attivo (con almeno una postazione)
const requireDispatch = () => {
  if (!usesKitchenDispatch(readProfile())) throw new HttpError(403);
};

export const fakeOrdersApi = {
  getOrders: async (): Promise<Order[]> => {
    await fakeDelay();
    requireRole(
      StaffRole.Cashier,
      StaffRole.HeadWaiter,
      StaffRole.Chef,
      StaffRole.Kitchen,
      StaffRole.Counter,
    );
    return ordersStore.get();
  },

  createOrder: async (order: NewOrder): Promise<OrderCreated> => {
    await fakeDelay(1000);
    requireActiveSagra();
    const checked = customerOrder(order);
    if (readProfile().orderingMode !== OrderingMode.PayOnline)
      return { orderNumber: addOrder(checked, false) };
    //Pagamento online: non c'è un vero servizio di pagamento, si torna subito al sito
    //come dopo un pagamento riuscito (il backend segnerebbe l'ordine pagato alla sua conferma)
    return {
      orderNumber: addOrder(checked, true),
      checkoutUrl: `/?${PAYMENT_PARAM}=${PaymentOutcome.Ok}`,
    };
  },

  createCashierOrder: async (
    cashierOrder: CashierOrder,
  ): Promise<{ orderNumber: number }> => {
    await fakeDelay();
    requireActiveSagra();
    const { paid, ...order } = staffOrder(cashierOrder);
    return { orderNumber: addOrder(order, paid) };
  },

  //Online gli ordini li paga il servizio di pagamento; con Solo menù si incassa soltanto
  //(dai conti), non si rimette un ordine da pagare
  updatePayment: async (id: number, paid: boolean): Promise<void> => {
    await fakeDelay();
    requireRole(StaffRole.Cashier);
    requireActiveSagra();
    const profile = readProfile();
    if (profile.orderingMode === OrderingMode.PayOnline)
      throw new HttpError(403);
    if (!paid && !marksOrdersPaid(profile)) throw new HttpError(400);
    updateOrder(id, (o) => ({
      ...o,
      paid,
      paidAt: paid ? (o.paidAt ?? new Date().toISOString()) : undefined,
    }));
  },

  //Solo senza smistamento: con lo smistamento il pronto lo danno le postazioni
  updateReady: async (id: number, ready: boolean): Promise<void> => {
    await fakeDelay(250);
    requireRole(StaffRole.Chef, StaffRole.Kitchen);
    requireActiveSagra();
    if (usesKitchenDispatch(readProfile())) throw new HttpError(403);
    checkKitchenSees(findOrder(id));
    updateOrder(id, (o) => ({
      ...o,
      readyAt: ready ? new Date().toISOString() : undefined,
    }));
  },

  //Piatti di un asporto: cambiandoli le comande già mandate alle postazioni non valgono più
  //e si rismista. Si possono tenere i piatti già nell'ordine o prenderne dal menù di oggi
  updateItems: async (id: number, items: CartType[]): Promise<void> => {
    await fakeDelay();
    requireRole(StaffRole.Cashier);
    requireActiveSagra();
    if (readProfile().orderingMode === OrderingMode.PayOnline)
      throw new HttpError(403);
    const order = findOrder(id);
    if (order.type !== OrderType.Takeaway) throw new HttpError(400);
    const checked = fromMenu(
      items,
      [...todayDishes(), ...order.items.map((it) => it.dish)],
      order.items,
    );
    updateOrder(id, (o) => ({
      ...o,
      items: checked,
      total: calcTotal(checked),
      tickets: undefined,
      readyAt: undefined,
    }));
  },

  //Solo se c'è un banco: col ritiro al banco tutti gli ordini, altrimenti solo l'asporto.
  //Si consegna solo un ordine pronto
  updateDelivered: async (id: number, delivered: boolean): Promise<void> => {
    await fakeDelay(250);
    requireRole(StaffRole.Cashier, StaffRole.Chef, StaffRole.Counter);
    requireActiveSagra();
    const profile = readProfile();
    const takeaway = readTakeaway();
    if (!hasPickupDesk(profile, takeaway)) throw new HttpError(403);
    const order = findOrder(id);
    if (
      (takeawayOnlyDesk(profile, takeaway) &&
        order.type !== OrderType.Takeaway) ||
      (delivered && !order.readyAt)
    )
      throw new HttpError(400);
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
    requireRole(StaffRole.Chef);
    requireActiveSagra();
    requireDispatch();
    if (!readProfile().kitchenStations.some((s) => s.id === stationId))
      throw new HttpError(400);
    checkKitchenSees(findOrder(id));
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

  //Si ritira solo una comanda non ancora pronta
  recallTicket: async (id: number, ticketId: string): Promise<void> => {
    await fakeDelay(250);
    requireRole(StaffRole.Chef);
    requireActiveSagra();
    requireDispatch();
    updateOrder(id, (o) => {
      const ticket = (o.tickets ?? []).find((t) => t.id === ticketId);
      if (!ticket) throw new HttpError(404);
      if (ticket.readyAt) throw new HttpError(400);
      return withReadyFromTickets({
        ...o,
        tickets: (o.tickets ?? []).filter((t) => t.id !== ticketId),
      });
    });
  },

  updateTicketReady: async (
    id: number,
    ticketId: string,
    ready: boolean,
  ): Promise<void> => {
    await fakeDelay(250);
    requireRole(StaffRole.Chef, StaffRole.Kitchen);
    requireActiveSagra();
    requireDispatch();
    updateOrder(id, (o) => {
      if (!(o.tickets ?? []).some((t) => t.id === ticketId))
        throw new HttpError(404);
      return withReadyFromTickets({
        ...o,
        tickets: (o.tickets ?? []).map((t) =>
          t.id === ticketId
            ? { ...t, readyAt: ready ? new Date().toISOString() : undefined }
            : t,
        ),
      });
    });
  },

  getTakeawaySettings: async (): Promise<TakeawaySettings> => {
    await fakeDelay(200);
    return readTakeaway();
  },

  saveTakeawaySettings: async (
    settings: TakeawaySettings,
  ): Promise<TakeawaySettings> => {
    await fakeDelay(200);
    requireManager();
    if (takeawayError(settings)) throw new HttpError(400);
    takeawayStore.set(settings);
    return settings;
  },
};
