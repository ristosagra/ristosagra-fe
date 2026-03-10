import {
  LabelDimensions,
  LabelWeight,
  type LabelDimensionsConst,
  type LabelTagsConst,
  type LabelWeightConst,
} from "../../constant/label";

export interface LabelProps {
  label: string;
  color?: string;
  colorBorderBottom?: string;
  tag: LabelTagsConst;
  size?: LabelDimensionsConst;
  noMargin?: boolean;
  weight?: LabelWeightConst;
  additionalClasses?: string;
  fontFamily?: string;
}

export const Label = ({
  label,
  color,
  colorBorderBottom,
  tag,
  size,
  noMargin,
  weight,
  additionalClasses = "",
  fontFamily,
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
      className={`${textSize} ${color} ${marginBottom} ${borderClass} ${colorBorderBottom} ${labelWeight} ${additionalClasses} ${fontFamily}`}
    >
      {label}
    </Tag>
  );
};
