import {
  TextDimensions,
  TextWeight,
  type LabelTagsConst,
  type TextDimensionsConst,
  type TextWeightConst,
} from "../../types/costant";
import {
  ColorVariants,
  type BorderColor,
  type TextColor,
} from "../../utils/colors";

export interface LabelProps {
  label: string;
  color?: TextColor;
  colorBorderBottom?: BorderColor;
  tag: LabelTagsConst;
  size?: TextDimensionsConst;
  noMargin?: boolean;
  weight?: TextWeightConst;
  additionalClasses?: string;
}

export const Label = ({
  label,
  color,
  colorBorderBottom,
  tag,
  size,
  noMargin,
  weight,
  additionalClasses
}: LabelProps) => {
  const Tag = tag as React.ElementType;
  const borderClass = colorBorderBottom ? "border-b" : "";
  const textColor = ColorVariants.text[color || "white"];
  const colorBorder = ColorVariants.border[colorBorderBottom || "grayLight"];
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
      className={`${textSize} ${textColor} ${marginBottom} ${borderClass} ${colorBorder} ${textWeight} ${additionalClasses}`}
    >
      {label}
    </Tag>
  );
};
