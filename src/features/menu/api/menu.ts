import { httpClient } from "../../../services/client/httpClient";
import type { Dish } from "../../../types/menuOrder";
import type { RestaurantMenu } from "../types/menu";

export const MenuService = {
  //piatti del menù di oggi, quello che vedono clienti e cassa
  getMenu: (): Promise<Dish[]> => httpClient.get("/api/menu"),
  //tutti i menù con i loro giorni, per il profilo
  getMenus: (): Promise<RestaurantMenu[]> => httpClient.get("/api/menus"),
  //elenco completo dei menù: sostituisce quello salvato
  saveMenus: (menus: RestaurantMenu[]): Promise<RestaurantMenu[]> =>
    httpClient.patch("/api/menus", menus),
};
