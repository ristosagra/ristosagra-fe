import React from "react";
import { Label } from "./Label";
import type { ButtonDimensionsConst } from "../../constant/button";
import { LabelDimensions, LabelTags } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";

interface ButtonProps {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick: () => void;
  dimension: ButtonDimensionsConst;
  label?: string | React.ReactNode;
  fullWidth?: boolean;
  variant: "primary" | "secondary" | "icon" | "active" | "success" | "danger";
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
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
  disabled = false,
}: ButtonProps) => {
  const variantClass = {
    primary: `${ThemeVariants.colors.bg.brand} ${ThemeVariants.colors.text.white} rounded-md font-bold`,
    secondary: `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.white} rounded-md font-bold`,
    success: `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.border.all.success} ${ThemeVariants.colors.text.white} rounded-md font-bold`,
    danger: `${ThemeVariants.colors.bg.danger} ${ThemeVariants.colors.border.all.danger} ${ThemeVariants.colors.text.white} rounded-md font-bold`,
    icon: `${ThemeVariants.colors.bg.trasparent} font-normal`,
    active: isActive
      ? `${ThemeVariants.colors.text.brand} ${ThemeVariants.colors.border.all.default} ${ThemeVariants.borderRadius.md} ${ThemeVariants.colors.bg.hover} font-bold`
      : `${ThemeVariants.colors.text.secondary} font-bold`,
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
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
          additionalClasses={iconLeft ? "ml-1" : iconRight ? "mr-1" : ""}
        />
      ) : (
        label
      )}
      {iconRight}
    </button>
  );
};
