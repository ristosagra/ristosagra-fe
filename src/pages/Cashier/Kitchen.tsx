import { Spinner } from "../../components/core/Spinner";
import { useState } from "react";
import { CollapsibleSection } from "../../components/core/CollapsibleSection";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { useOrders } from "../../features/orders/hook/useOrders";
import type { Order } from "../../features/orders/types/orders";
import { matchesSearch } from "../../features/orders/utils/orderPlace";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { usesKitchenDispatch } from "../../features/restaurant/utils/ordering";
import { KitchenOrderCard } from "../../features/kitchen/components/KitchenOrderCard";
import { DispatchBoard } from "../../features/kitchen/components/DispatchBoard";
import { StationBoard } from "../../features/kitchen/components/StationBoard";
import {
  BUSY_STATION_BACKLOG,
  byQueue,
  kitchenOrders,
  queueTime,
  stationBacklog,
  unsentLines,
} from "../../features/kitchen/utils/kitchen";
import {
  canDispatch,
  canMarkSoldOut,
  kitchenReadOnly,
} from "../../features/staff/utils/permissions";
import { SoldOutButton } from "../../features/menu/components/SoldOutButton";
import type { StaffRoleConst } from "../../features/staff/types/staff";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { cn } from "../../helpers/cn";
import { usePersistentState } from "../../hooks/usePersistentState";

//Le comande si rileggono spesso, per vedere subito quelle nuove
const KITCHEN_REFRESH_MS = 10000;

//Scheda dello smistamento (le altre sono gli id delle postazioni)
const DISPATCH_TAB = "dispatch";

const GRID = "grid gap-3 sm:grid-cols-2 xl:grid-cols-3";

const isString = (v: unknown): v is string => typeof v === "string";

//Cucina senza smistamento: tutte le comande, dalla prima in coda, poi quelle pronte
const SimpleKitchen = ({
  orders,
  queuedAt,
  readOnly,
}: {
  orders: Order[];
  queuedAt: (o: Order) => string;
  readOnly: boolean;
}) => {
  const toPrepare = orders.filter((o) => !o.readyAt);
  const ready = orders
    .filter((o) => o.readyAt)
    .sort((a, b) => (b.readyAt ?? "").localeCompare(a.readyAt ?? ""));

  return (
    <div className="flex flex-col gap-6">
      {toPrepare.length === 0 ? (
        <p
          className={`py-10 text-center ${ThemeVariants.colors.text.secondary}`}
        >
          Nessuna comanda da preparare
        </p>
      ) : (
        <div className={GRID}>
          {toPrepare.map((o) => (
            <KitchenOrderCard
              key={o.id}
              order={o}
              queuedAt={queuedAt(o)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {ready.length > 0 && (
        <CollapsibleSection title={`Pronte (${ready.length})`}>
          <div className={GRID}>
            {ready.map((o) => (
              <KitchenOrderCard
                key={o.id}
                order={o}
                queuedAt={queuedAt(o)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

//Cucina. Senza smistamento tutti vedono tutte le comande. Con lo smistamento il capo cucina
//(e titolare/vice) le manda alle postazioni dalla scheda Smistamento; ogni postazione ha la sua
//scheda, scelta una volta sul dispositivo. Se si paga prima, solo gli ordini pagati. Il caposala
//vede tutto (Smistamento compreso) in sola lettura. Si cerca per nome, tavolo o numero; il capo
//cucina (e titolare/vice) segna i piatti esauriti
export const Kitchen = ({ role }: { role: StaffRoleConst }) => {
  const { data: orders = [], isLoading } = useOrders(KITCHEN_REFRESH_MS);
  const { data: restaurant } = useRestaurant();
  const [search, setSearch] = useState("");
  const readOnly = kitchenReadOnly(role);
  //scheda scelta su questo dispositivo (es. il tablet della griglia)
  const [savedTab, setTab] = usePersistentState<string>(
    "ristosagra.kitchenTab",
    DISPATCH_TAB,
    { validate: isString },
  );

  const visible = kitchenOrders(orders, restaurant).sort(byQueue(restaurant));
  const dispatch = usesKitchenDispatch(restaurant);
  const stations = restaurant?.kitchenStations ?? [];
  const tabs = [
    ...(canDispatch(role) || readOnly
      ? [
          {
            id: DISPATCH_TAB,
            label: "Smistamento",
            count: visible.filter(
              (o) => !o.readyAt && unsentLines(o, stations).length > 0,
            ).length,
            busy: false,
          },
        ]
      : []),
    ...stations.map((s) => {
      const count = stationBacklog(visible, s.id);
      return {
        id: s.id,
        label: s.name,
        count,
        //postazione carica: il capo cucina la vede in rosso
        busy: count >= BUSY_STATION_BACKLOG,
      };
    }),
  ];
  const tab = tabs.some((t) => t.id === savedTab) ? savedTab : tabs[0]?.id;
  const waiting = dispatch
    ? (tabs.find((t) => t.id === tab)?.count ?? 0)
    : visible.filter((o) => !o.readyAt).length;

  return (
    <div className="h-full overflow-y-auto px-4 sm:px-5 pb-5">
      <div
        className={`sticky top-0 z-10 flex flex-col gap-3 -mx-4 px-4 py-4 sm:-mx-5 sm:px-5 ${ThemeVariants.colors.bg.base}`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Label
            label="Cucina"
            tag={LabelTags.h1}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            color={ThemeVariants.colors.text.brand}
            fontFamily={ThemeVariants.fontFamily.display}
            noMargin
          />
          <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
            {tab === DISPATCH_TAB && dispatch
              ? `${waiting} da smistare`
              : waiting === 1
                ? "1 comanda da preparare"
                : `${waiting} comande da preparare`}
            {readOnly && " · sola lettura"}
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              type="search"
              placeholder="Cerca nome, tavolo o numero..."
              value={search}
              setValue={setSearch}
              className="flex-1 min-w-0 sm:w-64"
              ariaLabel="Cerca per nome, tavolo o numero"
            />
            {canMarkSoldOut(role) && <SoldOutButton />}
          </div>
        </div>

        {/* Con lo smistamento: Smistamento e una scheda per postazione, col numero in coda */}
        {dispatch && (
          <div
            role="tablist"
            aria-label="Postazione"
            className="flex gap-2 overflow-x-auto [scrollbar-width:none]"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 px-3.5 py-2 text-sm font-bold cursor-pointer",
                  ThemeVariants.borderRadius.full,
                  tab === t.id
                    ? `${ThemeVariants.colors.bg.brand} text-white`
                    : `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`,
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "min-w-5 px-1.5 text-xs leading-5 text-center",
                    ThemeVariants.borderRadius.full,
                    t.busy
                      ? "bg-[var(--danger)] text-white"
                      : tab === t.id
                        ? "bg-white/25"
                        : ThemeVariants.colors.bg.hover,
                  )}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !dispatch ? (
        <SimpleKitchen
          orders={visible.filter((o) => matchesSearch(o, search))}
          queuedAt={(o) => queueTime(o, restaurant)}
          readOnly={readOnly}
        />
      ) : tab === DISPATCH_TAB ? (
        <DispatchBoard
          orders={visible}
          stations={stations}
          profile={restaurant}
          search={search}
          readOnly={readOnly}
        />
      ) : (
        tab && (
          <StationBoard
            orders={visible}
            stationId={tab}
            profile={restaurant}
            search={search}
            readOnly={readOnly}
          />
        )
      )}
    </div>
  );
};
