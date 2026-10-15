import { useState } from "react";
import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Card } from "../../components/Card";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { type Dispatch, type SetStateAction } from "react";
import { Loader } from "../../components/core/Loader";
import {
  useOrderNumber,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import {
  OrderType,
  PickupMode,
  type CartType,
  type NewOrder,
  type OrderTypeConst,
} from "../../features/orders/types/orders";
import { ButtonDimensions } from "../../constant/button";
import { type PagesCustomerConst, PagesCustomer } from "../../constant/pages";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";
import { ThemeVariants } from "../../constant/colors";
import { useNotification } from "../../hooks/useNotification";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { NotificationType } from "../../types/notification";

//Ordine confermato, con il numero da mostrare alla cassa
export type ConfirmedOrder = NewOrder & { orderNumber: number };

interface CartProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
  setPage: Dispatch<SetStateAction<PagesCustomerConst>>;
  setConfirmedOrder: React.Dispatch<
    React.SetStateAction<ConfirmedOrder | null>
  >;
}

export default function Cart({
  cartItems,
  setCartItems,
  setPage,
  setConfirmedOrder,
}: CartProps) {
  const { mutate: confirmOrder, isPending } = useOrderNumber();
  const { data: takeaway } = useTakeawaySettings();
  const showNotification = useNotification();
  const now = useCurrentTime();

  const [type, setType] = useState<OrderTypeConst>(OrderType.DineIn);
  const [customerName, setCustomerName] = useState("");
  const [customTime, setCustomTime] = useState("");

  const total = calcTotal(cartItems);
  const fixedTime =
    takeaway?.mode === PickupMode.Fixed ? takeaway.fixedTime : null;
  //Superato l'orario unico di ritiro l'asporto non si può più scegliere
  const canTakeaway = !!takeaway && !(fixedTime && now > fixedTime);
  const isTakeaway = canTakeaway && type === OrderType.Takeaway;
  const pickupTime = fixedTime ?? customTime;
  const canConfirm =
    !isTakeaway || (!!customerName.trim() && !!pickupTime && !!takeaway);

  if (cartItems.length === 0) {
    return (
      <div
        className={`${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.xl} flex justify-center items-center px-2 py-6 mt-20 mx-10`}
      >
        <Label
          label="Il carrello è vuoto"
          tag={LabelTags.p}
          size={LabelDimensions.large}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.white}
          noMargin
        />
      </div>
    );
  }

  const handleConfirm = () => {
    if (!canConfirm) return;
    const order: NewOrder = isTakeaway
      ? {
          items: cartItems,
          type,
          customerName: customerName.trim(),
          pickupTime,
        }
      : { items: cartItems, type };
    confirmOrder(order, {
      onSuccess: ({ orderNumber }) => {
        setConfirmedOrder({ ...order, orderNumber });
        setCartItems([]);
        setPage(PagesCustomer.RESERVATION);
      },
      onError: () =>
        showNotification(
          "Errore nell'invio dell'ordine, riprova",
          NotificationType.Err,
        ),
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
        {/* Sul posto o da asporto con ritiro in loco */}
        {canTakeaway && (
          <div
            className={`${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} p-4 rounded-2xl space-y-3`}
          >
            <Label
              label="Come vuoi il tuo ordine?"
              tag={LabelTags.h3}
              size={LabelDimensions.medium}
              weight={LabelWeight.bold}
              noMargin
            />
            <div className="flex gap-2">
              <Button
                iconLeft={<UtensilsCrossed size={16} />}
                label="Mangio qui"
                onClick={() => setType(OrderType.DineIn)}
                dimension={ButtonDimensions.auto}
                variant={isTakeaway ? "secondary" : "primary"}
                className="px-3 py-2"
                fullWidth
              />
              <Button
                iconLeft={<ShoppingBag size={16} />}
                label="Asporto"
                onClick={() => setType(OrderType.Takeaway)}
                dimension={ButtonDimensions.auto}
                variant={isTakeaway ? "primary" : "secondary"}
                className="px-3 py-2"
                fullWidth
              />
            </div>

            {isTakeaway && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label
                    label="Nome per il ritiro"
                    tag={LabelTags.p}
                    size={LabelDimensions.small}
                    color={ThemeVariants.colors.text.secondary}
                    noMargin
                    additionalClasses="mb-1.5"
                  />
                  <Input
                    type="text"
                    placeholder="Es. Mario Rossi"
                    value={customerName}
                    setValue={setCustomerName}
                    variant="secondary"
                    className="w-full"
                  />
                </div>
                {fixedTime ? (
                  <Label
                    label={`Ritiro in loco alle ${fixedTime}`}
                    tag={LabelTags.p}
                    size={LabelDimensions.medium}
                    weight={LabelWeight.semibold}
                    color={ThemeVariants.colors.text.brand}
                    noMargin
                  />
                ) : (
                  <div>
                    <Label
                      label="Orario di ritiro"
                      tag={LabelTags.p}
                      size={LabelDimensions.small}
                      color={ThemeVariants.colors.text.secondary}
                      noMargin
                      additionalClasses="mb-1.5"
                    />
                    <Input
                      type="time"
                      placeholder="19:30"
                      value={customTime}
                      setValue={setCustomTime}
                      variant="secondary"
                      className="w-36"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div
          className={`${ThemeVariants.colors.border.all.brand} ${ThemeVariants.colors.bg.surface} p-4 rounded-2xl flex justify-between items-center`}
        >
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
          label={isTakeaway ? "Prenota asporto" : "Prenota ordine"}
          fullWidth
          dimension={ButtonDimensions.large}
          onClick={handleConfirm}
          variant="primary"
          disabled={!canConfirm || isPending}
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </Container>
  );
}
