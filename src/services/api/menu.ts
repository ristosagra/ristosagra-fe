import type { Dish } from "../../types/types";
import { httpClient } from "../client/httpClient";

export const MenuService = {
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
};
