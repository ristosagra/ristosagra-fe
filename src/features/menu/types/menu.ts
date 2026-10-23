import type { Dish } from "../../../types/menuOrder";
import type { WeekdayConst } from "../../../types/openingHours";

//Menù del ristorante: se ne possono avere più di uno, ognuno usato in alcuni giorni della
//settimana (es. feriale e weekend). Un giorno sta in un solo menù; quello di oggi è attivo
//ed è quello che vedono clienti e cassa
export interface RestaurantMenu {
  //"m-<timestamp>" per i menù nuovi: lo genera il frontend e il backend lo conserva
  id: string;
  name: string;
  //nessun giorno = menù salvato ma non usato
  days: WeekdayConst[];
  dishes: Dish[];
}

export const MENU_NAME_MAX = 40;
