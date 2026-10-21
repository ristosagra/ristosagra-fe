import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import {
  OrderType,
  type ConfirmedOrder,
} from "../../features/orders/types/orders";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";
import { ThemeVariants } from "../../constant/colors";
import { Accordion } from "../../components/core/Accordion";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { PickupCall } from "../../features/restaurant/types/restaurant";
import {
  isPayFirstAtCashier,
  usesCounterPickup,
} from "../../features/restaurant/utils/ordering";
import { PickupStatus } from "../../features/orders/components/PickupStatus";

interface ReservationProps {
  order: ConfirmedOrder;
}

export const Reservation = ({ order }: ReservationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: restaurant } = useRestaurant();
  const { items: cartItems, orderNumber } = order;
  const isTakeaway = order.type === OrderType.Takeaway;
  //tipo sagra: si paga subito alla cassa, poi l'ordine va in cucina
  const payFirst = isPayFirstAtCashier(restaurant);

  const total = calcTotal(cartItems);
  //A nome di chi è l'ordine e dove va (gli ordini salvati prima del nome non ce l'hanno)
  const details = isTakeaway
    ? `Asporto a nome di ${order.customerName} · ritiro alle ${order.pickupTime}`
    : [
        order.customerName && `A nome di ${order.customerName}`,
        order.table && `tavolo ${order.table}`,
      ]
        .filter(Boolean)
        .join(" · ");
  //Ritiro al banco: come saprà che è pronto (qui sotto lo stato si aggiorna da solo)
  const counter = usesCounterPickup(restaurant);
  const pickupHint =
    restaurant?.pickupCall === PickupCall.Voice
      ? "quando chiamano il tuo numero, ritira l'ordine al banco"
      : "quando il tuo numero compare tra i pronti sullo schermo, ritira l'ordine al banco";
  const hint = counter
    ? order.paidOnline
      ? `Ordine pagato: ${pickupHint}`
      : payFirst
        ? `Vai alla cassa a pagare mostrando questo numero; poi ${pickupHint}`
        : `Paghi alla cassa ${isTakeaway ? "al ritiro" : "a fine pasto"}; ${pickupHint}`
    : order.paidOnline
      ? isTakeaway
        ? "Ordine pagato: mostralo alla cassa quando vieni a ritirarlo"
        : order.table
          ? "Ordine pagato: te lo portiamo al tavolo"
          : "Ordine pagato: tienilo a portata di mano per ritirare l'ordine"
      : payFirst
        ? "Vai alla cassa a pagare mostrando questo numero: dopo il pagamento il tuo ordine va in cucina"
        : isTakeaway
          ? "Mostralo alla cassa quando vieni a ritirarlo e pagarlo"
          : "Quando hai finito, mostralo alla cassa per pagare";

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
          {details && (
            <Label
              label={details}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.semibold}
              color={ThemeVariants.colors.text.white}
              noMargin
              additionalClasses="text-center justify-center px-4 [overflow-wrap:anywhere]"
            />
          )}
          {order.paidOnline && (
            <Label
              label="Pagato"
              tag={LabelTags.p}
              size={LabelDimensions.small}
              weight={LabelWeight.semibold}
              variant="success"
              noMargin
              additionalClasses="py-0.5"
            />
          )}
          {counter && <PickupStatus orderNumber={orderNumber} />}
          <Label
            label={hint}
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
