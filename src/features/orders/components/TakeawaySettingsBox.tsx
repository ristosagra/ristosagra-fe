import { Input } from "../../../components/core/Input";
import { ChoiceList, type Choice } from "../../../components/ChoiceList";
import { SettingSwitch } from "../../../components/SettingSwitch";
import {
  SettingsSummary,
  SummaryItem,
} from "../../../components/SettingsSummary";
import { ThemeVariants } from "../../../constant/colors";
import { SERVICE_LABELS, SERVICES } from "../../../constant/openingHours";
import { formatRanges } from "../../../helpers/openingHours";
import type { ServiceConst, TimeRange } from "../../../types/openingHours";
import {
  PickupMode,
  type PickupModeConst,
  type TakeawaySettings,
} from "../types/orders";
import { takeawayError } from "../utils/takeawayUtils";

const PICKUP_MODES: Choice<PickupModeConst>[] = [
  {
    value: PickupMode.Fixed,
    label: "Unico",
    description: "Tutti ritirano allo stesso orario del pranzo o della cena",
  },
  {
    value: PickupMode.Custom,
    label: "Scelto dal cliente",
    description:
      "Il cliente sceglie l'orario quando ordina, dentro la fascia del pranzo o della cena",
  },
];

interface TakeawaySettingsBoxProps {
  settings: TakeawaySettings;
  //i clienti ordinano dal sito: con Solo menù l'asporto lo prende la cassa e l'orario si concorda
  customersOrder: boolean;
  isEditMode: boolean;
  onChange: (settings: TakeawaySettings) => void;
}

//Impostazioni dell'asporto: attivo o no, poi orario unico di ritiro per pranzo e cena, oppure
//le fasce in cui lo sceglie il cliente. I giorni sono quelli di apertura del locale.
//In modifica i cambi vanno nella bozza della sezione, che li salva insieme agli orari.
export const TakeawaySettingsBox = ({
  settings,
  customersOrder,
  isEditMode,
  onChange,
}: TakeawaySettingsBoxProps) => {
  const isFixed = settings.mode === PickupMode.Fixed;
  const edit = (changes: Partial<TakeawaySettings>) =>
    onChange({ ...settings, ...changes });
  const setRange = (s: ServiceConst, changes: Partial<TimeRange>) =>
    edit({
      ranges: {
        ...settings.ranges,
        [s]: { ...settings.ranges[s], ...changes },
      },
    });
  const error = takeawayError(settings);
  const timeLabel = (s: ServiceConst) =>
    isFixed ? settings.fixedTimes[s] : formatRanges([settings.ranges[s]]);
  const daysNote = (
    <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
      L'asporto si ritira nei giorni e nei servizi in cui il locale è aperto.
    </p>
  );

  if (!isEditMode)
    return (
      <div className="flex flex-col gap-2">
        <SettingsSummary>
          <SummaryItem label="Asporto">
            {settings.enabled ? "Attivo" : "Non attivo"}
          </SummaryItem>
          {settings.enabled && (
            <SummaryItem label="Orario di ritiro">
              {!customersOrder
                ? "Lo concorda la cassa"
                : isFixed
                  ? "Unico"
                  : "Scelto dal cliente"}
            </SummaryItem>
          )}
          {settings.enabled &&
            customersOrder &&
            SERVICES.map((s) => (
              <SummaryItem key={s} label={SERVICE_LABELS[s]}>
                <span className="tabular-nums">{timeLabel(s)}</span>
              </SummaryItem>
            ))}
        </SettingsSummary>
        {settings.enabled && daysNote}
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <SettingSwitch
        label="Asporto attivo"
        description={
          !settings.enabled
            ? "Nessun asporto, in nessun giorno: gli orari restano salvati"
            : customersOrder
              ? "I clienti possono ordinare da asporto"
              : "La cassa può prendere ordini da asporto"
        }
        value={settings.enabled}
        isEditMode
        onChange={(enabled) => edit({ enabled })}
      />
      {settings.enabled && (
        <>
          <ChoiceList
            label="Orario di ritiro"
            choices={PICKUP_MODES}
            value={settings.mode}
            onChange={(mode) => edit({ mode })}
            disabledReason={
              customersOrder
                ? null
                : "Con Solo menù l'asporto lo prende la cassa e l'orario si concorda col cliente: serve quando i clienti ordinano dal sito"
            }
          />
          {customersOrder && (
            <div className="flex flex-col gap-2">
              <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
                {isFixed
                  ? "Tutti ritirano a quest'ora:"
                  : "Il cliente sceglie l'orario quando ordina, in queste fasce:"}
              </p>
              {SERVICES.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-sm">
                    {SERVICE_LABELS[s]}
                  </span>
                  {isFixed ? (
                    <Input
                      type="time"
                      placeholder="19:30"
                      value={settings.fixedTimes[s]}
                      setValue={(time) =>
                        time &&
                        edit({
                          fixedTimes: { ...settings.fixedTimes, [s]: time },
                        })
                      }
                      variant="secondary"
                      className="flex-1 max-w-28 text-sm py-1"
                      ariaLabel={`Orario unico di ritiro: ${SERVICE_LABELS[s].toLowerCase()}`}
                    />
                  ) : (
                    <>
                      <Input
                        type="time"
                        placeholder="12:00"
                        value={settings.ranges[s].from}
                        setValue={(from) => from && setRange(s, { from })}
                        variant="secondary"
                        className="flex-1 max-w-28 text-sm py-1"
                        ariaLabel={`Ritiro a ${SERVICE_LABELS[s].toLowerCase()}: dalle`}
                      />
                      <span className={ThemeVariants.colors.text.secondary}>
                        –
                      </span>
                      <Input
                        type="time"
                        placeholder="14:30"
                        value={settings.ranges[s].to}
                        setValue={(to) => to && setRange(s, { to })}
                        variant="secondary"
                        className="flex-1 max-w-28 text-sm py-1"
                        ariaLabel={`Ritiro a ${SERVICE_LABELS[s].toLowerCase()}: alle`}
                      />
                    </>
                  )}
                </div>
              ))}
              {error && (
                <p
                  role="alert"
                  className={`text-sm ${ThemeVariants.colors.text.danger}`}
                >
                  {error}
                </p>
              )}
            </div>
          )}
          {daysNote}
        </>
      )}
    </div>
  );
};
