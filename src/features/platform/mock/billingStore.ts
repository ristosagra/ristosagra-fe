import { createMockStore } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { sagraSlug } from "../../../helpers/site";
import type { BillingDetails } from "../types/platform";
import { addEdition } from "../utils/edition";

//Edizione pagata e dati per la fattura della sagra finta. Senza sottodominio (una sola sagra:
//demo e sviluppo di prima) la sagra è attiva; un sottodominio aperto senza registrazione
//(es. prova.localhost) parte non attivo, per provare la sagra preparata ma non online.
//Non importa staff/mock: lo usa anche requireRole
export interface MockBilling {
  paidUntil: string | null;
  details: BillingDetails;
}

const EXAMPLE_DETAILS: BillingDetails = {
  holder: "Pro Loco di esempio",
  taxCode: "01234567890",
  address: {
    street: "Via Roma 1",
    zip: "37100",
    city: "Verona",
    province: "VR",
  },
};

export const billingStore = createMockStore<MockBilling>("billing.v1", () => ({
  paidUntil: sagraSlug === null ? addEdition(null, new Date()) : null,
  details: EXAMPLE_DETAILS,
}));

export const isSagraActive = (): boolean => {
  const { paidUntil } = billingStore.get();
  return paidUntil !== null && new Date(paidUntil) > new Date();
};

//Ordini e prenotazioni solo con la sagra online: altrimenti 402 come il backend
export const requireActiveSagra = () => {
  if (!isSagraActive()) throw new HttpError(402);
};
