import React from "react";
import { cn } from "../../helpers/cn";

interface ContainerProps {
  children?: React.ReactNode;
  additionalClass?: string;
}

export const Container = ({ children, additionalClass }: ContainerProps) => {
  return (
    <div className={cn("w-full h-full overflow-y-auto", additionalClass)}>
      {children}
    </div>
  );
};
