import { createMockStore, fakeDelay } from "../../../mock/store";
import { DEFAULT_APPEARANCE } from "../constant/brandColors";
import { sameEveryDay } from "../../../helpers/openingHours";
import type {
  RestaurantProfile,
  RestaurantProfileUpdate,
} from "../types/restaurant";

//Aperto tutti i giorni a pranzo e a cena
const DEFAULT_OPENING_HOURS = sameEveryDay({
  open: true,
  lunch: { open: true, from: "12:00", to: "15:00" },
  dinner: { open: true, from: "19:00", to: "23:00" },
});

const DEFAULT_PROFILE: RestaurantProfile = {
  name: "Ristosagra",
  ...DEFAULT_APPEARANCE,
  openingHours: DEFAULT_OPENING_HOURS,
};

const restaurantStore = createMockStore<RestaurantProfile>(
  "restaurant",
  () => DEFAULT_PROFILE,
);

//i profili salvati prima di tema, colore e orari non li hanno: si usano quelli predefiniti
const readProfile = (): RestaurantProfile => ({
  ...DEFAULT_PROFILE,
  ...restaurantStore.get(),
});

export const fakeRestaurantApi = {
  getProfile: async (): Promise<RestaurantProfile> => {
    await fakeDelay(300);
    return readProfile();
  },

  updateProfile: async (
    changes: RestaurantProfileUpdate,
  ): Promise<RestaurantProfile> => {
    await fakeDelay();
    const updated = { ...readProfile(), ...changes };
    restaurantStore.set(updated);
    return updated;
  },
};
