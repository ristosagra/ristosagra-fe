import { Plus } from "lucide-react";
import { Button } from "./core/Button";
import { CounterCard } from "./core/CounterCard";
import type { MenuProps } from "../features/orders/types/orders";
import {
  decrementFunction,
  incrementFunction,
} from "../helpers/incrementDecrement";
import { ButtonDimensions } from "../constant/button";
import type { Dish } from "../types/menuOrder";
import { ThemeVariants } from "../constant/colors";

export const Counter = ({
  dish,
  cartItems,
  setCartItems,
}: { dish: Dish } & MenuProps) => {
  const item = cartItems.find((i) => i.dish.id === dish.id);
  const quantity = item?.quantity ?? 0;

  const increment = () => incrementFunction({ dish, setCartItems });
  const decrement = () => decrementFunction({ dish, setCartItems });

  return quantity > 0 ? (
    <CounterCard
      quantity={quantity}
      increment={increment}
      decrement={decrement}
    />
  ) : (
    <Button
      iconLeft={<Plus size={14} />}
      onClick={increment}
      dimension={ButtonDimensions.auto}
      label="Aggiungi"
      variant="secondary"
      className={`px-5 py-3 ${ThemeVariants.colors.border.all.brand}`}
    />
  );
};
