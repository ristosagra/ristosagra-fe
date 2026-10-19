import { Copy } from "lucide-react";
import { Toggle } from "./core/Toogle";
import { Input } from "./core/Input";
import { Button } from "./core/Button";
import {
  SERVICE_LABELS,
  SERVICES,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "../constant/openingHours";
import { ButtonDimensions } from "../constant/button";
import { ThemeVariants } from "../constant/colors";
import { dayHoursError } from "../helpers/openingHours";
import { cn } from "../helpers/cn";
import {
  Service,
  type DayHours,
  type ServiceConst,
  type ServiceHours,
  type WeekdayConst,
  type WeeklyHours,
} from "../types/openingHours";

interface WeeklyHoursEditorProps {
  hours: WeeklyHours;
  onChange: (hours: WeeklyHours) => void;
}

//Giorni della settimana: aperto o chiuso, pranzo e/o cena e i loro orari
export const WeeklyHoursEditor = ({
  hours,
  onChange,
}: WeeklyHoursEditorProps) => {
  const setDay = (d: WeekdayConst, day: DayHours) =>
    onChange({ ...hours, [d]: day });

  const setService = (
    d: WeekdayConst,
    s: ServiceConst,
    changes: Partial<ServiceHours>,
  ) => setDay(d, { ...hours[d], [s]: { ...hours[d][s], ...changes } });

  //Togliere l'ultimo servizio chiude il giorno: il servizio resta scelto per quando lo si riapre
  const toggleService = (d: WeekdayConst, s: ServiceConst) => {
    const day = hours[d];
    const other = s === Service.Lunch ? Service.Dinner : Service.Lunch;
    if (day[s].open && !day[other].open)
      return setDay(d, { ...day, open: false });
    setService(d, s, { open: !day[s].open });
  };

  const copyToOpenDays = (from: WeekdayConst) =>
    onChange(
      Object.fromEntries(
        WEEKDAYS.map((d) => [d, hours[d].open ? hours[from] : hours[d]]),
      ) as WeeklyHours,
    );

  return (
    <div className="@container flex flex-col">
      {WEEKDAYS.map((d) => {
        const day = hours[d];
        const dayLabel = WEEKDAY_LABELS[d];
        const error = dayHoursError(day);
        return (
          <div
            key={d}
            className={cn(
              "flex flex-col gap-1.5 py-2 last:border-b-0",
              ThemeVariants.colors.border.bottom.default,
            )}
          >
            <div className="flex items-center gap-3 min-h-9">
              <Toggle
                value={day.open}
                onChange={() => setDay(d, { ...day, open: !day.open })}
                ariaLabel={`${dayLabel}: aperto`}
              />
              <span className="flex-1 text-sm font-semibold">{dayLabel}</span>
              {day.open ? (
                <Button
                  iconLeft={<Copy size={15} />}
                  dimension={ButtonDimensions.auto}
                  variant="icon"
                  onClick={() => copyToOpenDays(d)}
                  className={`w-9 h-9 ${ThemeVariants.colors.text.secondary}`}
                  ariaLabel={`${dayLabel}: copia gli orari sugli altri giorni aperti`}
                />
              ) : (
                <span
                  className={`text-sm ${ThemeVariants.colors.text.secondary}`}
                >
                  Chiuso
                </span>
              )}
            </div>

            {day.open && (
              /* pranzo sopra e cena sotto, anche sugli schermi larghi */
              <div className="flex flex-col gap-1.5 @md:pl-15">
                {SERVICES.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <label className="flex items-center gap-2 w-20 shrink-0 min-h-9 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day[s].open}
                        onChange={() => toggleService(d, s)}
                        className="w-4 h-4 accent-[var(--brand)] cursor-pointer"
                      />
                      {SERVICE_LABELS[s]}
                    </label>
                    {day[s].open && (
                      <>
                        <Input
                          type="time"
                          placeholder="12:00"
                          value={day[s].from}
                          setValue={(from) =>
                            from && setService(d, s, { from })
                          }
                          variant="secondary"
                          className="flex-1 max-w-28 text-sm py-1"
                          ariaLabel={`${dayLabel}, ${SERVICE_LABELS[s].toLowerCase()}: dalle`}
                        />
                        <span className={ThemeVariants.colors.text.secondary}>
                          –
                        </span>
                        <Input
                          type="time"
                          placeholder="15:00"
                          value={day[s].to}
                          setValue={(to) => to && setService(d, s, { to })}
                          variant="secondary"
                          className="flex-1 max-w-28 text-sm py-1"
                          ariaLabel={`${dayLabel}, ${SERVICE_LABELS[s].toLowerCase()}: alle`}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <p
                role="alert"
                className={`text-sm @md:pl-15 ${ThemeVariants.colors.text.danger}`}
              >
                {error}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
