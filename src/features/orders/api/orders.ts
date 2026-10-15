import type {
  CartType,
  NewOrder,
  Order,
  TakeawaySettings,
} from "../types/orders";
import { httpClient } from "../../../services/client/httpClient";

export const OrdersService = {
  getOrders: (): Promise<Order[]> => httpClient.get("/api/orders"),

  createOrder: (order: NewOrder): Promise<{ orderNumber: number }> =>
    httpClient.post("/api/order", order),

  updatePayment: (id: number, paid: boolean): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/payment`, { paid }),

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
