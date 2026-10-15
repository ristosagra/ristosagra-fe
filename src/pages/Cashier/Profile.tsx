import { useState } from "react";
import {
  Check,
  Moon,
  Palette,
  Pencil,
  ShoppingBag,
  Store,
  Sun,
  X,
} from "lucide-react";
import { MenuEditor } from "./MenuEditor";
import { TakeawaySettingsBox } from "../../features/orders/components/TakeawaySettingsBox";
import {
  useRestaurant,
  useUpdateRestaurant,
} from "../../features/restaurant/hook/useRestaurant";
import {
  RESTAURANT_NAME_MAX,
  RestaurantTheme,
  type RestaurantProfileUpdate,
} from "../../features/restaurant/types/restaurant";
import {
  BRAND_COLORS,
  BRAND_PALETTE,
} from "../../features/restaurant/constant/brandColors";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { useNotification } from "../../hooks/useNotification";
import { ThemeVariants } from "../../constant/colors";
import { ButtonDimensions } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { NotificationType } from "../../types/notification";

interface SettingsCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

const SettingsCard = ({ icon, title, children }: SettingsCardProps) => (
  <div
    className={`flex flex-col gap-3 p-4 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default} ${ThemeVariants.borderRadius.lg}`}
  >
    <Label
      tag={LabelTags.h3}
      label={title}
      iconLeft={icon}
      size={LabelDimensions.small}
      weight={LabelWeight.semibold}
      color={ThemeVariants.colors.text.secondary}
      noMargin
      additionalClasses="uppercase gap-2"
    />
    {children}
  </div>
);

//Nome del locale, modificabile: compare nella barra della cassa e nella home dei clienti
const RestaurantNameSetting = () => {
  const { data: restaurant } = useRestaurant();
  const { mutate: updateRestaurant, isPending } = useUpdateRestaurant();
  const showNotification = useNotification();
  const [draft, setDraft] = useState<string | null>(null);

  const name = draft?.trim() ?? "";
  const canSave = name !== "" && !isPending;

  const save = () => {
    if (!canSave) return;
    if (name === restaurant?.name) return setDraft(null);
    updateRestaurant(
      { name },
      {
        onSuccess: () => {
          setDraft(null);
          showNotification("Nome del locale aggiornato", NotificationType.Ok);
        },
        onError: () =>
          showNotification(
            "Errore nel salvataggio del nome",
            NotificationType.Err,
          ),
      },
    );
  };

  if (draft !== null)
    return (
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Nome del locale"
          value={draft}
          setValue={setDraft}
          maxLength={RESTAURANT_NAME_MAX}
          variant="secondary"
          className="flex-1 min-w-0 text-sm"
          autoFocus
        />
        <Button
          iconLeft={<Check size={15} />}
          dimension={ButtonDimensions.auto}
          variant="primary"
          onClick={save}
          disabled={!canSave}
          className="w-9 h-9 disabled:opacity-40 disabled:cursor-not-allowed"
          ariaLabel="Salva il nome"
        />
        <Button
          iconLeft={<X size={15} />}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          onClick={() => setDraft(null)}
          className="w-9 h-9"
          ariaLabel="Annulla"
        />
      </div>
    );

  return (
    <div className="flex items-center justify-between gap-2 min-h-10">
      <span
        className={`text-2xl italic min-w-0 [overflow-wrap:anywhere] ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
      >
        {restaurant?.name ?? "…"}
      </span>
      <Button
        iconLeft={<Pencil size={15} />}
        label={<span className="text-sm ml-1">Modifica</span>}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        onClick={() => setDraft(restaurant?.name ?? "")}
        disabled={!restaurant}
        className="px-2.5 py-2 shrink-0"
      />
    </div>
  );
};

//Tema e colore delle parti colorate: li sceglie il ristorante e valgono anche per i clienti
const AppearanceSetting = () => {
  const { data: restaurant } = useRestaurant();
  const { mutate: updateRestaurant } = useUpdateRestaurant();
  const showNotification = useNotification();

  if (!restaurant) return null;
  const isDark = restaurant.theme === RestaurantTheme.Dark;
  const save = (changes: RestaurantProfileUpdate) =>
    updateRestaurant(changes, {
      onError: () =>
        showNotification(
          "Errore nel salvataggio di tema e colore",
          NotificationType.Err,
        ),
    });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          iconLeft={<Sun size={15} />}
          label={<span className="text-sm ml-1.5">Chiaro</span>}
          dimension={ButtonDimensions.auto}
          variant={isDark ? "secondary" : "primary"}
          onClick={() => isDark && save({ theme: RestaurantTheme.Light })}
          className="px-3 py-2"
        />
        <Button
          iconLeft={<Moon size={15} />}
          label={<span className="text-sm ml-1.5">Scuro</span>}
          dimension={ButtonDimensions.auto}
          variant={isDark ? "primary" : "secondary"}
          onClick={() => !isDark && save({ theme: RestaurantTheme.Dark })}
          className="px-3 py-2"
        />
      </div>
      <div>
        <p className={`text-sm mb-2 ${ThemeVariants.colors.text.secondary}`}>
          Colore:{" "}
          <span className={`font-semibold ${ThemeVariants.colors.text.brand}`}>
            {BRAND_PALETTE[restaurant.brandColor].label}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {BRAND_COLORS.map((c) => {
            const selected = c === restaurant.brandColor;
            return (
              <button
                key={c}
                type="button"
                title={BRAND_PALETTE[c].label}
                aria-label={BRAND_PALETTE[c].label}
                aria-pressed={selected}
                onClick={() => !selected && save({ brandColor: c })}
                style={{ backgroundColor: BRAND_PALETTE[c].dark }}
                className={`w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 ${selected ? "ring-2 ring-offset-2 ring-[var(--text-primary)] ring-offset-[var(--bg-surface)]" : ""}`}
              >
                {selected && <Check size={16} className="text-white" />}
              </button>
            );
          })}
        </div>
      </div>
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        Valgono per la cassa e per le pagine dei clienti
      </p>
    </>
  );
};

//Profilo del ristorante: nome del locale, tema e colore, orario di ritiro dell'asporto e menù
export const Profile = () => (
  <div className="h-full overflow-y-auto p-4 sm:p-6">
    <div className="flex items-center gap-3 mb-5 sm:mb-6">
      <Store size={24} className={ThemeVariants.colors.text.brand} />
      <Label
        tag={LabelTags.h2}
        label="Profilo del ristorante"
        size={LabelDimensions.xlarge}
        weight={LabelWeight.bold}
        noMargin
      />
    </div>

    <div className="grid gap-4 md:grid-cols-3 mb-8 sm:mb-10">
      <SettingsCard icon={<Store size={15} />} title="Nome del locale">
        <RestaurantNameSetting />
      </SettingsCard>

      <SettingsCard icon={<Palette size={15} />} title="Tema e colore">
        <AppearanceSetting />
      </SettingsCard>

      <SettingsCard
        icon={<ShoppingBag size={15} />}
        title="Orario di ritiro asporto"
      >
        <TakeawaySettingsBox />
      </SettingsCard>
    </div>

    <MenuEditor />
  </div>
);
