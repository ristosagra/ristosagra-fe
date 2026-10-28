import { Input } from "../../../components/core/Input";
import {
  BILLING_HOLDER_MAX,
  CITY_MAX,
  EMAIL_MAX,
  STREET_MAX,
} from "../../../constant/limits";
import type { BillingDraft } from "../types/platform";
import type { FieldErrors } from "../utils/signupForm";
import { FormField } from "./FormField";

interface BillingFieldsProps {
  value: BillingDraft;
  onChange: (value: BillingDraft) => void;
  errors: FieldErrors<keyof BillingDraft>;
}

//Dati per la fattura elettronica: nella registrazione e nel Profilo (i nomi dei campi
//iniziano con "billing." per trovare il primo con un errore)
export const BillingFields = ({
  value,
  onChange,
  errors,
}: BillingFieldsProps) => {
  const field = (
    key: keyof BillingDraft,
    label: string,
    placeholder: string,
    options: {
      maxLength: number;
      autoComplete?: string;
      inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
      type?: string;
      className?: string;
    },
  ) => (
    <FormField label={label} error={errors[key]} className={options.className}>
      <Input
        type={options.type ?? "text"}
        name={`billing.${key}`}
        placeholder={placeholder}
        ariaLabel={label}
        value={value[key]}
        setValue={(v) => onChange({ ...value, [key]: v })}
        maxLength={options.maxLength}
        autoComplete={options.autoComplete ?? "off"}
        inputMode={options.inputMode}
      />
    </FormField>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {field("holder", "Intestatario", "Pro Loco di Ponte", {
        maxLength: BILLING_HOLDER_MAX,
        autoComplete: "organization",
        className: "sm:col-span-2",
      })}
      {field("taxCode", "Codice fiscale o P.IVA", "01234567890", {
        maxLength: 16,
      })}
      {field("sdiCode", "Codice SDI", "Facoltativo", { maxLength: 7 })}
      {field("pec", "PEC", "Facoltativa", {
        maxLength: EMAIL_MAX,
        type: "email",
        className: "sm:col-span-2",
      })}
      {field("street", "Via e numero", "Via Roma 1", {
        maxLength: STREET_MAX,
        autoComplete: "street-address",
        className: "sm:col-span-2",
      })}
      {field("zip", "CAP", "37100", {
        maxLength: 5,
        autoComplete: "postal-code",
        inputMode: "numeric",
      })}
      {field("city", "Comune", "Verona", {
        maxLength: CITY_MAX,
        autoComplete: "address-level2",
      })}
      {field("province", "Provincia", "VR", {
        maxLength: 2,
        autoComplete: "address-level1",
      })}
    </div>
  );
};
