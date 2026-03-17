import { httpClient } from "../../../services/client/httpClient";
import type { Dish } from "../../../types/menuOrder";

export const MenuService = {
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
  createMenu: (dishes: Dish[]): Promise<Dish[]> => httpClient.post("/api/menu", dishes),
  updateMenu: (dishes: Dish[]): Promise<Dish[]> => httpClient.patch("/api/menu", dishes),
};
