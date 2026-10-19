import { Fragment, useId, useState } from "react";
import {
  Check,
  ChevronDown,
  Clock,
  Moon,
  Palette,
  Pencil,
  ShoppingBag,
  Store,
  Sun,
  UtensilsCrossed,
} from "lucide-react";
import { MenuEditor } from "./MenuEditor";
import { TakeawaySettingsBox } from "../../features/orders/components/TakeawaySettingsBox";
import {
  useSaveTakeawaySettings,
  useTakeawaySettings,
} from "../../features/orders/hook/useOrders";
import { takeawayError } from "../../features/orders/utils/takeawayUtils";
import type { TakeawaySettings } from "../../features/orders/types/orders";
import { useMenuDraft } from "../../features/menu/hook/useMenuDraft";
import {
  useRestaurant,
  useUpdateRestaurant,
} from "../../features/restaurant/hook/useRestaurant";
import {
  RESTAURANT_NAME_MAX,
  RestaurantTheme,
  type BrandColorConst,
  type RestaurantProfileUpdate,
  type RestaurantThemeConst,
} from "../../features/restaurant/types/restaurant";
import {
  BRAND_COLORS,
  BRAND_PALETTE,
} from "../../features/restaurant/constant/brandColors";
import { Accordion } from "../../components/core/Accordion";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { Loader } from "../../components/core/Loader";
import { SaveChanges } from "../../components/SaveChanges";
import { WeeklyHoursEditor } from "../../components/WeeklyHoursEditor";
import { useNotification } from "../../hooks/useNotification";
import { ThemeVariants } from "../../constant/colors";
import { ButtonDimensions } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import {
  SERVICE_LABELS,
  SERVICES,
  WEEKDAY_LABELS,
  WEEKDAYS,
} from "../../constant/openingHours";
import {
  formatRanges,
  openServices,
  weeklyHoursValid,
} from "../../helpers/openingHours";
import { cn } from "../../helpers/cn";
import { NotificationType } from "../../types/notification";
import type { WeeklyHours } from "../../types/openingHours";

interface BadgeProps {
  label: string;
  variant: "success" | "danger" | "brand";
}

//Etichetta accanto al titolo di una box: stato del menù, modifiche da salvare o da correggere
const Badge = ({ label, variant }: BadgeProps) => (
  <span
    className={cn(
      "text-xs px-2 py-0.5 rounded-full font-medium normal-case",
      {
        success: `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.text.white} ${ThemeVariants.colors.border.all.success}`,
        danger: `${ThemeVariants.colors.bg.danger} ${ThemeVariants.colors.text.white} ${ThemeVariants.colors.border.all.danger}`,
        brand: `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.text.brand} ${ThemeVariants.colors.border.all.brand}`,
      }[variant],
    )}
  >
    {label}
  </span>
);

//In modifica dice se una box ha cambi da salvare o da correggere (utile quando è chiusa)
const EditStatus = ({
  dirty,
  error,
}: {
  dirty: boolean;
  error?: string | null;
}) =>
  error ? (
    <Badge label={error} variant="danger" />
  ) : dirty ? (
    <Badge label="Da salvare" variant="brand" />
  ) : null;

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  //etichette accanto al titolo
  badges?: React.ReactNode;
  //false per una box sempre aperta, senza pulsante per chiuderla
  collapsible?: boolean;
  children: React.ReactNode;
}

//Box del profilo: quelle apribili partono chiuse. Da chiuse il contenuto resta montato
//(solo nascosto), così non si perde quello che si sta scrivendo, es. un piatto in modifica
const SettingsCard = ({
  icon,
  title,
  badges,
  collapsible = true,
  children,
}: SettingsCardProps) => {
  const [open, setOpen] = useState(!collapsible);
  const bodyId = useId();

  const heading = (
    <span
      className={cn(
        "flex flex-wrap items-center gap-2 min-w-0 text-sm font-semibold uppercase",
        ThemeVariants.colors.text.secondary,
      )}
    >
      <span className="flex items-center gap-2">
        {icon}
        {title}
      </span>
      {badges}
    </span>
  );

  return (
    <section
      className={cn(
        ThemeVariants.colors.bg.surface,
        ThemeVariants.colors.border.all.default,
        ThemeVariants.borderRadius.lg,
      )}
    >
      <h3>
        {collapsible ? (
          <Accordion
            onClick={() => setOpen((o) => !o)}
            expanded={open}
            controls={bodyId}
            className="gap-3 p-4"
          >
            {heading}
            <ChevronDown
              size={20}
              aria-hidden
              className={cn(
                "shrink-0 transition-transform duration-300",
                ThemeVariants.colors.text.secondary,
                open && "rotate-180",
              )}
            />
          </Accordion>
        ) : (
          <span className="block p-4">{heading}</span>
        )}
      </h3>
      <div id={bodyId} hidden={!open} className="flex flex-col gap-3 px-4 pb-4">
        {children}
      </div>
    </section>
  );
};

interface RestaurantNameSettingProps {
  name?: string;
  isEditMode: boolean;
  onChange: (name: string) => void;
}

