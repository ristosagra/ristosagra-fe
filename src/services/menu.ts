import { httpClient } from "../../client/httpClient";
import type { Dish } from "../types/types";

export const MenuService = {
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
};
