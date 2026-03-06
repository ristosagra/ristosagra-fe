import type { Dish } from "../../types/orders";
import { httpClient } from "../client/httpClient";

export const MenuService = {
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
};
