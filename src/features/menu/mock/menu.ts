import { faker } from "@faker-js/faker";
import { ALLERGENS, DISH_CATEGORIES } from "../constant/menu";
import { WEEKDAYS } from "../../../constant/openingHours";
import { todayWeekday } from "../../../helpers/openingHours";
import { createMockStore, fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import type { Dish } from "../../../types/menuOrder";
import type { RestaurantMenu } from "../types/menu";
import { menusError } from "../utils/menuUtils";
import { requireManager } from "../../staff/mock/auth";

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

//Menù finti salvati nel browser: cassa e clienti vedono gli stessi piatti. Si parte da un
//menù per tutti i giorni, coi piatti del vecchio menù unico se c'erano
const legacyMenuStore = createMockStore("menu", () => generateFakeDishes());
const menusStore = createMockStore<RestaurantMenu[]>("menus", () => [
  {
    id: "m-1",
    name: "Menù",
    days: [...WEEKDAYS],
    dishes: legacyMenuStore.get(),
  },
]);

//Come il backend: i piatti nuovi (id negativo) ricevono l'id definitivo, unico tra tutti i menù
const withDishIds = (menus: RestaurantMenu[]): RestaurantMenu[] => {
  let next = Math.max(0, ...menus.flatMap((m) => m.dishes.map((d) => d.id)));
  return menus.map((m) => ({
    ...m,
    dishes: m.dishes.map((d) => (d.id > 0 ? d : { ...d, id: ++next })),
  }));
};

//Piatti del menù che ha oggi tra i suoi giorni (nessuno = menù vuoto): gli ordini si
//controllano e si ricalcolano su questi
export const todayDishes = (): Dish[] => {
  const today = todayWeekday();
  return menusStore.get().find((m) => m.days.includes(today))?.dishes ?? [];
};

export const fakeMenuApi = {
  getMenu: async (): Promise<Dish[]> => {
    await fakeDelay();
    return todayDishes();
  },

  getMenus: async (): Promise<RestaurantMenu[]> => {
    await fakeDelay();
    requireManager();
    return menusStore.get();
  },

  //Regole che il backend deve applicare (vedi API.md): nomi presenti e diversi, almeno un
  //piatto per menù, un giorno in un solo menù
  saveMenus: async (menus: RestaurantMenu[]): Promise<RestaurantMenu[]> => {
    await fakeDelay();
    requireManager();
    const days = menus.flatMap((m) => m.days);
    if (menusError(menus) || new Set(days).size !== days.length)
      throw new HttpError(400);
    const saved = withDishIds(menus);
    menusStore.set(saved);
    return saved;
  },
};
