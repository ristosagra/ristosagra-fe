import { useEffect, useState } from "react";
import { CalendarClock, House, NotebookPen, ShoppingCart } from "lucide-react";
import Cart from "./Cart";
import { BookTable } from "./BookTable";
import { Reservation } from "./Reservation";
import Menu from "./Menu";
import { NavBar, NavGroup, NavItem } from "../../components/core/NavBar";
import { Loader } from "../../components/core/Loader";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import type {
  CartType,
  ConfirmedOrder,
} from "../../features/orders/types/orders";
import { Home } from "./Home";
import { ThemeVariants } from "../../constant/colors";
import { calcTotal } from "../../helpers/calcTotal";
import { usePersistentState } from "../../hooks/usePersistentState";
import { useNotification } from "../../hooks/useNotification";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { OrderingMode } from "../../features/restaurant/types/restaurant";
import { customerAsksTable } from "../../features/restaurant/utils/ordering";
import { useScannedTable } from "../../features/orders/hook/useScannedTable";
import { isCart, isRecentOrder } from "../../features/orders/utils/storedOrder";
import {
  clearPaymentReturn,
  PaymentOutcome,
  readPaymentReturn,
} from "../../features/orders/utils/onlinePayment";
import { NotificationType } from "../../types/notification";

const isPage = (v: unknown): v is PagesCustomerConst =>
  Object.values(PagesCustomer).includes(v as PagesCustomerConst);

const isLastOrder = (v: unknown): v is ConfirmedOrder | null =>
  v === null || isRecentOrder(v);

export const CustomerHome = () => {
  const { data: restaurant } = useRestaurant();
  const showNotification = useNotification();
  //Tavolo del QR code inquadrato (se il ristorante li usa)
  const scannedTable = useScannedTable();

  //Ritorno dalla pagina di pagamento online, letto una volta all'apertura: se è andato bene
  //si mostra l'ordine pagato e si svuota il carrello, altrimenti si torna al carrello
  const [payment] = useState(readPaymentReturn);
  const paidOrder =
    payment?.outcome === PaymentOutcome.Ok && payment.order
      ? { ...payment.order, paidOnline: true }
      : undefined;

  //Pagina e carrello restano finché la scheda è aperta, anche se il telefono la ricarica
  const [page, setPage] = usePersistentState<PagesCustomerConst>(
    "ristosagra.page",
    PagesCustomer.HOME,
    {
      storage: "session",
      validate: isPage,
      preferred: () =>
        paidOrder
          ? PagesCustomer.RESERVATION
          : payment?.outcome === PaymentOutcome.Cancelled
            ? PagesCustomer.CART
            : undefined,
    },
  );
  const [cartItems, setCartItems] = usePersistentState<CartType[]>(
    "ristosagra.cart",
    [],
    {
      storage: "session",
      validate: isCart,
      preferred: () => (paidOrder ? [] : undefined),
    },
  );
  //Il numero d'ordine serve alla cassa: resta salvato anche chiudendo il browser
  const [confirmedOrder, setConfirmedOrder] =
    usePersistentState<ConfirmedOrder | null>("ristosagra.lastOrder", null, {
      validate: isLastOrder,
      preferred: () => paidOrder,
    });

  useEffect(() => {
    if (!payment) return;
    clearPaymentReturn();
    if (payment.outcome === PaymentOutcome.Cancelled)
      showNotification(
        "Pagamento annullato: l'ordine non è stato inviato",
        NotificationType.Err,
      );
    else if (!payment.order)
      showNotification("Pagamento completato", NotificationType.Ok);
  }, [payment, showNotification]);

  //Finché non si sa cosa ha scelto il ristorante non si mostra il carrello
  const canOrder =
    !!restaurant && restaurant.orderingMode !== OrderingMode.MenuOnly;
  const total = calcTotal(cartItems);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalLabel = `€${total.toFixed(2)}`;
  const showOrder = page === PagesCustomer.RESERVATION && confirmedOrder;
  //Col solo menù il carrello non c'è: chi era lì vede il menù
  const showMenu =
    page === PagesCustomer.MENU ||
    (page === PagesCustomer.CART && !!restaurant && !canOrder);

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
            active={showMenu}
          />
          {canOrder && (
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
          )}
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
            table={
              canOrder && customerAsksTable(restaurant) ? scannedTable : null
            }
          />
        )}
        {showMenu && (
          <Menu
            cartItems={cartItems}
            setCartItems={setCartItems}
            onGoToCart={() => setPage(PagesCustomer.CART)}
            canOrder={canOrder}
          />
        )}
        {page === PagesCustomer.CART && !restaurant && <Loader />}
        {page === PagesCustomer.CART && canOrder && (
          <Cart
            cartItems={cartItems}
            setCartItems={setCartItems}
            setPage={setPage}
            setConfirmedOrder={setConfirmedOrder}
            restaurant={restaurant}
            scannedTable={scannedTable}
          />
        )}
        {showOrder && <Reservation order={confirmedOrder} />}
        {page === PagesCustomer.BOOK_TABLE && <BookTable />}
      </main>
    </div>
  );
};