//Nome del locale: compare nella barra della cassa e nella home dei clienti
const RestaurantNameSetting = ({
  name,
  isEditMode,
  onChange,
}: RestaurantNameSettingProps) =>
  isEditMode ? (
    <Input
      type="text"
      placeholder="Nome del locale"
      value={name ?? ""}
      setValue={onChange}
      maxLength={RESTAURANT_NAME_MAX}
      variant="secondary"
      className="w-full text-sm"
    />
  ) : (
    <span
      className={`flex items-center min-h-10 text-2xl italic [overflow-wrap:anywhere] ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
    >
      {name ?? "…"}
    </span>
  );

interface AppearanceSettingProps {
  theme: RestaurantThemeConst;
  brandColor: BrandColorConst;
  isEditMode: boolean;
  onChange: (changes: RestaurantProfileUpdate) => void;
}

//Tema e colore delle parti colorate: li sceglie il ristorante e valgono anche per i clienti
const AppearanceSetting = ({
  theme,
  brandColor,
  isEditMode,
  onChange,
}: AppearanceSettingProps) => {
  const isDark = theme === RestaurantTheme.Dark;
  const color = BRAND_PALETTE[brandColor];

  return (
    <>
      {isEditMode ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              iconLeft={<Sun size={15} />}
              label={<span className="text-sm ml-1.5">Chiaro</span>}
              dimension={ButtonDimensions.auto}
              variant={isDark ? "secondary" : "primary"}
              onClick={() => onChange({ theme: RestaurantTheme.Light })}
              className="px-3 py-2"
            />
            <Button
              iconLeft={<Moon size={15} />}
              label={<span className="text-sm ml-1.5">Scuro</span>}
              dimension={ButtonDimensions.auto}
              variant={isDark ? "primary" : "secondary"}
              onClick={() => onChange({ theme: RestaurantTheme.Dark })}
              className="px-3 py-2"
            />
          </div>
          <div>
            <p
              className={`text-sm mb-2 ${ThemeVariants.colors.text.secondary}`}
            >
              Colore:{" "}
              <span
                className={`font-semibold ${ThemeVariants.colors.text.brand}`}
              >
                {color.label}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {BRAND_COLORS.map((c) => {
                const selected = c === brandColor;
                return (
                  <button
                    key={c}
                    type="button"
                    title={BRAND_PALETTE[c].label}
                    aria-label={BRAND_PALETTE[c].label}
                    aria-pressed={selected}
                    onClick={() => onChange({ brandColor: c })}
                    style={{ backgroundColor: BRAND_PALETTE[c].dark }}
                    className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${selected ? "ring-2 ring-offset-2 ring-[var(--text-primary)] ring-offset-[var(--bg-surface)]" : ""}`}
                  >
                    {selected && <Check size={16} className="text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <p className="flex items-center gap-1.5">
            <span className={ThemeVariants.colors.text.secondary}>Tema:</span>
            {isDark ? <Moon size={15} /> : <Sun size={15} />}
            <span className="font-semibold">{isDark ? "Scuro" : "Chiaro"}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className={ThemeVariants.colors.text.secondary}>Colore:</span>
            <span
              aria-hidden
              style={{ backgroundColor: color.dark }}
              className="w-4 h-4 rounded-full"
            />
            <span className="font-semibold">{color.label}</span>
          </p>
        </div>
      )}
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        Valgono per la cassa e per le pagine dei clienti
      </p>
    </>
  );
};

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

