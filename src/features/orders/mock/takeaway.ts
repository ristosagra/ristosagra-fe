import { createMockStore } from "../../../mock/store";
import { PickupMode, type TakeawaySettings } from "../types/orders";

const DEFAULT_TAKEAWAY: TakeawaySettings = {
  enabled: true,
  mode: PickupMode.Custom,
  fixedTimes: { lunch: "12:30", dinner: "19:30" },
  ranges: {
    lunch: { from: "12:00", to: "14:30" },
    dinner: { from: "19:00", to: "22:30" },
  },
};

//Impostazioni dell'asporto finte, salvate nel browser (le leggono anche ordini e personale)
export const takeawayStore = createMockStore<TakeawaySettings>(
  "takeaway",
  () => DEFAULT_TAKEAWAY,
);

//le impostazioni salvate prima di alcuni campi (pranzo e cena, attivo/disattivo) non li hanno: si usano quelli predefiniti
export const readTakeaway = (): TakeawaySettings => {
  const { enabled, mode, fixedTimes, ranges } = {
    ...DEFAULT_TAKEAWAY,
    ...takeawayStore.get(),
  };
  return { enabled, mode, fixedTimes, ranges };
};
