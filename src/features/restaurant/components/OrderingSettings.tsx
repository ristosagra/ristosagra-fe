import { useState } from "react";
import { Check, MonitorPlay, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { SettingSwitch } from "../../../components/SettingSwitch";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import {
  OrderingMode,
  PaymentTiming,
  PickupCall,
  ServiceMode,
  type OrderingModeConst,
  type PaymentTimingConst,
  type PickupCallConst,
  type ServiceModeConst,
  type RestaurantProfile,
  type RestaurantProfileUpdate,
} from "../types/restaurant";
import { customerAsksTable } from "../utils/ordering";
import { TableQrCodes } from "./TableQrCodes";

interface Choice<T> {
  value: T;
  label: string;
  description: string;
}

const ORDERING_MODES: Choice<OrderingModeConst>[] = [
  {
    value: OrderingMode.MenuOnly,
    label: "Solo menù",
    description:
      "I clienti vedono il menù dal telefono; ordinano e pagano alla cassa (o al cameriere), che crea l'ordine da Nuovo ordine",
  },
  {
    value: OrderingMode.PayAtCashier,
    label: "Ordine dal sito, pagamento alla cassa",
    description:
      "I clienti ordinano dal telefono e pagano alla cassa, che segna l'ordine come pagato",
  },
  {
    value: OrderingMode.PayOnline,
    label: "Ordine e pagamento dal sito",
    description:
      "I clienti ordinano e pagano dal telefono; la cassa vede gli ordini in sola lettura",
  },
];

const PAYMENT_TIMINGS: Choice<PaymentTimingConst>[] = [
  {
    value: PaymentTiming.AfterMeal,
    label: "A fine pasto (tipo ristorante)",
    description:
      "Si ordina al tavolo, dal cameriere o dal telefono: la cucina prepara subito e si paga alla cassa prima di andare via",
  },
  {
    value: PaymentTiming.BeforeMeal,
    label: "Prima di mangiare (tipo sagra)",
    description:
      "Si ordina dal telefono o alla cassa e si paga subito: la cucina vede l'ordine solo dopo il pagamento e la cassa consegna il bigliettino col numero",
  },
];

const SERVICE_MODES: Choice<ServiceModeConst>[] = [
  {
    value: ServiceMode.Table,
    label: "Lo portiamo al tavolo",
    description:
      "Chi serve porta l'ordine al tavolo, cercando il tavolo o il numero del bigliettino",
  },
  {
    value: ServiceMode.Counter,
    label: "Ritiro al banco",
    description:
      "Quando il numero è pronto il cliente lo ritira al banco; sul telefono vede quando è pronto",
  },
];

const PICKUP_CALLS: Choice<PickupCallConst>[] = [
  {
    value: PickupCall.Screen,
    label: "Schermo Pronti",
    description:
      "I numeri pronti compaiono su una TV o un monitor vicino al banco (pagina /pronti)",
  },
  {
    value: PickupCall.Voice,
    label: "A voce",
    description: "Chi è al banco chiama i numeri pronti dalla pagina Ritiro",
  },
];

interface ChoiceListProps<T> {
  label: string;
  choices: Choice<T>[];
  value: T;
  isEditMode: boolean;
  onChange: (value: T) => void;
}

//Una scelta tra più opzioni descritte: schede selezionabili in modifica, quella scelta in lettura
const ChoiceList = <T extends string>({
  label,
  choices,
  value,
  isEditMode,
  onChange,
}: ChoiceListProps<T>) => {
  const current = choices.find((c) => c.value === value) ?? choices[0];

  if (!isEditMode)
    return (
      <div>
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {label}
        </p>
        <p
          className={`text-sm font-semibold ${ThemeVariants.colors.text.brand}`}
        >
          {current.label}
        </p>
        <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
          {current.description}
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
        {choices.map((c) => {
          const selected = c.value === current.value;
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(c.value)}
              className={cn(
                "flex items-start gap-3 p-3 text-left cursor-pointer transition-colors",
                ThemeVariants.borderRadius.md,
                selected
                  ? `${ThemeVariants.colors.bg.hover} border border-[var(--brand)]`
                  : ThemeVariants.colors.border.all.default,
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center",
                  ThemeVariants.borderRadius.full,
                  selected
                    ? `${ThemeVariants.colors.bg.brand} text-white`
                    : ThemeVariants.colors.border.all.default,
                )}
              >
                {selected && <Check size={13} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{c.label}</span>
                <span
                  className={`block text-sm ${ThemeVariants.colors.text.secondary}`}
                >
                  {c.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

type OrderingSettingsValue = Pick<
  RestaurantProfile,
  | "name"
  | "orderingMode"
  | "paymentTiming"
  | "tableOrdering"
  | "tableQrCode"
  | "serviceMode"
  | "pickupCall"
>;

interface OrderingSettingsProps {
  settings: OrderingSettingsValue;
  isEditMode: boolean;
  onChange: (changes: RestaurantProfileUpdate) => void;
}

//Cosa possono fare i clienti dal sito: solo vedere il menù, ordinare e pagare alla cassa
//oppure ordinare e pagare online. Pagando alla cassa: a fine pasto (tipo ristorante) o prima
//di mangiare (tipo sagra). Chi ordina già seduto può indicare il tavolo, scritto o dal QR code.
//L'ordine si porta al tavolo o si ritira al banco (numero sullo schermo Pronti o chiamato a voce)
export const OrderingSettings = ({
  settings,
  isEditMode,
  onChange,
}: OrderingSettingsProps) => {
  const [showQrCodes, setShowQrCodes] = useState(false);
  const {
    orderingMode,
    paymentTiming,
    tableOrdering,
    tableQrCode,
    serviceMode,
    pickupCall,
  } = settings;
  const paysAtCashier = orderingMode !== OrderingMode.PayOnline;
  //il tavolo si chiede a chi ordina dal sito già seduto (vedi customerAsksTable)
  const tableApplies = customerAsksTable({
    orderingMode,
    paymentTiming,
    tableOrdering: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <ChoiceList
        label="Cosa fanno i clienti dal sito"
        choices={ORDERING_MODES}
        value={orderingMode}
        isEditMode={isEditMode}
        onChange={(value) => onChange({ orderingMode: value })}
      />

      {paysAtCashier && (
        <ChoiceList
          label="Quando si paga alla cassa"
          choices={PAYMENT_TIMINGS}
          value={paymentTiming}
          isEditMode={isEditMode}
          onChange={(value) => onChange({ paymentTiming: value })}
        />
      )}

      {tableApplies && (
        <>
          <SettingSwitch
            label="Ordine dal tavolo"
            description="Il cliente ordina seduto e l'ordine riporta il suo tavolo"
            value={tableOrdering}
            isEditMode={isEditMode}
            onChange={(value) => onChange({ tableOrdering: value })}
          />
          {tableOrdering && (
            <SettingSwitch
              label="QR code sui tavoli"
              description={
                tableQrCode
                  ? "Il tavolo arriva dal QR code inquadrato: il cliente non lo scrive"
                  : "Il cliente scrive il numero del tavolo"
              }
              value={tableQrCode}
              isEditMode={isEditMode}
              onChange={(value) => onChange({ tableQrCode: value })}
            />
          )}
          {tableOrdering && tableQrCode && (
            <>
              <Button
                iconLeft={<QrCodeIcon size={15} />}
                label={
                  <span className="text-sm ml-1.5">
                    {showQrCodes ? "Nascondi i QR code" : "QR code dei tavoli"}
                  </span>
                }
                onClick={() => setShowQrCodes((s) => !s)}
                dimension={ButtonDimensions.auto}
                variant="secondary"
                className="px-3 py-2 self-start"
              />
              {showQrCodes && <TableQrCodes restaurantName={settings.name} />}
            </>
          )}
        </>
      )}

      <ChoiceList
        label="Come arriva l'ordine al cliente"
        choices={SERVICE_MODES}
        value={serviceMode}
        isEditMode={isEditMode}
        onChange={(value) => onChange({ serviceMode: value })}
      />
      {serviceMode === ServiceMode.Counter && (
        <>
          <ChoiceList
            label="Come si avvisa che un numero è pronto"
            choices={PICKUP_CALLS}
            value={pickupCall}
            isEditMode={isEditMode}
            onChange={(value) => onChange({ pickupCall: value })}
          />
          {pickupCall !== PickupCall.Voice && (
            <a
              href="/pronti"
              target="_blank"
              rel="noopener"
              className={cn(
                "flex items-center gap-1.5 self-start px-3 py-2 text-sm font-bold",
                ThemeVariants.borderRadius.md,
                ThemeVariants.colors.bg.hover,
              )}
            >
              <MonitorPlay size={15} />
              Apri lo schermo Pronti
            </a>
          )}
        </>
      )}
    </div>
  );
};
