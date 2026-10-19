import { useId, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  UtensilsCrossed,
  Check,
  X,
  ChevronDown,
} from "lucide-react";
import type {
  DishData,
  MenuDraft,
} from "../../features/menu/hook/useMenuDraft";
import {
  getCategories,
  getCategoryOptions,
  groupDishesByCategory,
} from "../../features/menu/utils/menuUtils";
import { ALLERGENS } from "../../features/menu/constant/menu";
import {
  AllergenChips,
  AllergensToggle,
} from "../../features/menu/components/DishAllergens";
import { Accordion } from "../../components/core/Accordion";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { Loader } from "../../components/core/Loader";
import { ThemeVariants } from "../../constant/colors";
import { ButtonDimensions } from "../../constant/button";
import { LabelTags, LabelDimensions, LabelWeight } from "../../constant/label";
import type { Dish } from "../../types/menuOrder";

//Limiti dei campi del piatto (anche per non inviare al backend testi enormi)
const DISH_NAME_MAX = 80;
const DISH_DESCRIPTION_MAX = 300;
const CATEGORY_NAME_MAX = 40;
const PRICE_MAX = 10000;

//Prezzo valido: numero tra 0 e PRICE_MAX, arrotondato ai centesimi
const parsePrice = (value: string): number | null => {
  const price = Number.parseFloat(value.replace(",", "."));
  if (!Number.isFinite(price) || price < 0 || price > PRICE_MAX) return null;
  return Math.round(price * 100) / 100;
};

interface DishRowProps {
  dish: Dish;
  onEdit: () => void;
  onDelete: () => void;
  isEditMode: boolean;
  disabled: boolean;
}

const DishRow = ({
  dish,
  onEdit,
  onDelete,
  isEditMode,
  disabled,
}: DishRowProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`px-3 sm:px-4 py-3 ${ThemeVariants.colors.bg.base} ${ThemeVariants.colors.border.all.default} ${ThemeVariants.borderRadius.md}`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3">
            <span
              className={`font-semibold min-w-0 [overflow-wrap:anywhere] ${ThemeVariants.colors.text.white}`}
            >
              {dish.name}
            </span>
            <span
              className={`text-sm font-bold ${ThemeVariants.colors.text.brand}`}
            >
              €{dish.price.toFixed(2)}
            </span>
          </div>
          {dish.description && (
            <p
              className={`text-sm mt-0.5 truncate ${ThemeVariants.colors.text.secondary}`}
            >
              {dish.description}
            </p>
          )}
        </div>
        {isEditMode && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              iconLeft={<Pencil size={15} />}
              dimension={ButtonDimensions.auto}
              variant="icon"
              onClick={onEdit}
              disabled={disabled}
              className={`w-9 h-9 sm:w-8 sm:h-7 ${ThemeVariants.colors.text.secondary}`}
              ariaLabel={`Modifica ${dish.name}`}
            />
            <Button
              iconLeft={<Trash2 size={15} />}
              dimension={ButtonDimensions.auto}
              variant="icon"
              onClick={onDelete}
              disabled={disabled}
              className={`w-9 h-9 sm:w-8 sm:h-7 ${ThemeVariants.colors.text.danger}`}
              ariaLabel={`Elimina ${dish.name}`}
            />
          </div>
        )}
        {/* Fuori dalla modifica la freccia apre il dettaglio con gli allergeni */}
        {!isEditMode && (
          <AllergensToggle open={open} onToggle={() => setOpen((o) => !o)} />
        )}
      </div>
      {!isEditMode && open && (
        <div className={`mt-3 pt-3 ${ThemeVariants.colors.border.top.default}`}>
          <AllergenChips allergens={dish.allergens} />
        </div>
      )}
    </div>
  );
};

interface DishEditRowProps {
  initial?: Dish;
  categories: string[];
  onConfirm: (dish: DishData) => void;
  onCancel: () => void;
}

