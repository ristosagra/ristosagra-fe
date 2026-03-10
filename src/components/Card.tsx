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
  const findItemDish = isCart
    ? cartItems.find((item) => item.dish.id === dish.id)!
    : undefined;
  const subtotal = dish.price * (findItemDish?.quantity || 0);
  const labelPrice = isCart
    ? `€${subtotal.toFixed(2)}`
    : `€${dish.price.toFixed(2)}`;

  const removeItem = (item: CartType) => {
    setCartItems((prev) => prev.filter((i) => i.dish.id !== item.dish.id));
  };

  return (
    <CardContainer key={dish.id}>
      <div className="flex justify-between items-start gap-3">
        <div>
          <Label
            label={`${dish.name}`}
            tag={LabelTags.h2}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.semibold}
            noMargin
          />
          {findItemDish ? (
            <Label
              label={`€${dish.price.toFixed(2)} × ${findItemDish.quantity}`}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              color={ThemeVariants.colors.text.secondary}
              noMargin
            />
          ) : (
            <Label
              tag={LabelTags.h3}
              label={dish.description}
              size={LabelDimensions.medium}
              color={ThemeVariants.colors.text.secondary}
              noMargin
            />
          )}
        </div>
        {findItemDish && (
          <Button
            iconLeft={
              <Trash2 size={18} color={`${ThemeVariants.raw.danger}`} />
            }
            onClick={() => removeItem(findItemDish)}
            dimension={ButtonDimensions.small}
            variant="icon"
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label
          label={labelPrice}
          tag={LabelTags.h3}
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
