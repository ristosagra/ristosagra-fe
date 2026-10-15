import { useState } from "react";
import { Check, Clock, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Label } from "../../../components/core/Label";
import { Accordion } from "../../../components/core/Accordion";
import { Toggle } from "../../../components/core/Toogle";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import {
  LabelDimensions,
  LabelTags,
  LabelWeight,
} from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { calcTotal } from "../../../helpers/calcTotal";
import type { Dish } from "../../../types/menuOrder";
import { OrderType, type CartType, type Order } from "../types/orders";
import { useOrderPayment, useUpdateOrderItems } from "../hook/useOrders";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggleExpand: () => void;
  //piatti del menù da poter aggiungere (solo per gli ordini modificabili)
  menu?: Dish[];
}

//Ordine nella lista della cassa. Gli asporti mostrano nome e orario di ritiro
//e si possono modificare aggiungendo o togliendo piatti.
export const OrderCard = ({
  order,
  expanded,
  onToggleExpand,
  menu = [],
}: OrderCardProps) => {
  const { mutate: updatePayment } = useOrderPayment();
  const { mutate: updateItems, isPending: isSaving } = useUpdateOrderItems();
  const showNotification = useNotification();

  const isTakeaway = order.type === OrderType.Takeaway;
  const [draft, setDraft] = useState<CartType[] | null>(null);
  const [dishToAdd, setDishToAdd] = useState("");

  const items = draft ?? order.items;
  const total = draft ? calcTotal(draft) : order.total;
  const borderTop = order.paid
    ? ThemeVariants.colors.border.top.brand
    : ThemeVariants.colors.border.top.default;

  const changeQuantity = (index: number, delta: number) =>
    setDraft((d) =>
      (d ?? order.items)
        .map((it, i) =>
          i === index ? { ...it, quantity: it.quantity + delta } : it,
        )
        .filter((it) => it.quantity > 0),
    );

  const addDish = () => {
    const dish = menu.find((d) => String(d.id) === dishToAdd);
    if (!dish) return;
    setDraft((d) => {
      const list = d ?? order.items;
      return list.some((it) => it.dish.id === dish.id)
        ? list.map((it) =>
            it.dish.id === dish.id ? { ...it, quantity: it.quantity + 1 } : it,
          )
        : [...list, { dish, quantity: 1 }];
    });
    setDishToAdd("");
  };

  const save = () => {
    if (!draft) return;
    updateItems(
      { id: order.id, items: draft },
      {
        onSuccess: () => {
          setDraft(null);
          showNotification(
            `Ordine #${order.orderNumber} aggiornato`,
            NotificationType.Ok,
          );
        },
        onError: () =>
          showNotification(
            "Errore nel salvataggio dell'ordine",
            NotificationType.Err,
          ),
      },
    );
  };

  return (
    <div
      className={`overflow-hidden transition-colors ${ThemeVariants.borderRadius.xl} ${
        order.paid
          ? `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`
          : `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`
      }`}
    >
      <div className="flex items-center justify-between p-4 gap-4">
        <Accordion onClick={onToggleExpand}>
          <div className="flex flex-col items-start min-w-0">
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
            {isTakeaway && (
              <Label
                label={`${order.customerName ?? ""} · ritiro ${order.pickupTime ?? ""}`}
                iconLeft={<Clock size={14} />}
                tag={LabelTags.p}
                size={LabelDimensions.small}
                weight={LabelWeight.semibold}
                color={ThemeVariants.colors.text.white}
                noMargin
              />
            )}
          </div>
          <div className="flex flex-row gap-5 items-center">
            <Label
              label={`${total.toFixed(2)} €`}
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
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </Accordion>
        <Toggle
          value={order.paid}
          onChange={() => updatePayment({ id: order.id, paid: !order.paid })}
        />
      </div>

      {expanded && (
        <div className={`px-4 pb-4 space-y-2 ${borderTop}`}>
          {items.map((item, index) => (
            <div
              key={`${item.dish.id}-${index}`}
              className={`flex justify-between items-center gap-3 first:border-t-0 ${borderTop}`}
            >
              <div className="flex flex-col mt-2 min-w-0">
                <Label
                  label={item.dish.name}
                  tag={LabelTags.p}
                  size={LabelDimensions.medium}
                  weight={LabelWeight.normal}
                  color={ThemeVariants.colors.text.white}
                  noMargin
                />
                {!draft && (
                  <Label
                    label={`x${item.quantity}`}
                    tag={LabelTags.p}
                    size={LabelDimensions.medium}
                    weight={LabelWeight.bold}
                    color={ThemeVariants.colors.text.brand}
                    noMargin
                  />
                )}
              </div>
              {draft ? (
                /* Modifica delle quantità (a 0 il piatto viene tolto) */
                <div className="flex items-center gap-1 mt-2 shrink-0">
                  <Button
                    iconLeft={
                      item.quantity === 1 ? (
                        <Trash2 size={14} />
                      ) : (
                        <Minus size={14} />
                      )
                    }
                    onClick={() => changeQuantity(index, -1)}
                    dimension={ButtonDimensions.small}
                    variant="secondary"
                  />
                  <Label
                    label={`${item.quantity}`}
                    tag={LabelTags.p}
                    size={LabelDimensions.medium}
                    weight={LabelWeight.bold}
                    color={ThemeVariants.colors.text.brand}
                    noMargin
                    additionalClasses="w-6 justify-center"
                  />
                  <Button
                    iconLeft={<Plus size={14} />}
                    onClick={() => changeQuantity(index, 1)}
                    dimension={ButtonDimensions.small}
                    variant="secondary"
                  />
                </div>
              ) : (
                <Label
                  label={`€${(item.dish.price * item.quantity).toFixed(2)}`}
                  tag={LabelTags.p}
                  size={LabelDimensions.medium}
                  weight={LabelWeight.normal}
                  color={ThemeVariants.colors.text.secondary}
                  noMargin
                />
              )}
            </div>
          ))}

          {draft && (
            /* Aggiunta di un piatto dal menù */
            <div className={`flex gap-2 items-center pt-3 ${borderTop}`}>
              <select
                value={dishToAdd}
                onChange={(e) => setDishToAdd(e.target.value)}
                className={`flex-1 min-w-0 px-2 py-2 text-sm ${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.sm} ${ThemeVariants.colors.text.white}`}
              >
                <option value="">Aggiungi un piatto…</option>
                {menu.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · €{d.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <Button
                iconLeft={<Plus size={15} />}
                label="Aggiungi"
                onClick={addDish}
                dimension={ButtonDimensions.auto}
                variant="secondary"
                disabled={!dishToAdd}
                className="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

          <div
            className={`flex justify-between items-center border-t ${borderTop} pt-3 mt-3`}
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
              label={`€${total.toFixed(2)}`}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.bold}
              color={ThemeVariants.colors.text.brand}
              noMargin
            />
          </div>

          {isTakeaway && (
            <div className="flex justify-end gap-2 pt-1">
              {draft ? (
                <>
                  <Button
                    iconLeft={<X size={15} />}
                    label="Annulla"
                    onClick={() => setDraft(null)}
                    dimension={ButtonDimensions.auto}
                    variant="secondary"
                    className="px-3 py-1.5"
                  />
                  <Button
                    iconLeft={<Check size={15} />}
                    label="Salva"
                    onClick={save}
                    dimension={ButtonDimensions.auto}
                    variant="primary"
                    disabled={draft.length === 0 || isSaving}
                    className="px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </>
              ) : (
                <Button
                  iconLeft={<Pencil size={15} />}
                  label="Modifica ordine"
                  onClick={() => setDraft(order.items)}
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  className="px-3 py-1.5"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
