import React from "react";
import { Label } from "./Label";
import { ColorVariants } from "../../constant/colors";
import type { ButtonDimensionsConst } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";

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
          size={LabelDimensions.medium}
          noMargin
          weight={LabelWeight.bold}
          color={colorLabel}
          additionalClasses={icon ? "ml-1" : ""}
        />
      )}
    </button>
  );
};
