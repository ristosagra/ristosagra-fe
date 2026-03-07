import type { CartType } from "../features/orders/types/orders";

export const calcTotal = (cartItems: CartType[]): number =>
  cartItems.reduce((acc, item) => acc + item.dish.price * item.quantity, 0);
