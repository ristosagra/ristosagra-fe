import {
  SERVICE_LABELS,
  SERVICES,
  WEEKDAYS,
} from "../../../constant/openingHours";
import {
  isWithinRanges,
  openServices,
  rangesError,
  todayWeekday,
} from "../../../helpers/openingHours";
import type { TimeRange, WeeklyHours } from "../../../types/openingHours";
import { PickupMode, type TakeawaySettings } from "../types/orders";

//Fasce di ritiro non valide: contano solo con l'asporto attivo e l'orario scelto dal cliente
export const takeawayError = (settings: TakeawaySettings): string | null =>
  !settings.enabled || settings.mode === PickupMode.Fixed
    ? null
    : rangesError(SERVICES.map((s) => settings.ranges[s]));

//Asporto ancora possibile oggi (now HH:MM): il primo servizio aperto di oggi in cui si può
//ritirare, con l'orario unico finché non è passato, altrimenti fino alla fine della sua fascia.
//Null se l'asporto è spento o oggi non resta un servizio. Lo usano clienti e cassa
export interface TakeawaySlot {
  //orario unico di ritiro del servizio (mode "fixed")
  fixedTime: string | null;
  //fasce in cui scegliere l'orario (mode "custom"): quelle dei servizi aperti oggi
  ranges: TimeRange[];
}

export const takeawayToday = (
  hours: WeeklyHours,
  takeaway: TakeawaySettings | undefined,
  now: string,
): TakeawaySlot | null => {
  if (!takeaway?.enabled) return null;
  const services = openServices(hours[todayWeekday()]);
  const isFixed = takeaway.mode === PickupMode.Fixed;
  const service = services.find(
    (s) => now <= (isFixed ? takeaway.fixedTimes[s] : takeaway.ranges[s].to),
  );
  if (!service) return null;
  return {
    fixedTime: isFixed ? takeaway.fixedTimes[service] : null,
    ranges: services.map((s) => takeaway.ranges[s]),
  };
};

//Orario di ritiro valido per oggi: quello unico, oppure dentro le fasce e non già passato
export const pickupTimeValid = (
  slot: TakeawaySlot,
  time: string | undefined,
  now: string,
) =>
  slot.fixedTime
    ? time === slot.fixedTime
    : !!time && isWithinRanges(slot.ranges, time) && time >= now;

//Servizi in cui gli orari di ritiro escono dall'apertura del locale in qualche giorno
//(es. ritiro alle 15:30 ma il pranzo chiude alle 15:00): si avvisa, non si blocca
export const takeawayOutsideHours = (
  settings: TakeawaySettings,
  hours: WeeklyHours,
): string[] =>
  !settings.enabled
    ? []
    : SERVICES.filter((s) =>
        WEEKDAYS.some((d) => {
          if (!openServices(hours[d]).includes(s)) return false;
          const open = hours[d][s];
          return settings.mode === PickupMode.Fixed
            ? !isWithinRanges([open], settings.fixedTimes[s])
            : settings.ranges[s].from < open.from ||
                settings.ranges[s].to > open.to;
        }),
      ).map((s) => SERVICE_LABELS[s].toLowerCase());
