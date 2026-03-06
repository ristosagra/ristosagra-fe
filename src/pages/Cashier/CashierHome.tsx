import { House, LandPlot, Wallet } from "lucide-react";
import { NavBar } from "../../components/core/NavBar";
import { useState } from "react";
import { CashierDashboard } from "./CashierDashboard";
import RestaurantFloorPlan from "./RestaurantFloorPlan";
import { PagesCashier, type PagesCashierConst } from "../../constant/pages";

export const CashierHome = () => {
  const [page, setPage] = useState<PagesCashierConst>(PagesCashier.HOME);

  return (
    <div className="min-h-screen min-w-screen h-full overflow-hidden flex flex-col">
      <NavBar>
        <House
          color="black"
          onClick={() => setPage(PagesCashier.HOME)}
          className="cursor-pointer"
        />
        <div className="flex flex-row items-center gap-8">
          <LandPlot
            color="black"
            onClick={() => setPage(PagesCashier.FLORPLAN)}
            className="cursor-pointer"
          />
          <Wallet
            color="black"
            onClick={() => setPage(PagesCashier.CASH)}
            className="cursor-pointer"
          />
        </div>
      </NavBar>
      <main className="flex-1 overflow-hidden bg-gray-500 pt-18">
        {page === PagesCashier.HOME && <div></div>}
        {page === PagesCashier.FLORPLAN && <RestaurantFloorPlan />}
        {page === PagesCashier.CASH && <CashierDashboard />}
      </main>
    </div>
  );
};