const DishEditRow = ({
  initial,
  categories,
  onConfirm,
  onCancel,
}: DishEditRowProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [category, setCategory] = useState(initial?.category ?? categories[0]);
  const [allergens, setAllergens] = useState<string[]>(
    initial?.allergens ?? [],
  );

  // mantiene gli allergeni nell'ordine dell'elenco ufficiale
  const toggleAllergen = (a: string) =>
    setAllergens((prev) =>
      ALLERGENS.filter((x) => (x === a ? !prev.includes(a) : prev.includes(x))),
    );

  const parsedPrice = parsePrice(price);
  const isValid = name.trim() !== "" && parsedPrice !== null;

  return (
    <div
      className={`flex flex-col gap-3 px-3 sm:px-4 py-3 ${ThemeVariants.colors.bg.overlay} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.md}`}
    >
      <div className="flex gap-3 flex-wrap">
        <Input
          type="text"
          placeholder="Nome piatto"
          value={name}
          setValue={setName}
          maxLength={DISH_NAME_MAX}
          variant="secondary"
          className="w-full sm:w-auto sm:flex-1 sm:min-w-40 text-sm"
        />
        <Input
          type="number"
          placeholder="Prezzo (€)"
          value={price}
          setValue={setPrice}
          inputMode="decimal"
          min={0}
          step={0.01}
          variant="secondary"
          className="w-28 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Categoria"
          className={`flex-1 sm:flex-none min-w-0 px-2 py-2 text-sm ${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.sm} ${ThemeVariants.colors.text.white}`}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <Input
        type="text"
        placeholder="Descrizione (opzionale)"
        value={description}
        setValue={setDescription}
        maxLength={DISH_DESCRIPTION_MAX}
        variant="secondary"
        className="w-full text-sm"
      />
      {/* Allergeni del piatto */}
      <div>
        <Label
          tag={LabelTags.p}
          label="Allergeni"
          size={LabelDimensions.small}
          color={ThemeVariants.colors.text.secondary}
          noMargin
          additionalClasses="uppercase mb-1.5"
        />
        <div className="flex flex-wrap gap-1.5">
          {ALLERGENS.map((a) => (
            <Button
              key={a}
              label={<span className="text-xs">{a}</span>}
              iconLeft={allergens.includes(a) ? <Check size={13} /> : undefined}
              dimension={ButtonDimensions.auto}
              variant={allergens.includes(a) ? "primary" : "secondary"}
              onClick={() => toggleAllergen(a)}
              className="px-2.5 py-1.5 sm:py-1 gap-1"
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          iconLeft={<X size={15} />}
          label="Annulla"
          dimension={ButtonDimensions.auto}
          variant="secondary"
          onClick={onCancel}
          className="px-3 py-2"
        />
        <Button
          iconLeft={<Check size={15} />}
          label="Conferma"
          dimension={ButtonDimensions.auto}
          variant="primary"
          onClick={() =>
            isValid &&
            onConfirm({
              name: name.trim(),
              description: description.trim(),
              price: parsedPrice,
              category,
              allergens,
            })
          }
          disabled={!isValid}
          className="px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
};

interface CategoryRenameRowProps {
  category: string;
  categories: string[];
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

//Rinomina di una categoria: il nuovo nome non può essere quello di un'altra
const CategoryRenameRow = ({
  category,
  categories,
  onConfirm,
  onCancel,
}: CategoryRenameRowProps) => {
  const [value, setValue] = useState(category);
  const draft = value.trim();
  const isValid =
    draft !== "" && (draft === category || !categories.includes(draft));

  return (
    <>
      <Input
        type="text"
        placeholder="Nome categoria"
        value={value}
        setValue={setValue}
        maxLength={CATEGORY_NAME_MAX}
        variant="secondary"
        className="text-sm flex-1 sm:flex-none sm:w-56"
        autoFocus
      />
      <Button
        iconLeft={<Check size={15} />}
        dimension={ButtonDimensions.auto}
        variant="primary"
        onClick={() => isValid && onConfirm(draft)}
        disabled={!isValid}
        className="w-9 h-9 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        ariaLabel="Conferma il nome della categoria"
      />
      <Button
        iconLeft={<X size={15} />}
        dimension={ButtonDimensions.auto}
        variant="secondary"
        onClick={onCancel}
        className="w-9 h-9 shrink-0"
        ariaLabel="Annulla"
      />
      {draft !== "" && !isValid && (
        <span
          className={`text-xs basis-full sm:basis-auto ${ThemeVariants.colors.text.danger}`}
        >
          Categoria già esistente
        </span>
      )}
    </>
  );
};

interface MenuCategoryProps {
  name: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  //pulsanti accanto al titolo (rinomina)
  actions?: React.ReactNode;
  //se c'è, prende il posto del titolo (form di rinomina)
  renameRow?: React.ReactNode;
  children: React.ReactNode;
}

//Categoria del menù (Antipasti, Primi...) che si apre e chiude dal titolo. Da chiusa
//i piatti restano montati (solo nascosti), così non si perde un piatto in modifica
const MenuCategory = ({
  name,
  count,
  open,
  onToggle,
  actions,
  renameRow,
  children,
}: MenuCategoryProps) => {
  const bodyId = useId();

  return (
    <div>
      <div
        className={`flex flex-wrap items-center gap-2 pb-2 ${ThemeVariants.colors.border.bottom.default}`}
      >
        {renameRow ?? (
          <>
            <h4 className="flex-1 min-w-0">
              <Accordion
                onClick={onToggle}
                expanded={open}
                controls={bodyId}
                className="gap-2 min-h-9"
              >
                <span className="flex flex-wrap items-baseline gap-x-2 min-w-0">
                  <span className="text-lg font-semibold [overflow-wrap:anywhere]">
                    {name}
                  </span>
                  <span
                    className={`text-sm ${ThemeVariants.colors.text.secondary}`}
                  >
                    ({count})
                  </span>
                </span>
                <ChevronDown
                  size={20}
                  aria-hidden
                  className={`shrink-0 transition-transform duration-300 ${ThemeVariants.colors.text.secondary} ${open ? "rotate-180" : ""}`}
                />
              </Accordion>
            </h4>
            {actions}
          </>
        )}
      </div>
      <div id={bodyId} hidden={!open} className="flex flex-col gap-2 mt-3">
        {children}
      </div>
    </div>
  );
};

interface MenuEditorProps {
  menu: MenuDraft;
  isEditMode: boolean;
}

//Menù del ristorante, nella sua box del Profilo: in lettura mostra piatti e allergeni,
//in modifica si aggiungono, cambiano ed eliminano piatti e si rinominano le categorie
export const MenuEditor = ({ menu, isEditMode }: MenuEditorProps) => {
  const { dishes, editingId, renamingCat } = menu;
  //categorie aperte: partono tutte chiuse
  const [openCats, setOpenCats] = useState<string[]>([]);

  if (menu.isLoading) return <Loader />;

  const toggleCat = (cat: string) =>
    setOpenCats((open) =>
      open.includes(cat) ? open.filter((c) => c !== cat) : [...open, cat],
    );

  //Un piatto confermato si vede subito: si apre la sua categoria
  const saveDish = (dish: DishData) => {
    menu.saveDish(dish);
    setOpenCats((open) =>
      open.includes(dish.category) ? open : [...open, dish.category],
    );
  };

  //Una categoria rinominata resta aperta (o chiusa) com'era
  const renameCategory = (name: string) => {
    setOpenCats((open) => open.map((c) => (c === renamingCat ? name : c)));
    menu.renameCategory(name);
  };

  const isEditing = editingId !== null;
  const categories = getCategories(dishes);
  const categoryOptions = getCategoryOptions(dishes);
  const grouped = groupDishesByCategory(dishes);

  return (
    <div className="flex flex-col gap-6">
      {isEditMode && dishes.length > 0 && (
        <Button
          iconLeft={<Plus size={18} />}
          label="Aggiungi piatto"
          dimension={ButtonDimensions.auto}
          variant="secondary"
          onClick={() => menu.setEditingId(0)}
          disabled={isEditing}
          className="self-start px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      )}

      {/* Empty state */}
      {dishes.length === 0 && !isEditing && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
          <UtensilsCrossed
            size={48}
            className={ThemeVariants.colors.text.secondary}
          />
          <Label
            tag={LabelTags.p}
            label="Nessun menu disponibile"
            size={LabelDimensions.large}
            weight={LabelWeight.semibold}
            noMargin
          />
          <Label
            tag={LabelTags.p}
            label={
              isEditMode
                ? "Aggiungi i tuoi piatti per creare il menu del ristorante"
                : "Clicca Modifica per iniziare a creare il menu"
            }
            size={LabelDimensions.small}
            noMargin
          />
          {isEditMode && (
            <Button
              iconLeft={<Plus size={18} />}
              label="Aggiungi piatto"
              dimension={ButtonDimensions.auto}
              variant="primary"
              onClick={() => menu.setEditingId(0)}
              className="px-4 py-2 mt-2"
            />
          )}
        </div>
      )}

      {/* New dish form */}
      {isEditMode && editingId === 0 && (
        <div>
          <div
            className={`flex items-center gap-2 mb-3 pb-2 ${ThemeVariants.colors.border.bottom.default}`}
          >
            <Label
              tag={LabelTags.h4}
              label="Nuovo piatto"
              size={LabelDimensions.large}
              weight={LabelWeight.semibold}
              noMargin
            />
          </div>
          <DishEditRow
            categories={categoryOptions}
            onConfirm={saveDish}
            onCancel={() => menu.setEditingId(null)}
          />
        </div>
      )}

      {/* Dishes grouped by category */}
      {categories.length > 0 && (
        <div className="flex flex-col gap-4">
          {categories.map((cat) => {
            const catDishes = grouped[cat] ?? [];
            return (
              <MenuCategory
                key={cat}
                name={cat}
                count={catDishes.length}
                open={openCats.includes(cat)}
                onToggle={() => toggleCat(cat)}
                renameRow={
                  isEditMode && renamingCat === cat ? (
                    <CategoryRenameRow
                      category={cat}
                      categories={categories}
                      onConfirm={renameCategory}
                      onCancel={() => menu.setRenamingCat(null)}
                    />
                  ) : undefined
                }
                actions={
                  isEditMode && (
                    <Button
                      iconLeft={<Pencil size={14} />}
                      dimension={ButtonDimensions.auto}
                      variant="icon"
                      onClick={() => menu.setRenamingCat(cat)}
                      disabled={isEditing || renamingCat !== null}
                      className={`w-9 h-9 sm:w-7 sm:h-7 ${ThemeVariants.colors.text.secondary}`}
                      ariaLabel={`Rinomina la categoria ${cat}`}
                    />
                  )
                }
              >
                {catDishes.map((dish) =>
                  isEditMode && editingId === dish.id ? (
                    <DishEditRow
                      key={dish.id}
                      initial={dish}
                      categories={categoryOptions}
                      onConfirm={saveDish}
                      onCancel={() => menu.setEditingId(null)}
                    />
                  ) : (
                    <DishRow
                      key={dish.id}
                      dish={dish}
                      onEdit={() => menu.setEditingId(dish.id)}
                      onDelete={() => menu.deleteDish(dish.id)}
                      isEditMode={isEditMode}
                      disabled={isEditing}
                    />
                  ),
                )}
              </MenuCategory>
            );
          })}
        </div>
      )}
    </div>
  );
};
