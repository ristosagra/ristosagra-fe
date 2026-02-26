import { useMutation } from "@tanstack/react-query";
import type { CartType } from "../types/types";
import { generateFakeOrderNumber } from "../mock/fakeOrderNumber";
import { postOrder } from "../services/orderNumber";

export const usePostOrder = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation({
    mutationFn: isMocking
      ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (_cart: CartType[]) => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return generateFakeOrderNumber();
        }
      : postOrder,
  });
};
