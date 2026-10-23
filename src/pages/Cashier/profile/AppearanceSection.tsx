import { useState } from "react";
import { Check, Moon, Palette, Store, Sun } from "lucide-react";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { Modal } from "../../../components/core/Modal";
import {
  SettingsSummary,
  SummaryItem,
} from "../../../components/SettingsSummary";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import {
  BRAND_SWATCH_ROWS,
  DEFAULT_BRAND_COLOR,
  colorName,
  toBrandHex,
} from "../../../features/restaurant/constant/brandColors";
import { useRestaurantDraft } from "../../../features/restaurant/hook/useRestaurantDraft";
import {
  RESTAURANT_NAME_MAX,
  RestaurantTheme,
  type RestaurantProfileUpdate,
  type RestaurantThemeConst,
} from "../../../features/restaurant/types/restaurant";
import { cn } from "../../../helpers/cn";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

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
      ariaLabel="Nome del locale"
    />
  ) : (
    <span
      className={`flex items-center min-h-10 text-2xl italic [overflow-wrap:anywhere] ${ThemeVariants.colors.text.brand} ${ThemeVariants.fontFamily.display}`}
    >
      {name ?? "…"}
    </span>
  );

interface ColorPaletteProps {
  value: string;
  onPick: (color: string) => void;
  onClose: () => void;
}

//Tavolozza dei colori: tante tinte su tutto il cerchio dei colori, in più luminosità, e il
//selettore del dispositivo per qualunque altro colore. Scegliendo un colore si chiude
const ColorPalette = ({ value, onPick, onClose }: ColorPaletteProps) => {
  const pick = (color: string) => {
    onPick(color);
    onClose();
  };

  return (
    <Modal
      icon={<Palette size={20} className="text-white" />}
      title="Scegli il colore"
      subTitle={
        <p className="text-sm text-neutral-400">
          Vale per la cassa e per le pagine dei clienti
        </p>
      }
      onClose={onClose}
    >
      <div className="grid grid-cols-12 gap-1">
        {BRAND_SWATCH_ROWS.flat().map((c, i) => {
          const selected = c === value;
          return (
            <button
              key={`${c}-${i}`}
              type="button"
              title={`${colorName(c)} ${c}`}
              aria-label={`${colorName(c)} ${c}`}
              aria-pressed={selected}
              onClick={() => pick(c)}
              style={{ backgroundColor: c }}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center cursor-pointer transition-transform hover:scale-110",
                selected &&
                  "ring-2 ring-white ring-offset-2 ring-offset-neutral-900",
              )}
            >
              {selected && <Check size={14} className="text-white" />}
            </button>
          );
        })}
      </div>
      <label className="flex items-center justify-between gap-3 mt-4 text-sm text-white cursor-pointer">
        Altro colore
        <input
          type="color"
          value={value}
          onChange={(e) => onPick(e.target.value)}
          className="w-12 h-9 cursor-pointer bg-transparent"
        />
      </label>
      <div className="flex justify-end mt-4">
        <Button
          label={<span className="text-sm">Fatto</span>}
          onClick={onClose}
          dimension={ButtonDimensions.auto}
          variant="primary"
          className="px-4 py-2"
        />
      </div>
    </Modal>
  );
};

interface AppearanceSettingProps {
  theme: RestaurantThemeConst;
  brandColor: string;
  isEditMode: boolean;
  onChange: (changes: RestaurantProfileUpdate) => void;
}

//Tema e colore delle parti colorate: li sceglie il ristorante e valgono anche per i clienti.
//In modifica si vede il colore di adesso: toccandolo si apre la tavolozza
const AppearanceSetting = ({
  theme,
  brandColor,
  isEditMode,
  onChange,
}: AppearanceSettingProps) => {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isDark = theme === RestaurantTheme.Dark;
  const color = toBrandHex(brandColor) ?? DEFAULT_BRAND_COLOR;
  const swatch = (size: string) => (
    <span
      aria-hidden
      style={{ backgroundColor: color }}
      className={cn("shrink-0 rounded-full", size)}
    />
  );

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
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-haspopup="dialog"
            className={cn(
              "flex items-center gap-3 p-2 pr-3 text-left cursor-pointer",
              ThemeVariants.borderRadius.md,
              ThemeVariants.colors.border.all.default,
              ThemeVariants.colors.bg.hover,
            )}
          >
            {swatch("w-9 h-9")}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold">
                Colore: {colorName(color)}
              </span>
              <span
                className={`block text-xs uppercase tabular-nums ${ThemeVariants.colors.text.secondary}`}
              >
                {color}
              </span>
            </span>
            <span
              className={`text-sm font-semibold ${ThemeVariants.colors.text.brand}`}
            >
              Cambia
            </span>
          </button>
          {paletteOpen && (
            <ColorPalette
              value={color}
              onPick={(c) => onChange({ brandColor: c })}
              onClose={() => setPaletteOpen(false)}
            />
          )}
        </>
      ) : (
        <SettingsSummary>
          <SummaryItem label="Tema">
            <span className="inline-flex items-center gap-1.5">
              {isDark ? <Moon size={15} /> : <Sun size={15} />}
              {isDark ? "Scuro" : "Chiaro"}
            </span>
          </SummaryItem>
          <SummaryItem label="Colore">
            <span className="inline-flex items-center gap-1.5">
              {swatch("w-4 h-4")}
              {colorName(color)}
            </span>
          </SummaryItem>
        </SettingsSummary>
      )}
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        Valgono per la cassa e per le pagine dei clienti
      </p>
    </>
  );
};

//Sezione del profilo: nome del locale, tema e colore
export const AppearanceSection = ({ onBack }: { onBack: () => void }) => {
  const restaurant = useRestaurantDraft();
  const { profile, draft } = restaurant;
  const edit = useSectionEdit(
    [{ label: "profilo", dirty: restaurant.isDirty, run: restaurant.save }],
    restaurant.reset,
  );

  return (
    <ProfileSection
      icon={<Palette size={22} />}
      title="Nome, tema e colore"
      onBack={onBack}
      edit={edit}
      canEdit={!!profile}
      saveError={draft.name?.trim() === "" ? "Scrivi il nome del locale" : null}
    >
      <div className="grid gap-4 md:grid-cols-2 md:items-start">
        <SettingsCard icon={<Store size={15} />} title="Nome del locale">
          <RestaurantNameSetting
            name={profile?.name}
            isEditMode={edit.isEditMode}
            onChange={(name) => restaurant.edit({ name })}
          />
        </SettingsCard>
        <SettingsCard icon={<Palette size={15} />} title="Tema e colore">
          {profile && (
            <AppearanceSetting
              theme={profile.theme}
              brandColor={profile.brandColor}
              isEditMode={edit.isEditMode}
              onChange={restaurant.edit}
            />
          )}
        </SettingsCard>
      </div>
    </ProfileSection>
  );
};
