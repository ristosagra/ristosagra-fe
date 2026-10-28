import { ChartColumn, Clock, UtensilsCrossed } from "lucide-react";
import { Spinner } from "../../../components/core/Spinner";
import { ThemeVariants } from "../../../constant/colors";
import { cn } from "../../../helpers/cn";
import { formatMinutes } from "../../../features/kitchen/utils/kitchen";
import { useOrders } from "../../../features/orders/hook/useOrders";
import {
  daySummary,
  hourLabel,
  type DishSold,
  type HourCount,
} from "../../../features/orders/utils/daySummary";
import { useRestaurant } from "../../../features/restaurant/hook/useRestaurant";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//Un numero della giornata in grande, con una riga di dettaglio
const StatTile = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-1 p-4 min-w-0",
      ThemeVariants.colors.bg.surface,
      ThemeVariants.colors.border.all.default,
      ThemeVariants.borderRadius.lg,
    )}
  >
    <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>{label}</p>
    <p className="text-2xl font-bold tabular-nums [overflow-wrap:anywhere]">
      {value}
    </p>
    {detail && (
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        {detail}
      </p>
    )}
  </div>
);

//Ordini per fascia oraria: una barra per ora, lunga quanto i suoi ordini, col numero accanto
const HourBars = ({
  hours,
  peak,
}: {
  hours: HourCount[];
  peak: HourCount | null;
}) => {
  const max = Math.max(1, ...hours.map((h) => h.orders));

  return (
    <ul className="flex flex-col gap-1.5">
      {hours.map((h) => {
        const isPeak = h.hour === peak?.hour;
        return (
          <li
            key={h.hour}
            className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-3 text-sm"
          >
            <span
              className={cn(
                "tabular-nums",
                isPeak ? "font-bold" : ThemeVariants.colors.text.secondary,
              )}
            >
              {hourLabel(h.hour)}
            </span>
            <span aria-hidden className="h-3">
              {h.orders > 0 && (
                <span
                  className={cn(
                    "block h-full rounded-r-[4px]",
                    ThemeVariants.colors.bg.brand,
                  )}
                  style={{ width: `${(h.orders / max) * 100}%` }}
                />
              )}
            </span>
            <span
              className={cn("text-right tabular-nums", isPeak && "font-bold")}
            >
              {h.orders}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

//Piatti venduti, dal più venduto: quantità e incasso
const DishTable = ({ dishes }: { dishes: DishSold[] }) => (
  <table className="w-full text-sm">
    <thead>
      <tr
        className={cn(
          "text-left",
          ThemeVariants.colors.text.secondary,
          ThemeVariants.colors.border.bottom.default,
        )}
      >
        <th className="py-2 font-normal">Piatto</th>
        <th className="py-2 pl-3 font-normal text-right">Venduti</th>
        <th className="py-2 pl-3 font-normal text-right">Incasso</th>
      </tr>
    </thead>
    <tbody>
      {dishes.map((d) => (
        <tr
          key={d.id}
          className={cn(
            "last:border-b-0",
            ThemeVariants.colors.border.bottom.default,
          )}
        >
          <td className="py-2 [overflow-wrap:anywhere]">{d.name}</td>
          <td className="py-2 pl-3 text-right font-bold tabular-nums">
            {d.quantity}
          </td>
          <td className="py-2 pl-3 text-right tabular-nums">
            €{d.revenue.toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

//Sezione del profilo (titolare e vice): il riepilogo di oggi, calcolato dagli ordini e
//aggiornato da solo. Incasso, ordini sul posto e da asporto, piatti venduti, ordini per ora
//(il picco) e tempi della cucina: per chiudere la serata e misurare come è andata
export const SummarySection = ({ onBack }: { onBack: () => void }) => {
  const { data: orders, isLoading } = useOrders();
  const { data: restaurant } = useRestaurant();
  const summary = daySummary(orders ?? [], restaurant);
  const today = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  //ordini all'ora, con un decimale (es. "0,5")
  const perHour = (
    summary.byHour.length > 0 ? summary.orders / summary.byHour.length : 0
  ).toLocaleString("it-IT", { maximumFractionDigits: 1 });

  return (
    <ProfileSection
      icon={<ChartColumn size={22} />}
      title="Riepilogo di oggi"
      onBack={onBack}
    >
      <p className={`text-sm -mt-2 ${ThemeVariants.colors.text.secondary}`}>
        {today} · si aggiorna da solo
      </p>
      {isLoading ? (
        <Spinner />
      ) : summary.orders === 0 ? (
        <p
          className={`py-10 text-center ${ThemeVariants.colors.text.secondary}`}
        >
          {summary.neverPaid > 0
            ? `Oggi nessun ordine pagato (${summary.neverPaid} inviati e mai pagati)`
            : "Oggi ancora nessun ordine"}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Incassato"
              value={`€${summary.revenue.toFixed(2)}`}
              detail={
                summary.toCollect > 0
                  ? `+ €${summary.toCollect.toFixed(2)} da incassare`
                  : undefined
              }
            />
            <StatTile
              label="Ordini"
              value={String(summary.orders)}
              detail={
                summary.takeaway > 0
                  ? `${summary.dineIn} sul posto · ${summary.takeaway} asporto`
                  : "tutti sul posto"
              }
            />
            <StatTile
              label="Tempo in cucina"
              value={
                summary.avgPrepMinutes === null
                  ? "–"
                  : formatMinutes(summary.avgPrepMinutes)
              }
              detail={
                summary.maxPrepMinutes === null
                  ? "nessun ordine pronto"
                  : `in media; il più lungo ${formatMinutes(summary.maxPrepMinutes)}`
              }
            />
            <StatTile
              label="Picco"
              value={summary.peak ? hourLabel(summary.peak.hour) : "–"}
              detail={
                summary.peak
                  ? `${summary.peak.orders} ordini · in media ${perHour} all'ora`
                  : undefined
              }
            />
          </div>

          {(summary.avgPickupMinutes !== null || summary.neverPaid > 0) && (
            <div
              className={`flex flex-col gap-1 text-sm ${ThemeVariants.colors.text.secondary}`}
            >
              {summary.avgPickupMinutes !== null && (
                <p>
                  Al banco un ordine pronto aspetta in media{" "}
                  {formatMinutes(summary.avgPickupMinutes)} prima di essere
                  ritirato.
                </p>
              )}
              {summary.neverPaid > 0 && (
                <p>
                  {summary.neverPaid === 1
                    ? "1 ordine inviato non è mai stato pagato"
                    : `${summary.neverPaid} ordini inviati non sono mai stati pagati`}
                  : non sono arrivati in cucina e qui non contano.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
            <SettingsCard icon={<Clock size={15} />} title="Ordini per ora">
              <HourBars hours={summary.byHour} peak={summary.peak} />
              <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
                Dall'ora in cui l'ordine è arrivato in cucina (il pagamento, se
                si paga prima).
              </p>
            </SettingsCard>
            <SettingsCard
              icon={<UtensilsCrossed size={15} />}
              title="Piatti venduti"
            >
              <DishTable dishes={summary.dishes} />
            </SettingsCard>
          </div>
        </>
      )}
    </ProfileSection>
  );
};
