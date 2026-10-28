import { PrintButton } from "../../../components/PrintButton";
import type { Order } from "../../orders/types/orders";
import { orderPlace } from "../../orders/utils/orderPlace";
import { timeOf } from "../utils/ticketStyle";

interface KitchenSlipProps {
  order: Order;
  //righe da preparare (indici in order.items): l'ordine intero o la comanda di una postazione
  lines: number[];
  //con lo smistamento: la postazione a cui è stata mandata
  stationName?: string;
  //da quando l'ordine è in coda (invio o pagamento)
  queuedAt: string;
}

//Comanda di carta per la cucina, larga 80 mm: numero d'ordine, dove va, postazione e piatti in
//grande, senza prezzi
const KitchenSlip = ({
  order,
  lines,
  stationName,
  queuedAt,
}: KitchenSlipProps) => (
  <div className="print-sheet hidden print:block w-[72mm] p-1 text-black bg-white text-[12pt] leading-snug">
    <p className="text-center font-bold uppercase">
      Comanda{stationName ? ` · ${stationName}` : ""}
    </p>
    <p className="text-center text-[40pt] font-bold leading-none mt-1">
      #{order.orderNumber}
    </p>
    <p className="text-center mt-1 font-bold">{orderPlace(order)}</p>
    {order.customerName && <p className="text-center">{order.customerName}</p>}
    <hr className="my-2 border-black border-dashed" />
    <ul className="text-[16pt] leading-tight">
      {lines.map((i) => {
        const it = order.items[i];
        return (
          it && (
            <li key={i} className="py-0.5">
              <span className="font-bold">{it.quantity}×</span> {it.dish.name}
            </li>
          )
        );
      })}
    </ul>
    <hr className="my-2 border-black border-dashed" />
    <p className="text-center text-[9pt]">
      In coda dalle {timeOf(queuedAt)} · stampata alle{" "}
      {timeOf(new Date().toISOString())}
    </p>
  </div>
);

//Stampa la comanda di carta (l'ordine intero senza smistamento, la parte della postazione con lo
//smistamento): per chi in cucina lavora sulla carta o come ripiego se la rete cade. Pulsante
//quadrato grande accanto a "Pronto"
export const PrintKitchenSlipButton = (props: KitchenSlipProps) => (
  <PrintButton
    sheet={<KitchenSlip {...props} />}
    ariaLabel={`Stampa la comanda #${props.order.orderNumber}${props.stationName ? ` (${props.stationName})` : ""}`}
    iconSize={20}
    className="w-12 h-12 shrink-0"
  />
);
