import { Plus } from "lucide-react";
import { Button } from "./core/Button";
import { CounterCard } from "./core/CounterCard";
import { ColorVariants } from "../constant/colors";
import type { Dish, MenuProps } from "../types/orders";
import {
  decrementOrderFunction,
  incrementOrderFunction,
} from "../helpers/orders";
import { ButtonDimensions } from "../constant/button";

export const Counter = ({
  dish,
  cartItems,
  setCartItems,
}: { dish: Dish } & MenuProps) => {
  const item = cartItems.find((i) => i.dish.id === dish.id);
  const quantity = item?.quantity ?? 0;

  const increment = () => incrementOrderFunction({ dish, setCartItems });
  const decrement = () => decrementOrderFunction({ dish, setCartItems });

  return quantity > 0 ? (
    <CounterCard
      quantity={quantity}
      increment={increment}
      decrement={decrement}
    />
  ) : (
    <Button
      icon={<Plus size={14} />}
      onClick={increment}
      dimension={ButtonDimensions.label}
      bgColor={ColorVariants.bg.grayDark}
      label="Aggiungi"
      colorIcon={ColorVariants.text.white}
    />
  );
};
