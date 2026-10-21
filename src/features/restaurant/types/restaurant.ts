import type { WeeklyHours } from "../../../types/openingHours";

//Tema del sito, scelto dal ristorante e usato anche dai clienti
export const RestaurantTheme = {
  Dark: "dark",
  Light: "light",
} as const;

export type RestaurantThemeConst =
  (typeof RestaurantTheme)[keyof typeof RestaurantTheme];

//Colore delle parti colorate (pulsanti, titoli, prezzi...), scelto da una palette
export const BrandColor = {
  Orange: "orange",
  Red: "red",
  Pink: "pink",
  Violet: "violet",
  Blue: "blue",
  Teal: "teal",
  Green: "green",
  Brown: "brown",
} as const;

export type BrandColorConst = (typeof BrandColor)[keyof typeof BrandColor];

//Cosa possono fare i clienti dal sito
export const OrderingMode = {
  //vedono solo il menù: ordinano e pagano alla cassa, che crea l'ordine
  MenuOnly: "menuOnly",
  //ordinano dal sito e pagano alla cassa
  PayAtCashier: "payAtCashier",
  //ordinano e pagano dal sito: la cassa vede gli ordini in sola lettura
  PayOnline: "payOnline",
} as const;

export type OrderingModeConst =
  (typeof OrderingMode)[keyof typeof OrderingMode];

//Quando si paga alla cassa (con MenuOnly e PayAtCashier)
export const PaymentTiming = {
  //tipo ristorante: si ordina al tavolo, la cucina prepara subito e si paga a fine pasto
  AfterMeal: "afterMeal",
  //tipo sagra: si paga subito alla cassa e solo dopo l'ordine arriva in cucina
  BeforeMeal: "beforeMeal",
} as const;

export type PaymentTimingConst =
  (typeof PaymentTiming)[keyof typeof PaymentTiming];

//Come arriva l'ordine al cliente
export const ServiceMode = {
  //lo portano al tavolo (cercando il tavolo o il numero del bigliettino)
  Table: "table",
  //il cliente lo ritira al banco quando il suo numero è pronto
  Counter: "counter",
} as const;

export type ServiceModeConst = (typeof ServiceMode)[keyof typeof ServiceMode];

//Col ritiro al banco: come si avvisa che un numero è pronto
export const PickupCall = {
  //su uno schermo (pagina /pronti aperta su una TV o un monitor)
  Screen: "screen",
  //chi è al banco chiama il numero a voce
  Voice: "voice",
} as const;

export type PickupCallConst = (typeof PickupCall)[keyof typeof PickupCall];

//Postazione della cucina (es. Primi, Griglia, Bar) a cui il capo cucina manda le comande
export interface KitchenStation {
  id: string;
  name: string;
}

//Dati del profilo del ristorante mostrati a cassa e clienti
export interface RestaurantProfile {
  name: string;
  theme: RestaurantThemeConst;
  brandColor: BrandColorConst;
  //giorni e orari di apertura: le prenotazioni dei clienti devono starci dentro
  openingHours: WeeklyHours;
  orderingMode: OrderingModeConst;
  //tipo ristorante o tipo sagra (non con PayOnline)
  paymentTiming: PaymentTimingConst;
  //i clienti ordinano seduti al tavolo e l'ordine riporta il tavolo (non con MenuOnly né tipo sagra)
  tableOrdering: boolean;
  //il tavolo arriva dal QR code inquadrato invece di essere scritto (solo con tableOrdering)
  tableQrCode: boolean;
  //portato al tavolo o ritiro al banco, e col banco come si chiama il numero
  serviceMode: ServiceModeConst;
  pickupCall: PickupCallConst;
  //le comande arrivano al capo cucina, che le manda alle postazioni
  kitchenDispatch: boolean;
  kitchenStations: KitchenStation[];
}

export type RestaurantProfileUpdate = Partial<RestaurantProfile>;

//Lunghezza massima del nome, perché stia nella barra in alto
export const RESTAURANT_NAME_MAX = 40;

export const STATION_NAME_MAX = 30;
