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
  //solo asporto: nome del cliente e orario di ritiro (HH:MM)
  customerName?: string;
  pickupTime?: string;
}

//Ordine inviato dal cliente
export interface NewOrder {
  items: CartType[];
  type: OrderTypeConst;
  customerName?: string;
  pickupTime?: string;
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
  mode: PickupModeConst;
  //orario unico di ritiro (HH:MM) del pranzo e della cena, usato con mode "fixed"
  fixedTimes: Record<ServiceConst, string>;
  //fasce in cui il cliente sceglie l'orario di ritiro, usate con mode "custom"
  ranges: Record<ServiceConst, TimeRange>;
}
