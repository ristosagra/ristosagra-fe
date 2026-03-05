import type { CartType } from "../types/types";
import { Container } from "../components/core/Container";
import {
  ButtonDimensions,
  LabelTags,
  PagesCustomer,
  TextDimensions,
  TextWeight,
  type PagesCustomerConst,
} from "../types/costant";
import { Label } from "../components/core/Label";
import { Card } from "../components/Card/Card";
import { Button } from "../components/core/Button";
import { type Dispatch, type SetStateAction } from "react";
import { Loader } from "../components/core/Loader";
import { ColorVariants } from "../utils/colors";
import { useOrderNumber } from "../hooks/useOrders";

interface CartProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
  setPage: Dispatch<SetStateAction<PagesCustomerConst>>;
  setOrderNumber: React.Dispatch<React.SetStateAction<number | null>>;
  setConfirmedCart: React.Dispatch<React.SetStateAction<CartType[]>>;
}

export default function Cart({
  cartItems,
  setCartItems,
  setPage,
  setOrderNumber,
  setConfirmedCart,
}: CartProps) {
  const { mutate: confirmOrder, isPending } = useOrderNumber();

  const total = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0,
  );

  if (cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center px-2 py-6 rounded-2xl w-full bg-gray-900">
        <Label
          label="Il carrello è vuoto"
          tag={LabelTags.p}
          size={TextDimensions.large}
          weight={TextWeight.bold}
          color={ColorVariants.text.white}
          noMargin
        />
      </div>
    );
  }

  const handleConfirm = async () => {
    confirmOrder(cartItems, {
      onSuccess: ({ orderNumber }) => {
        setConfirmedCart(cartItems);
        setCartItems([]);
        setOrderNumber(orderNumber);
        setPage(PagesCustomer.RESERVATION);
      },
    });
  };

  return (
    <Container additionalClass="px-5 py-7">
      {isPending && <Loader />}

      <div className="space-y-3">
        {cartItems.map((item) => (
          <Card
            key={item.dish.id}
            dish={item.dish}
            cartItems={cartItems}
            setCartItems={setCartItems}
            isCart
          />
        ))}
      </div>

      <div className="space-y-3 mt-3">
        <div className="bg-black p-4 rounded-2xl flex justify-between items-center">
          <Label
            label="Totale"
            tag={LabelTags.h3}
            size={TextDimensions.large}
            noMargin
            weight={TextWeight.bold}
          />
          <Label
            label={`€${total.toFixed(2)}`}
            tag={LabelTags.h3}
            size={TextDimensions.large}
            noMargin
            weight={TextWeight.bold}
          />
        </div>

        <Button
          label="Prenota ordine"
          fullWidth
          borderColor={ColorVariants.border.black}
          dimension={ButtonDimensions.large}
          onClick={handleConfirm}
          colorLabel={ColorVariants.text.black}
        />
      </div>
    </Container>
  );
}
