import { Button } from "./Button";
import { Minus, Plus } from "lucide-react";
import { Label } from "./Label";
import { ThemeVariants } from "../../constant/colors";
import { LabelTags, LabelDimensions, LabelWeight } from "../../constant/label";
import { ButtonDimensions } from "../../constant/button";

interface CounterCardProps {
  quantity: number;
  increment: () => void;
  decrement: () => void;
}

//Sul cellulare i pulsanti sono più alti, per essere comodi da toccare
const STEP_BUTTON = "w-9 h-9 sm:w-10 sm:h-7";

export const CounterCard = ({
  quantity,
  increment,
  decrement,
}: CounterCardProps) => {
  return (
    <div
      className={`flex items-center gap-2 px-2 sm:px-3 py-1 shrink-0 ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`}
    >
      <Button
        iconLeft={<Minus size={14} />}
        onClick={decrement}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        className={STEP_BUTTON}
        ariaLabel="Diminuisci"
      />
      <span aria-live="polite" className="min-w-5 text-center">
        <Label
          label={`${quantity}`}
          tag={LabelTags.p}
          size={LabelDimensions.medium}
          color={ThemeVariants.colors.text.brand}
          weight={LabelWeight.semibold}
          noMargin
          additionalClasses="justify-center"
        />
      </span>
      <Button
        iconLeft={<Plus size={14} />}
        onClick={increment}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        className={STEP_BUTTON}
        ariaLabel="Aumenta"
      />
    </div>
  );
};
