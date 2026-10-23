import { Spinner } from "../../../components/core/Spinner";
import { Copy, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { MenuEditor } from "../MenuEditor";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { Label } from "../../../components/core/Label";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import {
  LabelDimensions,
  LabelTags,
  LabelWeight,
} from "../../../constant/label";
import {
  WEEKDAY_LABELS,
  WEEKDAY_SHORT_LABELS,
  WEEKDAYS,
} from "../../../constant/openingHours";
import {
  useMenusDraft,
  type MenusDraft,
} from "../../../features/menu/hook/useMenusDraft";
import { MENU_NAME_MAX } from "../../../features/menu/types/menu";
import {
  formatDays,
  menusError,
  openDaysWithoutMenu,
} from "../../../features/menu/utils/menuUtils";
import { useRestaurant } from "../../../features/restaurant/hook/useRestaurant";
import { cn } from "../../../helpers/cn";
import { useSectionEdit } from "../../../hooks/useSectionEdit";
import { ProfileSection, SettingsCard } from "./ProfileSection";

//"Lunedì", "Lunedì e Martedì", "Lunedì, Martedì e Mercoledì"
const joinNames = (names: string[]) =>
  names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;

//Giorni del menù aperto: un giorno già in un altro menù, se scelto, passa a questo
const DaysPicker = ({ menu }: { menu: MenusDraft }) => {
  const { current, menus } = menu;
  if (!current) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold">Giorni in cui si usa</p>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((d) => {
          const selected = current.days.includes(d);
          const owner = menus.find(
            (m) => m.id !== current.id && m.days.includes(d),
          );
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              aria-label={WEEKDAY_LABELS[d]}
              title={
                owner
                  ? `${WEEKDAY_LABELS[d]}: ora è nel menù ${owner.name}, sceglierlo lo sposta qui`
                  : WEEKDAY_LABELS[d]
              }
              onClick={() => menu.toggleDay(d)}
              className={cn(
                "min-w-12 h-10 sm:h-9 px-3 text-sm font-bold cursor-pointer",
                ThemeVariants.borderRadius.md,
                selected
                  ? `${ThemeVariants.colors.bg.brand} text-white`
                  : owner
                    ? `border border-dashed border-[var(--border)] ${ThemeVariants.colors.text.secondary}`
                    : `${ThemeVariants.colors.bg.hover} ${ThemeVariants.colors.border.all.default}`,
              )}
            >
              {WEEKDAY_SHORT_LABELS[d]}
            </button>
          );
        })}
      </div>
      <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
        Un giorno sta in un solo menù: sceglierlo qui lo toglie dagli altri
        (tratteggiati).
      </p>
    </div>
  );
};

