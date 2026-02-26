import { faker } from "@faker-js/faker";

export const generateFakeOrderNumber = (): { orderNumber: number } => ({
  orderNumber: faker.number.int({ min: 1, max: 999 }),
});
