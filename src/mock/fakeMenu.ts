import { faker } from "@faker-js/faker";
import type { Dish } from "../types/types";
import { CATEGORIES } from "../types/costant";

export const generateFakeDishes = (count = 15): Dish[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: faker.food.dish(),
    description: faker.food.description(),
    price: Number.parseFloat(faker.commerce.price({ min: 4, max: 20 })),
    category: CATEGORIES[i % CATEGORIES.length],
  }));
