import React from "react";
import {
  LabelTags,
  TextDimensions,
  TextWeight,
  type ButtonDimensionsConst,
} from "../../types/costant";
import {
  Colors,
  ColorVariants,
  type BgColor,
  type BorderColor,
  type TextColor,
} from "../../utils/colors";
import { Label } from "./Label";

interface ButtonProps {
  icon?: React.ReactNode;
  onClick: () => void;
  dimension: ButtonDimensionsConst;
  label?: string;
  colorIcon?: TextColor;
  bgColor?: BgColor;
  fullWidth?: boolean;
  borderColor?: BorderColor;
  colorLabel?: TextColor;
}

export const Button = ({
  icon,
  onClick,
  dimension,
  label,
  colorIcon,
  bgColor,
  fullWidth,
  borderColor,
  colorLabel,
}: ButtonProps) => {
  const textColor = ColorVariants.text[colorIcon || Colors.text.white];
  const bgColorIcon = ColorVariants.bg[bgColor || Colors.bg.transparent];
  const borderColorClass = borderColor
    ? `border ${ColorVariants.border[borderColor]}`
    : "";
  const full = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      className={`${dimension} flex items-center justify-center rounded-lg ${textColor} ${bgColorIcon} ${borderColorClass} ${full} outline-none`}
    >
      {icon}
      {label && (
        <Label
          label={label}
          tag={LabelTags.p}
          size={TextDimensions.medium}
          noMargin
          weight={TextWeight.bold}
          color={colorLabel}
          additionalClasses={icon ? "ml-1" : ""}
        />
      )}
    </button>
  );
};
