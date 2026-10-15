import { LandPlot, LogOut, Store, Wallet } from "lucide-react";
import { NavBar, NavGroup, NavItem } from "../../components/core/NavBar";
import { useState } from "react";
import { CashierDashboard } from "./CashierDashboard";
import RestaurantFloorPlan from "./RestaurantFloorPlan";
import { PagesCashier, type PagesCashierConst } from "../../constant/pages";
import { ThemeVariants } from "../../constant/colors";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { useLogout } from "../../hooks/useLogout";
import { Profile } from "./Profile";

export const CashierHome = () => {
  const [page, setPage] = useState<PagesCashierConst>(PagesCashier.PROFILE);
  const { data: restaurant } = useRestaurant();
  const logout = useLogout();

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <NavBar>
        {/* Il nome del locale apre il profilo del ristorante */}
        <NavItem
          icon={<Store size={22} />}
          label="Profilo"
          desktopLabel={
            <span
              className={`text-lg italic font-normal max-w-64 truncate ${ThemeVariants.fontFamily.display}`}
            >
              {restaurant?.name ?? "Profilo"}
            </span>
          }
          onClick={() => setPage(PagesCashier.PROFILE)}
          active={page === PagesCashier.PROFILE}
        />
        <NavGroup>
          <NavItem
            icon={<LandPlot size={22} />}
            label="Piantina"
            onClick={() => setPage(PagesCashier.FLORPLAN)}
            active={page === PagesCashier.FLORPLAN}
          />
          <NavItem
            icon={<Wallet size={22} />}
            label="Ordini"
            onClick={() => setPage(PagesCashier.CASH)}
            active={page === PagesCashier.CASH}
          />
          <NavItem
            icon={<LogOut size={22} />}
            label="Esci"
            onClick={logout}
            ariaLabel="Esci dalla cassa"
          />
        </NavGroup>
      </NavBar>
      <main
        className={`${ThemeVariants.colors.bg.base} flex-1 min-h-0 overflow-hidden`}
      >
        {page === PagesCashier.PROFILE && <Profile />}
        {page === PagesCashier.FLORPLAN && <RestaurantFloorPlan />}
        {page === PagesCashier.CASH && <CashierDashboard />}
      </main>
    </div>
  );
};
