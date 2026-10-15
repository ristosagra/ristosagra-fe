import { faker } from "@faker-js/faker";
import { ALLERGENS, DISH_CATEGORIES } from "../constant/menu";
import { createMockStore, fakeDelay } from "../../../mock/store";
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

//Menù finto salvato nel browser: cassa e clienti vedono gli stessi piatti
const menuStore = createMockStore("menu", () => generateFakeDishes());

const saveMenu = async (dishes: Dish[]): Promise<Dish[]> => {
  await fakeDelay();
  menuStore.set(dishes);
  return dishes;
};

export const fakeMenuApi = {
  getMenu: async (): Promise<Dish[]> => {
    await fakeDelay();
    return menuStore.get();
  },
  createMenu: saveMenu,
  updateMenu: saveMenu,
};
