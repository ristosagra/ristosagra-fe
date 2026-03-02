import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateFakeOrders } from "../mock/fakeApiOrder";
import type { CartType, Payment } from "../types/types";
import { generateFakeOrderNumber } from "../mock/fakeOrderNumber";
import { OrdersService } from "../services/api/orders";

export const useOrders = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery({
    queryKey: ["orders"],
    queryFn: isMocking ? () => generateFakeOrders() : OrdersService.getOrders,
    refetchInterval: 30000,
  });
};

export const useOrderNumber = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation({
    mutationFn: isMocking
      ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_cart: CartType[]) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return generateFakeOrderNumber();
        }
      : OrdersService.postOrderNumber,
  });
};

export const useOrderPayment = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: isMocking
      ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_params: Payment) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      : ({ id, paid }: Payment) => OrdersService.updatePayment(id, paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