//Profilo del ristorante: nome del locale, tema e colore, orari di apertura, asporto e menù.
//Si parte in lettura; Modifica rende modificabili tutte le box e Salva salva insieme le modifiche
export const Profile = () => {
  const { data: restaurant } = useRestaurant();
  const { data: takeaway } = useTakeawaySettings();
  const { mutateAsync: updateRestaurant } = useUpdateRestaurant();
  const { mutateAsync: saveTakeaway } = useSaveTakeawaySettings();
  const menu = useMenuDraft();
  const showNotification = useNotification();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  //bozze delle modifiche, salvate tutte insieme
  const [restaurantDraft, setRestaurantDraft] =
    useState<RestaurantProfileUpdate>({});
  const [takeawayDraft, setTakeawayDraft] = useState<TakeawaySettings | null>(
    null,
  );

  const profile = restaurant && { ...restaurant, ...restaurantDraft };
  const editRestaurant = (changes: RestaurantProfileUpdate) =>
    setRestaurantDraft((d) => ({ ...d, ...changes }));

  //Cosa impedisce di salvare, box per box
  const nameError =
    restaurantDraft.name?.trim() === "" ? "Nome mancante" : null;
  const hoursError =
    restaurantDraft.openingHours &&
    !weeklyHoursValid(restaurantDraft.openingHours)
      ? "Da correggere"
      : null;
  const takeawayDraftError =
    takeawayDraft && takeawayError(takeawayDraft) ? "Da correggere" : null;
  const menuError = menu.isBusy
    ? "Da confermare"
    : menu.isDirty && menu.dishes.length === 0
      ? "Menù vuoto"
      : null;
  const canSave =
    !isSaving && !nameError && !hoursError && !takeawayDraftError && !menuError;

  const cancel = () => {
    setRestaurantDraft({});
    setTakeawayDraft(null);
    menu.reset();
    setIsEditMode(false);
  };

  //Salva le box modificate; se qualcosa non va si resta in modifica con le sole bozze non salvate
  const save = async () => {
    const tasks: { label: string; run: () => Promise<unknown> }[] = [];
    if (Object.keys(restaurantDraft).length > 0) {
      const { name } = restaurantDraft;
      const changes =
        name === undefined
          ? restaurantDraft
          : { ...restaurantDraft, name: name.trim() };
      tasks.push({
        label: "profilo",
        run: () => updateRestaurant(changes).then(() => setRestaurantDraft({})),
      });
    }
    if (takeawayDraft)
      tasks.push({
        label: "asporto",
        run: () =>
          saveTakeaway(takeawayDraft).then(() => setTakeawayDraft(null)),
      });
    if (menu.isDirty) tasks.push({ label: "menù", run: menu.save });

    setIsSaving(true);
    const results = await Promise.allSettled(tasks.map((t) => t.run()));
    setIsSaving(false);

    const failed = tasks.filter((_, i) => results[i].status === "rejected");
    if (failed.length > 0)
      return showNotification(
        `Errore nel salvataggio: ${failed.map((t) => t.label).join(", ")}`,
        NotificationType.Err,
      );
    setIsEditMode(false);
    if (tasks.length > 0)
      showNotification("Modifiche salvate", NotificationType.Ok);
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
      {isSaving && <Loader />}

      {/* Intestazione fissa in alto, così Salva resta a portata anche scorrendo il menù */}
      <div
        className={`sticky top-0 z-10 flex flex-wrap items-center gap-3 -mx-4 px-4 py-3 mb-2 sm:-mx-6 sm:px-6 sm:py-4 sm:mb-3 ${ThemeVariants.colors.bg.base}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Store
            size={24}
            className={`shrink-0 ${ThemeVariants.colors.text.brand}`}
          />
          <Label
            tag={LabelTags.h2}
            label="Profilo"
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            noMargin
            additionalClasses="max-sm:text-xl"
          />
        </div>
        <div className="ml-auto">
          {isEditMode ? (
            <SaveChanges onSave={save} onCancel={cancel} disabled={!canSave} />
          ) : (
            <Button
              iconLeft={<Pencil size={16} />}
              label={<span className="text-sm ml-1">Modifica</span>}
              dimension={ButtonDimensions.auto}
              variant="primary"
              onClick={() => setIsEditMode(true)}
              disabled={!restaurant}
              className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 md:items-start">
          <SettingsCard
            icon={<Store size={15} />}
            title="Nome del locale"
            collapsible={false}
            badges={
              <EditStatus
                dirty={restaurantDraft.name !== undefined}
                error={nameError}
              />
            }
          >
            <RestaurantNameSetting
              name={profile?.name}
              isEditMode={isEditMode}
              onChange={(name) => editRestaurant({ name })}
            />
          </SettingsCard>

          <SettingsCard
            icon={<Palette size={15} />}
            title="Tema e colore"
            badges={
              <EditStatus
                dirty={
                  restaurantDraft.theme !== undefined ||
                  restaurantDraft.brandColor !== undefined
                }
              />
            }
          >
            {profile && (
              <AppearanceSetting
                theme={profile.theme}
                brandColor={profile.brandColor}
                isEditMode={isEditMode}
                onChange={editRestaurant}
              />
            )}
          </SettingsCard>
        </div>

        <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
          <SettingsCard
            icon={<Clock size={15} />}
            title="Giorni e orari di apertura"
            badges={
              <EditStatus
                dirty={restaurantDraft.openingHours !== undefined}
                error={hoursError}
              />
            }
          >
            {profile && (
              <OpeningHoursSetting
                hours={profile.openingHours}
                isEditMode={isEditMode}
                onChange={(openingHours) => editRestaurant({ openingHours })}
              />
            )}
          </SettingsCard>

          <SettingsCard
            icon={<ShoppingBag size={15} />}
            title="Asporto"
            badges={
              <EditStatus
                dirty={takeawayDraft !== null}
                error={takeawayDraftError}
              />
            }
          >
            {takeaway && (
              <TakeawaySettingsBox
                settings={takeawayDraft ?? takeaway}
                isEditMode={isEditMode}
                onChange={setTakeawayDraft}
              />
            )}
          </SettingsCard>
        </div>

        <SettingsCard
          icon={<UtensilsCrossed size={15} />}
          title="Menù"
          badges={
            <>
              {!menu.isLoading && (
                <Badge
                  label={menu.hasExistingMenu ? "Attivo" : "Non configurato"}
                  variant={menu.hasExistingMenu ? "success" : "danger"}
                />
              )}
              <EditStatus dirty={menu.isDirty} error={menuError} />
            </>
          }
        >
          <MenuEditor menu={menu} isEditMode={isEditMode} />
        </SettingsCard>
      </div>
    </div>
  );
};
