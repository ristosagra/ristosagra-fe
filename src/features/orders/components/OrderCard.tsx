import { useState } from "react";
import {
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  MapPin,
  Minus,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
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
import { PrintTicketButton } from "./PrintTicketButton";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import { HttpError } from "../../../services/client/httpClient";

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggleExpand: () => void;
  //piatti del menù da poter aggiungere (solo per gli ordini modificabili)
  menu?: Dish[];
  //sola lettura (ordini pagati online): niente interruttore del pagamento né modifiche
  readOnly?: boolean;
  //pagato / da pagare: solo se i clienti ordinano dal sito e pagano alla cassa
  showPayment?: boolean;
}

//Ordine nella lista della cassa, con il nome del cliente e il tavolo (sul posto) o l'orario
//di ritiro (asporto). Gli asporti si possono modificare aggiungendo o togliendo piatti (quelli
//esauriti si possono togliere ma non aggiungere).
export const OrderCard = ({
  order,
  expanded,
  onToggleExpand,
  menu = [],
  readOnly = false,
  showPayment = true,
}: OrderCardProps) => {
  const { mutate: updatePayment } = useOrderPayment();
  const { mutate: updateItems, isPending: isSaving } = useUpdateOrderItems();
  const showNotification = useNotification();

  const isTakeaway = order.type === OrderType.Takeaway;
  //senza pagato / da pagare tutti gli ordini si vedono uguali
  const paid = showPayment && order.paid;
  const [draft, setDraft] = useState<CartType[] | null>(null);
  const [dishToAdd, setDishToAdd] = useState("");

  const items = draft ?? order.items;
  const total = draft ? calcTotal(draft) : order.total;
  //nome e tavolo, oppure nome e orario di ritiro (quelli che ci sono)
  const details = [
    order.customerName,
    isTakeaway
      ? order.pickupTime && `ritiro ${order.pickupTime}`
      : order.table && `tavolo ${order.table}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const borderTop = paid
    ? ThemeVariants.colors.border.top.brand
    : ThemeVariants.colors.border.top.default;

  //piatto finito per oggi: se ne può solo togliere
  const isSoldOut = (dishId: number) =>
    menu.some((d) => d.id === dishId && d.soldOut);

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
    if (!dish || dish.soldOut) return;
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
        onError: (error) =>
          showNotification(
            error instanceof HttpError && error.status === 409
              ? "Un piatto aggiunto è finito: toglilo e salva di nuovo"
              : "Errore nel salvataggio dell'ordine",
            NotificationType.Err,
          ),
      },
    );
  };

  return (
    <div
      className={`overflow-hidden transition-colors ${ThemeVariants.borderRadius.xl} ${
        paid
          ? `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.brand}`
          : `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`
      }`}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 gap-3 sm:gap-4">
        <Accordion
          onClick={onToggleExpand}
          expanded={expanded}
          className="flex-wrap gap-x-3 gap-y-1 min-w-0"
        >
          <div className="flex flex-col items-start min-w-0">
            <span className="flex items-center gap-2">
              <Label
                label={`#${order.orderNumber}`}
                tag={LabelTags.p}
                size={LabelDimensions.xlarge}
                weight={LabelWeight.bold}
                color={
                  paid
                    ? ThemeVariants.colors.text.secondary
                    : ThemeVariants.colors.text.brand
                }
                noMargin
              />
              {/* La cucina l'ha preparato */}
              {order.readyAt && (
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${ThemeVariants.colors.text.success}`}
                >
                  <ChefHat size={14} />
                  Pronto
                </span>
              )}
            </span>
            {details && (
              <Label
                label={details}
                iconLeft={
                  isTakeaway ? (
                    <Clock size={14} />
                  ) : order.table ? (
                    <MapPin size={14} />
                  ) : (
                    <User size={14} />
                  )
                }
                tag={LabelTags.p}
                size={LabelDimensions.small}
                weight={LabelWeight.semibold}
                color={ThemeVariants.colors.text.white}
                noMargin
                additionalClasses="[overflow-wrap:anywhere]"
              />
            )}
          </div>
          <div className="flex flex-row gap-2 sm:gap-5 items-center ml-auto">
            <Label
              label={`${total.toFixed(2)} €`}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.normal}
              color={
                paid
                  ? ThemeVariants.colors.text.secondary
                  : ThemeVariants.colors.text.white
              }
              noMargin
            />
            {showPayment && (
              <Label
                tag={LabelTags.p}
                size={LabelDimensions.small}
                label={
                  order.paid ? "Pagato" : readOnly ? "Non pagato" : "Da pagare"
                }
                variant={order.paid ? "success" : "danger"}
                noMargin
              />
            )}
            <ChevronDown
              size={20}
              aria-hidden
              className={`shrink-0 transition-transform duration-300 ${
                paid
                  ? ThemeVariants.colors.text.secondary
                  : ThemeVariants.colors.text.white
              } ${expanded ? "rotate-180" : ""}`}
            />
          </div>
        </Accordion>
        {!readOnly && showPayment && (
          <Toggle
            value={order.paid}
            onChange={() => updatePayment({ id: order.id, paid: !order.paid })}
            ariaLabel={`Ordine #${order.orderNumber} pagato`}
          />
        )}
      </div>

      {expanded && (
        <div className={`px-3 sm:px-4 pb-4 space-y-2 ${borderTop}`}>
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
                    className="max-sm:h-9"
                    ariaLabel={
                      item.quantity === 1
                        ? `Togli ${item.dish.name}`
                        : `Diminuisci ${item.dish.name}`
                    }
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
                    disabled={isSoldOut(item.dish.id)}
                    className="max-sm:h-9 disabled:opacity-40 disabled:cursor-not-allowed"
                    ariaLabel={
                      isSoldOut(item.dish.id)
                        ? `${item.dish.name} è esaurito`
                        : `Aumenta ${item.dish.name}`
                    }
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
                aria-label="Piatto da aggiungere"
                className={`flex-1 min-w-0 px-2 py-2 text-sm ${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.sm} ${ThemeVariants.colors.text.white}`}
              >
                <option value="">Aggiungi un piatto…</option>
                {menu.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.soldOut}>
                    {d.name} ·{" "}
                    {d.soldOut ? "esaurito" : `€${d.price.toFixed(2)}`}
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

          {!readOnly && (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {!draft && (
                <PrintTicketButton order={order} className="px-3 py-1.5" />
              )}
              {!isTakeaway ? null : draft ? (
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
