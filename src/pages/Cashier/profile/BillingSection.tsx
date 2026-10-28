import { useState } from "react";
import { CalendarCheck, Receipt } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Spinner } from "../../../components/core/Spinner";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { EDITION_MONTHS, EDITION_PRICE } from "../../../constant/platform";
import { BillingFields } from "../../../features/platform/components/BillingFields";
import {
  useBilling,
  useUpdateBilling,
} from "../../../features/platform/hook/useBilling";
import { useStartActivation } from "../../../features/platform/hook/useStartActivation";
import type {
  Billing,
  BillingDraft,
} from "../../../features/platform/types/platform";
import { formatPaidUntil } from "../../../features/platform/utils/edition";
import {
  billingErrors,
  toBillingDetails,
  toBillingDraft,
} from "../../../features/platform/utils/signupForm";
import { cn } from "../../../helpers/cn";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//Stato dell'edizione in parole
const editionStatus = ({ active, paidUntil }: Billing) =>
  active && paidUntil
    ? `Attiva fino al ${formatPaidUntil(paidUntil)}`
    : paidUntil
      ? `Scaduta il ${formatPaidUntil(paidUntil)}`
      : "Non attiva";

//Edizione: scadenza e, se non è attiva, il pagamento
const EditionCard = ({ billing }: { billing: Billing }) => {
  const { start, sending } = useStartActivation();

  return (
    <SettingsCard icon={<CalendarCheck size={16} />} title="Edizione">
      <p
        className={cn(
          "font-semibold",
          !billing.active && ThemeVariants.colors.text.danger,
        )}
      >
        {editionStatus(billing)}
      </p>
      <p className={cn("text-sm", ThemeVariants.colors.text.secondary)}>
        €{EDITION_PRICE} a edizione, valida {EDITION_MONTHS} mesi dal pagamento.
        Nessun rinnovo automatico.
      </p>
      {!billing.active && (
        <Button
          label={sending ? "Attendi…" : `Attiva per €${EDITION_PRICE}`}
          onClick={start}
          disabled={sending}
          dimension={ButtonDimensions.auto}
          variant="primary"
          className="self-start px-4 h-10 disabled:opacity-60 disabled:cursor-wait"
        />
      )}
    </SettingsCard>
  );
};

//Dati per la fattura in sola lettura
const BillingSummary = ({ billing }: { billing: Billing }) => {
  const { holder, taxCode, sdiCode, pec, address } = billing.details;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm [overflow-wrap:anywhere]">
      <dt className={ThemeVariants.colors.text.secondary}>Intestatario</dt>
      <dd>{holder}</dd>
      <dt className={ThemeVariants.colors.text.secondary}>CF o P.IVA</dt>
      <dd>{taxCode}</dd>
      {sdiCode && (
        <>
          <dt className={ThemeVariants.colors.text.secondary}>Codice SDI</dt>
          <dd>{sdiCode}</dd>
        </>
      )}
      {pec && (
        <>
          <dt className={ThemeVariants.colors.text.secondary}>PEC</dt>
          <dd>{pec}</dd>
        </>
      )}
      <dt className={ThemeVariants.colors.text.secondary}>Indirizzo</dt>
      <dd>
        {address.street}, {address.zip} {address.city} ({address.province})
      </dd>
    </dl>
  );
};

//Edizione e fattura (titolare e vice): scadenza dell'edizione, pagamento se non è attiva e
//dati per la fattura elettronica, che sono l'unica cosa da modificare
export const BillingSection = ({ onBack }: { onBack: () => void }) => {
  const { data: billing } = useBilling();
  const { mutateAsync: updateBilling } = useUpdateBilling();
  //bozza dei dati per la fattura, solo mentre si modifica
  const [draft, setDraft] = useState<BillingDraft | null>(null);
  const current = draft ?? (billing && toBillingDraft(billing.details));
  const errors = current ? billingErrors(current) : {};

  const edit = useSectionEdit(
    [
      {
        label: "dati per la fattura",
        dirty: draft !== null,
        run: async () => {
          if (current) await updateBilling(toBillingDetails(current));
          setDraft(null);
        },
      },
    ],
    () => setDraft(null),
  );

  return (
    <ProfileSection
      icon={<Receipt size={24} />}
      title="Edizione e fattura"
      onBack={onBack}
      edit={edit}
      canEdit={!!billing}
      saveError={Object.values(errors)[0] ?? null}
    >
      {!billing || !current ? (
        <Spinner />
      ) : (
        <>
          {!edit.isEditMode && <EditionCard billing={billing} />}
          <SettingsCard
            icon={<Receipt size={16} />}
            title="Dati per la fattura"
          >
            {edit.isEditMode ? (
              <BillingFields
                value={current}
                onChange={setDraft}
                errors={errors}
              />
            ) : (
              <BillingSummary billing={billing} />
            )}
          </SettingsCard>
        </>
      )}
    </ProfileSection>
  );
};
