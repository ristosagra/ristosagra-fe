import { faker } from "@faker-js/faker";
import { generateFakeDish } from "./menu";
import type { CartType, Order } from "../types/orders";

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
    return {
      id: i + 1,
      orderNumber: faker.number.int({ min: 100, max: 999 }),
      total: items.reduce(
        (acc, item) => acc + item.dish.price * item.quantity,
        0,
      ),
      paid: faker.datatype.boolean(),
      items,
      createdAt: faker.date.recent().toISOString(),
    };
  });

export const generateFakeOrderNumber = (): { orderNumber: number } => ({
  orderNumber: faker.number.int({ min: 1, max: 999 }),
});
