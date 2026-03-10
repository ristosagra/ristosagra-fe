import React from "react";
import { ThemeVariants } from "../../constant/colors";

export const CardContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={`p-4 flex flex-col gap-3 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.xl} ${ThemeVariants.colors.border.all.default}`}
    >
      {children}
    </div>
  );
};
