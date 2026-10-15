import { createMockStore, fakeDelay } from "../../../mock/store";
import { DEFAULT_APPEARANCE } from "../constant/brandColors";
import type {
  RestaurantProfile,
  RestaurantProfileUpdate,
} from "../types/restaurant";

const restaurantStore = createMockStore<RestaurantProfile>(
  "restaurant",
  () => ({ name: "Ristosagra", ...DEFAULT_APPEARANCE }),
);

//i profili salvati prima di tema e colore non li hanno: si usano quelli predefiniti
const readProfile = (): RestaurantProfile => ({
  ...DEFAULT_APPEARANCE,
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
