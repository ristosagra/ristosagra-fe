import { ShoppingCart } from "lucide-react";
import { Card } from "../../components/Card";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Loader } from "../../components/core/Loader";
import { Button } from "../../components/core/Button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ButtonDimensions } from "../../constant/button";
import { useMenu } from "../../features/menu/hook/useMenu";
import type { MenuProps } from "../../features/orders/types/orders";
import { groupDishesByCategory } from "../../features/menu/utils/menuUtils";
import { ThemeVariants } from "../../constant/colors";
import { calcTotal } from "../../helpers/calcTotal";

const sectionId = (index: number) => `menu-categoria-${index}`;

export default function Menu({
  cartItems,
  setCartItems,
  onGoToCart,
}: MenuProps & { onGoToCart: () => void }) {
  const { data: dishes, isLoading, isError, refetch } = useMenu();

  if (isLoading) return <Loader />;
  if (isError || !dishes) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-3 p-6 text-center">
        <p className={ThemeVariants.colors.text.danger}>
          Errore nel caricamento del menù
        </p>
        <Button
          label="Riprova"
          onClick={() => refetch()}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="px-4 py-2"
        />
      </div>
    );
  }

  const grouped = Object.entries(groupDishesByCategory(dishes));
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Categorie: sul cellulare scorrono in orizzontale e portano alla sezione */}
      {grouped.length > 1 && (
        <div
          className={`shrink-0 ${ThemeVariants.colors.bg.base} ${ThemeVariants.colors.border.bottom.default}`}
        >
          <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto px-5 py-3 [scrollbar-width:none]">
            {grouped.map(([category], i) => (
              <button
                key={category}
                type="button"
                onClick={() =>
                  document
                    .getElementById(sectionId(i))
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className={`shrink-0 px-3.5 py-1.5 text-sm font-semibold cursor-pointer ${ThemeVariants.borderRadius.full} ${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.text.white}`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      <Container additionalClass="flex-1 min-h-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-5 pb-6">
          {grouped.length === 0 && (
            <p
              className={`py-16 text-center ${ThemeVariants.colors.text.secondary}`}
            >
              Il menù non è ancora disponibile
            </p>
          )}
          {grouped.map(([category, items], i) => (
            <section
              key={category}
              id={sectionId(i)}
              className="pt-6 scroll-mt-2"
            >
              <Label
                label={category}
                color={ThemeVariants.colors.text.brand}
                colorBorderBottom={ThemeVariants.colors.border.bottom.default}
                tag={LabelTags.h2}
                weight={LabelWeight.bold}
                size={LabelDimensions.xxlarge}
                additionalClasses="max-sm:text-3xl max-sm:mb-4"
              />
              <div className="space-y-3">
                {items.map((dish) => (
                  <Card
                    key={dish.id}
                    dish={dish}
                    cartItems={cartItems}
                    setCartItems={setCartItems}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </Container>

      {/* Riepilogo del carrello sempre a portata di mano */}
      {cartCount > 0 && (
        <div
          className={`shrink-0 px-4 py-3 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.top.default}`}
        >
          <Button
            iconLeft={<ShoppingCart size={18} />}
            label={`Vai al carrello · ${cartCount} ${cartCount === 1 ? "articolo" : "articoli"} · €${calcTotal(cartItems).toFixed(2)}`}
            onClick={onGoToCart}
            dimension={ButtonDimensions.auto}
            variant="primary"
            fullWidth
            className="h-12 px-4 max-w-3xl mx-auto"
          />
        </div>
      )}
    </div>
  );
}
