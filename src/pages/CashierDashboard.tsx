import { useState } from "react";
import { useOrders, useOrderPayment } from "../hooks/useOrders";
import { Loader } from "../components/core/Loader";
import { Label } from "../components/core/Label";
import { LabelTags, TextDimensions, TextWeight } from "../types/costant";
import { Input } from "../components/core/Input";
import { Container } from "../components/core/Container";
import { ColorVariants } from "../utils/colors";

export const CashierDashboard = () => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: orders = [], isLoading } = useOrders();
  const { mutate: updatePayment } = useOrderPayment();

  const filtered = orders.filter((order) =>
    order.orderNumber.toString().includes(search),
  );

  return (
    <main className="bg-gray-500">
      <div className="flex flex-row justify-between fixed w-full top-0 py-6 px-4">
        <Label
          label="Ordini"
          tag={LabelTags.h1}
          size={TextDimensions.xlarge}
          weight={TextWeight.bold}
          color={ColorVariants.text.orange}
          noMargin
        />
        <Input
          type="text"
          placeholder="Cerca numero ordine..."
          value={search}
          setValue={setSearch}
        />
      </div>
      <Container>
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex flex-col gap-2 pt-18">
            {filtered.map((order) => (
              <div
                key={order.id}
                className={`rounded-2xl overflow-hidden transition-colors ${
                  order.paid ? ColorVariants.bg.grayLight : "bg-white border border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between p-4 gap-4">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === order.id ? null : order.id)
                    }
                    className="flex items-center gap-4 flex-1 text-left outline-none focus:outline-none focus-visible:outline-none cursor-pointer "
                  >
                    <Label
                      label={`#${order.orderNumber}`}
                      tag={LabelTags.p}
                      size={TextDimensions.xlarge}
                      weight={TextWeight.bold}
                      color={ColorVariants.text.orange}
                      noMargin
                    />
                    <Label
                      label={order.total.toFixed(2)}
                      tag={LabelTags.p}
                      size={TextDimensions.medium}
                      weight={TextWeight.normal}
                      color={ColorVariants.text.grayDark}
                      noMargin
                    />
                    <Label
                      label="▼"
                      tag={LabelTags.p}
                      size={TextDimensions.medium}
                      weight={TextWeight.normal}
                      color={ColorVariants.text.grayDark}
                      noMargin
                      additionalClasses={`ml-auto transition-transform duration-300 ${
                        expandedId === order.id ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() =>
                      updatePayment({ id: order.id, paid: !order.paid })
                    }
                    className={`relative cursor-pointer w-12 h-6 rounded-full transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                      order.paid
                        ? `${ColorVariants.bg.orange}`
                        : `${ColorVariants.bg.grayLight}`
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 ${ColorVariants.bg.white} rounded-full shadow transition-all ${
                        order.paid ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                {expandedId === order.id && (
                  <div
                    className={`px-4 pb-4 space-y-2 border-t ${order.paid ? ColorVariants.border.white : ColorVariants.border.grayMedium} pt-3`}
                  >
                    {order.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div className="flex gap-2 items-center">
                          <Label
                            label={`x${item.quantity}`}
                            tag={LabelTags.p}
                            size={TextDimensions.medium}
                            weight={TextWeight.bold}
                            color={ColorVariants.text.orange}
                            noMargin
                          />
                          <Label
                            label={item.dish.name}
                            tag={LabelTags.p}
                            size={TextDimensions.medium}
                            weight={TextWeight.normal}
                            color={ColorVariants.text.grayDark}
                            noMargin
                          />
                        </div>
                        <Label
                          label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                          tag={LabelTags.p}
                          size={TextDimensions.medium}
                          weight={TextWeight.normal}
                          color={ColorVariants.text.grayDark}
                          noMargin
                        />
                      </div>
                    ))}
                    <div
                      className={`flex justify-between items-center border-t ${order.paid ? ColorVariants.border.white : ColorVariants.border.grayMedium} pt-2 mt-2`}
                    >
                      <Label
                        label="Totale"
                        tag={LabelTags.p}
                        size={TextDimensions.medium}
                        weight={TextWeight.bold}
                        color={ColorVariants.text.grayDark}
                        noMargin
                      />
                      <Label
                        label={`€${order.total.toFixed(2)}`}
                        tag={LabelTags.p}
                        size={TextDimensions.medium}
                        weight={TextWeight.bold}
                        color={ColorVariants.text.orange}
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
                  size={TextDimensions.large}
                  color={ColorVariants.text.white}
                  weight={TextWeight.bold}
                  noMargin
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </main>
  );
};
