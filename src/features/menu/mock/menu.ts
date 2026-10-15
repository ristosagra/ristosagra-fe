import { faker } from "@faker-js/faker";
import { ALLERGENS, DISH_CATEGORIES } from "../constant/menu";
import type { Dish } from "../../../types/menuOrder";

export const generateFakeDish = (): Dish => ({
  id: faker.number.int({ min: 1000, max: 99999 }),
  name: faker.food.dish(),
  description: faker.food.description(),
  price: Number.parseFloat(faker.commerce.price({ min: 4, max: 20 })),
  category: DISH_CATEGORIES[0],
});

export const generateFakeDishes = (count = 15): Dish[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.food.dish(),
    description: faker.food.description(),
    price: Number.parseFloat(faker.commerce.price({ min: 4, max: 20 })),
    category: DISH_CATEGORIES[i % DISH_CATEGORIES.length],
    allergens: faker.helpers.arrayElements(ALLERGENS, { min: 0, max: 3 }),
  }));

export const fakeCreateMenu = (dishes: Dish[]): Promise<Dish[]> =>
  Promise.resolve(dishes);

export const fakeUpdateMenu = (dishes: Dish[]): Promise<Dish[]> =>
  Promise.resolve(dishes);
