import { useState } from "react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { ColorVariants } from "../../constant/colors";
import type { CartType } from "../../features/orders/types/orders";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";

interface ReservationProps {
  cartItems: CartType[];
  orderNumber: number;
}

export const Reservation = ({ cartItems, orderNumber }: ReservationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const total = calcTotal(cartItems);

  return (
    <Container>
      <div className="min-h-full flex flex-col justify-center items-center py-10 px-10">
        {/* Numero ordine */}
        <div className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl py-10 w-full gap-2">
          <Label
            label="Il tuo numero ordine è"
            tag={LabelTags.p}
            size={LabelDimensions.medium}
            color={ColorVariants.text.white}
            noMargin
          />
          <Label
            label={`${orderNumber}`}
            tag={LabelTags.p}
            size={LabelDimensions.xxxxlarge}
            color={ColorVariants.text.orange}
            weight={LabelWeight.bold}
            noMargin
          />
          <Label
            label="Mostralo alla cassa per ritirare il tuo ordine"
            tag={LabelTags.p}
            size={LabelDimensions.small}
            color={ColorVariants.text.white}
            noMargin
          />
        </div>

        {/* Riepilogo */}
        <div className="bg-gray-900 rounded-2xl overflow-hidden w-full mt-5">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center p-4"
          >
            <Label
              label="Riepilogo ordine"
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.bold}
              color={ColorVariants.text.white}
              noMargin
            />
            <span
              className={`text-white transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>

          {isOpen && (
            <div className="px-4 pb-4 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.dish.id}
                  className="flex justify-between items-center border-t border-gray-700 pt-3"
                >
                  <div>
                    <Label
                      label={item.dish.name}
                      tag={LabelTags.p}
                      size={LabelDimensions.medium}
                      color={ColorVariants.text.white}
                      noMargin
                    />
                    <Label
                      label={`x${item.quantity}`}
                      tag={LabelTags.p}
                      size={LabelDimensions.small}
                      color={ColorVariants.text.orange}
                      noMargin
                    />
                  </div>
                  <Label
                    label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                    tag={LabelTags.p}
                    size={LabelDimensions.medium}
                    color={ColorVariants.text.white}
                    noMargin
                  />
                </div>
              ))}

              <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                <Label
                  label="Totale"
                  tag={LabelTags.p}
                  size={LabelDimensions.large}
                  weight={LabelWeight.bold}
                  color={ColorVariants.text.white}
                  noMargin
                />
                <Label
                  label={`€${total.toFixed(2)}`}
                  tag={LabelTags.p}
                  size={LabelDimensions.large}
                  weight={LabelWeight.bold}
                  color={ColorVariants.text.orange}
                  noMargin
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};
