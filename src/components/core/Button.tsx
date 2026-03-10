import React from "react";
import { Label } from "./Label";
import type { ButtonDimensionsConst } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";

interface ButtonProps {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick: () => void;
  dimension: ButtonDimensionsConst;
  label?: string | React.ReactNode;
  fullWidth?: boolean;
  variant: "primary" | "secondary" | "icon" | "active";
  className?: string;
  isActive?: boolean;
}

export const Button = ({
  iconLeft,
  iconRight,
  onClick,
  dimension,
  label,
  fullWidth = false,
  variant,
  className = "",
  isActive = false,
}: ButtonProps) => {
  const variantClass = {
    primary: `${ThemeVariants.colors.bg.brand} ${ThemeVariants.colors.text.white} rounded-md`,
    secondary: `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.white} rounded-md`,
    icon: `${ThemeVariants.colors.bg.trasparent}`,
    active: isActive
      ? `${ThemeVariants.colors.text.brand} ${ThemeVariants.colors.border.all.default} ${ThemeVariants.borderRadius.md} ${ThemeVariants.colors.bg.hover}`
      : `${ThemeVariants.colors.text.secondary}`,
  }[variant];

  return (
    <button
      onClick={onClick}
      className={`
        ${dimension}
        flex items-center justify-center gap-1.5
        outline-none cursor-pointer
        ${variantClass}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {iconLeft}
      {typeof label === "string" ? (
        <Label
          label={label}
          tag={LabelTags.p}
          size={LabelDimensions.medium}
          noMargin
          weight={LabelWeight.bold}
          additionalClasses={iconLeft ? "ml-1" : iconRight ? "mr-1" : ""}
        />
      ) : (
        label
      )}
      {iconRight}
    </button>
  );
};
