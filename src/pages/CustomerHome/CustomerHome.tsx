import { useState } from "react";
import { ShoppingCart, House, NotebookPen } from "lucide-react";
import { Pages, type PagesConst } from "../../types/costant";
import Menu from "../Menu/Menu";
import type { CartType } from "../../types/types";
import Cart from "../Cart/Cart";
import { Reservation } from "../Reservation";

export const CustomerHome = () => {
  const [page, setPage] = useState<PagesConst>(Pages.HOME);
  const [cartItems, setCartItems] = useState<CartType[]>([]);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [confirmedCart, setConfirmedCart] = useState<CartType[]>([]);

  const total = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen min-w-screen">
      <header className="flex flex-row items-center justify-between py-6 px-4 bg-gray-100 fixed w-full top-0">
        <House color="black" onClick={() => setPage(Pages.HOME)} />
        <div className="flex flex-row items-center gap-8">
          <NotebookPen color="black" onClick={() => setPage(Pages.MENU)} />
          <div className="flex flex-row items-center gap-2">
            {total > 0 && (
              <span className="text-black">{total.toFixed(2)}€</span>
            )}
            <ShoppingCart color="black" onClick={() => setPage(Pages.CART)} />
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-500 p-4 pt-18">
        {page === Pages.HOME && <div></div>}
        {page === Pages.MENU && (
          <Menu cartItems={cartItems} setCartItems={setCartItems} />
        )}
        {page === Pages.CART && (
          <Cart
            cartItems={cartItems}
            setCartItems={setCartItems}
            setPage={setPage}
            setOrderNumber={setOrderNumber}
            setConfirmedCart={setConfirmedCart}
          />
        )}
        {page === Pages.RESERVATION && (
          <Reservation cartItems={confirmedCart} orderNumber={orderNumber!} />
        )}
      </main>
    </div>
  );
};
