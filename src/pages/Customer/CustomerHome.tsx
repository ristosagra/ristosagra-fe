import { useState } from "react";
import { ShoppingCart, House, NotebookPen } from "lucide-react";
import Cart from "./Cart";
import { Reservation } from "./Reservation";
import Menu from "./Menu";
import { NavBar } from "../../components/core/NavBar";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import type { CartType } from "../../types/orders";

export const CustomerHome = () => {
  const [page, setPage] = useState<PagesCustomerConst>(PagesCustomer.HOME);
  const [cartItems, setCartItems] = useState<CartType[]>([]);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [confirmedCart, setConfirmedCart] = useState<CartType[]>([]);

  const total = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen min-w-screen h-full overflow-hidden flex flex-col">
      <NavBar>
        <House
          color="black"
          onClick={() => setPage(PagesCustomer.HOME)}
          className="cursor-pointer"
        />
        <div className="flex flex-row items-center gap-8">
          <NotebookPen
            color="black"
            onClick={() => setPage(PagesCustomer.MENU)}
            className="cursor-pointer"
          />
          <div className="flex flex-row items-center gap-2">
            {total > 0 && (
              <span className="text-black">{total.toFixed(2)}€</span>
            )}
            <ShoppingCart
              color="black"
              onClick={() => setPage(PagesCustomer.CART)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </NavBar>

      <main className="flex-1 overflow-hidden bg-gray-500 pt-18">
        {page === PagesCustomer.HOME && <div></div>}
        {page === PagesCustomer.MENU && (
          <Menu cartItems={cartItems} setCartItems={setCartItems} />
        )}
        {page === PagesCustomer.CART && (
          <Cart
            cartItems={cartItems}
            setCartItems={setCartItems}
            setPage={setPage}
            setOrderNumber={setOrderNumber}
            setConfirmedCart={setConfirmedCart}
          />
        )}
        {page === PagesCustomer.RESERVATION && (
          <Reservation cartItems={confirmedCart} orderNumber={orderNumber!} />
        )}
      </main>
    </div>
  );
};
