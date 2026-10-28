import { createMockStore, fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { DEFAULT_APPEARANCE, toBrandHex } from "../constant/brandColors";
import { sameEveryDay, weeklyHoursValid } from "../../../helpers/openingHours";
import { WEEKDAYS } from "../../../constant/openingHours";
import { kitchenSettingsError } from "../../kitchen/utils/kitchenSettings";
import { requireManager } from "../../staff/mock/auth";
import { isSagraActive } from "../../platform/mock/billingStore";
import {
  OrderingMode,
  PaymentTiming,
  PickupCall,
  RESTAURANT_NAME_MAX,
  RestaurantTheme,
  ServiceMode,
  STATION_NAME_MAX,
  type RestaurantProfile,
  type RestaurantProfileUpdate,
} from "../types/restaurant";

//Aperto tutti i giorni a pranzo e a cena
const DEFAULT_OPENING_HOURS = sameEveryDay({
  open: true,
  lunch: { open: true, from: "12:00", to: "15:00" },
  dinner: { open: true, from: "19:00", to: "23:00" },
});

//Profilo salvato: l'attivazione non c'è, la calcola isSagraActive dal pagamento
type StoredProfile = Omit<RestaurantProfile, "active">;

const DEFAULT_PROFILE: StoredProfile = {
  name: "Ristosagra",
  ...DEFAULT_APPEARANCE,
  openingHours: DEFAULT_OPENING_HOURS,
  orderingMode: OrderingMode.PayAtCashier,
  paymentTiming: PaymentTiming.AfterMeal,
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

export const restaurantStore = createMockStore<StoredProfile>(
  "restaurant",
  () => DEFAULT_PROFILE,
);

//i profili salvati prima di alcune impostazioni (tema, orari, ordini...) non le hanno: si usano quelle predefinite.
//Lo usano anche gli altri dati finti, che seguono le regole scelte dal ristorante.
//L'attivazione dipende dal pagamento dell'edizione, non da quello che è salvato
export const readProfile = (): RestaurantProfile => ({
  ...DEFAULT_PROFILE,
  ...restaurantStore.get(),
  active: isSagraActive(),
});

//Senza l'attivazione: non si salva nel profilo e non si cambia dal profilo
const withoutActive = (
  p: RestaurantProfile | RestaurantProfileUpdate,
): Partial<RestaurantProfile> => {
  const copy: Partial<RestaurantProfile> = { ...p };
  delete copy.active;
  return copy;
};

const isOneOf = (values: object, v: unknown) =>
  v === undefined || Object.values(values).includes(v);

//Profilo valido dopo le modifiche (vedi API.md): il backend deve rifiutare il resto con 400
const profileValid = (p: RestaurantProfile) => {
  const name = p.name.trim();
  return (
    name.length > 0 &&
    name.length <= RESTAURANT_NAME_MAX &&
    isOneOf(RestaurantTheme, p.theme) &&
    toBrandHex(p.brandColor) !== null &&
    isOneOf(OrderingMode, p.orderingMode) &&
    isOneOf(PaymentTiming, p.paymentTiming) &&
    isOneOf(ServiceMode, p.serviceMode) &&
    isOneOf(PickupCall, p.pickupCall) &&
    WEEKDAYS.every((d) => p.openingHours[d]) &&
    weeklyHoursValid(p.openingHours) &&
    p.kitchenStations.every((s) => s.name.trim().length <= STATION_NAME_MAX) &&
    kitchenSettingsError(p.kitchenDispatch, p.kitchenStations) === null
  );
};

export const fakeRestaurantApi = {
  getProfile: async (): Promise<RestaurantProfile> => {
    await fakeDelay(300);
    return readProfile();
  },

  updateProfile: async (
    changes: RestaurantProfileUpdate,
  ): Promise<RestaurantProfile> => {
    await fakeDelay();
    requireManager();
    const updated = { ...readProfile(), ...withoutActive(changes) };
    if (!profileValid(updated)) throw new HttpError(400);
    restaurantStore.set(withoutActive(updated) as StoredProfile);
    return updated;
  },
};
