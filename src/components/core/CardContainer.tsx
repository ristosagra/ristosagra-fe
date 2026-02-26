import React from "react";

export const CardContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="p-4 bg-white rounded-2xl flex flex-col gap-3 shadow-md">
      {children}
    </div>
  );
};
