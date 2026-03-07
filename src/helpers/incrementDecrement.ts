import type { CartType, Dish } from "../features/orders/types/orders";

interface CounterFunctionsProps {
  dish: Dish;
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
}

export const incrementFunction = ({
  dish,
  setCartItems,
}: CounterFunctionsProps) => {
  setCartItems((prev) => {
    const existing = prev.find((i) => i.dish.id === dish.id);
    if (existing)
      return prev.map((i) =>
        i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i,
      );
    return [...prev, { dish, quantity: 1 }];
  });
};

export const decrementFunction = ({
  dish,
  setCartItems,
}: CounterFunctionsProps) => {
  setCartItems((prev) => {
    const existing = prev.find((i) => i.dish.id === dish.id);
    if (!existing) return prev;
    if (existing.quantity === 1)
      return prev.filter((i) => i.dish.id !== dish.id);
    return prev.map((i) =>
      i.dish.id === dish.id ? { ...i, quantity: i.quantity - 1 } : i,
    );
  });
};
