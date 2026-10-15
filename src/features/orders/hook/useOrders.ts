import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { OrdersService } from "../api/orders";
import { IS_MOCKING } from "../../../constant/env";
import type {
  CartType,
  NewOrder,
  Payment,
  TakeawaySettings,
} from "../types/orders";

//Servizio reale o finto: il finto (con Faker) si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof OrdersService> = IS_MOCKING
  ? () => import("../mock/orders").then((m) => m.fakeOrdersApi)
  : () => Promise.resolve(OrdersService);

export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await loadApi()).getOrders(),
    refetchInterval: 30000,
  });

//Invio di un nuovo ordine (sul posto o da asporto) dal cliente
export const useOrderNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (order: NewOrder) => (await loadApi()).createOrder(order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useOrderPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, paid }: Payment) =>
      (await loadApi()).updatePayment(id, paid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

//Modifica dei piatti di un ordine dalla cassa
export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, items }: { id: number; items: CartType[] }) =>
      (await loadApi()).updateItems(id, items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useTakeawaySettings = () =>
  useQuery({
    queryKey: ["takeaway-settings"],
    queryFn: async () => (await loadApi()).getTakeawaySettings(),
  });

export const useSaveTakeawaySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: TakeawaySettings) =>
      (await loadApi()).saveTakeawaySettings(settings),
    onSuccess: (saved) =>
      queryClient.setQueryData(["takeaway-settings"], saved),
  });
};
