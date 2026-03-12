import { ThemeVariants } from "../../constant/colors";
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
  variant?: "success" | "danger";
  iconLeft?: React.ReactNode;
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
  variant,
  iconLeft,
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
  const variantClass = variant
    ? {
        success: `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.text.success} ${ThemeVariants.colors.border.all.success} ${ThemeVariants.borderRadius.xl} px-4`,
        danger: `${ThemeVariants.colors.bg.danger} ${ThemeVariants.colors.text.danger} ${ThemeVariants.colors.border.all.danger} ${ThemeVariants.borderRadius.xl} px-4`,
      }[variant]
    : "";

  return (
    <Tag
      className={`${variantClass} ${textSize} ${color} ${marginBottom} ${borderClass} ${colorBorderBottom} ${labelWeight} ${additionalClasses} ${fontFamily} flex flex-row items-center ${iconLeft && "gap-1"}`}
    >
      {iconLeft}
      {label}
    </Tag>
  );
};
