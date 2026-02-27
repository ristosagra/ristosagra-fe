import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateFakeOrders } from "../mock/fakeApiOrder";
import { getOrders, updateOrderPayment } from "../services/orders";
import type { Payment } from "../types/types";

export const useOrders = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery({
    queryKey: ["orders"],
    queryFn: isMocking ? () => generateFakeOrders() : getOrders,
    refetchInterval: 30000,
  });
};

export const useUpdatePayment = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: isMocking
      ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_params: Payment) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      : ({ id, paid }: Payment) => updateOrderPayment(id, paid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};
