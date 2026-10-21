import {
  ChefHat,
  CirclePlus,
  ConciergeBell,
  LandPlot,
  LogOut,
  Store,
  Wallet,
} from "lucide-react";
import { NavBar, NavGroup, NavItem } from "../../components/core/NavBar";
import { Loader } from "../../components/core/Loader";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { useState } from "react";
import { CashierDashboard } from "./CashierDashboard";
import { Kitchen } from "./Kitchen";
import { NewOrder } from "./NewOrder";
import { Pickup } from "./Pickup";
import RestaurantFloorPlan from "./RestaurantFloorPlan";
import { PagesCashier, type PagesCashierConst } from "../../constant/pages";
import { ThemeVariants } from "../../constant/colors";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { STAFF_ROLE_LABELS } from "../../features/staff/types/staff";
import {
  canEditFloorPlan,
  staffHomePage,
  staffPages,
} from "../../features/staff/utils/permissions";
import { useCurrentUser } from "../../hooks/useAuth";
import { useLogout } from "../../hooks/useLogout";
import { Profile } from "./Profile";

//Voci della barra (il profilo è a parte: a sinistra, col nome del locale)
const NAV_ITEMS: Partial<
  Record<
    PagesCashierConst,
    { icon: React.ReactNode; label: string; desktopLabel?: string }
  >
> = {
  [PagesCashier.FLORPLAN]: { icon: <LandPlot size={22} />, label: "Piantina" },
  [PagesCashier.NEW_ORDER]: {
    icon: <CirclePlus size={22} />,
    label: "Nuovo",
    desktopLabel: "Nuovo ordine",
  },
  [PagesCashier.CASH]: { icon: <Wallet size={22} />, label: "Ordini" },
  [PagesCashier.KITCHEN]: { icon: <ChefHat size={22} />, label: "Cucina" },
  [PagesCashier.PICKUP]: { icon: <ConciergeBell size={22} />, label: "Ritiro" },
};

//Area del personale: ognuno vede solo le pagine del suo ruolo, adattate a come
//l'amministratore fa funzionare il ristorante (vedi features/staff/utils/permissions.ts)
export const CashierHome = () => {
  const [page, setPage] = useState<PagesCashierConst | null>(null);
  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: retryUser,
  } = useCurrentUser();
  const { data: restaurant, isLoading: restaurantLoading } = useRestaurant();
  const logout = useLogout();

  //Senza sapere chi è entrato non si sa cosa mostrare
  if (!user && userError)
    return (
      <div className="h-dvh flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p className={ThemeVariants.colors.text.danger}>
          Impossibile verificare l'accesso: controlla la connessione
        </p>
        <div className="flex gap-2">
          <Button
            label="Riprova"
            onClick={() => retryUser()}
            dimension={ButtonDimensions.auto}
            variant="primary"
            className="px-4 py-2"
          />
          <Button
            label="Esci"
            onClick={logout}
            dimension={ButtonDimensions.auto}
            variant="secondary"
            className="px-4 py-2"
          />
        </div>
      </div>
    );
  if (!user || userLoading || restaurantLoading) return <Loader />;

  const pages = staffPages(user.role, restaurant);
  //una pagina non più permessa (es. l'amministratore ha cambiato le impostazioni) riporta alla prima
  const home = staffHomePage(user.role);
  const current =
    page && pages.includes(page)
      ? page
      : pages.includes(home)
        ? home
        : pages[0];
  const who = `${user.name} · ${STAFF_ROLE_LABELS[user.role]}`;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <NavBar>
        {pages.includes(PagesCashier.PROFILE) ? (
          //Il nome del locale apre il profilo del ristorante (solo amministratore)
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
            active={current === PagesCashier.PROFILE}
          />
        ) : (
          //Gli altri vedono il locale e chi ha fatto l'accesso
          <div className="hidden sm:flex flex-col min-w-0 leading-tight">
            <span
              className={`text-lg italic truncate max-w-64 ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
            >
              {restaurant?.name}
            </span>
            <span
              className={`text-sm truncate ${ThemeVariants.colors.text.secondary}`}
            >
              {who}
            </span>
          </div>
        )}
        <NavGroup>
          {pages.map((p) => {
            const item = NAV_ITEMS[p];
            return (
              item && (
                <NavItem
                  key={p}
                  icon={item.icon}
                  label={item.label}
                  desktopLabel={item.desktopLabel}
                  ariaLabel={item.desktopLabel}
                  onClick={() => setPage(p)}
                  active={current === p}
                />
              )
            );
          })}
          <NavItem
            icon={<LogOut size={22} />}
            label="Esci"
            onClick={logout}
            ariaLabel={`Esci (${who})`}
          />
        </NavGroup>
      </NavBar>
      <main
        className={`${ThemeVariants.colors.bg.base} flex-1 min-h-0 overflow-hidden`}
      >
        {current === PagesCashier.PROFILE && <Profile />}
        {current === PagesCashier.FLORPLAN && (
          <RestaurantFloorPlan canEditLayout={canEditFloorPlan(user.role)} />
        )}
        {current === PagesCashier.NEW_ORDER && <NewOrder role={user.role} />}
        {current === PagesCashier.CASH && <CashierDashboard />}
        {current === PagesCashier.KITCHEN && <Kitchen role={user.role} />}
        {current === PagesCashier.PICKUP && <Pickup />}
        {/* Es. Banco ritiro mentre l'ordine si porta al tavolo: per ora nessuna pagina */}
        {!current && (
          <p
            className={`h-full flex items-center justify-center p-6 text-center ${ThemeVariants.colors.text.secondary}`}
          >
            Con le impostazioni attuali del ristorante non ci sono pagine per il
            tuo ruolo.
          </p>
        )}
      </main>
    </div>
  );
};
