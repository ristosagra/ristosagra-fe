import type { Dish } from "../../../types/menuOrder";
import { DISH_CATEGORIES } from "../constant/menu";

export const groupDishesByCategory = (dishes: Dish[]): Record<string, Dish[]> =>
  dishes.reduce(
    (acc, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    },
    {} as Record<string, Dish[]>,
  );

//Categorie presenti nel menù, nell'ordine in cui compaiono i piatti (come nel menù dei clienti)
export const getCategories = (dishes: Dish[]): string[] => [
  ...new Set(dishes.map((d) => d.category)),
];

//Categorie selezionabili per un piatto: quelle del menù più quelle predefinite
export const getCategoryOptions = (dishes: Dish[]): string[] => [
  ...new Set([...getCategories(dishes), ...DISH_CATEGORIES]),
];
