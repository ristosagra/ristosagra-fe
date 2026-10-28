import { useState } from "react";
import {
  ChartColumn,
  ChevronRight,
  Clock,
  Palette,
  Receipt,
  Smartphone,
  Store,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AppearanceSection } from "./profile/AppearanceSection";
import { HoursSection } from "./profile/HoursSection";
import { MenuSection } from "./profile/MenuSection";
import { OrdersSection } from "./profile/OrdersSection";
import { StaffSection } from "./profile/StaffSection";
import { SummarySection } from "./profile/SummarySection";
import { BillingSection } from "./profile/BillingSection";
import { useBilling } from "../../features/platform/hook/useBilling";
import { formatPaidUntil } from "../../features/platform/utils/edition";
import { useMenus } from "../../features/menu/hook/useMenu";
import { activeMenu } from "../../features/menu/utils/menuUtils";
import {
  useOrders,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import { daySummary } from "../../features/orders/utils/daySummary";
import {
  DEFAULT_BRAND_COLOR,
  colorName,
  toBrandHex,
} from "../../features/restaurant/constant/brandColors";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { ORDERING_MODE_LABELS } from "../../features/restaurant/constant/ordering";
import { RestaurantTheme } from "../../features/restaurant/types/restaurant";
import {
  usesCounterPickup,
  usesKitchenDispatch,
} from "../../features/restaurant/utils/ordering";
import { presetOf } from "../../features/restaurant/utils/presets";
import { useStaff } from "../../features/staff/hook/useStaff";
import { ThemeVariants } from "../../constant/colors";
import { WEEKDAYS } from "../../constant/openingHours";
import { PagesProfile, type PagesProfileConst } from "../../constant/pages";
import { openServices } from "../../helpers/openingHours";
import { cn } from "../../helpers/cn";

interface SectionLinkProps {
  icon: React.ReactNode;
  title: string;
  //com'è adesso, in breve
  summary?: string;
  //qualcosa da sistemare (es. nessun menù per oggi)
  warning?: boolean;
  onClick: () => void;
}

//Collegamento a una sezione del profilo
const SectionLink = ({
  icon,
  title,
  summary,
  warning,
  onClick,
}: SectionLinkProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 p-4 text-left cursor-pointer transition-colors hover:bg-[var(--bg-hover)]",
      ThemeVariants.colors.bg.surface,
      ThemeVariants.colors.border.all.default,
      ThemeVariants.borderRadius.lg,
    )}
  >
    <span
      aria-hidden
      className={cn(
        "w-11 h-11 shrink-0 flex items-center justify-center",
        ThemeVariants.borderRadius.md,
        ThemeVariants.colors.bg.hover,
        ThemeVariants.colors.text.brand,
      )}
    >
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block font-semibold">{title}</span>
      <span
        className={cn(
          "block text-sm [overflow-wrap:anywhere]",
          warning
            ? ThemeVariants.colors.text.danger
            : ThemeVariants.colors.text.secondary,
        )}
      >
        {summary ?? "…"}
      </span>
    </span>
    <ChevronRight
      size={20}
      aria-hidden
      className={`shrink-0 ${ThemeVariants.colors.text.secondary}`}
    />
  </button>
);

