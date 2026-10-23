import { useState } from "react";
import { MonitorPlay, QrCode as QrCodeIcon } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { ChoiceList, type Choice } from "../../../components/ChoiceList";
import { SettingSwitch } from "../../../components/SettingSwitch";
import {
  SettingsSummary,
  SummaryItem,
} from "../../../components/SettingsSummary";
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
import { ORDERING_MODE_LABELS } from "../constant/ordering";
import { customerAsksTable } from "../utils/ordering";
import { useFloorPlan } from "../../floorPlan/hook/useFloorPlan";
import { tableNames } from "../../floorPlan/helpers/tableNames";
import { TableQrCodes } from "./TableQrCodes";

const ORDERING_MODES: Choice<OrderingModeConst>[] = [
  {
    value: OrderingMode.MenuOnly,
    label: ORDERING_MODE_LABELS[OrderingMode.MenuOnly],
    description:
      "I clienti vedono il menù dal telefono; ordinano e pagano alla cassa (o al cameriere), che crea l'ordine da Nuovo ordine",
  },
  {
    value: OrderingMode.PayAtCashier,
    label: ORDERING_MODE_LABELS[OrderingMode.PayAtCashier],
    description:
      "I clienti ordinano dal telefono e pagano alla cassa, che segna l'ordine come pagato. A fine pasto, se l'ordine si porta al tavolo, riporta il tavolo",
  },
  {
    value: OrderingMode.PayOnline,
    label: ORDERING_MODE_LABELS[OrderingMode.PayOnline],
    description:
      "I clienti ordinano seduti al tavolo e pagano dal telefono: l'ordine riporta il tavolo e la cassa lo vede in sola lettura",
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
      "Chi serve porta l'ordine al tavolo, cercando il tavolo o il numero del bigliettino. Al banco si consegna solo l'asporto",
  },
  {
    value: ServiceMode.Counter,
    label: "Ritiro al banco",
    description:
      "Si paga prima di mangiare; quando il numero è pronto il cliente lo ritira al banco e sul telefono vede quando è pronto",
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

//Scelte in breve, per il riepilogo in lettura
const PAYMENT_SUMMARY: Record<PaymentTimingConst, string> = {
  [PaymentTiming.AfterMeal]: "A fine pasto (tipo ristorante)",
  [PaymentTiming.BeforeMeal]: "Prima di mangiare (tipo sagra)",
};

type OrderingSettingsValue = Pick<
  RestaurantProfile,
  | "name"
  | "orderingMode"
  | "paymentTiming"
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
//oppure ordinare e pagare online. Chi ordina e paga dal sito è già seduto: l'ordine riporta il
//tavolo, scritto o dal QR code (vedi customerAsksTable). Poi come arriva l'ordine: portato al
//tavolo o ritirato al banco (numero sullo schermo Pronti o chiamato a voce). Infine quando si
//paga alla cassa, a fine pasto (tipo ristorante) o prima di mangiare (tipo sagra): pagando
//online o col ritiro al banco si paga sempre prima (vedi paysBeforeKitchen). In lettura un
//riepilogo breve; in modifica le scelte che non valgono con le altre restano bloccate, col
//motivo (i valori restano salvati per quando tornano a valere)
export const OrderingSettings = ({
  settings,
  isEditMode,
  onChange,
}: OrderingSettingsProps) => {
  const [showQrCodes, setShowQrCodes] = useState(false);
  const { orderingMode, paymentTiming, tableQrCode, serviceMode, pickupCall } =
    settings;
  const { data: floorPlan } = useFloorPlan();
  const payOnline = orderingMode === OrderingMode.PayOnline;
  const counter = serviceMode === ServiceMode.Counter;
  //il cliente ordina dal sito già seduto: l'ordine riporta il tavolo (vedi customerAsksTable)
  const asksTable = customerAsksTable(settings);
  const usesQrCode = asksTable && tableQrCode;
  //senza tavoli con un nome non ci sono QR code: nessuno potrebbe ordinare sul posto
  const noQrTables =
    usesQrCode && !!floorPlan && tableNames(floorPlan).length === 0;

  //Perché una scelta non vale con le altre
  const paymentDisabled = payOnline
    ? "Non serve: pagando dal sito si paga sempre prima che la cucina prepari"
    : counter
      ? "Col ritiro al banco si paga sempre prima di mangiare: alla cassa, poi si ritira quando il numero è pronto"
      : null;
  const qrDisabled = asksTable
    ? null
    : orderingMode === OrderingMode.PayAtCashier
      ? "Pagando alla cassa si attiva solo a fine pasto con l'ordine portato al tavolo: prima di mangiare il tavolo non si sa ancora"
      : "Si attiva quando i clienti ordinano dal sito già seduti";
  const pickupCallDisabled = counter ? null : "Solo col ritiro al banco";
  const qrWarning = noQrTables && (
    <p role="status" className={`text-sm ${ThemeVariants.colors.text.danger}`}>
      La piantina non ha tavoli con un nome: senza QR code i clienti non possono
      ordinare sul posto. Dai un nome ai tavoli dalla Piantina.
    </p>
  );

  if (!isEditMode)
    return (
      <div className="flex flex-col gap-3">
        <SettingsSummary>
          <SummaryItem label="Clienti dal sito">
            {ORDERING_MODE_LABELS[orderingMode]}
          </SummaryItem>
          {asksTable && (
            <SummaryItem label="Tavolo">
              {tableQrCode ? "Dal QR code sul tavolo" : "Lo scrive il cliente"}
            </SummaryItem>
          )}
          <SummaryItem label="Consegna">
            {!counter
              ? "Portato al tavolo"
              : pickupCall === PickupCall.Voice
                ? "Ritiro al banco, chiamata a voce"
                : "Ritiro al banco, schermo Pronti"}
          </SummaryItem>
          <SummaryItem label="Si paga">
            {payOnline
              ? "Dal sito, prima che la cucina prepari"
              : counter
                ? "Alla cassa, prima di mangiare"
                : PAYMENT_SUMMARY[paymentTiming]}
          </SummaryItem>
        </SettingsSummary>

        {(usesQrCode || (counter && pickupCall !== PickupCall.Voice)) && (
          <div className="flex flex-wrap gap-2">
            {usesQrCode && (
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
                className="px-3 py-2"
              />
            )}
            {counter && pickupCall !== PickupCall.Voice && (
              <a
                href="/pronti"
                target="_blank"
                rel="noopener"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-bold",
                  ThemeVariants.borderRadius.md,
                  ThemeVariants.colors.bg.hover,
                )}
              >
                <MonitorPlay size={15} />
                Apri lo schermo Pronti
              </a>
            )}
          </div>
        )}
        {usesQrCode && showQrCodes && (
          <TableQrCodes restaurantName={settings.name} />
        )}
        {qrWarning}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <ChoiceList
        label="Cosa fanno i clienti dal sito"
        choices={ORDERING_MODES}
        value={orderingMode}
        onChange={(value) => onChange({ orderingMode: value })}
        //sotto la modalità scelta (con Solo menù sotto "Ordine e pagamento dal sito", bloccato)
        extras={{
          [orderingMode === OrderingMode.MenuOnly
            ? OrderingMode.PayOnline
            : orderingMode]: (
            <SettingSwitch
              label="QR code sui tavoli"
              description={
                tableQrCode
                  ? "Il tavolo arriva dal QR code inquadrato: il cliente non lo scrive"
                  : "Il cliente scrive il numero del tavolo"
              }
              value={tableQrCode}
              isEditMode
              onChange={(value) => onChange({ tableQrCode: value })}
              disabledReason={qrDisabled}
            />
          ),
        }}
      />
      <ChoiceList
        label="Come arriva l'ordine al cliente"
        choices={SERVICE_MODES}
        value={serviceMode}
        onChange={(value) => onChange({ serviceMode: value })}
        extras={{
          [ServiceMode.Counter]: (
            <ChoiceList
              label="Come si avvisa che un numero è pronto"
              choices={PICKUP_CALLS}
              value={pickupCall}
              onChange={(value) => onChange({ pickupCall: value })}
              disabledReason={pickupCallDisabled}
            />
          ),
        }}
      />
      <ChoiceList
        label="Quando si paga alla cassa"
        choices={PAYMENT_TIMINGS}
        value={paymentTiming}
        onChange={(value) => onChange({ paymentTiming: value })}
        disabledReason={paymentDisabled}
      />
      {qrWarning}
    </div>
  );
};
