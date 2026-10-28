import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ThemeVariants } from "../constant/colors";
import { cn } from "../helpers/cn";
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
  //false = menù solo da guardare, senza pulsanti per aggiungere
  canOrder?: boolean;
  //nel carrello: perché il piatto non si può più ordinare (es. "Esaurito")
  unavailable?: string;
}

//Piatto esaurito: al posto dei pulsanti per aggiungere c'è il motivo (anche nel menù solo
//da guardare)
export const Card = ({
  dish,
  cartItems,
  setCartItems,
  isCart = false,
  canOrder = true,
  unavailable,
}: CardProps) => {
  const [showAllergens, setShowAllergens] = useState(false);
  const cartItem = isCart
    ? cartItems.find((item) => item.dish.id === dish.id)
    : undefined;
  const price = cartItem ? dish.price * cartItem.quantity : dish.price;
  const soldOut = isCart ? unavailable : dish.soldOut ? "Esaurito" : undefined;

  const removeItem = () =>
    setCartItems((prev) => prev.filter((i) => i.dish.id !== dish.id));

  return (
    <CardContainer>
      <div className="flex justify-between items-start gap-3">
        <div className={cn("min-w-0", soldOut && "opacity-60")}>
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
        {soldOut ? (
          <span
            className={cn(
              "shrink-0 px-4 py-2 text-sm font-bold",
              ThemeVariants.borderRadius.full,
              ThemeVariants.colors.border.all.danger,
              ThemeVariants.colors.text.danger,
            )}
          >
            {soldOut}
          </span>
        ) : (
          canOrder && (
            <Counter
              dish={dish}
              cartItems={cartItems}
              setCartItems={setCartItems}
            />
          )
        )}
      </div>
    </CardContainer>
  );
};
