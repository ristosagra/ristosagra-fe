import { Spinner } from "../../components/core/Spinner";
import { useState } from "react";
import {
  Check,
  ChevronUp,
  Plus,
  ShoppingBag,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "../../components/core/Button";
import { CounterCard } from "../../components/core/CounterCard";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { Loader } from "../../components/core/Loader";
import { SettingSwitch } from "../../components/SettingSwitch";
import { useMenu } from "../../features/menu/hook/useMenu";
import { groupDishesByCategory } from "../../features/menu/utils/menuUtils";
import {
  useCreateCashierOrder,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import {
  OrderType,
  type CartType,
  type CashierOrder,
  type Order,
  type OrderTypeConst,
} from "../../features/orders/types/orders";
import { PrintTicketButton } from "../../features/orders/components/PrintTicketButton";
import { cleanTableName } from "../../features/orders/utils/tableQr";
import {
  pickupTimeValid,
  takeawayToday,
} from "../../features/orders/utils/takeawayUtils";
import { ButtonDimensions } from "../../constant/button";
import { ThemeVariants } from "../../constant/colors";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { PERSON_NAME_MAX, TABLE_NAME_MAX } from "../../constant/limits";
import { calcTotal } from "../../helpers/calcTotal";
import { cn } from "../../helpers/cn";
import {
  formatRanges,
  isOpenNow,
  todayHoursLabel,
} from "../../helpers/openingHours";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import {
  decrementFunction,
  incrementFunction,
} from "../../helpers/incrementDecrement";
import { useNotification } from "../../hooks/useNotification";
import { NotificationType } from "../../types/notification";
import type { Dish } from "../../types/menuOrder";
import { useFloorPlan } from "../../features/floorPlan/hook/useFloorPlan";
import { tableNames } from "../../features/floorPlan/helpers/tableNames";
import type { StaffRoleConst } from "../../features/staff/types/staff";
import {
  canTakePayments,
  takesTableOrders,
} from "../../features/staff/utils/permissions";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import {
  customersOrderOnline,
  isPayFirstAtCashier,
  marksOrdersPaid,
  staffOrderNeedsTable,
} from "../../features/restaurant/utils/ordering";

const TABLES_LIST_ID = "nuovo-ordine-tavoli";

//Nuovo ordine creato dal personale: piatti dal menù, sul posto o da asporto (se attivo). La cassa
//lo crea per chi è al bancone (già pagato; se i clienti ordinano dal sito e pagano alla cassa
//sceglie se è pagato); cameriere e caposala lo prendono al tavolo (solo sul posto) e il cliente
//paga poi alla cassa. Sul posto tavolo (obbligatorio) e nome solo a fine pasto: se si paga prima
//(tipo sagra o ritiro al banco) il tavolo non si sa ancora e vale il numero d'ordine. Valgono le
//regole del profilo come per i clienti, anche per l'amministratore: sul posto solo a locale
//aperto, l'asporto per un servizio di oggi non ancora finito e, se i clienti ordinano dal sito,
//all'orario unico o nelle fasce di ritiro (con Solo menù l'orario si concorda)
export const NewOrder = ({ role }: { role: StaffRoleConst }) => {
  const { data: menu = [], isLoading } = useMenu();
  const { data: takeaway } = useTakeawaySettings();
  const { data: restaurant } = useRestaurant();
  const { data: floorPlan } = useFloorPlan();
  const { mutate: createOrder, isPending } = useCreateCashierOrder();
  const showNotification = useNotification();
  const now = useCurrentTime();

  const [items, setItems] = useState<CartType[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<OrderTypeConst>(OrderType.DineIn);
  const [customerName, setCustomerName] = useState("");
  const [table, setTable] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [paid, setPaid] = useState(true);
  //ultimo ordine creato: il numero da dire al cliente e il bigliettino da stampare
  const [created, setCreated] = useState<Order | null>(null);
  //sul cellulare il riepilogo si apre dal basso
  const [summaryOpen, setSummaryOpen] = useState(false);

  const takesPayments = canTakePayments(role);
  //pagato o da pagare si sceglie solo se i clienti ordinano dal sito e pagano alla cassa a fine
  //pasto: se si paga prima chi è alla cassa paga subito
  const asksPaid =
    takesPayments &&
    marksOrdersPaid(restaurant) &&
    !isPayFirstAtCashier(restaurant);
  const tableStaff = takesTableOrders(role);
  const dineInOpen = !!restaurant && isOpenNow(restaurant.openingHours, now);
  const slot =
    restaurant && !tableStaff
      ? takeawayToday(restaurant.openingHours, takeaway, now)
      : null;
  const canTakeaway = !!slot;
  //a locale chiuso resta solo l'asporto
  const isTakeaway =
    canTakeaway && (type === OrderType.Takeaway || !dineInOpen);
  //orario di ritiro: con i clienti che ordinano dal sito valgono le stesse regole
  const pickupRules = customersOrderOnline(restaurant) ? slot : null;
  const fixedTime = pickupRules?.fixedTime ?? null;
  const closed = !!restaurant && !dineInOpen && !canTakeaway;
  const todayHours = restaurant && todayHoursLabel(restaurant.openingHours);
  const needsTable = tableStaff || staffOrderNeedsTable(restaurant);
  //nome e tavolo: all'asporto il nome, sul posto entrambi solo a fine pasto
  const asksCustomer = isTakeaway || needsTable;
  //tavoli della piantina, suggeriti mentre si scrive
  const tables = tableNames(floorPlan);
  const total = calcTotal(items);
  const count = items.reduce((acc, it) => acc + it.quantity, 0);
  const q = search.trim().toLowerCase();
  const grouped = Object.entries(
    groupDishesByCategory(menu.filter((d) => d.name.toLowerCase().includes(q))),
  );
  //all'asporto serve il nome, per chiamare il cliente quando ritira; sul posto il tavolo
  const missing = closed
    ? todayHours
      ? `Il locale ora è chiuso: gli ordini si creano negli orari di apertura (oggi ${todayHours})`
      : "Oggi il locale è chiuso: non si creano ordini"
    : items.length === 0
      ? null
      : isTakeaway && !customerName.trim()
        ? "Scrivi il nome di chi ritira"
        : isTakeaway &&
            pickupRules &&
            !pickupRules.fixedTime &&
            !pickupTimeValid(pickupRules, pickupTime, now)
          ? `Scegli l'orario di ritiro: ${formatRanges(pickupRules.ranges)}`
          : !isTakeaway && needsTable && !cleanTableName(table)
            ? "Scrivi il tavolo"
            : null;
  const canCreate = items.length > 0 && !missing && !isPending;

  const quantityOf = (dish: Dish) =>
    items.find((it) => it.dish.id === dish.id)?.quantity ?? 0;
  const add = (dish: Dish) => {
    setCreated(null);
    incrementFunction({ dish, setCartItems: setItems });
  };
  const remove = (dish: Dish) =>
    decrementFunction({ dish, setCartItems: setItems });

  const reset = () => {
    setItems([]);
    setType(OrderType.DineIn);
    setCustomerName("");
    setTable("");
    setPickupTime("");
    setPaid(true);
  };

  const create = () => {
    if (!canCreate) return;
    const name = customerName.trim();
    const tableName = cleanTableName(table);
    const order: CashierOrder = {
      items,
      type: isTakeaway ? OrderType.Takeaway : OrderType.DineIn,
      //chi non incassa (cameriere, caposala) crea ordini da pagare alla cassa
      paid: takesPayments && (!asksPaid || paid),
      ...(asksCustomer && name && { customerName: name }),
      ...(isTakeaway
        ? (fixedTime ?? pickupTime) && { pickupTime: fixedTime ?? pickupTime }
        : needsTable && tableName && { table: tableName }),
    };
    createOrder(order, {
      onSuccess: ({ orderNumber }) => {
        //per il bigliettino: il totale vero lo calcola il backend, qui è quello del menù
        setCreated({
          ...order,
          id: 0,
          orderNumber,
          total: calcTotal(order.items),
          createdAt: new Date().toISOString(),
        });
        setSummaryOpen(true);
        reset();
      },
      onError: () =>
        showNotification(
          "Errore nella creazione dell'ordine",
          NotificationType.Err,
        ),
    });
  };

  return (
    <div className="relative h-full flex flex-col lg:flex-row overflow-hidden">
      {isPending && <Loader />}

      {/* Menù: un tocco sul piatto lo aggiunge */}
      <section className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 pb-5">
        <div
          className={`sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 -mx-4 px-4 py-4 sm:-mx-5 sm:px-5 ${ThemeVariants.colors.bg.base}`}
        >
          <Label
            label="Nuovo ordine"
            tag={LabelTags.h1}
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            color={ThemeVariants.colors.text.brand}
            fontFamily={ThemeVariants.fontFamily.display}
            noMargin
          />
          <Input
            type="search"
            placeholder="Cerca un piatto..."
            value={search}
            setValue={setSearch}
            className="w-full sm:w-56"
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : grouped.length === 0 ? (
          <p
            className={`py-10 text-center ${ThemeVariants.colors.text.secondary}`}
          >
            {menu.length === 0
              ? "Il menù è vuoto: aggiungi i piatti dal Profilo"
              : "Nessun piatto trovato"}
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.map(([category, dishes]) => (
              <section key={category}>
                <h2
                  className={`text-sm font-semibold uppercase mb-2 ${ThemeVariants.colors.text.secondary}`}
                >
                  {category}
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                  {dishes.map((dish) => {
                    const quantity = quantityOf(dish);
                    return (
                      <li
                        key={dish.id}
                        className={cn(
                          "flex items-center gap-2 pr-2",
                          ThemeVariants.borderRadius.md,
                          ThemeVariants.colors.bg.surface,
                          quantity > 0
                            ? ThemeVariants.colors.border.all.brand
                            : ThemeVariants.colors.border.all.default,
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => add(dish)}
                          className="flex-1 min-w-0 flex flex-col items-start px-3 py-2.5 text-left cursor-pointer"
                        >
                          <span className="font-semibold [overflow-wrap:anywhere]">
                            {dish.name}
                          </span>
                          <span
                            className={`text-sm ${ThemeVariants.colors.text.brand}`}
                          >
                            €{dish.price.toFixed(2)}
                          </span>
                        </button>
                        {quantity > 0 ? (
                          <CounterCard
                            quantity={quantity}
                            increment={() => add(dish)}
                            decrement={() => remove(dish)}
                          />
                        ) : (
                          <Button
                            iconLeft={<Plus size={16} />}
                            onClick={() => add(dish)}
                            dimension={ButtonDimensions.auto}
                            variant="secondary"
                            className="w-9 h-9 shrink-0"
                            ariaLabel={`Aggiungi ${dish.name}`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* Sul cellulare, a riepilogo aperto, il menù dietro si scurisce: toccandolo si richiude */}
      {summaryOpen && (
        <div
          aria-hidden
          onClick={() => setSummaryOpen(false)}
          className="lg:hidden absolute inset-0 z-20 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Riepilogo: a destra sugli schermi grandi, apribile dal basso sul cellulare */}
      <aside
        className={cn(
          "relative z-30 shrink-0 flex flex-col lg:w-96 max-lg:max-h-[70%]",
          "border-t border-t-[var(--border)] lg:border-t-0 lg:border-l lg:border-l-[var(--border)]",
          ThemeVariants.colors.bg.surface,
        )}
      >
        <button
          type="button"
          onClick={() => setSummaryOpen((o) => !o)}
          aria-expanded={summaryOpen}
          className="lg:hidden flex items-center justify-between gap-3 px-4 py-3 cursor-pointer font-bold"
        >
          <span>
            Riepilogo · {count} {count === 1 ? "articolo" : "articoli"}
          </span>
          <span className="flex items-center gap-2">
            <span className={ThemeVariants.colors.text.brand}>
              €{total.toFixed(2)}
            </span>
            <ChevronUp
              size={20}
              aria-hidden
              className={cn(
                "transition-transform duration-300",
                !summaryOpen && "rotate-180",
              )}
            />
          </span>
        </button>

        <div
          className={cn(
            "flex-1 min-h-0 overflow-y-auto flex-col gap-4 p-4 max-lg:pt-0 lg:flex",
            summaryOpen ? "flex" : "hidden",
          )}
        >
          {created !== null && (
            <div
              role="status"
              className={`flex flex-col items-center gap-1 p-4 text-center ${ThemeVariants.borderRadius.lg} ${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Check
                  size={16}
                  className={ThemeVariants.colors.text.success}
                />
                Ordine creato
              </span>
              <span
                className={`text-5xl font-bold ${ThemeVariants.colors.text.brand}`}
              >
                {created.orderNumber}
              </span>
              <span
                className={`text-sm ${ThemeVariants.colors.text.secondary}`}
              >
                {created.paid
                  ? "Di' questo numero al cliente"
                  : "Il cliente lo pagherà alla cassa"}
              </span>
              {takesPayments && (
                <PrintTicketButton
                  order={created}
                  className="px-3 py-1.5 mt-2"
                />
              )}
            </div>
          )}

          {items.length === 0 ? (
            <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
              Tocca i piatti del menù per aggiungerli all'ordine.
            </p>
          ) : (
            <ul className="flex flex-col">
              {items.map((it) => (
                <li
                  key={it.dish.id}
                  className={`flex justify-between gap-3 py-1.5 text-sm ${ThemeVariants.colors.border.bottom.default}`}
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    <span
                      className={`font-bold ${ThemeVariants.colors.text.brand}`}
                    >
                      {it.quantity}×
                    </span>{" "}
                    {it.dish.name}
                  </span>
                  <span className="shrink-0 tabular-nums">
                    €{(it.dish.price * it.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {canTakeaway && (
            <div className="flex gap-2">
              <Button
                iconLeft={<UtensilsCrossed size={15} />}
                label={<span className="text-sm ml-1.5">Sul posto</span>}
                onClick={() => setType(OrderType.DineIn)}
                dimension={ButtonDimensions.auto}
                variant={isTakeaway ? "secondary" : "primary"}
                //a locale chiuso sul posto non si ordina
                disabled={!dineInOpen}
                className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                fullWidth
              />
              <Button
                iconLeft={<ShoppingBag size={15} />}
                label={<span className="text-sm ml-1.5">Asporto</span>}
                onClick={() => setType(OrderType.Takeaway)}
                dimension={ButtonDimensions.auto}
                variant={isTakeaway ? "primary" : "secondary"}
                className="px-3 py-2"
                fullWidth
              />
            </div>
          )}
          {canTakeaway && !dineInOpen && (
            <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
              Il locale ora è chiuso: sul posto si ordina negli orari di
              apertura{todayHours ? ` (oggi ${todayHours})` : ""}, intanto si
              può prenotare l'asporto
            </p>
          )}

          {/* Sul posto tipo sagra (o col ritiro al banco) niente nome né tavolo: vale il numero */}
          {asksCustomer && (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={
                  isTakeaway ? "Nome (obbligatorio)" : "Nome (facoltativo)"
                }
                value={customerName}
                setValue={setCustomerName}
                maxLength={PERSON_NAME_MAX}
                variant="secondary"
                className="flex-1 text-sm"
                ariaLabel="Nome del cliente"
              />
              {isTakeaway && fixedTime ? (
                //orario unico deciso dal ristorante
                <span
                  className={`shrink-0 self-center text-sm font-semibold ${ThemeVariants.colors.text.brand}`}
                >
                  Ritiro {fixedTime}
                </span>
              ) : isTakeaway ? (
                <Input
                  type="time"
                  placeholder="19:30"
                  value={pickupTime}
                  setValue={setPickupTime}
                  variant="secondary"
                  className="w-28 text-sm"
                  ariaLabel={
                    pickupRules
                      ? "Orario di ritiro"
                      : "Orario di ritiro (facoltativo)"
                  }
                />
              ) : (
                <>
                  <Input
                    type="text"
                    placeholder="Tavolo*"
                    value={table}
                    setValue={setTable}
                    maxLength={TABLE_NAME_MAX}
                    variant="secondary"
                    className="w-24 text-sm"
                    ariaLabel="Tavolo (obbligatorio)"
                    list={TABLES_LIST_ID}
                    required
                  />
                  <datalist id={TABLES_LIST_ID}>
                    {tables.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </>
              )}
            </div>
          )}

          {/* Pagato o da pagare solo se i clienti ordinano dal sito e pagano alla cassa:
              altrimenti la cassa crea l'ordine già pagato (cameriere e caposala non incassano) */}
          {asksPaid && (
            <SettingSwitch
              label="Pagato"
              description={
                paid
                  ? "Il cliente paga adesso"
                  : "Lo pagherà più tardi alla cassa"
              }
              value={paid}
              isEditMode
              onChange={setPaid}
            />
          )}

          <div className="flex items-center justify-between font-bold text-lg">
            <span>Totale</span>
            <span className={ThemeVariants.colors.text.brand}>
              €{total.toFixed(2)}
            </span>
          </div>
          {missing && (
            <p
              className={`text-sm ${closed ? ThemeVariants.colors.text.danger : ThemeVariants.colors.text.secondary}`}
            >
              {missing}
            </p>
          )}
          <Button
            iconLeft={<Check size={18} />}
            label="Crea ordine"
            onClick={create}
            dimension={ButtonDimensions.auto}
            variant="primary"
            fullWidth
            disabled={!canCreate}
            className="h-12 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </aside>
    </div>
  );
};
