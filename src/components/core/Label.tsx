import { ThemeVariants } from "../../constant/colors";
import {
  LabelDimensions,
  LabelWeight,
  type LabelDimensionsConst,
  type LabelTagsConst,
  type LabelWeightConst,
} from "../../constant/label";
import { cn } from "../../helpers/cn";

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
  size = LabelDimensions.medium,
  noMargin,
  weight = LabelWeight.normal,
  additionalClasses,
  fontFamily,
  variant,
  iconLeft,
}: LabelProps) => {
  const Tag = tag as React.ElementType;
  const variantClass = variant
    ? {
        success: `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.text.success} ${ThemeVariants.colors.border.all.success} ${ThemeVariants.borderRadius.xl} px-4`,
        danger: `${ThemeVariants.colors.bg.danger} ${ThemeVariants.colors.text.danger} ${ThemeVariants.colors.border.all.danger} ${ThemeVariants.borderRadius.xl} px-4`,
      }[variant]
    : undefined;

  return (
    <Tag
      className={cn(
        variantClass,
        size,
        color,
        !noMargin && "mb-6",
        colorBorderBottom && `border-b ${colorBorderBottom}`,
        weight,
        additionalClasses,
        fontFamily,
        "flex flex-row items-center",
        !!iconLeft && "gap-1",
      )}
    >
      {iconLeft}
      {label}
    </Tag>
  );
};
