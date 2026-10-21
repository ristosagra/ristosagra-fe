import { useState } from "react";
import {
  useOrders,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import { useMenu } from "../../features/menu/hook/useMenu";
import { Label } from "../../components/core/Label";
import { Container } from "../../components/core/Container";
import {
  HandCoins,
  LoaderCircle,
  ReceiptText,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { TableBills } from "../../features/orders/components/TableBills";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";
import { OrderType, type Order } from "../../features/orders/types/orders";
import { OrderCard } from "../../features/orders/components/OrderCard";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { OrderingMode } from "../../features/restaurant/types/restaurant";
import { isPayFirstAtCashier } from "../../features/restaurant/utils/ordering";

//Quali liste mostrare: entrambe, solo asporto o solo ordini sul posto
const OrdersFilter = {
  All: "all",
  Takeaway: "takeaway",
  DineIn: "dinein",
} as const;
type OrdersFilterConst = (typeof OrdersFilter)[keyof typeof OrdersFilter];

const FILTERS: { key: OrdersFilterConst; label: string }[] = [
  { key: OrdersFilter.All, label: "Tutti" },
  { key: OrdersFilter.Takeaway, label: "Asporto" },
  { key: OrdersFilter.DineIn, label: "In loco" },
];

//Elenco degli ordini oppure conti da incassare raggruppati per tavolo
const OrdersView = { List: "list", Bills: "bills" } as const;
type OrdersViewConst = (typeof OrdersView)[keyof typeof OrdersView];

export const CashierDashboard = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrdersFilterConst>(OrdersFilter.All);
  const [view, setView] = useState<OrdersViewConst>(OrdersView.List);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: takeawaySettings, isLoading: takeawayLoading } =
    useTakeawaySettings();
  const { data: menu = [] } = useMenu();
  const { data: restaurant } = useRestaurant();
  //Col pagamento online gli ordini sono già pagati dal sito: la cassa li vede soltanto
  const readOnly = restaurant?.orderingMode === OrderingMode.PayOnline;
  //Con l'asporto disattivato si vedono solo gli ordini in loco, senza filtri
  const takeawayEnabled = !!takeawaySettings?.enabled;
  const isLoading = ordersLoading || takeawayLoading;
  //I conti per tavolo servono quando si paga alla cassa a fine pasto (tipo ristorante)
  const hasBills = !readOnly && !isPayFirstAtCashier(restaurant);
  const showBills = hasBills && view === OrdersView.Bills;

  const q = search.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      order.orderNumber.toString().includes(q) ||
      (order.customerName ?? "").toLowerCase().includes(q) ||
      (order.table ?? "").toLowerCase().includes(q),
  );
  //Asporti in ordine di orario di ritiro
  const takeaway = filtered
    .filter((o) => o.type === OrderType.Takeaway)
    .sort((a, b) => (a.pickupTime ?? "").localeCompare(b.pickupTime ?? ""));
  const dineIn = filtered.filter((o) => o.type !== OrderType.Takeaway);

  const showTakeaway = takeawayEnabled && filter !== OrdersFilter.DineIn;
  const showDineIn = !takeawayEnabled || filter !== OrdersFilter.Takeaway;

  const renderList = (
    title: string,
    icon: React.ReactNode,
    list: Order[],
    editable: boolean,
  ) => (
    <section className="flex flex-col min-h-0">
      <Label
        label={`${title} (${list.length})`}
        iconLeft={icon}
        tag={LabelTags.h2}
        size={LabelDimensions.large}
        weight={LabelWeight.bold}
        noMargin
        additionalClasses="mb-3 gap-2"
      />
      <div className="flex flex-col gap-2">
        {list.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            expanded={expandedId === order.id}
            onToggleExpand={() =>
              setExpandedId(expandedId === order.id ? null : order.id)
            }
            menu={editable ? menu : undefined}
            readOnly={readOnly}
          />
        ))}
        {list.length === 0 && (
          <Label
            label="Nessun ordine"
            tag={LabelTags.p}
            size={LabelDimensions.medium}
            color={ThemeVariants.colors.text.secondary}
            noMargin
            additionalClasses="py-6 justify-center"
          />
        )}
      </div>
    </section>
  );

  return (
    //Sul cellulare l'intestazione scorre via con la lista: gli ordini hanno tutto lo schermo
    <Container additionalClass="flex flex-col h-full sm:overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 w-full p-4 sm:p-5 shrink-0">
        <div className="flex-1 min-w-0">
          <Label
            label="Ordini"
            tag={LabelTags.h1}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            color={ThemeVariants.colors.text.brand}
            fontFamily={ThemeVariants.fontFamily.display}
            noMargin
          />
          {readOnly ? (
            <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
              Sola lettura: i clienti pagano dal sito
            </p>
          ) : (
            isPayFirstAtCashier(restaurant) && (
              <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
                Gli ordini vanno in cucina quando li segni pagati
              </p>
            )
          )}
        </div>
        {hasBills && (
          <div
            role="tablist"
            aria-label="Vista"
            className={`flex p-0.5 ${ThemeVariants.borderRadius.md} ${ThemeVariants.colors.border.all.default}`}
          >
            {[
              {
                key: OrdersView.List,
                label: "Ordini",
                icon: <ReceiptText size={15} />,
              },
              {
                key: OrdersView.Bills,
                label: "Conti",
                icon: <HandCoins size={15} />,
              },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => setView(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold cursor-pointer ${ThemeVariants.borderRadius.sm} ${
                  view === key
                    ? `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.brand}`
                    : ThemeVariants.colors.text.secondary
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {takeawayEnabled && !showBills && (
            <div className="flex gap-1">
              {FILTERS.map(({ key, label }) => (
                <Button
                  key={key}
                  label={<span className="text-sm font-bold">{label}</span>}
                  onClick={() => setFilter(key)}
                  dimension={ButtonDimensions.auto}
                  variant={filter === key ? "primary" : "secondary"}
                  className="px-3 py-2"
                />
              ))}
            </div>
          )}
          <Input
            type="search"
            placeholder="Cerca numero, nome o tavolo..."
            value={search}
            setValue={setSearch}
            className="w-full sm:w-56"
          />
        </div>
      </div>
      <div className="sm:flex-1 sm:overflow-y-auto px-4 sm:px-5 pb-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle
              size={32}
              aria-label="Caricamento"
              className={`animate-spin ${ThemeVariants.colors.text.brand}`}
            />
          </div>
        ) : showBills ? (
          <TableBills orders={filtered} />
        ) : (
          /* Asporto e ordini sul posto in due liste separate */
          <div
            className={`grid gap-6 ${showTakeaway && showDineIn ? "lg:grid-cols-2" : ""}`}
          >
            {showTakeaway &&
              renderList("Asporto", <ShoppingBag size={20} />, takeaway, true)}
            {showDineIn &&
              renderList(
                "In loco",
                <UtensilsCrossed size={20} />,
                dineIn,
                false,
              )}
          </div>
        )}
      </div>
    </Container>
  );
};
