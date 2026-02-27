import { ButtonDimensions, LabelTags, TextDimensions, TextWeight } from "../../types/costant";
import { Button } from "./Button";
import { Minus, Plus } from "lucide-react";
import { Label } from "./Label";
import { ColorVariants } from "../../utils/colors";

interface CounterCardProps {
  quantity: number;
  increment: () => void;
  decrement: () => void;
}

export const CounterCard = ({ quantity, increment, decrement }: CounterCardProps) => {
  return (
    <div className="flex items-center gap-3 bg-gray-200 rounded-full px-3 py-1">
      <Button
        icon={<Minus size={14} />}
        onClick={decrement}
        dimension={ButtonDimensions.small}
        bgColor={ColorVariants.bg.grayDark}
        colorIcon={ColorVariants.text.white}
      />
      <Label
        label={`${quantity}`}
        tag={LabelTags.p}
        size={TextDimensions.medium}
        color={ColorVariants.text.grayDark}
        weight={TextWeight.semibold}
        noMargin
      />
      <Button
        icon={<Plus size={14} />}
        onClick={increment}
        dimension={ButtonDimensions.small}
        bgColor={ColorVariants.bg.grayDark}
        colorIcon={ColorVariants.text.white}
      />
    </div>
  );
};
