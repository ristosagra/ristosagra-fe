import {
  TextDimensions,
  TextWeight,
  type LabelTagsConst,
  type TextDimensionsConst,
  type TextWeightConst,
} from "../../types/costant";
import {
  ColorVariants,
} from "../../utils/colors";

export interface LabelProps {
  label: string;
  color?: string;
  colorBorderBottom?: string;
  tag: LabelTagsConst;
  size?: TextDimensionsConst;
  noMargin?: boolean;
  weight?: TextWeightConst;
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
  additionalClasses = ""
}: LabelProps) => {
  const Tag = tag as React.ElementType;
  const borderClass = colorBorderBottom ? "border-b" : "";
  const textSize = size ?? TextDimensions.medium;
  const textWeight = weight ?? TextWeight.normal;
  const marginBottom = noMargin
    ? ""
    : TextDimensions.large
      ? "mb-6"
      : TextDimensions.medium
        ? "mb-4"
        : "mb-2";

  return (
    <Tag
      className={`${textSize} ${color} ${marginBottom} ${borderClass} ${colorBorderBottom} ${textWeight} ${additionalClasses}`}
    >
      {label}
    </Tag>
  );
};
