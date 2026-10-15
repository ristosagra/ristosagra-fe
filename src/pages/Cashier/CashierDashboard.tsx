import { useState } from "react";
import { useOrders } from "../../features/orders/hook/useOrders";
import { useMenu } from "../../features/menu/hook/useMenu";
import { Label } from "../../components/core/Label";
import { Container } from "../../components/core/Container";
import { LoaderCircle, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";
import { OrderType, type Order } from "../../features/orders/types/orders";
import { OrderCard } from "../../features/orders/components/OrderCard";

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

export const CashierDashboard = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrdersFilterConst>(OrdersFilter.All);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: orders = [], isLoading } = useOrders();
  const { data: menu = [] } = useMenu();

  const q = search.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      order.orderNumber.toString().includes(q) ||
      (order.customerName ?? "").toLowerCase().includes(q),
  );
  //Asporti in ordine di orario di ritiro
  const takeaway = filtered
    .filter((o) => o.type === OrderType.Takeaway)
    .sort((a, b) => (a.pickupTime ?? "").localeCompare(b.pickupTime ?? ""));
  const dineIn = filtered.filter((o) => o.type !== OrderType.Takeaway);

  const showTakeaway = filter !== OrdersFilter.DineIn;
  const showDineIn = filter !== OrdersFilter.Takeaway;

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
    <Container additionalClass="flex flex-col h-full overflow-hidden">
      <div className="flex flex-row flex-wrap items-center justify-between gap-3 w-full p-4 sm:p-5 shrink-0">
        <Label
          label="Ordini"
          tag={LabelTags.h1}
          size={LabelDimensions.xlarge}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.brand}
          fontFamily={ThemeVariants.fontFamily.display}
          noMargin
        />
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
          <Input
            type="search"
            placeholder="Cerca numero o nome..."
            value={search}
            setValue={setSearch}
            className="w-full sm:w-56"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle
              size={32}
              aria-label="Caricamento"
              className={`animate-spin ${ThemeVariants.colors.text.brand}`}
            />
          </div>
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
