export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

export type CartType = { dish: Dish; quantity: number };

export interface CartProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}

export interface setCartProps {
  dish: Dish;
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}

export interface MenuProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}
