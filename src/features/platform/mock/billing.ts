import { fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { requireManager } from "../../staff/mock/auth";
import type { Billing, BillingDetails } from "../types/platform";
import { addEdition } from "../utils/edition";
import { billingDetailsValid } from "../utils/signupForm";
import { billingStore, isSagraActive } from "./billingStore";

const readBilling = (): Billing => ({
  active: isSagraActive(),
  ...billingStore.get(),
});

//Edizione e fattura finte (VITE_MOCKING), solo per titolare e vice. Non c'è un servizio di
//pagamento: pagare attiva subito l'edizione e si torna alla login, come dopo un pagamento
//riuscito (il backend la attiverebbe solo alla conferma del servizio)
export const fakeBillingApi = {
  getBilling: async (): Promise<Billing> => {
    await fakeDelay(300);
    requireManager();
    return readBilling();
  },

  updateBilling: async (details: BillingDetails): Promise<Billing> => {
    await fakeDelay();
    requireManager();
    if (!billingDetailsValid(details)) throw new HttpError(400);
    billingStore.set({ ...billingStore.get(), details });
    return readBilling();
  },

  checkout: async (): Promise<{ checkoutUrl: string }> => {
    await fakeDelay(800);
    requireManager();
    if (isSagraActive()) throw new HttpError(409);
    const billing = billingStore.get();
    billingStore.set({
      ...billing,
      paidUntil: addEdition(billing.paidUntil, new Date()),
    });
    return { checkoutUrl: "/login?attivazione=ok" };
  },
};
