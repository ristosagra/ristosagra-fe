import { useState } from "react"
import { Container } from "../components/core/Container"
import { Label } from "../components/core/Label"
import { LabelTags, TextDimensions, TextWeight } from "../types/costant"
import type { CartType } from "../types/types"
import { ColorVariants } from "../utils/colors"

interface ReservationProps {
  cartItems: CartType[],
  orderNumber: number,
}

export const Reservation = ({cartItems, orderNumber}: ReservationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const total = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0,
  );
  
  return (
    <Container>
      <div className="flex flex-col items-center justify-center bg-gray-900 rounded-2xl py-10 gap-2">
        <Label
          label="Il tuo numero ordine è"
          tag={LabelTags.p}
          size={TextDimensions.medium}
          color={ColorVariants.text.white}
          noMargin
        />
        <Label
          label={`${orderNumber}`}
          tag={LabelTags.p}
          size={TextDimensions.xxxxlarge}
          color={ColorVariants.text.orange}
          weight={TextWeight.bold}
          noMargin
        />
        <Label
          label="Mostralo alla cassa per ritirare il tuo ordine"
          tag={LabelTags.p}
          size={TextDimensions.small}
          color={ColorVariants.text.white}
          noMargin
        />
      </div>

      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center p-4"
        >
          <Label
            label="Riepilogo ordine"
            tag={LabelTags.p}
            size={TextDimensions.medium}
            weight={TextWeight.bold}
            color={ColorVariants.text.white}
            noMargin
          />
          <span className={`text-white transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="px-4 pb-4 space-y-3">
            {cartItems.map((item) => (
              <div key={item.dish.id} className="flex justify-between items-center border-t border-gray-700 pt-3">
                <div>
                  <Label
                    label={item.dish.name}
                    tag={LabelTags.p}
                    size={TextDimensions.medium}
                    color={ColorVariants.text.white}
                    noMargin
                  />
                  <Label
                    label={`x${item.quantity}`}
                    tag={LabelTags.p}
                    size={TextDimensions.small}
                    color={ColorVariants.text.orange}
                    noMargin
                  />
                </div>
                <Label
                  label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                  tag={LabelTags.p}
                  size={TextDimensions.medium}
                  color={ColorVariants.text.white}
                  noMargin
                />
              </div>
            ))}

            <div className="flex justify-between items-center border-t border-gray-700 pt-3">
              <Label
                label="Totale"
                tag={LabelTags.p}
                size={TextDimensions.large}
                weight={TextWeight.bold}
                color={ColorVariants.text.white}
                noMargin
              />
              <Label
                label={`€${total.toFixed(2)}`}
                tag={LabelTags.p}
                size={TextDimensions.large}
                weight={TextWeight.bold}
                color={ColorVariants.text.orange}
                noMargin
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}
