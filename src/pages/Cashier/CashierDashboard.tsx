import { useState } from "react";
import {
  useOrderPayment,
  useOrders,
} from "../../features/orders/hook/useOrders";
import { Label } from "../../components/core/Label";
import { Container } from "../../components/core/Container";
import { Loader } from "lucide-react";
import { Input } from "../../components/core/Input";
import type { CartType } from "../../features/orders/types/orders";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";

export const CashierDashboard = () => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: orders = [], isLoading } = useOrders();
  const { mutate: updatePayment } = useOrderPayment();

  const filtered = orders.filter((order) =>
    order.orderNumber.toString().includes(search),
  );

  return (
    <Container additionalClass="flex flex-col h-full overflow-hidden">
      <div className="flex flex-row justify-between w-full p-5 shrink-0">
        <Label
          label="Ordini"
          tag={LabelTags.h1}
          size={LabelDimensions.xlarge}
          weight={LabelWeight.bold}
          color={ThemeVariants.colors.text.brand}
          fontFamily={ThemeVariants.fontFamily.display}
          noMargin
        />
        <Input
          type="text"
          placeholder="Cerca numero ordine..."
          value={search}
          setValue={setSearch}
        />
      </div>
      <div className="flex-1 overflow-y-auto mx-5 mb-5">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((order) => (
              <div
                key={order.id}
                className={`overflow-hidden transition-colors ${ThemeVariants.borderRadius.xl} ${
                  order.paid
                    ? `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`
                    : `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`
                }`}
              >
                <div className="flex items-center justify-between p-4 gap-4">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === order.id ? null : order.id)
                    }
                    className="flex justify-between items-center gap-4 flex-1 text-left outline-none focus:outline-none focus-visible:outline-none cursor-pointer "
                  >
                    <Label
                      label={`#${order.orderNumber}`}
                      tag={LabelTags.p}
                      size={LabelDimensions.xlarge}
                      weight={LabelWeight.bold}
                      color={
                        order.paid
                          ? ThemeVariants.colors.text.secondary
                          : ThemeVariants.colors.text.brand
                      }
                      noMargin
                    />
                    <div className="flex flex-row gap-5">
                      <Label
                        label={`${order.total.toFixed(2)} €`}
                        tag={LabelTags.p}
                        size={LabelDimensions.medium}
                        weight={LabelWeight.normal}
                        color={
                          order.paid
                            ? ThemeVariants.colors.text.secondary
                            : ThemeVariants.colors.text.white
                        }
                        noMargin
                      />
                      <Label
                        tag={LabelTags.p}
                        size={LabelDimensions.small}
                        label={order.paid ? "Pagato" : "Da pagare"}
                        variant={order.paid ? "success" : "danger"}
                        noMargin
                      />
                      <Label
                        label="▼"
                        tag={LabelTags.p}
                        size={LabelDimensions.medium}
                        weight={LabelWeight.normal}
                        color={
                          order.paid
                            ? ThemeVariants.colors.text.secondary
                            : ThemeVariants.colors.text.white
                        }
                        noMargin
                        additionalClasses={`transition-transform duration-300 ${
                          expandedId === order.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      updatePayment({ id: order.id, paid: !order.paid })
                    }
                    className={`relative cursor-pointer w-12 h-6 rounded-full transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                      order.paid
                        ? `${ThemeVariants.colors.bg.brand} ${ThemeVariants.colors.border.all.default}`
                        : `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.default}`
                    }`}
                  >
                    <span
                      className={`absolute top-0.75 w-4 h-4 ${ThemeVariants.colors.bg.white} rounded-full shadow transition-all ${
                        order.paid ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {expandedId === order.id && (
                  <div
                    className={`px-4 pb-4 space-y-2 ${order.paid ? ThemeVariants.colors.border.top.brand : ThemeVariants.colors.border.top.default}`}
                  >
                    {order.items.map((item: CartType, index: number) => (
                      <div
                        key={item.quantity + index}
                        className={`flex justify-between items-center first:border-t-0 ${order.paid ? ThemeVariants.colors.border.top.brand : ThemeVariants.colors.border.top.default}`}
                      >
                        <div className="flex flex-col mt-2">
                          <Label
                            label={item.dish.name}
                            tag={LabelTags.p}
                            size={LabelDimensions.medium}
                            weight={LabelWeight.normal}
                            color={ThemeVariants.colors.text.white}
                            noMargin
                          />
                          <Label
                            label={`x${item.quantity}`}
                            tag={LabelTags.p}
                            size={LabelDimensions.medium}
                            weight={LabelWeight.bold}
                            color={ThemeVariants.colors.text.brand}
                            noMargin
                          />
                        </div>
                        <Label
                          label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                          tag={LabelTags.p}
                          size={LabelDimensions.medium}
                          weight={LabelWeight.normal}
                          color={ThemeVariants.colors.text.secondary}
                          noMargin
                        />
                      </div>
                    ))}
                    <div
                      className={`flex justify-between items-center border-t ${order.paid ? ThemeVariants.colors.border.top.brand : ThemeVariants.colors.border.top.default} pt-3 mt-3`}
                    >
                      <Label
                        label="Totale"
                        tag={LabelTags.p}
                        size={LabelDimensions.medium}
                        weight={LabelWeight.bold}
                        color={ThemeVariants.colors.text.white}
                        noMargin
                      />
                      <Label
                        label={`€${order.total.toFixed(2)}`}
                        tag={LabelTags.p}
                        size={LabelDimensions.medium}
                        weight={LabelWeight.bold}
                        color={ThemeVariants.colors.text.brand}
                        noMargin
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="flex justify-center py-10">
                <Label
                  label="Nessun ordine trovato"
                  tag={LabelTags.h1}
                  size={LabelDimensions.large}
                  color={ThemeVariants.colors.text.brand}
                  weight={LabelWeight.bold}
                  noMargin
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
};
