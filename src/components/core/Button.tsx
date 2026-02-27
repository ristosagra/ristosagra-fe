import React from "react";
import {
  LabelTags,
  TextDimensions,
  TextWeight,
  type ButtonDimensionsConst,
} from "../../types/costant";
import { Label } from "./Label";
import { ColorVariants } from "../../utils/colors";

interface ButtonProps {
  icon?: React.ReactNode;
  onClick: () => void;
  dimension: ButtonDimensionsConst;
  label?: string;
  colorIcon?: string;
  bgColor?: string;
  fullWidth?: boolean;
  borderColor?: string;
  colorLabel?: string;
}

export const Button = ({
  icon,
  onClick,
  dimension,
  label,
  colorIcon,
  bgColor,
  fullWidth,
  borderColor = ColorVariants.border.transparent,
  colorLabel,
}: ButtonProps) => {
  const full = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      className={`${dimension} flex items-center justify-center rounded-lg ${colorIcon} ${bgColor} border ${borderColor} ${full} outline-none cursor-pointer`}
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
