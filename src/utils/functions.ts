import type { setCartProps } from "../types/types";

export const incrementFunction = ({ dish, setCartItems }: setCartProps) => {
  setCartItems((prev) => {
    const existing = prev.find((i) => i.dish.id === dish.id);
    if (existing)
      return prev.map((i) =>
        i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i,
      );
    return [...prev, { dish, quantity: 1 }];
  });
};

export const decrementFunction = ({ dish, setCartItems }: setCartProps) => {
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
