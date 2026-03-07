import { faker } from "@faker-js/faker";
import { DISH_CATEGORIES } from "../constant/menu";
import type { Dish } from "../../../types/menuOrder";

export const generateFakeDish = (): Dish => ({
  id: 1,
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
  }));
