import { useState } from "react";
import type React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "./Button";
import { ButtonDimensions } from "../../constant/button";
import { cn } from "../../helpers/cn";

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

//Barra degli strumenti: colonna a sinistra sugli schermi grandi; sul cellulare pannello sotto
//la piantina, con gli strumenti in una riga scorrevole e le opzioni che si possono chiudere
export const SideBar = <T extends string>({
  buttons,
  activeKey,
  onButtonClick,
  children,
}: SidebarProps<T>) => {
  const [optionsOpen, setOptionsOpen] = useState(true);

  return (
    <aside className="order-last sm:order-first w-full sm:w-60 max-h-[45dvh] sm:max-h-none bg-neutral-900 border-t sm:border-t-0 sm:border-r border-neutral-700 flex flex-col shrink-0">
      <div className="flex items-center sm:items-stretch shrink-0">
        <div className="flex-1 min-w-0 flex sm:flex-col gap-1 p-2 overflow-x-auto [scrollbar-width:none]">
          {buttons.map(({ key, label, icon }) => (
            <Button
              key={key}
              iconLeft={icon}
              label={label}
              onClick={() => onButtonClick(key)}
              dimension={ButtonDimensions.auto}
              variant="active"
              isActive={activeKey === key}
              className="flex items-center justify-start gap-2 px-2.5 py-2 shrink-0 whitespace-nowrap"
            />
          ))}
        </div>
        {/* Sul cellulare le opzioni si possono chiudere per lasciare più spazio alla piantina */}
        <Button
          iconLeft={
            <ChevronDown
              size={18}
              className={cn(
                "transition-transform",
                !optionsOpen && "rotate-180",
              )}
            />
          }
          onClick={() => setOptionsOpen((o) => !o)}
          dimension={ButtonDimensions.auto}
          variant="icon"
          className="sm:hidden shrink-0 w-10 h-10 mr-1 text-neutral-400 border-l border-neutral-700"
          ariaLabel={optionsOpen ? "Nascondi le opzioni" : "Mostra le opzioni"}
        />
      </div>
      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-1 px-2 pb-2",
          !optionsOpen && "max-sm:hidden",
        )}
      >
        {children}
      </div>
    </aside>
  );
};
