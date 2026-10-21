import React from "react";
import { ThemeVariants } from "../../constant/colors";
import { cn } from "../../helpers/cn";

//Barra di navigazione: in alto sugli schermi grandi, in basso (a portata di pollice) sul cellulare.
//Va messa in un contenitore flex in colonna: l'ordine CSS la sposta sopra o sotto il contenuto.
export const NavBar = ({ children }: { children: React.ReactNode }) => {
  return (
    <nav
      className={cn(
        ThemeVariants.colors.bg.surface,
        "order-last sm:order-first shrink-0 z-10",
        "border-t border-t-[var(--border)] sm:border-t-0 sm:border-b sm:border-b-[var(--border)]",
        "pb-[env(safe-area-inset-bottom)] sm:pb-0",
      )}
    >
      <div className="flex items-stretch sm:items-center justify-around sm:justify-between h-16 sm:h-18 px-1 sm:px-4">
        {children}
      </div>
    </nav>
  );
};

//Voci allineate a destra sugli schermi grandi; sul cellulare si distribuiscono su tutta la barra
export const NavGroup = ({ children }: { children: React.ReactNode }) => (
  <div className="contents sm:flex sm:items-center sm:gap-2">{children}</div>
);

interface NavItemProps {
  icon: React.ReactNode;
  //etichetta sotto l'icona sul cellulare
  label: React.ReactNode;
  //etichetta accanto all'icona sugli schermi grandi (null = solo icona); se manca si usa label
  desktopLabel?: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  //numero mostrato sull'icona (es. articoli nel carrello)
  badge?: number;
  ariaLabel?: string;
  className?: string;
}

export const NavItem = ({
  icon,
  label,
  desktopLabel,
  onClick,
  active = false,
  badge = 0,
  ariaLabel,
  className,
}: NavItemProps) => {
  const wide = desktopLabel === undefined ? label : desktopLabel;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        "flex flex-1 sm:flex-none flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 min-w-0",
        "px-1 sm:px-3 sm:py-2 cursor-pointer font-bold text-[11px] leading-tight sm:text-base",
        //telefoni stretti (es. 320 px) con molte voci: etichette un filo più piccole, per non tagliarle
        "max-[359px]:px-0 max-[359px]:text-[10px]",
        "sm:border",
        ThemeVariants.borderRadius.md,
        active
          ? `${ThemeVariants.colors.text.brand} sm:bg-[var(--bg-hover)] sm:border-[var(--border)]`
          : `${ThemeVariants.colors.text.secondary} sm:border-transparent`,
        className,
      )}
    >
      <span className="relative flex shrink-0">
        {icon}
        {badge > 0 && (
          <span
            className={`absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.bg.brand} text-white text-[9px] font-bold flex items-center justify-center leading-none`}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className="sm:hidden truncate max-w-full">{label}</span>
      {wide !== null && (
        <span className="hidden sm:flex items-center min-w-0">{wide}</span>
      )}
    </button>
  );
};
