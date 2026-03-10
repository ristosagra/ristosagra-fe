import { House, LandPlot, Wallet } from "lucide-react";
import { NavBar } from "../../components/core/NavBar";
import { useState } from "react";
import { CashierDashboard } from "./CashierDashboard";
import RestaurantFloorPlan from "./RestaurantFloorPlan";
import { PagesCashier, type PagesCashierConst } from "../../constant/pages";
import { ThemeVariants } from "../../constant/colors";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";

export const CashierHome = () => {
  const [page, setPage] = useState<PagesCashierConst>(PagesCashier.HOME);

  return (
    <div className="min-h-screen min-w-screen h-full overflow-hidden flex flex-col">
      <NavBar>
        <Button
          iconLeft={<House size={24} />}
          dimension={ButtonDimensions.auto}
          onClick={() => setPage(PagesCashier.HOME)}
          variant="active"
          isActive={page === PagesCashier.HOME}
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
        {page === PagesCashier.HOME && <div></div>}
        {page === PagesCashier.FLORPLAN && <RestaurantFloorPlan />}
        {page === PagesCashier.CASH && <CashierDashboard />}
      </main>
    </div>
  );
};
