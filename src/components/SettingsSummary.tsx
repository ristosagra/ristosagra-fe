import { ThemeVariants } from "../constant/colors";
import { cn } from "../helpers/cn";

//Riepilogo in lettura di un gruppo di impostazioni: una riga per voce, nome a sinistra e scelta a destra
export const SettingsSummary = ({
  children,
}: {
  children: React.ReactNode;
}) => <dl className="flex flex-col">{children}</dl>;

export const SummaryItem = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2 text-sm last:border-b-0",
      ThemeVariants.colors.border.bottom.default,
    )}
  >
    <dt className={ThemeVariants.colors.text.secondary}>{label}</dt>
    <dd className="font-semibold text-right [overflow-wrap:anywhere]">
      {children}
    </dd>
  </div>
);
