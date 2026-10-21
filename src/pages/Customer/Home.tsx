import { CalendarClock, MapPin, NotebookPen, ReceiptText } from "lucide-react";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags } from "../../constant/label";
import { Label } from "../../components/core/Label";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import {
  OrderingMode,
  type OrderingModeConst,
} from "../../features/restaurant/types/restaurant";
import { isPayFirstAtCashier } from "../../features/restaurant/utils/ordering";

//Cosa può fare il cliente, in base a come il ristorante fa ordinare
const INTRO: Record<OrderingModeConst, string> = {
  [OrderingMode.MenuOnly]: "Sfoglia il menù e ordina alla cassa.",
  [OrderingMode.PayAtCashier]:
    "Sfoglia il menù e aggiungi i piatti al carrello. Quando sei pronto, invia il tuo ordine e paga alla cassa.",
  [OrderingMode.PayOnline]:
    "Sfoglia il menù e aggiungi i piatti al carrello. Quando sei pronto, ordina e paga direttamente dal telefono.",
};

//Tipo sagra: si ordina dal telefono e si paga subito alla cassa
const PAY_FIRST_INTRO =
  "Sfoglia il menù e ordina dal telefono, poi vai alla cassa a pagare: dopo il pagamento il tuo ordine va in cucina.";

export const Home = ({
  setPage,
  lastOrderNumber,
  table,
}: {
  setPage: (page: PagesCustomerConst) => void;
  //ultimo ordine inviato da questo dispositivo, da mostrare alla cassa
  lastOrderNumber?: number;
  //tavolo del QR code inquadrato
  table?: string | null;
}) => {
  const { data: restaurant } = useRestaurant();

  return (
    <div className="h-full overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center gap-6 px-5 py-8">
        <div
          className={`leading-none text-center w-full max-w-xl ${ThemeVariants.fontFamily.display}`}
        >
          <Label
            tag={LabelTags.p}
            label="Benvenuto da"
            size={LabelDimensions.xxlarge}
            additionalClasses="max-sm:text-3xl justify-center"
            noMargin
          />
          <Label
            tag={LabelTags.h1}
            // spazio vuoto finché il nome non è caricato, per non far saltare il testo
            label={restaurant?.name ?? " "}
            size={LabelDimensions.xxxlarge}
            color={ThemeVariants.colors.text.brand}
            additionalClasses="italic max-sm:text-5xl justify-center text-center [overflow-wrap:anywhere] my-2"
            noMargin
          />
          <Label
            tag={LabelTags.p}
            // spazio vuoto finché non si sa come si ordina
            label={
              !restaurant
                ? " "
                : restaurant.orderingMode === OrderingMode.PayAtCashier &&
                    isPayFirstAtCashier(restaurant)
                  ? PAY_FIRST_INTRO
                  : (INTRO[restaurant.orderingMode] ??
                    INTRO[OrderingMode.PayAtCashier])
            }
            color={ThemeVariants.colors.text.secondary}
            size={LabelDimensions.medium}
            additionalClasses="justify-center text-center mt-4 leading-normal"
            noMargin
          />
        </div>
        {table && (
          <Label
            tag={LabelTags.p}
            label={`Sei al tavolo ${table}`}
            iconLeft={<MapPin size={16} />}
            size={LabelDimensions.medium}
            color={ThemeVariants.colors.text.brand}
            additionalClasses={`font-semibold gap-1.5 px-4 py-1.5 [overflow-wrap:anywhere] ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.border.all.brand}`}
            noMargin
          />
        )}
        <div className="flex flex-col sm:flex-row gap-2.5 mt-2 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Button
            dimension={ButtonDimensions.auto}
            onClick={() => setPage(PagesCustomer.MENU)}
            label="Vai al menù"
            iconLeft={<NotebookPen size={16} />}
            variant="primary"
            className="h-12 px-5"
          />
          <Button
            dimension={ButtonDimensions.auto}
            onClick={() => setPage(PagesCustomer.BOOK_TABLE)}
            label="Prenota un posto"
            iconLeft={<CalendarClock size={16} />}
            variant="secondary"
            className="h-12 px-4"
          />
        </div>
        {lastOrderNumber !== undefined && (
          <Button
            dimension={ButtonDimensions.auto}
            onClick={() => setPage(PagesCustomer.RESERVATION)}
            label={`Il tuo ordine n° ${lastOrderNumber}`}
            iconLeft={<ReceiptText size={16} />}
            variant="active"
            isActive
            className="h-11 px-4"
          />
        )}
      </div>
    </div>
  );
};
