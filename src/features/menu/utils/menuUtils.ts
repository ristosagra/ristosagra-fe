import {
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
  WEEKDAYS,
} from "../../../constant/openingHours";
import { openServices, todayWeekday } from "../../../helpers/openingHours";
import type { Dish } from "../../../types/menuOrder";
import type { WeekdayConst, WeeklyHours } from "../../../types/openingHours";
import { DISH_CATEGORIES } from "../constant/menu";
import type { RestaurantMenu } from "../types/menu";

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

//Menù attivo: quello che ha il giorno (di oggi) tra i suoi
export const activeMenu = (
  menus: RestaurantMenu[],
  day: WeekdayConst = todayWeekday(),
) => menus.find((m) => m.days.includes(day));

//Giorni di un menù in breve: "Tutti i giorni", "Lun–Ven", "Sab, Dom", "Lun–Mer, Ven"
export const formatDays = (days: WeekdayConst[]): string => {
  if (days.length === 0) return "Nessun giorno";
  if (days.length === WEEKDAYS.length) return "Tutti i giorni";
  //gruppi di giorni consecutivi, nell'ordine della settimana
  const runs: WeekdayConst[][] = [];
  WEEKDAYS.forEach((d, i) => {
    if (!days.includes(d)) return;
    const last = runs.at(-1);
    if (last && last.at(-1) === WEEKDAYS[i - 1]) last.push(d);
    else runs.push([d]);
  });
  return runs
    .flatMap((r) =>
      r.length >= 3
        ? [
            `${WEEKDAY_SHORT_LABELS[r[0]]}–${WEEKDAY_SHORT_LABELS[r[r.length - 1]]}`,
          ]
        : r.map((d) => WEEKDAY_SHORT_LABELS[d]),
    )
    .join(", ");
};

//Menù non validi: ognuno con un nome, diverso dagli altri, e almeno un piatto
export const menusError = (menus: RestaurantMenu[]): string | null => {
  if (menus.length === 0) return "Crea almeno un menù";
  const names = menus.map((m) => m.name.trim().toLowerCase());
  if (names.some((n) => !n)) return "Ogni menù deve avere un nome";
  if (new Set(names).size !== names.length)
    return "Due menù hanno lo stesso nome";
  const empty = menus.find((m) => m.dishes.length === 0);
  return empty ? `Il menù ${empty.name.trim()} non ha piatti` : null;
};

//Giorni in cui il locale è aperto ma nessun menù li ha: i clienti non vedrebbero piatti
export const openDaysWithoutMenu = (
  menus: RestaurantMenu[],
  hours: WeeklyHours,
) =>
  WEEKDAYS.filter(
    (d) =>
      openServices(hours[d]).length > 0 &&
      !menus.some((m) => m.days.includes(d)),
  ).map((d) => WEEKDAY_LABELS[d]);

//Id di un menù nuovo (il backend lo conserva così com'è)
export const newMenuId = () => `m-${Date.now()}`;
