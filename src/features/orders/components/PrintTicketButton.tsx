import { PrintButton } from "../../../components/PrintButton";
import { useRestaurant } from "../../restaurant/hook/useRestaurant";
import { usesCounterPickup } from "../../restaurant/utils/ordering";
import type { Order } from "../types/orders";
import { orderPlace } from "../utils/orderPlace";

//Bigliettino per il cliente, largo come la carta delle stampanti da cassa (80 mm):
//numero d'ordine in grande, dove va, piatti, totale e se è pagato
const Ticket = ({
  order,
  restaurantName,
  counterPickup,
}: {
  order: Order;
  restaurantName?: string;
  //col ritiro al banco si ricorda al cliente di aspettare il suo numero
  counterPickup?: boolean;
}) => (
  <div className="print-sheet hidden print:block w-[72mm] p-1 text-black bg-white text-[12pt] leading-snug">
    {restaurantName && (
      <p className="text-center font-bold">{restaurantName}</p>
    )}
    <p className="text-center mt-1">Ordine n°</p>
    <p className="text-center text-[44pt] font-bold leading-none">
      {order.orderNumber}
    </p>
    <p className="text-center mt-1 font-bold">{orderPlace(order)}</p>
    {order.customerName && <p className="text-center">{order.customerName}</p>}
    <hr className="my-2 border-black border-dashed" />
    <ul>
      {order.items.map((it, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span>
            {it.quantity}× {it.dish.name}
          </span>
          <span className="shrink-0">
            €{(it.dish.price * it.quantity).toFixed(2)}
          </span>
        </li>
      ))}
    </ul>
    <hr className="my-2 border-black border-dashed" />
    <p className="flex justify-between font-bold">
      <span>Totale</span>
      <span>€{order.total.toFixed(2)}</span>
    </p>
    <p className="text-center font-bold mt-2">
      {order.paid ? "PAGATO" : "DA PAGARE"}
    </p>
    {counterPickup && (
      <p className="text-center mt-1">
        Ritira al banco quando il tuo numero è pronto
      </p>
    )}
    <p className="text-center text-[9pt] mt-1">
      {new Date(order.createdAt).toLocaleString("it-IT", {
        dateStyle: "short",
        timeStyle: "short",
      })}
    </p>
  </div>
);

//Stampa il bigliettino da dare al cliente (es. tipo sagra: lo mette sul tavolo e
//gli portano l'ordine)
export const PrintTicketButton = ({
  order,
  className,
}: {
  order: Order;
  className?: string;
}) => {
  const { data: restaurant } = useRestaurant();

  return (
    <PrintButton
      label="Stampa bigliettino"
      className={className}
      sheet={
        <Ticket
          order={order}
          restaurantName={restaurant?.name}
          counterPickup={usesCounterPickup(restaurant)}
        />
      }
    />
  );
};
