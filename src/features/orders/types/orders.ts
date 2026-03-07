import type { Dish } from "../../../types/menuOrder";

export type CartType = { dish: Dish; quantity: number };

export interface MenuProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}

export interface Order {
  id: number;
  orderNumber: number;
  total: number;
  paid: boolean;
  items: CartType[];
  createdAt: string;
}

export type Payment = { id: number; paid: boolean };