//Pagina iniziale del profilo: un collegamento per argomento, con com'è adesso in breve
const ProfileHome = ({
  onOpen,
}: {
  onOpen: (section: PagesProfileConst) => void;
}) => {
  const { data: restaurant } = useRestaurant();
  const { data: takeaway } = useTakeawaySettings();
  const { data: staff } = useStaff();
  const { data: menus } = useMenus();
  const { data: orders } = useOrders();
  const { data: billing } = useBilling();

  const openDays = restaurant
    ? WEEKDAYS.filter((d) => openServices(restaurant.openingHours[d]).length)
        .length
    : 0;
  const blocked = staff?.filter((m) => !m.enabled).length ?? 0;
  const todayMenu = menus && activeMenu(menus);
  const today = orders && daySummary(orders, restaurant);
  //modo già pronto scelto (sagra, sagra al tavolo, ristorante), se le scelte sono le sue
  const preset =
    restaurant && takeaway && presetOf(restaurant, takeaway.enabled);

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="flex items-center gap-3 min-w-0 py-3 mb-2 sm:py-4 sm:mb-3">
        <Store
          size={24}
          className={`shrink-0 ${ThemeVariants.colors.text.brand}`}
        />
        <h2 className="flex flex-wrap items-baseline gap-x-2 min-w-0">
          <span className="text-2xl max-sm:text-xl font-bold">Profilo</span>
          {restaurant && (
            <span
              className={`text-2xl max-sm:text-xl italic min-w-0 [overflow-wrap:anywhere] ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
            >
              {restaurant.name}
            </span>
          )}
        </h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <SectionLink
          icon={<ChartColumn size={22} />}
          title="Riepilogo di oggi"
          summary={
            today &&
            (today.orders === 0
              ? "Ancora nessun ordine"
              : `${today.orders === 1 ? "1 ordine" : `${today.orders} ordini`} · €${today.revenue.toFixed(2)} incassati`)
          }
          onClick={() => onOpen(PagesProfile.SUMMARY)}
        />
        <SectionLink
          icon={<Palette size={22} />}
          title="Nome, tema e colore"
          summary={
            restaurant &&
            `${restaurant.name} · tema ${restaurant.theme === RestaurantTheme.Dark ? "scuro" : "chiaro"} · ${colorName(toBrandHex(restaurant.brandColor) ?? DEFAULT_BRAND_COLOR)}`
          }
          onClick={() => onOpen(PagesProfile.APPEARANCE)}
        />
        <SectionLink
          icon={<Clock size={22} />}
          title="Orari e asporto"
          summary={
            restaurant &&
            takeaway &&
            `${openDays === WEEKDAYS.length ? "Aperto tutti i giorni" : openDays === 0 ? "Sempre chiuso" : `Aperto ${openDays} giorni su 7`} · ${takeaway.enabled ? "asporto attivo" : "niente asporto"}`
          }
          warning={!!restaurant && openDays === 0}
          onClick={() => onOpen(PagesProfile.HOURS)}
        />
        <SectionLink
          icon={<Smartphone size={22} />}
          title="Ordini e cucina"
          summary={
            restaurant &&
            (preset
              ? preset.label
              : `${ORDERING_MODE_LABELS[restaurant.orderingMode]} · ${usesCounterPickup(restaurant) ? "ritiro al banco" : "al tavolo"} · ${usesKitchenDispatch(restaurant) ? "smistamento dall'app" : "bigliettini"}`)
          }
          onClick={() => onOpen(PagesProfile.ORDERS)}
        />
        <SectionLink
          icon={<Users size={22} />}
          title="Personale"
          summary={
            staff &&
            `${staff.length === 1 ? "1 persona" : `${staff.length} persone`}${blocked > 0 ? ` · ${blocked} con accesso bloccato` : ""}`
          }
          onClick={() => onOpen(PagesProfile.STAFF)}
        />
        <SectionLink
          icon={<UtensilsCrossed size={22} />}
          title="Menù"
          summary={
            menus &&
            `${menus.length === 1 ? "1 menù" : `${menus.length} menù`} · ${todayMenu ? `oggi: ${todayMenu.name}` : "nessun menù per oggi"}`
          }
          warning={!!menus && !todayMenu}
          onClick={() => onOpen(PagesProfile.MENU)}
        />
        <SectionLink
          icon={<Receipt size={22} />}
          title="Edizione e fattura"
          summary={
            billing &&
            (billing.active && billing.paidUntil
              ? `Attiva fino al ${formatPaidUntil(billing.paidUntil)}`
              : "Non attiva")
          }
          warning={!!billing && !billing.active}
          onClick={() => onOpen(PagesProfile.BILLING)}
        />
      </div>
    </div>
  );
};

//Profilo del ristorante (titolare e vice): una pagina con un collegamento per argomento
//(riepilogo di oggi, nome e aspetto, orari e asporto, ordini e cucina, personale, menù, edizione e fattura). Ogni
//sezione si apre a parte e ha la sua Modifica, che riguarda solo le sue box (il riepilogo si
//legge soltanto)
export const Profile = () => {
  const [section, setSection] = useState<PagesProfileConst | null>(null);
  const back = () => setSection(null);

  switch (section) {
    case PagesProfile.SUMMARY:
      return <SummarySection onBack={back} />;
    case PagesProfile.APPEARANCE:
      return <AppearanceSection onBack={back} />;
    case PagesProfile.HOURS:
      return <HoursSection onBack={back} />;
    case PagesProfile.ORDERS:
      return <OrdersSection onBack={back} />;
    case PagesProfile.STAFF:
      return <StaffSection onBack={back} />;
    case PagesProfile.MENU:
      return <MenuSection onBack={back} />;
    case PagesProfile.BILLING:
      return <BillingSection onBack={back} />;
    default:
      return <ProfileHome onOpen={setSection} />;
  }
};
