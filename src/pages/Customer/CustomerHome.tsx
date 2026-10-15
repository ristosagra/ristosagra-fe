import { CalendarClock, House, NotebookPen, ShoppingCart } from "lucide-react";
import Cart, { type ConfirmedOrder } from "./Cart";
import { BookTable } from "./BookTable";
import { Reservation } from "./Reservation";
import Menu from "./Menu";
import { NavBar, NavGroup, NavItem } from "../../components/core/NavBar";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import type { CartType } from "../../features/orders/types/orders";
import { Home } from "./Home";
import { ThemeVariants } from "../../constant/colors";
import { calcTotal } from "../../helpers/calcTotal";
import { usePersistentState } from "../../hooks/usePersistentState";

//Dopo questo tempo il numero dell'ultimo ordine non viene più riproposto
const ORDER_TTL_MS = 12 * 60 * 60 * 1000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isPage = (v: unknown): v is PagesCustomerConst =>
  Object.values(PagesCustomer).includes(v as PagesCustomerConst);

const isCart = (v: unknown): v is CartType[] =>
  Array.isArray(v) &&
  v.every(
    (item) =>
      isRecord(item) &&
      typeof item.quantity === "number" &&
      item.quantity > 0 &&
      isRecord(item.dish) &&
      typeof item.dish.id === "number" &&
      typeof item.dish.name === "string" &&
      typeof item.dish.price === "number",
  );

const isRecentOrder = (v: unknown): v is ConfirmedOrder | null =>
  v === null ||
  (isRecord(v) &&
    typeof v.orderNumber === "number" &&
    isCart(v.items) &&
    typeof v.confirmedAt === "string" &&
    Date.now() - Date.parse(v.confirmedAt) < ORDER_TTL_MS);

export const CustomerHome = () => {
  //Pagina e carrello restano finché la scheda è aperta, anche se il telefono la ricarica
  const [page, setPage] = usePersistentState<PagesCustomerConst>(
    "ristosagra.page",
    PagesCustomer.HOME,
    { storage: "session", validate: isPage },
  );
  const [cartItems, setCartItems] = usePersistentState<CartType[]>(
    "ristosagra.cart",
    [],
    { storage: "session", validate: isCart },
  );
  //Il numero d'ordine serve alla cassa: resta salvato anche chiudendo il browser
  const [confirmedOrder, setConfirmedOrder] =
    usePersistentState<ConfirmedOrder | null>("ristosagra.lastOrder", null, {
      validate: isRecentOrder,
    });

  const total = calcTotal(cartItems);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalLabel = `€${total.toFixed(2)}`;
  const showOrder = page === PagesCustomer.RESERVATION && confirmedOrder;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <NavBar>
        <NavItem
          icon={<House size={22} />}
          label="Home"
          desktopLabel={null}
          ariaLabel="Home"
          onClick={() => setPage(PagesCustomer.HOME)}
          active={page === PagesCustomer.HOME}
        />
        <NavGroup>
          <NavItem
            icon={<CalendarClock size={22} />}
            label="Prenota"
            desktopLabel="Prenota un tavolo"
            onClick={() => setPage(PagesCustomer.BOOK_TABLE)}
            active={page === PagesCustomer.BOOK_TABLE}
          />
          <NavItem
            icon={<NotebookPen size={22} />}
            label="Menù"
            onClick={() => setPage(PagesCustomer.MENU)}
            active={page === PagesCustomer.MENU}
          />
          <NavItem
            icon={<ShoppingCart size={22} />}
            badge={cartCount}
            label={total > 0 ? totalLabel : "Carrello"}
            desktopLabel={
              total > 0 ? (
                <span
                  className={`${ThemeVariants.fontFamily.display} ${ThemeVariants.colors.text.brand}`}
                >
                  {totalLabel}
                </span>
              ) : null
            }
            ariaLabel={`Carrello: ${cartCount} ${cartCount === 1 ? "articolo" : "articoli"}`}
            onClick={() => setPage(PagesCustomer.CART)}
            active={page === PagesCustomer.CART}
          />
        </NavGroup>
      </NavBar>

      <main
        className={`${ThemeVariants.colors.bg.base} flex-1 min-h-0 overflow-hidden`}
      >
        {(page === PagesCustomer.HOME ||
          (page === PagesCustomer.RESERVATION && !confirmedOrder)) && (
          <Home
            setPage={setPage}
            lastOrderNumber={confirmedOrder?.orderNumber}
          />
        )}
        {page === PagesCustomer.MENU && (
          <Menu
            cartItems={cartItems}
            setCartItems={setCartItems}
            onGoToCart={() => setPage(PagesCustomer.CART)}
          />
        )}
        {page === PagesCustomer.CART && (
          <Cart
            cartItems={cartItems}
            setCartItems={setCartItems}
            setPage={setPage}
            setConfirmedOrder={setConfirmedOrder}
          />
        )}
        {showOrder && <Reservation order={confirmedOrder} />}
        {page === PagesCustomer.BOOK_TABLE && <BookTable />}
      </main>
    </div>
  );
};
