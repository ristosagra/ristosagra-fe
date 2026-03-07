import { httpClient } from "../../../services/client/httpClient";
import type { Dish } from "../../../types/menuOrder";

export const MenuService = {
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
};
