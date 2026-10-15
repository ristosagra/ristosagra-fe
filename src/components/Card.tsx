import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ThemeVariants } from "../constant/colors";
import { Button } from "./core/Button";
import { CardContainer } from "./core/CardContainer";
import { Label } from "./core/Label";
import { Counter } from "./Counter";
import type { CartType } from "../features/orders/types/orders";
import { LabelDimensions, LabelTags, LabelWeight } from "../constant/label";
import { ButtonDimensions } from "../constant/button";
import type { Dish } from "../types/menuOrder";
import {
  AllergenChips,
  AllergensToggle,
} from "../features/menu/components/DishAllergens";

interface CardProps {
  dish: Dish;
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
  isCart?: boolean;
}

export const Card = ({
  dish,
  cartItems,
  setCartItems,
  isCart = false,
}: CardProps) => {
  const [showAllergens, setShowAllergens] = useState(false);
  const cartItem = isCart
    ? cartItems.find((item) => item.dish.id === dish.id)
    : undefined;
  const price = cartItem ? dish.price * cartItem.quantity : dish.price;

  const removeItem = () =>
    setCartItems((prev) => prev.filter((i) => i.dish.id !== dish.id));

  return (
    <CardContainer>
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <Label
            label={dish.name}
            tag={LabelTags.h3}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.semibold}
            additionalClasses="max-sm:text-xl [overflow-wrap:anywhere]"
            noMargin
          />
          <Label
            tag={LabelTags.p}
            label={
              cartItem
                ? `€${dish.price.toFixed(2)} × ${cartItem.quantity}`
                : dish.description
            }
            size={LabelDimensions.medium}
            color={ThemeVariants.colors.text.secondary}
            additionalClasses="max-sm:text-sm"
            noMargin
          />
        </div>
        {cartItem && (
          <Button
            iconLeft={
              <Trash2 size={18} color={`${ThemeVariants.raw.danger}`} />
            }
            onClick={removeItem}
            dimension={ButtonDimensions.small}
            variant="icon"
            className="shrink-0"
            ariaLabel={`Togli ${dish.name} dal carrello`}
          />
        )}
        {/* Nel menù la freccia apre il dettaglio del piatto con gli allergeni */}
        {!isCart && (
          <AllergensToggle
            open={showAllergens}
            onToggle={() => setShowAllergens((o) => !o)}
          />
        )}
      </div>
      {!isCart && showAllergens && <AllergenChips allergens={dish.allergens} />}
      <div className="flex items-center justify-between gap-3">
        <Label
          label={`€${price.toFixed(2)}`}
          tag={LabelTags.p}
          size={LabelDimensions.large}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.brand}
          noMargin
        />
        <Counter
          dish={dish}
          cartItems={cartItems}
          setCartItems={setCartItems}
        />
      </div>
    </CardContainer>
  );
};
