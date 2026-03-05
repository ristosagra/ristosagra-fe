import React from "react";

export const NavBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <header className="flex flex-row items-center justify-between py-6 px-4 bg-gray-100 fixed w-full top-0 z-10 shrink-0">
      {children}
    </header>
  );
};
