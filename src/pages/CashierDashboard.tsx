import { useState } from "react";
import { useOrders, useUpdatePayment } from "../hooks/useOrders";
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
  const { mutate: updatePayment } = useUpdatePayment();

  const filtered = orders.filter((order) =>
    order.orderNumber.toString().includes(search),
  );

  if (isLoading) return <Loader />;

  return (
    <body className="bg-gray-500">
      <Container>
        <div className="flex flex-row justify-between">
          <Label
            label="Ordini"
            tag={LabelTags.h1}
            size={TextDimensions.xlarge}
            weight={TextWeight.bold}
            color={ColorVariants.text.grayDark}
            noMargin
          />

          <Input
            type="text"
            placeholder="Cerca numero ordine..."
            value={search}
            setValue={setSearch}
          />
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className={`rounded-2xl overflow-hidden transition-colors ${
                order.paid ? "bg-gray-200" : "bg-white border border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between p-4 gap-4">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === order.id ? null : order.id)
                  }
                  className="flex items-center gap-4 flex-1 text-left outline-none focus:outline-none focus-visible:outline-none"
                >
                  <span className="text-2xl font-bold text-orange-300 w-16">
                    #{order.orderNumber}
                  </span>
                  <span className="text-gray-700 font-medium">
                    €{order.total.toFixed(2)}
                  </span>
                  <span
                    className={`ml-auto text-gray-400 transition-transform duration-300 ${
                      expandedId === order.id ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                <button
                  onClick={() =>
                    updatePayment({ id: order.id, paid: !order.paid })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors outline-none focus:outline-none focus-visible:outline-none ${
                    order.paid ? `${ColorVariants.bg.orange}` : `${ColorVariants.bg.grayLight}`
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      order.paid ? "left-7" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {expandedId === order.id && (
                <div className="px-4 pb-4 space-y-2 border-t border-gray-200 pt-3">
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="text-orange-300 font-bold text-sm">
                          x{item.quantity}
                        </span>
                        <span className="text-gray-700">{item.dish.name}</span>
                      </div>
                      <span className="text-gray-600 text-sm">
                        €{(item.dish.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                    <span className="font-bold text-gray-800">Totale</span>
                    <span className="font-bold text-orange-300">
                      €{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex justify-center py-10">
              <Label
                label="Nessun ordine trovato"
                tag={LabelTags.p}
                size={TextDimensions.large}
                color={ColorVariants.text.grayDark}
                noMargin
              />
            </div>
          )}
        </div>
      </Container>
    </body>
  );
};
