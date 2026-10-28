import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { ROOT_DOMAIN } from "../../../constant/env";
import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PERSON_NAME_MAX,
  PHONE_MAX,
} from "../../../constant/limits";
import { EDITION_PRICE } from "../../../constant/platform";
import { safeCheckoutUrl } from "../../../helpers/checkoutUrl";
import { cn } from "../../../helpers/cn";
import { HttpError } from "../../../services/client/httpClient";
import { RESTAURANT_NAME_MAX } from "../../restaurant/types/restaurant";
import { useSignup } from "../hook/usePlatform";
import type { BillingDraft, SignupDraft } from "../types/platform";
import {
  EMPTY_SIGNUP_DRAFT,
  hasErrors,
  signupErrors,
  toSignupRequest,
  type SignupErrors,
} from "../utils/signupForm";
import { normalizeSlugInput, slugify } from "../utils/slug";
import { BillingFields } from "./BillingFields";
import { FormField } from "./FormField";
import { SlugField } from "./SlugField";

type TextField = Exclude<keyof SignupDraft, "billing">;

const NO_ERRORS: SignupErrors = { fields: {}, billing: {} };

//Ordine dei campi nel form: il primo con un errore riceve il focus
const FIELD_ORDER: string[] = [
  "restaurantName",
  "slug",
  "ownerName",
  "email",
  "phone",
  "password",
  "passwordConfirm",
  ...(
    [
      "holder",
      "taxCode",
      "sdiCode",
      "pec",
      "street",
      "zip",
      "city",
      "province",
    ] satisfies (keyof BillingDraft)[]
  ).map((k) => `billing.${k}`),
];

const focusFirstError = (form: HTMLFormElement, errors: SignupErrors) => {
  const wrong = FIELD_ORDER.find((name) =>
    name.startsWith("billing.")
      ? errors.billing[name.slice(8) as keyof BillingDraft]
      : errors.fields[name as TextField],
  );
  const el = wrong && form.elements.namedItem(wrong);
  if (el instanceof HTMLElement) el.focus();
};

