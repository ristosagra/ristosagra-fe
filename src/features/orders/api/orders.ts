import type {
  CartType,
  CashierOrder,
  NewOrder,
  Order,
  OrderCreated,
  PickupBoard,
  StationTicket,
  TakeawaySettings,
} from "../types/orders";
import { httpClient } from "../../../services/client/httpClient";

export const OrdersService = {
  getOrders: (): Promise<Order[]> => httpClient.get("/api/orders"),

  createOrder: (order: NewOrder): Promise<OrderCreated> =>
    httpClient.post("/api/order", order),

  //ordine creato dalla cassa per un cliente al bancone
  createCashierOrder: (order: CashierOrder): Promise<{ orderNumber: number }> =>
    httpClient.post("/api/orders", order),

  updatePayment: (id: number, paid: boolean): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/payment`, { paid }),

  //la cucina segna la comanda pronta (o la rimette in preparazione)
  updateReady: (id: number, ready: boolean): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/ready`, { ready }),

  //ritiro al banco: ordine consegnato al cliente (o di nuovo da consegnare)
  updateDelivered: (id: number, delivered: boolean): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/delivered`, { delivered }),

  //ritiro al banco: numeri in preparazione e pronti, per lo schermo e il telefono del cliente
  getPickupBoard: (): Promise<PickupBoard> =>
    httpClient.get("/api/pickup-board"),

  //smistamento: il capo cucina manda alcune righe dell'ordine a una postazione
  sendToStation: (
    id: number,
    stationId: string,
    items: number[],
  ): Promise<StationTicket> =>
    httpClient.post(`/api/orders/${id}/tickets`, { stationId, items }),

  //smistamento: comanda ritirata dalla postazione (le righe tornano da smistare)
  recallTicket: (id: number, ticketId: string): Promise<void> =>
    httpClient.delete(
      `/api/orders/${id}/tickets/${encodeURIComponent(ticketId)}`,
    ),

  //smistamento: la postazione segna pronta la sua comanda (o la rimette da preparare)
  updateTicketReady: (
    id: number,
    ticketId: string,
    ready: boolean,
  ): Promise<void> =>
    httpClient.patch(
      `/api/orders/${id}/tickets/${encodeURIComponent(ticketId)}/ready`,
      { ready },
    ),

  //modifica dei piatti di un ordine (es. asporto) dalla cassa
  updateItems: (id: number, items: CartType[]): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/items`, { items }),

  getTakeawaySettings: (): Promise<TakeawaySettings> =>
    httpClient.get("/api/takeaway/settings"),

  saveTakeawaySettings: (
    settings: TakeawaySettings,
  ): Promise<TakeawaySettings> =>
    httpClient.patch("/api/takeaway/settings", settings),
};
