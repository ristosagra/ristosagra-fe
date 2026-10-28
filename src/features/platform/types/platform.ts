//Piattaforma: registrazione di una sagra, attivazione dell'edizione e dati per la fattura
//(contratto in API.md → "Piattaforma: registrazione e attivazione")

export interface BillingAddress {
  street: string;
  zip: string;
  city: string;
  //sigla di 2 lettere, maiuscola
  province: string;
}

//Intestatario della fattura elettronica
export interface BillingDetails {
  //es. "Pro Loco di Ponte"
  holder: string;
  //codice fiscale (16 caratteri) o P.IVA / codice fiscale numerico (11 cifre)
  taxCode: string;
  //codice destinatario SDI (7 caratteri), facoltativo
  sdiCode?: string;
  //PEC, facoltativa
  pec?: string;
  address: BillingAddress;
}

export interface SignupRequest {
  restaurantName: string;
  //indirizzo della sagra: <slug>.ristosagra.it
  slug: string;
  //il titolare entra con l'email come username
  owner: { name: string; email: string; phone: string; password: string };
  billing: BillingDetails;
}

export interface SignupResponse {
  slug: string;
  //pagina di pagamento dell'edizione
  checkoutUrl: string;
}

export interface SlugAvailability {
  available: boolean;
}

//Stato dell'edizione e dati per la fattura (solo gestori)
export interface Billing {
  //pagata e non scaduta
  active: boolean;
  //fine dell'edizione pagata (ISO), null se mai pagata
  paidUntil: string | null;
  details: BillingDetails;
}

//Form: tutti testi, come li scrive l'utente
export interface BillingDraft {
  holder: string;
  taxCode: string;
  sdiCode: string;
  pec: string;
  street: string;
  zip: string;
  city: string;
  province: string;
}

export interface SignupDraft {
  restaurantName: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  billing: BillingDraft;
}
