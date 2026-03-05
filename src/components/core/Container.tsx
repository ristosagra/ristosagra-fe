import React from "react";

interface ContainerProps {
  children?: React.ReactNode;
  additionalClass?: string;
}

export const Container = ({ children, additionalClass }: ContainerProps) => {
  return (
    <div className={`w-full h-full overflow-y-auto ${additionalClass}`}>
      {children}
    </div>
  );
};
