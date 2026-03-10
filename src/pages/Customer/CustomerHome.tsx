import { useState } from "react";
import { ShoppingCart, House } from "lucide-react";
import Cart from "./Cart";
import { Reservation } from "./Reservation";
import Menu from "./Menu";
import { NavBar } from "../../components/core/NavBar";
import { PagesCustomer, type PagesCustomerConst } from "../../constant/pages";
import type { CartType } from "../../features/orders/types/orders";
import { Home } from "./Home";
import { useTheme } from "../../hooks/useTheme";
import { ThemeVariants } from "../../constant/colors";
import { Button } from "../../components/core/Button";
import { ButtonDimensions } from "../../constant/button";
import { Label } from "../../components/core/Label";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";

export const CustomerHome = () => {
  const [page, setPage] = useState<PagesCustomerConst>(PagesCustomer.HOME);
  const [cartItems, setCartItems] = useState<CartType[]>([]);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [confirmedCart, setConfirmedCart] = useState<CartType[]>([]);
  const { isDark, toggleTheme } = useTheme();

  const total = cartItems.reduce(
    (acc, item) => acc + item.dish.price * item.quantity,
    0,
  );
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen min-w-screen h-full overflow-hidden flex flex-col">
      <NavBar>
        <Button
          iconLeft={<House size={24} />}
          dimension={ButtonDimensions.auto}
          onClick={() => setPage(PagesCustomer.HOME)}
          variant="active"
          isActive={page === PagesCustomer.HOME}
          className="px-2 py-2"
        />

        <button onClick={toggleTheme}>{isDark ? "☀️ Light" : "🌙 Dark"}</button>

        <div className="flex flex-row items-center gap-2">
          <Button
            isActive={page === PagesCustomer.MENU}
            onClick={() => setPage(PagesCustomer.MENU)}
            label="Menù"
            dimension={ButtonDimensions.auto}
            variant="active"
            className="px-3 py-2"
          />
          <div className="flex flex-row items-center">
            <div style={{ position: "relative", display: "flex" }}>
              <Button
                dimension={ButtonDimensions.auto}
                onClick={() => setPage(PagesCustomer.CART)}
                variant="active"
                isActive={page === PagesCustomer.CART}
                iconRight={
                  <>
                    <ShoppingCart size={24} />
                    {cartCount > 0 && (
                      <span
                        className={`absolute w-4 h-4 right-1 top-0.5 ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.bg.brand} text-white text-[9px] font-bold flex items-center justify-center leading-none`}
                      >
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </>
                }
                label={
                  total > 0 && (
                    <Label
                      label={`€${total.toFixed(2)}`}
                      tag={LabelTags.h2}
                      size={LabelDimensions.medium}
                      weight={LabelWeight.bold}
                      fontFamily={ThemeVariants.fontFamily.display}
                      noMargin
                      color={ThemeVariants.colors.text.brand}
                    />
                  )
                }
                className={`px-3 py-2 ${cartCount > 0 ? ThemeVariants.colors.border.all.brand : ""} ${ThemeVariants.borderRadius.md}`}
              />
            </div>
          </div>
        </div>
      </NavBar>

      <main
        className={`${ThemeVariants.colors.bg.base} flex-1 overflow-hidden pt-16`}
      >
        {page === PagesCustomer.HOME && <Home setPage={setPage} />}
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
