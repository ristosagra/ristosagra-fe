import { Plus } from "lucide-react";
import type { Dish, MenuProps } from "../types/types";
import { decrementFunction, incrementFunction } from "../utils/functions";
import { Button } from "./core/Button";
import { CounterCard } from "./core/CounterCard";
import { ButtonDimensions } from "../types/costant";
import { Colors } from "../utils/colors";

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
      icon={<Plus size={14} />}
      onClick={increment}
      dimension={ButtonDimensions.label}
      bgColor={Colors.bg.grayDark}
      label="Aggiungi"
    />
  );
}