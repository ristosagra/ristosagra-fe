import { Trash2 } from "lucide-react";
import {
  ButtonDimensions,
  LabelTags,
  TextDimensions,
  TextWeight,
} from "../../types/costant";
import type { CartType, Dish } from "../../types/types";
import { ColorVariants } from "../../utils/colors";
import { Button } from "../core/Button";
import { CardContainer } from "../core/CardContainer";
import { Label } from "../core/Label";
import { Counter } from "../Counter";

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
            tag={LabelTags.h3}
            size={TextDimensions.medium}
            color={ColorVariants.text.grayDark}
            weight={TextWeight.semibold}
            noMargin
          />
          {findItemDish ? (
            <Label
              label={`€${dish.price.toFixed(2)} × ${findItemDish.quantity}`}
              tag={LabelTags.p}
              size={TextDimensions.small}
              color={ColorVariants.text.grayMedium}
              noMargin
            />
          ) : (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
              {dish.description}
            </p>
          )}
        </div>
        {findItemDish && (
          <Button
            icon={<Trash2 size={18} />}
            onClick={() => removeItem(findItemDish)}
            dimension={ButtonDimensions.small}
            colorIcon={ColorVariants.text.red}
            bgColor={ColorVariants.bg.transparent}
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <Label
          label={labelPrice}
          tag={LabelTags.h3}
          size={TextDimensions.medium}
          weight={TextWeight.bold}
          color={ColorVariants.text.black}
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
