import { SERVICES, WEEKDAYS } from "../constant/openingHours";
import type {
  DayHours,
  ServiceConst,
  ServiceHours,
  TimeRange,
  WeekdayConst,
  WeeklyHours,
} from "../types/openingHours";

//Giorno della settimana di oggi (getDay parte dalla domenica)
export const todayWeekday = (date = new Date()): WeekdayConst =>
  WEEKDAYS[(date.getDay() + 6) % 7];

//Stessi orari per tutti i giorni della settimana
export const sameEveryDay = (day: DayHours): WeeklyHours =>
  Object.fromEntries(WEEKDAYS.map((d) => [d, day])) as WeeklyHours;

//Servizi aperti in un giorno, nell'ordine della giornata
export const openServices = (day: DayHours): ServiceConst[] =>
  day.open ? SERVICES.filter((s) => day[s].open) : [];

//Orari dei servizi aperti in un giorno, nell'ordine della giornata
export const openRanges = (day: DayHours): ServiceHours[] =>
  openServices(day).map((s) => day[s]);

//Orario (HH:MM) dentro una delle fasce, estremi compresi
export const isWithinRanges = (ranges: TimeRange[], time: string) =>
  ranges.some((r) => r.from <= time && time <= r.to);

//Es. "12:00–15:00 · 19:00–23:00"
export const formatRanges = (ranges: TimeRange[]) =>
  ranges.map((r) => `${r.from}–${r.to}`).join(" · ");

//Fasce non valide (nell'ordine della giornata): fine prima dell'inizio o pranzo che si sovrappone alla cena
export const rangesError = (ranges: TimeRange[]): string | null => {
  if (ranges.some((r) => r.from >= r.to))
    return "L'orario di fine deve essere dopo quello di inizio";
  if (ranges.some((r, i) => i > 0 && ranges[i - 1].to > r.from))
    return "Il pranzo deve finire prima che inizi la cena";
  return null;
};

export const dayHoursError = (day: DayHours) => rangesError(openRanges(day));

export const weeklyHoursValid = (hours: WeeklyHours) =>
  WEEKDAYS.every((d) => dayHoursError(hours[d]) === null);
