import { useState } from "react";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { SaveChanges } from "../../../components/SaveChanges";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { SERVICE_LABELS, SERVICES } from "../../../constant/openingHours";
import { rangesError } from "../../../helpers/openingHours";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";
import type { ServiceConst, TimeRange } from "../../../types/openingHours";
import { PickupMode, type TakeawaySettings } from "../types/orders";
import {
  useSaveTakeawaySettings,
  useTakeawaySettings,
} from "../hook/useOrders";

//Impostazioni dell'asporto: orario unico di ritiro per pranzo e cena, oppure le fasce
//in cui lo sceglie il cliente. I giorni sono quelli di apertura del locale.
//Si modificano in bozza e si salvano insieme.
export const TakeawaySettingsBox = () => {
  const { data: saved } = useTakeawaySettings();
  const { mutate: save, isPending } = useSaveTakeawaySettings();
  const showNotification = useNotification();
  const [draft, setDraft] = useState<TakeawaySettings | null>(null);

  if (!saved) return null;
  const settings = draft ?? saved;
  const isFixed = settings.mode === PickupMode.Fixed;
  const edit = (changes: Partial<TakeawaySettings>) =>
    setDraft({ ...settings, ...changes });
  const setRange = (s: ServiceConst, changes: Partial<TimeRange>) =>
    edit({
      ranges: {
        ...settings.ranges,
        [s]: { ...settings.ranges[s], ...changes },
      },
    });
  //le fasce contano (e si vedono) solo con l'orario scelto dal cliente
  const error = isFixed
    ? null
    : rangesError(SERVICES.map((s) => settings.ranges[s]));

  const submit = () => {
    if (!draft) return;
    save(draft, {
      onSuccess: () => {
        setDraft(null);
        showNotification(
          "Impostazioni dell'asporto salvate",
          NotificationType.Ok,
        );
      },
      onError: () =>
        showNotification(
          "Errore nel salvataggio dell'asporto",
          NotificationType.Err,
        ),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Orario di ritiro</p>
      <div className="flex flex-wrap gap-2">
        <Button
          label={<span className="text-sm">Unico</span>}
          onClick={() => edit({ mode: PickupMode.Fixed })}
          dimension={ButtonDimensions.auto}
          variant={isFixed ? "primary" : "secondary"}
          className="px-3 py-2"
        />
        <Button
          label={<span className="text-sm">Scelto dal cliente</span>}
          onClick={() => edit({ mode: PickupMode.Custom })}
          dimension={ButtonDimensions.auto}
          variant={isFixed ? "secondary" : "primary"}
          className="px-3 py-2"
        />
      </div>

      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        {isFixed
          ? "Tutti ritirano a quest'ora:"
          : "Il cliente sceglie l'orario quando ordina, in queste fasce:"}
      </p>
      {SERVICES.map((s) => (
        <div key={s} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-sm">{SERVICE_LABELS[s]}</span>
          {isFixed ? (
            <Input
              type="time"
              placeholder="19:30"
              value={settings.fixedTimes[s]}
              setValue={(time) =>
                time &&
                edit({ fixedTimes: { ...settings.fixedTimes, [s]: time } })
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
              <span className={ThemeVariants.colors.text.secondary}>–</span>
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

      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        L'asporto si ritira nei giorni e nei servizi in cui il locale è aperto
        (vedi Giorni e orari di apertura).
      </p>

      {draft && (
        <SaveChanges
          onSave={submit}
          onCancel={() => setDraft(null)}
          disabled={isPending || !!error}
        />
      )}
    </div>
  );
};
