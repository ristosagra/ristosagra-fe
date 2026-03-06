import {
  LabelDimensions,
  LabelWeight,
  type LabelDimensionsConst,
  type LabelTagsConst,
  type LabelWeightConst,
} from "../../constant/label";
import { ColorVariants } from "../../constant/colors";

export interface LabelProps {
  label: string;
  color?: string;
  colorBorderBottom?: string;
  tag: LabelTagsConst;
  size?: LabelDimensionsConst;
  noMargin?: boolean;
  weight?: LabelWeightConst;
  additionalClasses?: string;
}

export const Label = ({
  label,
  color = ColorVariants.text.white,
  colorBorderBottom,
  tag,
  size,
  noMargin,
  weight,
  additionalClasses = "",
}: LabelProps) => {
  const Tag = tag as React.ElementType;
  const borderClass = colorBorderBottom ? "border-b" : "";
  const textSize = size ?? LabelDimensions.medium;
  const labelWeight = weight ?? LabelWeight.normal;
  const marginBottom = noMargin
    ? ""
    : LabelDimensions.large
      ? "mb-6"
      : LabelDimensions.medium
        ? "mb-4"
        : "mb-2";

  return (
    <Tag
      className={`${textSize} ${color} ${marginBottom} ${borderClass} ${colorBorderBottom} ${labelWeight} ${additionalClasses}`}
    >
      {label}
    </Tag>
  );
};
