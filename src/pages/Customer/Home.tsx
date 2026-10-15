import { CalendarClock, NotebookPen, ReceiptText } from "lucide-react";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags } from "../../constant/label";
import { Label } from "../../components/core/Label";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";

export const Home = ({
  setPage,
  lastOrderNumber,
}: {
  setPage: (page: PagesCustomerConst) => void;
  //ultimo ordine inviato da questo dispositivo, da mostrare alla cassa
  lastOrderNumber?: number;
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
            label={restaurant?.name ?? " "}
            size={LabelDimensions.xxxlarge}
            color={ThemeVariants.colors.text.brand}
            additionalClasses="italic max-sm:text-5xl justify-center text-center [overflow-wrap:anywhere] my-2"
            noMargin
          />
          <Label
            tag={LabelTags.p}
            label="Sfoglia il menù e aggiungi i piatti al carrello. Quando sei pronto, invia il tuo ordine."
            color={ThemeVariants.colors.text.secondary}
            size={LabelDimensions.medium}
            additionalClasses="justify-center text-center mt-4 leading-normal"
            noMargin
          />
        </div>
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
