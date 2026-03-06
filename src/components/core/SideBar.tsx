import type React from "react";

interface SidebarButton<T extends string> {
  key: T;
  label: string;
  icon: string;
  color: string;
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
      {buttons.map(({ key, label, icon, color }) => (
        <button
          key={key}
          onClick={() => onButtonClick(key)}
          className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all border
            ${
              activeKey === key
                ? `${color} text-white border-white/20 shadow-lg`
                : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700"
            }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
      {children}
    </aside>
  );
};
