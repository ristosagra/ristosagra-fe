import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fakeOrdersApi } from "../mock/orders";
import { OrdersService } from "../api/orders";
import type {
  CartType,
  NewOrder,
  Payment,
  TakeawaySettings,
} from "../types/orders";

const isMocking = () => import.meta.env.VITE_MOCKING === "true";
const api = () => (isMocking() ? fakeOrdersApi : OrdersService);

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: () => api().getOrders(),
    refetchInterval: 30000,
  });

//Invio di un nuovo ordine (sul posto o da asporto) dal cliente
export const useOrderNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (order: NewOrder) => api().createOrder(order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useOrderPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid }: Payment) => api().updatePayment(id, paid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Modifica dei piatti di un ordine dalla cassa
export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, items }: { id: number; items: CartType[] }) =>
      api().updateItems(id, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useTakeawaySettings = () =>
  useQuery({
    queryKey: ["takeaway-settings"],
    queryFn: () => api().getTakeawaySettings(),
  });

export const useSaveTakeawaySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: TakeawaySettings) =>
      api().saveTakeawaySettings(settings),
    onSuccess: (saved) =>
      queryClient.setQueryData(["takeaway-settings"], saved),
  });
};
