import {
  BILLING_HOLDER_MAX,
  CITY_MAX,
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PERSON_NAME_MAX,
  PHONE_MAX,
  STREET_MAX,
} from "../../../constant/limits";
import { RESTAURANT_NAME_MAX } from "../../restaurant/types/restaurant";
import type {
  BillingDetails,
  BillingDraft,
  SignupDraft,
  SignupRequest,
} from "../types/platform";
import { slugError } from "./slug";

//Regole del form di registrazione e dei dati per la fattura: le usano il form, la sezione
//del Profilo e i dati finti (come farà il backend)

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

type SignupField = Exclude<keyof SignupDraft, "billing">;

export interface SignupErrors {
  fields: FieldErrors<SignupField>;
  billing: FieldErrors<keyof BillingDraft>;
}

export const EMPTY_BILLING_DRAFT: BillingDraft = {
  holder: "",
  taxCode: "",
  sdiCode: "",
  pec: "",
  street: "",
  zip: "",
  city: "",
  province: "",
};

export const EMPTY_SIGNUP_DRAFT: SignupDraft = {
  restaurantName: "",
  slug: "",
  ownerName: "",
  email: "",
  phone: "",
  password: "",
  passwordConfirm: "",
  billing: EMPTY_BILLING_DRAFT,
};

const REQUIRED = "Campo obbligatorio";

const isEmail = (v: string) =>
  v.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

//Testo obbligatorio entro una lunghezza massima
const textError = (v: string, max: number) =>
  !v.trim()
    ? REQUIRED
    : v.trim().length > max
      ? `Massimo ${max} caratteri`
      : undefined;

//Senza i campi vuoti: un oggetto senza chiavi = nessun errore
const compact = <K extends string>(
  errors: Record<K, string | undefined>,
): FieldErrors<K> =>
  Object.fromEntries(
    Object.entries(errors).filter(([, v]) => v !== undefined),
  ) as FieldErrors<K>;

export const billingErrors = (
  d: BillingDraft,
): FieldErrors<keyof BillingDraft> => {
  const taxCode = d.taxCode.trim().toUpperCase();
  const sdi = d.sdiCode.trim();
  const pec = d.pec.trim();
  return compact({
    holder: textError(d.holder, BILLING_HOLDER_MAX),
    taxCode: !taxCode
      ? REQUIRED
      : /^\d{11}$/.test(taxCode) || /^[A-Z0-9]{16}$/.test(taxCode)
        ? undefined
        : "Codice fiscale o P.IVA non valido",
    sdiCode:
      sdi && !/^[A-Za-z0-9]{7}$/.test(sdi)
        ? "Il codice SDI ha 7 caratteri"
        : undefined,
    pec: pec && !isEmail(pec) ? "PEC non valida" : undefined,
    street: textError(d.street, STREET_MAX),
    zip: !d.zip.trim()
      ? REQUIRED
      : /^\d{5}$/.test(d.zip.trim())
        ? undefined
        : "CAP di 5 cifre",
    city: textError(d.city, CITY_MAX),
    province: !d.province.trim()
      ? REQUIRED
      : /^[A-Za-z]{2}$/.test(d.province.trim())
        ? undefined
        : "Sigla di 2 lettere (es. VR)",
  });
};

export const signupErrors = (d: SignupDraft): SignupErrors => {
  const email = d.email.trim();
  const phone = d.phone.trim();
  return {
    fields: compact({
      restaurantName: textError(d.restaurantName, RESTAURANT_NAME_MAX),
      slug: slugError(d.slug) ?? undefined,
      ownerName: textError(d.ownerName, PERSON_NAME_MAX),
      email: !email
        ? REQUIRED
        : isEmail(email)
          ? undefined
          : "Email non valida",
      phone: !phone
        ? REQUIRED
        : phone.length >= 6 &&
            phone.length <= PHONE_MAX &&
            /^\+?[\d\s]+$/.test(phone)
          ? undefined
          : "Telefono non valido",
      password:
        d.password.length < PASSWORD_MIN || d.password.length > PASSWORD_MAX
          ? `Almeno ${PASSWORD_MIN} caratteri`
          : undefined,
      passwordConfirm:
        d.passwordConfirm !== d.password
          ? "Le password non coincidono"
          : undefined,
    }),
    billing: billingErrors(d.billing),
  };
};

const isSignupErrors = (
  e: SignupErrors | FieldErrors<string>,
): e is SignupErrors => "fields" in e && "billing" in e;

//C'è almeno un errore (degli errori di tutto il form o di un gruppo di campi)
export const hasErrors = (e: SignupErrors | FieldErrors<string>): boolean =>
  isSignupErrors(e)
    ? Object.keys(e.fields).length + Object.keys(e.billing).length > 0
    : Object.keys(e).length > 0;

export const toBillingDetails = (d: BillingDraft): BillingDetails => {
  const sdiCode = d.sdiCode.trim().toUpperCase();
  const pec = d.pec.trim().toLowerCase();
  return {
    holder: d.holder.trim(),
    taxCode: d.taxCode.trim().toUpperCase(),
    ...(sdiCode && { sdiCode }),
    ...(pec && { pec }),
    address: {
      street: d.street.trim(),
      zip: d.zip.trim(),
      city: d.city.trim(),
      province: d.province.trim().toUpperCase(),
    },
  };
};

export const toBillingDraft = (b: BillingDetails): BillingDraft => ({
  holder: b.holder,
  taxCode: b.taxCode,
  sdiCode: b.sdiCode ?? "",
  pec: b.pec ?? "",
  street: b.address.street,
  zip: b.address.zip,
  city: b.address.city,
  province: b.address.province,
});

export const toSignupRequest = (d: SignupDraft): SignupRequest => ({
  restaurantName: d.restaurantName.trim(),
  slug: d.slug.trim().toLowerCase(),
  owner: {
    name: d.ownerName.trim(),
    email: d.email.trim().toLowerCase(),
    phone: d.phone.trim(),
    password: d.password,
  },
  billing: toBillingDetails(d.billing),
});

//Stesse regole sui dati già inviati (dati finti e, in futuro, test): il backend deve
//rifiutare il resto con 400
export const billingDetailsValid = (b: BillingDetails): boolean =>
  !hasErrors(billingErrors(toBillingDraft(b)));

export const signupRequestValid = (r: SignupRequest): boolean =>
  !hasErrors(
    signupErrors({
      restaurantName: r.restaurantName,
      slug: r.slug,
      ownerName: r.owner.name,
      email: r.owner.email,
      phone: r.owner.phone,
      password: r.owner.password,
      passwordConfirm: r.owner.password,
      billing: toBillingDraft(r.billing),
    }),
  );
