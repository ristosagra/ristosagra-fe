import type { Dish } from "../../../types/menuOrder";

export const groupDishesByCategory = (dishes: Dish[]): Record<string, Dish[]> =>
  dishes.reduce(
    (acc, dish) => {
      if (!acc[dish.category]) acc[dish.category] = [];
      acc[dish.category].push(dish);
      return acc;
    },
    {} as Record<string, Dish[]>,
  );
