import type { Dish } from "../../../types/menuOrder";

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

export interface TakeawaySettings {
  mode: PickupModeConst;
  //orario unico di ritiro (HH:MM), usato con mode "fixed"
  fixedTime: string;
}
