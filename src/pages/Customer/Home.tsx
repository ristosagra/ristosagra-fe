import { NotebookPen } from "lucide-react";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags } from "../../constant/label";
import { Label } from "../../components/core/Label";

export const Home = ({
  setPage,
}: {
  setPage: React.Dispatch<React.SetStateAction<PagesCustomerConst>>;
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <div
        className={`leading-none text-center ${ThemeVariants.fontFamily.display}`}
      >
        <Label
          tag={LabelTags.p}
          label="Benvenuto da"
          size={LabelDimensions.xxlarge}
          noMargin
        />{" "}
        <Label
          tag={LabelTags.p}
          label="Ristosagra"
          size={LabelDimensions.xxxlarge}
          color={ThemeVariants.colors.text.brand}
          additionalClasses="italic"
          noMargin
        />
        <br />
        <Label
          tag={LabelTags.p}
          label="Sfoglia il menù e aggiungi i piatti al carrello."
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.medium}
          noMargin
        />
        <Label
          tag={LabelTags.p}
          label="Quando sei pronto, invia il tuo ordine."
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.medium}
          noMargin
        />
      </div>
      {/* </p> */}
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
