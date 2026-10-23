import { Fragment, useState } from "react";
import { Clock, ShoppingBag } from "lucide-react";
import { WeeklyHoursEditor } from "../../../components/WeeklyHoursEditor";
import { ThemeVariants } from "../../../constant/colors";
import {
  SERVICE_LABELS,
  SERVICES,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "../../../constant/openingHours";
import { TakeawaySettingsBox } from "../../../features/orders/components/TakeawaySettingsBox";
import {
  useSaveTakeawaySettings,
  useTakeawaySettings,
} from "../../../features/orders/hook/useOrders";
import type { TakeawaySettings } from "../../../features/orders/types/orders";
import {
  takeawayError,
  takeawayOutsideHours,
} from "../../../features/orders/utils/takeawayUtils";
import { useRestaurantDraft } from "../../../features/restaurant/hook/useRestaurantDraft";
import { customersOrderOnline } from "../../../features/restaurant/utils/ordering";
import { cn } from "../../../helpers/cn";
import {
  formatRanges,
  openServices,
  weeklyHoursValid,
} from "../../../helpers/openingHours";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import type { WeeklyHours } from "../../../types/openingHours";
import { ProfileSection, SettingsCard } from "./ProfileSection";

interface OpeningHoursSettingProps {
  hours: WeeklyHours;
  isEditMode: boolean;
  onChange: (hours: WeeklyHours) => void;
}

//Giorni e orari di apertura del locale: le prenotazioni dei clienti devono starci dentro
const OpeningHoursSetting = ({
  hours,
  isEditMode,
  onChange,
}: OpeningHoursSettingProps) => {
  if (isEditMode)
    return <WeeklyHoursEditor hours={hours} onChange={onChange} />;

  //Un giorno per riga: pranzo sopra e cena sotto, divisi dal giorno dopo da una linea
  return (
    <ul className="flex flex-col">
      {WEEKDAYS.map((d) => {
        const open = openServices(hours[d]);
        return (
          <li
            key={d}
            className={cn(
              "flex items-start justify-between gap-3 py-2 text-sm last:border-b-0",
              ThemeVariants.colors.border.bottom.default,
            )}
          >
            <span className="font-semibold flex mt-auto mb-auto">
              {WEEKDAY_LABELS[d]}
            </span>
            {open.length > 0 ? (
              <dl className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
                {SERVICES.map((s) => (
                  <Fragment key={s}>
                    <dt className={ThemeVariants.colors.text.secondary}>
                      {SERVICE_LABELS[s]}
                    </dt>
                    <dd
                      className={cn(
                        "tabular-nums",
                        !open.includes(s) &&
                          ThemeVariants.colors.text.secondary,
                      )}
                    >
                      {open.includes(s)
                        ? formatRanges([hours[d][s]])
                        : "Chiuso"}
                    </dd>
                  </Fragment>
                ))}
              </dl>
            ) : (
              <span className={ThemeVariants.colors.text.secondary}>
                Chiuso
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

//Sezione del profilo: giorni e orari di apertura e asporto (che segue gli stessi giorni).
//Orari e asporto si salvano insieme con Salva
export const HoursSection = ({ onBack }: { onBack: () => void }) => {
  const restaurant = useRestaurantDraft();
  const { profile, draft } = restaurant;
  const { data: takeaway } = useTakeawaySettings();
  const { mutateAsync: saveTakeaway } = useSaveTakeawaySettings();
  const [takeawayDraft, setTakeawayDraft] = useState<TakeawaySettings | null>(
    null,
  );
  //con Solo menù l'asporto lo prende la cassa: le fasce di ritiro non contano
  const customersOrder = customersOrderOnline(restaurant.restaurant);

  const edit = useSectionEdit(
    [
      { label: "orari", dirty: restaurant.isDirty, run: restaurant.save },
      {
        label: "asporto",
        dirty: takeawayDraft !== null,
        run: async () => {
          if (!takeawayDraft) return;
          await saveTakeaway(takeawayDraft);
          setTakeawayDraft(null);
        },
      },
    ],
    () => {
      restaurant.reset();
      setTakeawayDraft(null);
    },
  );

  //Avvisi (non bloccano): locale mai aperto, orari di ritiro fuori dall'apertura
  const takeawayNow = takeawayDraft ?? takeaway;
  const neverOpen =
    !!profile &&
    WEEKDAYS.every((d) => openServices(profile.openingHours[d]).length === 0);
  const pickupOutside =
    profile && takeawayNow && customersOrder
      ? takeawayOutsideHours(takeawayNow, profile.openingHours)
      : [];

  const saveError =
    draft.openingHours && !weeklyHoursValid(draft.openingHours)
      ? "Orari di apertura da correggere"
      : takeawayDraft && customersOrder && takeawayError(takeawayDraft)
        ? "Fasce di ritiro dell'asporto da correggere"
        : null;

  return (
    <ProfileSection
      icon={<Clock size={22} />}
      title="Orari e asporto"
      onBack={onBack}
      edit={edit}
      canEdit={!!profile && !!takeaway}
      saveError={saveError}
    >
      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        <SettingsCard
          icon={<Clock size={15} />}
          title="Giorni e orari di apertura"
        >
          {profile && (
            <OpeningHoursSetting
              hours={profile.openingHours}
              isEditMode={edit.isEditMode}
              onChange={(openingHours) => restaurant.edit({ openingHours })}
            />
          )}
        </SettingsCard>
        <SettingsCard icon={<ShoppingBag size={15} />} title="Asporto">
          {takeawayNow && (
            <TakeawaySettingsBox
              settings={takeawayNow}
              customersOrder={customersOrder}
              isEditMode={edit.isEditMode}
              onChange={setTakeawayDraft}
            />
          )}
          {pickupOutside.length > 0 && (
            <p
              role="status"
              className={`text-sm ${ThemeVariants.colors.text.danger}`}
            >
              Il ritiro a {pickupOutside.join(" e a ")} esce dall'orario di
              apertura in alcuni giorni: controlla gli orari di ritiro.
            </p>
          )}
        </SettingsCard>
      </div>
      {neverOpen && (
        <p
          role="status"
          className={`text-sm ${ThemeVariants.colors.text.danger}`}
        >
          Il locale risulta sempre chiuso: i clienti non possono prenotare né
          ordinare, e nemmeno la cassa.
        </p>
      )}
    </ProfileSection>
  );
};
