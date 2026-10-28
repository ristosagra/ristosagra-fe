import { useState } from "react";
import {
  CreditCard,
  MapPin,
  PackageX,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Card } from "../../components/Card";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { Loader } from "../../components/core/Loader";
import { useMenu } from "../../features/menu/hook/useMenu";
import {
  unavailableItems,
  unavailableReason,
} from "../../features/menu/utils/menuUtils";
import {
  useOrderNumber,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import {
  OrderType,
  type CartType,
  type ConfirmedOrder,
  type NewOrder,
  type OrderTypeConst,
} from "../../features/orders/types/orders";
import {
  goToCheckout,
  safeCheckoutUrl,
} from "../../features/orders/utils/onlinePayment";
import { cleanTableName } from "../../features/orders/utils/tableQr";
import {
  pickupTimeValid,
  takeawayToday,
} from "../../features/orders/utils/takeawayUtils";
import {
  OrderingMode,
  type RestaurantProfile,
} from "../../features/restaurant/types/restaurant";
import {
  customerAsksTable,
  isPayFirstAtCashier,
} from "../../features/restaurant/utils/ordering";
import { ButtonDimensions } from "../../constant/button";
import { type PagesCustomerConst, PagesCustomer } from "../../constant/pages";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { calcTotal } from "../../helpers/calcTotal";
import { ThemeVariants } from "../../constant/colors";
import { useNotification } from "../../hooks/useNotification";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import {
  formatRanges,
  isOpenNow,
  todayHoursLabel,
} from "../../helpers/openingHours";
import { NotificationType } from "../../types/notification";
import { HttpError } from "../../services/client/httpClient";
import { PERSON_NAME_MAX, TABLE_NAME_MAX } from "../../constant/limits";

interface CartProps {
  cartItems: CartType[];
  setCartItems: React.Dispatch<React.SetStateAction<CartType[]>>;
  setPage: (page: PagesCustomerConst) => void;
  setConfirmedOrder: (order: ConfirmedOrder) => void;
  //come il ristorante fa ordinare (modalità, tavolo, QR code) e orari di oggi
  restaurant: RestaurantProfile;
  //tavolo del QR code inquadrato, se c'è
  scannedTable: string | null;
}

//Titolo piccolo sopra un campo
const FieldLabel = ({ label }: { label: string }) => (
  <Label
    label={label}
    tag={LabelTags.p}
    size={LabelDimensions.small}
    color={ThemeVariants.colors.text.secondary}
    noMargin
    additionalClasses="mb-1.5"
  />
);

export default function Cart({
  cartItems,
  setCartItems,
  setPage,
  setConfirmedOrder,
  restaurant,
  scannedTable,
}: CartProps) {
  const { mutate: confirmOrder, isPending } = useOrderNumber();
  const { data: takeaway } = useTakeawaySettings();
  //il menù di oggi, per accorgersi dei piatti finiti mentre erano nel carrello
  const { data: menu, refetch: refetchMenu } = useMenu();
  const showNotification = useNotification();
  const now = useCurrentTime();

  const [type, setType] = useState<OrderTypeConst>(OrderType.DineIn);
  const [customerName, setCustomerName] = useState("");
  const [typedTable, setTypedTable] = useState("");
  const [customTime, setCustomTime] = useState("");
  //si sta andando alla pagina di pagamento: il carrello resta bloccato
  const [isLeaving, setIsLeaving] = useState(false);

  const total = calcTotal(cartItems);
  const payOnline = restaurant.orderingMode === OrderingMode.PayOnline;
  //tipo sagra: si paga alla cassa prima che la cucina prepari
  const payFirst = isPayFirstAtCashier(restaurant);
  //Sul posto si ordina solo mentre il locale è aperto; l'asporto (se attivo) si prenota per
  //un servizio di oggi non ancora finito (vedi takeawayToday)
  const dineInOpen = isOpenNow(restaurant.openingHours, now);
  const slot = takeawayToday(restaurant.openingHours, takeaway, now);
  const canTakeaway = !!slot;
  //a locale chiuso resta solo l'asporto
  const isTakeaway =
    canTakeaway && (type === OrderType.Takeaway || !dineInOpen);
  const fixedTime = slot?.fixedTime ?? null;
  const todayRanges = slot?.ranges ?? [];
  const customTimeValid = !!slot && pickupTimeValid(slot, customTime, now);
  const pickupTime = fixedTime ?? customTime;
  //niente da fare: chiuso e senza asporto
  const closed = !dineInOpen && !canTakeaway;
  const todayHours = todayHoursLabel(restaurant.openingHours);

  //Sul posto il tavolo serve se il ristorante fa ordinare dal tavolo: arriva dal QR code
  //inquadrato oppure lo scrive il cliente
  const askTable = !isTakeaway && customerAsksTable(restaurant);
  const tableFromQr = askTable && restaurant.tableQrCode;
  const table = !askTable
    ? null
    : tableFromQr
      ? scannedTable
      : cleanTableName(typedTable);

  //piatti del carrello finiti nel frattempo: vanno tolti prima di inviare l'ordine
  const unavailable = unavailableItems(cartItems, menu);
  const removeUnavailable = () =>
    setCartItems((items) =>
      items.filter((it) => unavailableReason(it.dish.id, menu) === null),
    );

  const canConfirm =
    unavailable.length === 0 &&
    !closed &&
    !!customerName.trim() &&
    (isTakeaway ? !!fixedTime || customTimeValid : !askTable || !!table);
  const busy = isPending || isLeaving;

  if (cartItems.length === 0) {
    return (
      <Container additionalClass="px-5 py-10">
        <div
          className={`${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.xl} max-w-md mx-auto flex flex-col justify-center items-center gap-4 px-4 py-6`}
        >
          <Label
            label="Il carrello è vuoto"
            tag={LabelTags.p}
            size={LabelDimensions.large}
            weight={LabelWeight.bold}
            color={ThemeVariants.colors.text.white}
            noMargin
          />
          <Button
            label="Vai al menù"
            onClick={() => setPage(PagesCustomer.MENU)}
            dimension={ButtonDimensions.auto}
            variant="primary"
            className="h-11 px-5"
          />
        </div>
      </Container>
    );
  }

  const handleConfirm = () => {
    if (!canConfirm || busy) return;
    const name = customerName.trim();
    const order: NewOrder = isTakeaway
      ? { items: cartItems, type, customerName: name, pickupTime }
      : { items: cartItems, type, customerName: name, ...(table && { table }) };
    confirmOrder(order, {
      onSuccess: ({ orderNumber, checkoutUrl }) => {
        const confirmed: ConfirmedOrder = {
          ...order,
          orderNumber,
          confirmedAt: new Date().toISOString(),
        };
        //Pagamento online: il carrello resta finché il pagamento non va a buon fine
        if (checkoutUrl) {
          const url = safeCheckoutUrl(checkoutUrl);
          if (!url)
            return showNotification(
              "Errore nel pagamento, riprova",
              NotificationType.Err,
            );
          setIsLeaving(true);
          return goToCheckout(confirmed, url);
        }
        setConfirmedOrder(confirmed);
        setCartItems([]);
        setPage(PagesCustomer.RESERVATION);
      },
      onError: (error) => {
        //un piatto è finito mentre si ordinava: il menù riletto lo segna nel carrello
        if (error instanceof HttpError && error.status === 409) {
          refetchMenu();
          return showNotification(
            "Un piatto è appena finito: controlla il carrello",
            NotificationType.Err,
          );
        }
        showNotification(
          "Errore nell'invio dell'ordine, riprova",
          NotificationType.Err,
        );
      },
    });
  };

  return (
    <Container additionalClass="px-4 sm:px-5 py-6 sm:py-7">
      {busy && <Loader />}

      <div className="max-w-2xl mx-auto space-y-3">
        {cartItems.map((item) => (
          <Card
            key={item.dish.id}
            dish={item.dish}
            cartItems={cartItems}
            setCartItems={setCartItems}
            isCart
            unavailable={unavailableReason(item.dish.id, menu) ?? undefined}
          />
        ))}
      </div>

      {unavailable.length > 0 && (
        <div
          role="alert"
          className={`max-w-2xl mx-auto mt-3 p-4 rounded-2xl flex flex-col gap-3 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.danger}`}
        >
          <p
            className={`text-sm font-semibold ${ThemeVariants.colors.text.danger}`}
          >
            {unavailable.length === 1
              ? `${unavailable[0].dish.name} è finito: toglilo per inviare l'ordine.`
              : `${unavailable.map((it) => it.dish.name).join(", ")} sono finiti: toglili per inviare l'ordine.`}
          </p>
          <Button
            iconLeft={<PackageX size={16} />}
            label={
              unavailable.length === 1
                ? "Togli il piatto finito"
                : "Togli i piatti finiti"
            }
            onClick={removeUnavailable}
            dimension={ButtonDimensions.auto}
            variant="secondary"
            className="h-11 px-4 self-start"
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-3 mt-3">
        {/* Dati dell'ordine: sul posto (col tavolo) o da asporto con ritiro in loco */}
        <div
          className={`${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} p-4 rounded-2xl space-y-3`}
        >
          <Label
            label={canTakeaway ? "Come vuoi il tuo ordine?" : "I tuoi dati"}
            tag={LabelTags.h3}
            size={LabelDimensions.medium}
            weight={LabelWeight.bold}
            noMargin
          />
          {(closed || (canTakeaway && !dineInOpen)) && (
            <Label
              label={
                closed
                  ? todayHours
                    ? `Ora siamo chiusi: puoi ordinare negli orari di apertura (oggi ${todayHours})`
                    : "Oggi siamo chiusi: non si possono inviare ordini"
                  : `Ora siamo chiusi: sul posto si ordina negli orari di apertura${todayHours ? ` (oggi ${todayHours})` : ""}, intanto puoi prenotare l'asporto`
              }
              tag={LabelTags.p}
              size={LabelDimensions.small}
              weight={LabelWeight.semibold}
              variant="danger"
              noMargin
              additionalClasses="py-2"
            />
          )}
          {canTakeaway && (
            <div className="flex gap-2">
              <Button
                iconLeft={<UtensilsCrossed size={16} />}
                label="Mangio qui"
                onClick={() => setType(OrderType.DineIn)}
                dimension={ButtonDimensions.auto}
                variant={isTakeaway ? "secondary" : "primary"}
                disabled={!dineInOpen}
                className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
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
          )}

          <div className="space-y-3 pt-1">
            <div>
              <FieldLabel
                label={isTakeaway ? "Nome per il ritiro" : "Il tuo nome"}
              />
              <Input
                type="text"
                name="name"
                placeholder="Es. Mario Rossi"
                value={customerName}
                setValue={setCustomerName}
                variant="secondary"
                className="w-full"
                autoComplete="name"
                maxLength={PERSON_NAME_MAX}
                ariaLabel={isTakeaway ? "Nome per il ritiro" : "Il tuo nome"}
              />
            </div>

            {isTakeaway &&
              (fixedTime ? (
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
                  <FieldLabel label="Orario di ritiro" />
                  <Input
                    type="time"
                    placeholder="19:30"
                    value={customTime}
                    setValue={setCustomTime}
                    variant="secondary"
                    className="w-36"
                    ariaLabel="Orario di ritiro"
                  />
                  <p
                    className={`text-sm mt-1.5 ${customTime && !customTimeValid ? ThemeVariants.colors.text.danger : ThemeVariants.colors.text.secondary}`}
                  >
                    Ritiro possibile oggi: {formatRanges(todayRanges)}
                  </p>
                </div>
              ))}

            {askTable &&
              (!tableFromQr ? (
                <div>
                  <FieldLabel label="Numero del tavolo" />
                  <Input
                    type="text"
                    placeholder="Es. 12"
                    value={typedTable}
                    setValue={setTypedTable}
                    variant="secondary"
                    className="w-36"
                    maxLength={TABLE_NAME_MAX}
                    ariaLabel="Numero del tavolo"
                  />
                </div>
              ) : scannedTable ? (
                <Label
                  label={`Tavolo ${scannedTable}`}
                  iconLeft={<MapPin size={16} />}
                  tag={LabelTags.p}
                  size={LabelDimensions.medium}
                  weight={LabelWeight.semibold}
                  color={ThemeVariants.colors.text.brand}
                  noMargin
                  additionalClasses="gap-1.5 [overflow-wrap:anywhere]"
                />
              ) : (
                <Label
                  label="Inquadra il QR code sul tuo tavolo per ordinare da qui"
                  tag={LabelTags.p}
                  size={LabelDimensions.small}
                  weight={LabelWeight.semibold}
                  variant="danger"
                  noMargin
                  additionalClasses="py-2"
                />
              ))}
          </div>
        </div>

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
          iconLeft={payOnline ? <CreditCard size={18} /> : undefined}
          label={
            payOnline
              ? `Paga €${total.toFixed(2)}`
              : isTakeaway
                ? "Prenota asporto"
                : "Prenota ordine"
          }
          fullWidth
          dimension={ButtonDimensions.auto}
          onClick={handleConfirm}
          variant="primary"
          disabled={!canConfirm || busy}
          className="h-12 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p
          className={`text-sm text-center ${ThemeVariants.colors.text.secondary}`}
        >
          {payOnline
            ? "Pagherai sulla pagina sicura del servizio di pagamento"
            : payFirst
              ? "Poi vai alla cassa a pagare: la cucina prepara l'ordine dopo il pagamento"
              : isTakeaway
                ? "Pagherai alla cassa quando vieni a ritirarlo"
                : "Pagherai alla cassa a fine pasto"}
        </p>
      </div>
    </Container>
  );
}
