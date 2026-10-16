import { faker } from "@faker-js/faker";
import { generateFakeDish } from "../../menu/mock/menu";
import { calcTotal } from "../../../helpers/calcTotal";
import { createMockStore, fakeDelay } from "../../../mock/store";
import {
  OrderType,
  PickupMode,
  type CartType,
  type NewOrder,
  type Order,
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
    return {
      id: i + 1,
      orderNumber: 100 + i,
      total: calcTotal(items),
      paid: faker.datatype.boolean(),
      items,
      createdAt: faker.date.recent().toISOString(),
      type: takeaway ? OrderType.Takeaway : OrderType.DineIn,
      ...(takeaway && {
        customerName: faker.person.lastName(),
        pickupTime: `${faker.number.int({ min: 19, max: 21 })}:${faker.helpers.arrayElement(["00", "15", "30", "45"])}`,
      }),
    };
  });

const DEFAULT_TAKEAWAY: TakeawaySettings = {
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

//le impostazioni salvate prima di pranzo e cena (con un solo fixedTime) non li hanno: si usano quelli predefiniti
const readTakeaway = (): TakeawaySettings => {
  const { mode, fixedTimes, ranges } = {
    ...DEFAULT_TAKEAWAY,
    ...takeawayStore.get(),
  };
  return { mode, fixedTimes, ranges };
};

export const fakeOrdersApi = {
  getOrders: async (): Promise<Order[]> => {
    await fakeDelay();
    return ordersStore.get();
  },

  createOrder: async (order: NewOrder): Promise<{ orderNumber: number }> => {
    await fakeDelay(1000);
    const orders = ordersStore.get();
    const orderNumber = Math.max(99, ...orders.map((o) => o.orderNumber)) + 1;
    ordersStore.set([
      ...orders,
      {
        ...order,
        id: Math.max(0, ...orders.map((o) => o.id)) + 1,
        orderNumber,
        total: calcTotal(order.items),
        paid: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    return { orderNumber };
  },

  updatePayment: async (id: number, paid: boolean): Promise<void> => {
    await fakeDelay();
    ordersStore.set(
      ordersStore.get().map((o) => (o.id === id ? { ...o, paid } : o)),
    );
  },

  updateItems: async (id: number, items: CartType[]): Promise<void> => {
    await fakeDelay();
    ordersStore.set(
      ordersStore
        .get()
        .map((o) =>
          o.id === id ? { ...o, items, total: calcTotal(items) } : o,
        ),
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
