import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { OrderType } from "../../features/orders/types/orders";
import type { ConfirmedOrder } from "./Cart";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";
import { ThemeVariants } from "../../constant/colors";
import { Accordion } from "../../components/core/Accordion";

interface ReservationProps {
  order: ConfirmedOrder;
}

export const Reservation = ({ order }: ReservationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { items: cartItems, orderNumber } = order;
  const isTakeaway = order.type === OrderType.Takeaway;

  const total = calcTotal(cartItems);

  return (
    <Container>
      <div className="min-h-full max-w-lg mx-auto flex flex-col justify-center items-center py-8 sm:py-10 px-4 sm:px-5">
        {/* Numero ordine */}
        <div
          className={`${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.xl}  flex flex-col items-center justify-center py-10 w-full gap-2`}
        >
          <Label
            label="Il tuo numero ordine è"
            tag={LabelTags.p}
            size={LabelDimensions.medium}
            color={ThemeVariants.colors.text.white}
            noMargin
          />
          {/* Grande e leggibile: il cliente lo mostra alla cassa dallo schermo del telefono */}
          <Label
            label={`${orderNumber}`}
            tag={LabelTags.p}
            size={LabelDimensions.xxxxlarge}
            color={ThemeVariants.colors.text.brand}
            weight={LabelWeight.bold}
            noMargin
          />
          {isTakeaway && (
            <Label
              label={`Asporto a nome di ${order.customerName} · ritiro alle ${order.pickupTime}`}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.semibold}
              color={ThemeVariants.colors.text.white}
              noMargin
              additionalClasses="text-center justify-center px-4 [overflow-wrap:anywhere]"
            />
          )}
          <Label
            label={
              isTakeaway
                ? "Mostralo alla cassa quando vieni a ritirarlo"
                : "Mostralo alla cassa per ritirare il tuo ordine"
            }
            tag={LabelTags.p}
            size={LabelDimensions.medium}
            color={ThemeVariants.colors.text.secondary}
            noMargin
            additionalClasses="text-center justify-center px-4"
          />
        </div>

        {/* Riepilogo */}
        <div
          className={`${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.xl} overflow-hidden w-full mt-5`}
        >
          <Accordion
            onClick={() => setIsOpen(!isOpen)}
            expanded={isOpen}
            className="p-4"
          >
            <Label
              label="Riepilogo ordine"
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.bold}
              color={ThemeVariants.colors.text.white}
              noMargin
            />
            <ChevronDown
              size={20}
              aria-hidden
              className={`${ThemeVariants.colors.text.white} transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          </Accordion>

          {isOpen && (
            <div className="px-4 pb-4 space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.dish.id}
                  className={`${ThemeVariants.colors.border.top.default} flex justify-between items-center gap-3 pt-3`}
                >
                  <div className="min-w-0">
                    <Label
                      label={item.dish.name}
                      tag={LabelTags.p}
                      size={LabelDimensions.medium}
                      color={ThemeVariants.colors.text.white}
                      noMargin
                    />
                    <Label
                      label={`x${item.quantity}`}
                      tag={LabelTags.p}
                      size={LabelDimensions.small}
                      color={ThemeVariants.colors.text.brand}
                      noMargin
                    />
                  </div>
                  <Label
                    label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                    tag={LabelTags.p}
                    size={LabelDimensions.medium}
                    color={ThemeVariants.colors.text.white}
                    noMargin
                  />
                </div>
              ))}

              <div
                className={`${ThemeVariants.colors.border.top.default} flex justify-between items-center pt-3`}
              >
                <Label
                  label="Totale"
                  tag={LabelTags.p}
                  size={LabelDimensions.large}
                  weight={LabelWeight.bold}
                  color={ThemeVariants.colors.text.white}
                  noMargin
                />
                <Label
                  label={`€${total.toFixed(2)}`}
                  tag={LabelTags.p}
                  size={LabelDimensions.large}
                  weight={LabelWeight.bold}
                  color={ThemeVariants.colors.text.brand}
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
