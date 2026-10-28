import { httpClient } from "../../../services/client/httpClient";
import type { Billing, BillingDetails } from "../types/platform";

//Edizione e dati per la fattura della sagra (solo titolare e vice)
export const BillingService = {
  getBilling: (): Promise<Billing> => httpClient.get("/api/billing"),

  updateBilling: (details: BillingDetails): Promise<Billing> =>
    httpClient.patch("/api/billing", details),

  //pagamento dell'edizione: la sagra si attiva quando il servizio di pagamento lo conferma
  checkout: (): Promise<{ checkoutUrl: string }> =>
    httpClient.post("/api/billing/checkout", {}),
};
