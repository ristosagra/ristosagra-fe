import { SERVICES } from "../../../constant/openingHours";
import { rangesError } from "../../../helpers/openingHours";
import { PickupMode, type TakeawaySettings } from "../types/orders";

//Fasce di ritiro non valide: contano solo con l'asporto attivo e l'orario scelto dal cliente
export const takeawayError = (settings: TakeawaySettings): string | null =>
  !settings.enabled || settings.mode === PickupMode.Fixed
    ? null
    : rangesError(SERVICES.map((s) => settings.ranges[s]));
