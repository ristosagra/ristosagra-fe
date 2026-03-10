import { NotebookPen } from "lucide-react";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";

export const Home = ({
  setPage,
}: {
  setPage: React.Dispatch<React.SetStateAction<PagesCustomerConst>>;
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <div
        className={`text-5xl leading-none text-center ${ThemeVariants.fontFamily.display}`}
      >
        Benvenuto da{" "}
        <em className={`italic ${ThemeVariants.colors.text.brand}`}>
          Ristosagra
        </em>
      </div>
      <p
        className={`${ThemeVariants.colors.text.secondary} text-[15px] text-center max-w-90`}
      >
        Sfoglia il menù e aggiungi i piatti al carrello.
        <br />
        Quando sei pronto, invia il tuo ordine.
      </p>
      <div className="flex gap-2.5 mt-2">
        <Button
          dimension={ButtonDimensions.xlarge}
          onClick={() => setPage(PagesCustomer.MENU)}
          label="Vai al menù"
          iconLeft={<NotebookPen size={16} />}
          variant="primary"
        />
      </div>
    </div>
  );
};
