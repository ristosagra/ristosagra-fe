import type { CartType, Order } from "../types/orders";
import { httpClient } from "../../../services/client/httpClient";

export const OrdersService = {
  getOrders: (): Promise<Order[]> => httpClient.get("/api/orders"),

  postOrderNumber: (cart: CartType[]): Promise<{ orderNumber: number }> =>
    httpClient.post("/api/order", cart),

  updatePayment: (id: number, paid: boolean): Promise<void> =>
    httpClient.patch(`/api/orders/${id}/payment`, { paid }),
};
