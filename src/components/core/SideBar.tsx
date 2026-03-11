import type React from "react";
import { Button } from "./Button";
import { ButtonDimensions } from "../../constant/button";

interface SidebarButton<T extends string> {
  key: T;
  label: string;
  icon: string;
}

interface SidebarProps<T extends string> {
  buttons: SidebarButton<T>[];
  activeKey: T;
  onButtonClick: (key: T) => void;
  children?: React.ReactNode;
}

export const SideBar = <T extends string>({
  buttons,
  activeKey,
  onButtonClick,
  children,
}: SidebarProps<T>) => {
  return (
    <aside className="w-60 bg-neutral-900 border-r border-neutral-700 flex flex-col p-2 gap-1 shrink-0 overflow-y-auto">
      {buttons.map(({ key, label, icon }) => (
        <Button
          key={key}
          iconLeft={icon}
          label={label}
          onClick={() => onButtonClick(key)}
          dimension={ButtonDimensions.auto}
          variant="active"
          isActive={activeKey === key}
          className="flex items-center justify-start gap-2 px-2.5 py-2"
        />
      ))}
      {children}
    </aside>
  );
};
