import { createMockStore, fakeDelay } from "../../../mock/store";
import { DEFAULT_APPEARANCE } from "../constant/brandColors";
import { sameEveryDay } from "../../../helpers/openingHours";
import {
  OrderingMode,
  PaymentTiming,
  PickupCall,
  ServiceMode,
  type RestaurantProfile,
  type RestaurantProfileUpdate,
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
  orderingMode: OrderingMode.PayAtCashier,
  paymentTiming: PaymentTiming.AfterMeal,
  tableOrdering: false,
  tableQrCode: false,
  serviceMode: ServiceMode.Table,
  pickupCall: PickupCall.Screen,
  //postazioni già pronte per provare lo smistamento (si attiva dal profilo)
  kitchenDispatch: false,
  kitchenStations: [
    { id: "st-primi", name: "Primi" },
    { id: "st-griglia", name: "Griglia" },
    { id: "st-bar", name: "Bar" },
  ],
};

const restaurantStore = createMockStore<RestaurantProfile>(
  "restaurant",
  () => DEFAULT_PROFILE,
);

//i profili salvati prima di alcune impostazioni (tema, orari, ordini...) non le hanno: si usano quelle predefinite.
//Lo usano anche gli ordini finti, che seguono le regole scelte dal ristorante
export const readProfile = (): RestaurantProfile => ({
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
