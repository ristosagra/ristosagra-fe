import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Card } from "../../components/Card";
import { Button } from "../../components/core/Button";
import { type Dispatch, type SetStateAction } from "react";
import { Loader } from "../../components/core/Loader";
import { ColorVariants } from "../../constant/colors";
import { useOrderNumber } from "../../features/orders/hook/useOrders";
import type { CartType } from "../../features/orders/types/orders";
import { ButtonDimensions } from "../../constant/button";
import { type PagesCustomerConst, PagesCustomer } from "../../constant/pages";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";

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

  const total = calcTotal(cartItems);

  if (cartItems.length === 0) {
    return (
      <div className="flex justify-center items-center px-2 py-6 rounded-2xl w-full bg-gray-900 mx-10">
        <Label
          label="Il carrello è vuoto"
          tag={LabelTags.p}
          size={LabelDimensions.large}
          weight={LabelWeight.bold}
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
            size={LabelDimensions.large}
            noMargin
            weight={LabelWeight.bold}
          />
          <Label
            label={`€${total.toFixed(2)}`}
            tag={LabelTags.h3}
            size={LabelDimensions.large}
            noMargin
            weight={LabelWeight.bold}
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
