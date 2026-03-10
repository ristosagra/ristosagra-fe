import React from "react";
import { ThemeVariants } from "../../constant/colors";

export const NavBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <header
      className={`${ThemeVariants.colors.bg.surface} 
      ${ThemeVariants.colors.border.bottom.default} 
      flex 
      flex-row 
      items-center 
      justify-between 
      h-18
      px-4
      fixed 
      w-full 
      top-0 
      z-10 
      shrink-0`}
    >
      {children}
    </header>
  );
};