const Block = ({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) => (
  <fieldset className="flex flex-col gap-4">
    <legend className={cn("text-2xl mb-1", ThemeVariants.fontFamily.display)}>
      {title}
    </legend>
    {intro && (
      <p className={cn("-mt-2", ThemeVariants.colors.text.secondary)}>
        {intro}
      </p>
    )}
    {children}
  </fieldset>
);

//Registrazione di una sagra: sagra, titolare e dati per la fattura in un solo invio, poi la
//pagina di pagamento. Errori sotto ai campi, il primo campo sbagliato riceve il focus
export const SignupForm = () => {
  const [draft, setDraft] = useState<SignupDraft>(EMPTY_SIGNUP_DRAFT);
  //l'indirizzo segue il nome finché non lo si cambia a mano
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<SignupErrors>(NO_ERRORS);
  const [sendError, setSendError] = useState("");
  //invio partito (anche mentre si va alla pagina di pagamento): impostato subito al primo
  //tocco, così un secondo tocco ravvicinato trova il bottone già spento
  const [sending, setSending] = useState(false);
  const { mutate: signup } = useSignup();

  //modificando un campo il suo errore sparisce (col nome anche quello dell'indirizzo, se
  //l'indirizzo lo segue)
  const setField = (field: TextField, value: string) => {
    const slugFollows = field === "restaurantName" && !slugTouched;
    setDraft((d) => ({
      ...d,
      [field]: value,
      ...(slugFollows && { slug: slugify(value) }),
    }));
    setErrors((e) => ({
      ...e,
      fields: {
        ...e.fields,
        [field]: undefined,
        ...(slugFollows && { slug: undefined }),
      },
    }));
  };

  const setBilling = (billing: BillingDraft) => {
    const changed = (Object.keys(billing) as (keyof BillingDraft)[]).filter(
      (k) => billing[k] !== draft.billing[k],
    );
    setDraft((d) => ({ ...d, billing }));
    setErrors((e) => ({
      ...e,
      billing: Object.fromEntries(
        Object.entries(e.billing).filter(
          ([k]) => !changed.includes(k as keyof BillingDraft),
        ),
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const form = e.currentTarget;
    const found = signupErrors(draft);
    setErrors(found);
    setSendError("");
    if (hasErrors(found)) return focusFirstError(form, found);

    setSending(true);
    signup(toSignupRequest(draft), {
      onSuccess: ({ checkoutUrl }) => {
        const url = safeCheckoutUrl(checkoutUrl);
        if (url) return window.location.assign(url);
        setSending(false);
        setSendError(
          "Registrazione non riuscita: controlla la connessione e riprova",
        );
      },
      onError: (err) => {
        setSending(false);
        if (err instanceof HttpError && err.status === 409) {
          const taken: SignupErrors = {
            fields: { slug: "Questo indirizzo è già in uso" },
            billing: {},
          };
          setErrors(taken);
          return focusFirstError(form, taken);
        }
        setSendError(
          "Registrazione non riuscita: controlla la connessione e riprova",
        );
      },
    });
  };

  const text = (
    field: TextField,
    label: string,
    placeholder: string,
    options: { type?: string; maxLength: number; autoComplete: string },
  ) => (
    <FormField label={label} error={errors.fields[field]}>
      <Input
        type={options.type ?? "text"}
        name={field}
        placeholder={placeholder}
        ariaLabel={label}
        value={draft[field]}
        setValue={(v) => setField(field, v)}
        maxLength={options.maxLength}
        autoComplete={options.autoComplete}
      />
    </FormField>
  );

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-10">
      <Block title="La sagra">
        {text(
          "restaurantName",
          "Nome della sagra",
          "Sagra del Pesce di Ponte",
          {
            maxLength: RESTAURANT_NAME_MAX,
            autoComplete: "organization",
          },
        )}
        <SlugField
          value={draft.slug}
          onChange={(v) => {
            setSlugTouched(true);
            setField("slug", normalizeSlugInput(v, ROOT_DOMAIN));
          }}
          error={errors.fields.slug}
        />
      </Block>

      <Block
        title="Il titolare"
        intro="Entrerai nell'area della sagra con questa email e questa password."
      >
        {text("ownerName", "Nome e cognome", "Anna Rossi", {
          maxLength: PERSON_NAME_MAX,
          autoComplete: "name",
        })}
        {text("email", "Email", "anna@esempio.it", {
          type: "email",
          maxLength: EMAIL_MAX,
          autoComplete: "email",
        })}
        {text("phone", "Telefono", "+39 333 123 4567", {
          type: "tel",
          maxLength: PHONE_MAX,
          autoComplete: "tel",
        })}
        <div className="grid gap-4 sm:grid-cols-2">
          {text("password", "Password", "Almeno 8 caratteri", {
            type: "password",
            maxLength: PASSWORD_MAX,
            autoComplete: "new-password",
          })}
          {text("passwordConfirm", "Ripeti la password", "Uguale a sopra", {
            type: "password",
            maxLength: PASSWORD_MAX,
            autoComplete: "new-password",
          })}
        </div>
      </Block>

      <Block
        title="Dati per la fattura"
        intro="SDI e PEC: se non li avete, lasciate vuoto."
      >
        <BillingFields
          value={draft.billing}
          onChange={setBilling}
          errors={errors.billing}
        />
      </Block>

      <div className="flex flex-col gap-3">
        {sendError && (
          <p
            role="alert"
            className={cn("font-semibold", ThemeVariants.colors.text.danger)}
          >
            {sendError}
          </p>
        )}
        <Button
          type="submit"
          label={sending ? "Invio…" : `Registra e paga €${EDITION_PRICE}`}
          dimension={ButtonDimensions.auto}
          fullWidth
          variant="primary"
          disabled={sending}
          className="h-12 text-base disabled:opacity-60 disabled:cursor-wait"
        />
        <Link
          to="/accedi"
          className={cn(
            "text-sm text-center underline underline-offset-4",
            ThemeVariants.colors.text.secondary,
          )}
        >
          Hai già una sagra? Accedi
        </Link>
      </div>
    </form>
  );
};
