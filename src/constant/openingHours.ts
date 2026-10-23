import {
  Service,
  Weekday,
  type ServiceConst,
  type WeekdayConst,
} from "../types/openingHours";

export const WEEKDAYS: WeekdayConst[] = Object.values(Weekday);

export const WEEKDAY_LABELS: Record<WeekdayConst, string> = {
  [Weekday.Mon]: "Lunedì",
  [Weekday.Tue]: "Martedì",
  [Weekday.Wed]: "Mercoledì",
  [Weekday.Thu]: "Giovedì",
  [Weekday.Fri]: "Venerdì",
  [Weekday.Sat]: "Sabato",
  [Weekday.Sun]: "Domenica",
};

export const WEEKDAY_SHORT_LABELS: Record<WeekdayConst, string> = {
  [Weekday.Mon]: "Lun",
  [Weekday.Tue]: "Mar",
  [Weekday.Wed]: "Mer",
  [Weekday.Thu]: "Gio",
  [Weekday.Fri]: "Ven",
  [Weekday.Sat]: "Sab",
  [Weekday.Sun]: "Dom",
};

//Nell'ordine della giornata: pranzo e poi cena
export const SERVICES: ServiceConst[] = Object.values(Service);

export const SERVICE_LABELS: Record<ServiceConst, string> = {
  [Service.Lunch]: "Pranzo",
  [Service.Dinner]: "Cena",
};