//Sezione del profilo: i menù del ristorante. Se ne possono avere più di uno, ognuno per alcuni
//giorni della settimana (un giorno in un solo menù): clienti e cassa vedono quello di oggi
export const MenuSection = ({ onBack }: { onBack: () => void }) => {
  const menu = useMenusDraft();
  const { data: restaurant } = useRestaurant();
  const edit = useSectionEdit(
    [{ label: "menù", dirty: menu.isDirty, run: menu.save }],
    menu.reset,
  );
  const { menus, current, isBusy } = menu;
  const isEditMode = edit.isEditMode;

  const saveError = isBusy
    ? "Conferma o annulla il piatto (o la categoria) in modifica"
    : menu.isDirty
      ? menusError(menus)
      : null;
  const missingDays = restaurant
    ? openDaysWithoutMenu(menus, restaurant.openingHours)
    : [];

  return (
    <ProfileSection
      icon={<UtensilsCrossed size={22} />}
      title="Menù"
      onBack={onBack}
      edit={edit}
      canEdit={!menu.isLoading && !menu.isError}
      saveError={saveError}
    >
      {menu.isLoading ? (
        <Spinner />
      ) : menu.isError ? (
        <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
          Errore nel caricamento dei menù
        </p>
      ) : (
        <>
          <p className={`text-sm ${ThemeVariants.colors.text.secondary}`}>
            Puoi avere più menù, ognuno per alcuni giorni della settimana (es.
            feriale e weekend): clienti e cassa vedono quello del giorno.
          </p>

          {menus.length > 0 && (
            <div
              role="tablist"
              aria-label="Menù"
              className="flex gap-2 overflow-x-auto [scrollbar-width:none]"
            >
              {menus.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={current?.id === m.id}
                  onClick={() => menu.selectMenu(m.id)}
                  //un piatto in modifica va prima confermato o annullato
                  disabled={isBusy && current?.id !== m.id}
                  className={cn(
                    "shrink-0 flex items-center gap-2 px-3.5 py-2 text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    ThemeVariants.borderRadius.full,
                    current?.id === m.id
                      ? `${ThemeVariants.colors.bg.brand} text-white`
                      : `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.default}`,
                  )}
                >
                  {m.name.trim() || "Senza nome"}
                </button>
              ))}
              {isEditMode && (
                <Button
                  iconLeft={<Plus size={15} />}
                  label={<span className="text-sm ml-1.5">Nuovo menù</span>}
                  onClick={menu.addMenu}
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  disabled={isBusy}
                  className="shrink-0 px-3.5 py-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
                />
              )}
            </div>
          )}

          {missingDays.length > 0 && (
            <p className={`text-sm ${ThemeVariants.colors.text.danger}`}>
              {joinNames(missingDays)} il locale è aperto ma non c'è un menù: i
              clienti non vedono piatti.
            </p>
          )}

          {current ? (
            <SettingsCard
              icon={<UtensilsCrossed size={15} />}
              title={current.name.trim() || "Senza nome"}
            >
              {isEditMode ? (
                <>
                  <Input
                    type="text"
                    placeholder="Nome del menù (es. Weekend)"
                    value={current.name}
                    setValue={menu.renameMenu}
                    maxLength={MENU_NAME_MAX}
                    variant="secondary"
                    className="w-full text-sm"
                    ariaLabel="Nome del menù"
                  />
                  <DaysPicker menu={menu} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      iconLeft={<Copy size={15} />}
                      label={<span className="text-sm ml-1.5">Duplica</span>}
                      onClick={menu.duplicateMenu}
                      dimension={ButtonDimensions.auto}
                      variant="secondary"
                      disabled={isBusy}
                      className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      ariaLabel={`Duplica il menù ${current.name}`}
                    />
                    <Button
                      iconLeft={
                        <Trash2
                          size={15}
                          className={ThemeVariants.colors.text.danger}
                        />
                      }
                      label={
                        <span className="text-sm ml-1.5">Elimina menù</span>
                      }
                      onClick={menu.deleteMenu}
                      dimension={ButtonDimensions.auto}
                      variant="secondary"
                      disabled={isBusy}
                      className="px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      ariaLabel={`Elimina il menù ${current.name}`}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm">
                  <span className="font-semibold">
                    {current.days.length > 0
                      ? formatDays(current.days)
                      : "Non usato: nessun giorno"}
                  </span>
                  <span className={ThemeVariants.colors.text.secondary}>
                    {" "}
                    ·{" "}
                    {current.dishes.length === 1
                      ? "1 piatto"
                      : `${current.dishes.length} piatti`}
                  </span>
                </p>
              )}
              <div
                className={`pt-4 ${ThemeVariants.colors.border.top.default}`}
              >
                <MenuEditor
                  key={current.id}
                  menu={menu}
                  isEditMode={isEditMode}
                />
              </div>
            </SettingsCard>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <UtensilsCrossed
                size={48}
                className={ThemeVariants.colors.text.secondary}
              />
              <Label
                tag={LabelTags.p}
                label="Nessun menù"
                size={LabelDimensions.large}
                weight={LabelWeight.semibold}
                noMargin
              />
              <Label
                tag={LabelTags.p}
                label={
                  isEditMode
                    ? "Crea il primo menù del ristorante"
                    : "Clicca Modifica per creare il primo menù"
                }
                size={LabelDimensions.small}
                noMargin
              />
              {isEditMode && (
                <Button
                  iconLeft={<Plus size={18} />}
                  label="Crea il primo menù"
                  dimension={ButtonDimensions.auto}
                  variant="primary"
                  onClick={menu.addMenu}
                  className="px-4 py-2 mt-2"
                />
              )}
            </div>
          )}
        </>
      )}
    </ProfileSection>
  );
};
