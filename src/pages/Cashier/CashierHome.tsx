import { LandPlot, Store, Wallet } from "lucide-react";
import { NavBar } from "../../components/core/NavBar";
import { useState } from "react";
import { CashierDashboard } from "./CashierDashboard";
import RestaurantFloorPlan from "./RestaurantFloorPlan";
import { PagesCashier, type PagesCashierConst } from "../../constant/pages";
import { ThemeVariants } from "../../constant/colors";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { Profile } from "./Profile";

export const CashierHome = () => {
  const [page, setPage] = useState<PagesCashierConst>(PagesCashier.PROFILE);
  const { data: restaurant } = useRestaurant();

  return (
    <div className="min-h-screen min-w-screen h-full overflow-hidden flex flex-col">
      <NavBar>
        {/* Il nome del locale apre il profilo del ristorante */}
        <Button
          iconLeft={<Store size={24} />}
          label={
            <span
              className={`ml-2 text-lg italic max-w-64 truncate ${ThemeVariants.fontFamily.display}`}
            >
              {restaurant?.name ?? "Profilo"}
            </span>
          }
          dimension={ButtonDimensions.auto}
          onClick={() => setPage(PagesCashier.PROFILE)}
          variant="active"
          isActive={page === PagesCashier.PROFILE}
          className="px-2 py-2 cursor-pointer"
        />
        <div className="flex flex-row items-center gap-8">
          <Button
            iconLeft={<LandPlot size={24} />}
            label="Piantina"
            dimension={ButtonDimensions.auto}
            onClick={() => setPage(PagesCashier.FLORPLAN)}
            variant="active"
            isActive={page === PagesCashier.FLORPLAN}
            className="px-2 py-2 cursor-pointer"
          />
          <Button
            iconLeft={<Wallet size={24} />}
            label="Ordini"
            dimension={ButtonDimensions.auto}
            onClick={() => setPage(PagesCashier.CASH)}
            variant="active"
            isActive={page === PagesCashier.CASH}
            className="px-2 py-2 cursor-pointer"
          />
        </div>
      </NavBar>
      <main
        className={`${ThemeVariants.colors.bg.base} flex-1 overflow-hidden pt-16 pb-10`}
      >
        {page === PagesCashier.PROFILE && <Profile />}
        {page === PagesCashier.FLORPLAN && <RestaurantFloorPlan />}
        {page === PagesCashier.CASH && <CashierDashboard />}
      </main>
    </div>
  );
};
