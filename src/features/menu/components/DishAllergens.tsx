import { ChevronDown } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Label } from "../../../components/core/Label";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ALLERGENS } from "../constant/menu";

//posizione nell'elenco ufficiale (eventuali allergeni non in elenco vanno in fondo)
const allergenOrder = (a: string) => {
  const i = ALLERGENS.indexOf(a);
  return i === -1 ? ALLERGENS.length : i;
};

//Freccia che apre/chiude il dettaglio del piatto con gli allergeni
export const AllergensToggle = ({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) => (
  <Button
    iconLeft={
      <ChevronDown
        size={20}
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    }
    onClick={onToggle}
    dimension={ButtonDimensions.auto}
    variant="icon"
    className={`p-2 -m-1 shrink-0 ${ThemeVariants.colors.text.secondary}`}
    ariaLabel={open ? "Nascondi allergeni" : "Mostra allergeni"}
  />
);

//Elenco degli allergeni di un piatto
export const AllergenChips = ({ allergens = [] }: { allergens?: string[] }) => (
  <div>
    <Label
      tag={LabelTags.p}
      label="Allergeni"
      size={LabelDimensions.small}
      color={ThemeVariants.colors.text.secondary}
      noMargin
      additionalClasses="uppercase mb-1.5"
    />
    {allergens.length === 0 ? (
      <Label
        tag={LabelTags.p}
        label="Nessun allergene indicato"
        size={LabelDimensions.small}
        color={ThemeVariants.colors.text.secondary}
        noMargin
      />
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {[...allergens]
          .sort((a, b) => allergenOrder(a) - allergenOrder(b))
          .map((a) => (
            <span
              key={a}
              className={`text-xs px-2.5 py-1 font-medium ${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.white} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.full}`}
            >
              {a}
            </span>
          ))}
      </div>
    )}
  </div>
);
