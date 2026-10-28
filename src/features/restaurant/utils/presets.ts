import { StaffRole, type StaffRoleConst } from "../../staff/types/staff";
import {
  OrderingMode,
  PaymentTiming,
  PickupCall,
  ServiceMode,
  type RestaurantProfile,
} from "../types/restaurant";
import { customerAsksTable, paysBeforeKitchen } from "./ordering";

//Modi già pronti di far funzionare la festa: scegliendone uno nel profilo si compilano tutte le
//impostazioni di ordini, consegna, pagamento, cucina e asporto, che poi restano modificabili una
//per una. Il backend non li conosce: riceve solo le impostazioni
export const FestPreset = {
  //si paga alla cassa prima di mangiare e si ritira al banco quando il numero è pronto
  Sagra: "sagra",
  //si paga alla cassa prima di mangiare e i volontari portano l'ordine al tavolo
  SagraTable: "sagraTable",
  //si ordina al tavolo (cameriere o telefono) e si paga a fine pasto
  Restaurant: "restaurant",
} as const;

export type FestPresetConst = (typeof FestPreset)[keyof typeof FestPreset];

//Impostazioni del profilo che un modo già pronto decide
export type PresetSettings = Pick<
  RestaurantProfile,
  | "orderingMode"
  | "paymentTiming"
  | "serviceMode"
  | "tableQrCode"
  | "kitchenDispatch"
> &
  Partial<Pick<RestaurantProfile, "pickupCall">>;

export interface Preset {
  id: FestPresetConst;
  label: string;
  description: string;
  badge?: string;
  settings: PresetSettings;
  //asporto attivo
  takeaway: boolean;
  //ruoli che servono, per ricordare chi creare in Personale
  roles: StaffRoleConst[];
}

//Il primo è quello consigliato per la prima edizione: tutto il resto spento (niente ordini dal
//telefono, QR code, smistamento in cucina e asporto). Il ristorante è com'era il sito all'inizio
export const PRESETS: Preset[] = [
  {
    id: FestPreset.Sagra,
    label: "Sagra: si paga prima, ritiro al banco",
    badge: "Consigliato",
    description:
      "In fila si guarda il menù sul telefono; alla cassa si ordina, si paga e si riceve il bigliettino col numero. Quando è pronto il numero compare sullo schermo Pronti e si ritira al banco. Niente asporto, la cucina lavora con i bigliettini",
    settings: {
      orderingMode: OrderingMode.MenuOnly,
      paymentTiming: PaymentTiming.BeforeMeal,
      serviceMode: ServiceMode.Counter,
      pickupCall: PickupCall.Screen,
      tableQrCode: false,
      kitchenDispatch: false,
    },
    takeaway: false,
    roles: [StaffRole.Cashier, StaffRole.Kitchen, StaffRole.Counter],
  },
  {
    id: FestPreset.SagraTable,
    label: "Sagra con servizio al tavolo",
    description:
      "Come la sagra, ma dopo aver pagato ci si siede col bigliettino e i volontari portano l'ordine al tavolo cercando il numero. Niente asporto, la cucina lavora con i bigliettini",
    settings: {
      orderingMode: OrderingMode.MenuOnly,
      paymentTiming: PaymentTiming.BeforeMeal,
      serviceMode: ServiceMode.Table,
      tableQrCode: false,
      kitchenDispatch: false,
    },
    takeaway: false,
    roles: [StaffRole.Cashier, StaffRole.Kitchen],
  },
  {
    id: FestPreset.Restaurant,
    label: "Ristorante",
    description:
      "Si ordina seduti, dal cameriere o dal telefono scrivendo il tavolo; la cucina prepara subito e si paga alla cassa a fine pasto (conti per tavolo). Con l'asporto, consegnato al banco",
    settings: {
      orderingMode: OrderingMode.PayAtCashier,
      paymentTiming: PaymentTiming.AfterMeal,
      serviceMode: ServiceMode.Table,
      tableQrCode: false,
      kitchenDispatch: false,
    },
    takeaway: true,
    roles: [
      StaffRole.Cashier,
      StaffRole.Waiter,
      StaffRole.Kitchen,
      StaffRole.Counter,
    ],
  },
];

//Il QR code conta solo quando l'ordine riporta il tavolo (vedi customerAsksTable)
const usesQrCode = (p: PresetSettings) => customerAsksTable(p) && p.tableQrCode;

//Modo già pronto che corrisponde alle impostazioni (null = scelte fatte a mano). Si guarda a come
//funziona davvero, non ai valori salvati che non valgono con le altre scelte (es. il momento del
//pagamento col ritiro al banco); come si chiama il numero pronto (schermo o voce) non conta
export const presetOf = (
  profile: PresetSettings,
  takeawayEnabled: boolean,
): Preset | null =>
  PRESETS.find(
    ({ settings, takeaway }) =>
      settings.orderingMode === profile.orderingMode &&
      settings.serviceMode === profile.serviceMode &&
      paysBeforeKitchen(settings) === paysBeforeKitchen(profile) &&
      usesQrCode(settings) === usesQrCode(profile) &&
      settings.kitchenDispatch === !!profile.kitchenDispatch &&
      takeaway === takeawayEnabled,
  ) ?? null;
