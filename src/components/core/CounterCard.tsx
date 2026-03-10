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

export const CounterCard = ({
  quantity,
  increment,
  decrement,
}: CounterCardProps) => {
  return (
    <div
      className={`flex items-center gap-2  px-3 py-1 ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`}
    >
      <Button
        iconLeft={<Minus size={14} />}
        onClick={decrement}
        dimension={ButtonDimensions.small}
        variant="secondary"
      />
      <Label
        label={`${quantity}`}
        tag={LabelTags.p}
        size={LabelDimensions.medium}
        color={ThemeVariants.colors.text.brand}
        weight={LabelWeight.semibold}
        noMargin
      />
      <Button
        iconLeft={<Plus size={14} />}
        onClick={increment}
        dimension={ButtonDimensions.small}
        variant="secondary"
      />
    </div>
  );
};
