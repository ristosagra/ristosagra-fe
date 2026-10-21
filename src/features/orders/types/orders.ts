import type { Dish } from "../../../types/menuOrder";
import type { ServiceConst, TimeRange } from "../../../types/openingHours";

export type CartType = { dish: Dish; quantity: number };

export interface MenuProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}

//Tipo di ordine: consumato sul posto oppure da asporto con ritiro in loco
export const OrderType = {
  DineIn: "dinein",
  Takeaway: "takeaway",
} as const;
export type OrderTypeConst = (typeof OrderType)[keyof typeof OrderType];

export interface Order {
  id: number;
  orderNumber: number;
  total: number;
  paid: boolean;
  items: CartType[];
  createdAt: string;
  //se assente l'ordine è sul posto
  type?: OrderTypeConst;
  //nome del cliente (sempre negli ordini dal sito e negli asporti)
  customerName?: string;
  //solo sul posto: tavolo del cliente, se il ristorante fa ordinare dal tavolo
  table?: string;
  //solo asporto: orario di ritiro (HH:MM)
  pickupTime?: string;
  //quando è stato pagato (ISO): col pagamento prima di mangiare la cucina lo prepara da lì
  paidAt?: string;
  //quando la cucina l'ha segnato pronto (ISO); assente = da preparare.
  //Con lo smistamento lo calcola il backend: tutte le righe mandate e tutte le comande pronte
  readyAt?: string;
  //solo con lo smistamento: parti dell'ordine mandate dal capo cucina alle postazioni
  tickets?: StationTicket[];
  //col ritiro al banco: quando è stato consegnato al cliente (ISO)
  deliveredAt?: string;
}

//Tabellone del ritiro al banco: solo i numeri d'ordine (è pubblico)
export interface PickupBoard {
  //in cucina, da chi ha ordinato per primo
  preparing: number[];
  //pronti da ritirare, dall'ultimo pronto
  ready: number[];
}

//Comanda di una postazione: alcune righe di un ordine (indici in items)
export interface StationTicket {
  id: string;
  stationId: string;
  items: number[];
  //quando il capo cucina l'ha mandata (ISO)
  sentAt: string;
  //quando la postazione l'ha preparata (ISO)
  readyAt?: string;
}

//Ordine inviato dal cliente
export interface NewOrder {
  items: CartType[];
  type: OrderTypeConst;
  customerName?: string;
  table?: string;
  pickupTime?: string;
}

//Ordine inviato dal cliente, salvato sul suo telefono con il numero da mostrare alla cassa
//e l'ora di invio (ISO)
export type ConfirmedOrder = NewOrder & {
  orderNumber: number;
  confirmedAt: string;
  //pagato dal sito (pagamento online)
  paidOnline?: boolean;
};

//Ordine creato dalla cassa per un cliente al bancone: può essere già pagato
export interface CashierOrder extends NewOrder {
  paid: boolean;
}

//Risposta all'invio di un ordine dal sito
export interface OrderCreated {
  orderNumber: number;
  //solo con il pagamento online: pagina del servizio di pagamento a cui mandare il cliente
  checkoutUrl?: string;
}

export type Payment = { id: number; paid: boolean };

//Orario di ritiro dell'asporto: unico deciso dal ristorante o scelto dal cliente
export const PickupMode = {
  Fixed: "fixed",
  Custom: "custom",
} as const;
export type PickupModeConst = (typeof PickupMode)[keyof typeof PickupMode];

//L'asporto si ritira nei giorni e nei servizi (pranzo/cena) in cui il locale è aperto
export interface TakeawaySettings {
  //false = niente asporto, qualunque sia il giorno (gli orari restano salvati)
  enabled: boolean;
  mode: PickupModeConst;
  //orario unico di ritiro (HH:MM) del pranzo e della cena, usato con mode "fixed"
  fixedTimes: Record<ServiceConst, string>;
  //fasce in cui il cliente sceglie l'orario di ritiro, usate con mode "custom"
  ranges: Record<ServiceConst, TimeRange>;
}
