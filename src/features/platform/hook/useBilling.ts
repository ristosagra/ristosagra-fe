import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BillingService } from "../api/billing";
import { IS_MOCKING } from "../../../constant/env";
import type { BillingDetails } from "../types/platform";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof BillingService> = IS_MOCKING
  ? () => import("../mock/billing").then((m) => m.fakeBillingApi)
  : () => Promise.resolve(BillingService);

export const useBilling = () =>
  useQuery({
    queryKey: ["billing"],
    queryFn: async () => (await loadApi()).getBilling(),
  });

export const useUpdateBilling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (details: BillingDetails) =>
      (await loadApi()).updateBilling(details),
    onSuccess: (saved) => queryClient.setQueryData(["billing"], saved),
  });
};

//Pagina di pagamento dell'edizione (al successo si lascia il sito: niente cache da aggiornare)
export const useActivationCheckout = () =>
  useMutation({
    mutationFn: async () => (await loadApi()).checkout(),
  });
