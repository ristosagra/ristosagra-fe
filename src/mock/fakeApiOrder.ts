import { faker } from "@faker-js/faker";
import type { CartType, Order } from "../types/types";
import { generateFakeDish } from "./fakeMenu";

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
