import { useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  UtensilsCrossed,
  Check,
  X,
} from "lucide-react";
import { useMenu } from "../../features/menu/hook/useMenu";
import {
  useCreateMenu,
  useUpdateMenu,
} from "../../features/menu/hook/useSaveMenu";
import { groupDishesByCategory } from "../../features/menu/utils/menuUtils";
import { DISH_CATEGORIES } from "../../features/menu/constant/menu";
import { Button } from "../../components/core/Button";
import { Input } from "../../components/core/Input";
import { Label } from "../../components/core/Label";
import { Loader } from "../../components/core/Loader";
import { useNotification } from "../../hooks/useNotification";
import { ThemeVariants } from "../../constant/colors";
import { ButtonDimensions } from "../../constant/button";
import { LabelTags, LabelDimensions, LabelWeight } from "../../constant/label";
import { NotificationType } from "../../types/notification";
import type { Dish } from "../../types/menuOrder";

interface DishFormData {
  name: string;
  description: string;
  price: string;
  category: string;
}

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
}: DishRowProps) => (
  <div
    className={`flex items-start justify-between gap-4 px-4 py-3 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.md}`}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${ThemeVariants.colors.text.white}`}>
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
          className={`px-2 py-1 ${ThemeVariants.colors.text.secondary}`}
        />
        <Button
          iconLeft={<Trash2 size={15} />}
          dimension={ButtonDimensions.auto}
          variant="icon"
          onClick={onDelete}
          disabled={disabled}
          className={`px-2 py-1 ${ThemeVariants.colors.text.danger}`}
        />
      </div>
    )}
  </div>
);

interface DishEditRowProps {
  initial?: Dish;
  onConfirm: (data: DishFormData) => void;
  onCancel: () => void;
}

const DishEditRow = ({ initial, onConfirm, onCancel }: DishEditRowProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [category, setCategory] = useState(
    initial?.category ?? DISH_CATEGORIES[0],
  );

  const isValid =
    name.trim() !== "" && price !== "" && !isNaN(parseFloat(price));

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 ${ThemeVariants.colors.bg.overlay} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.md}`}
    >
      <div className="flex gap-3 flex-wrap">
        <Input
          type="text"
          placeholder="Nome piatto"
          value={name}
          setValue={setName}
          variant="secondary"
          className="flex-1 min-w-40 text-sm"
        />
        <Input
          type="number"
          placeholder="Prezzo (€)"
          value={price}
          setValue={setPrice}
          variant="secondary"
          className="w-28 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`px-2 py-2 text-sm ${ThemeVariants.colors.border.all.default} ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.sm} ${ThemeVariants.colors.text.white}`}
        >
          {DISH_CATEGORIES.map((cat) => (
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
        variant="secondary"
        className="w-full text-sm"
      />
      <div className="flex gap-2 justify-end">
        <Button
          iconLeft={<X size={15} />}
          label="Annulla"
          dimension={ButtonDimensions.auto}
          variant="secondary"
          onClick={onCancel}
          className="px-3 py-1.5"
        />
        <Button
          iconLeft={<Check size={15} />}
          label="Conferma"
          dimension={ButtonDimensions.auto}
          variant="primary"
          onClick={() =>
            isValid && onConfirm({ name, description, price, category })
          }
          disabled={!isValid}
          className="px-3 py-1.5"
        />
      </div>
    </div>
  );
};

export const Home = () => {
  const { data, isLoading } = useMenu();
  const { mutate: createMenu, isPending: isCreating } = useCreateMenu();
  const { mutate: updateMenu, isPending: isUpdating } = useUpdateMenu();
  const showNotification = useNotification();

  const [isEditMode, setIsEditMode] = useState(false);
  const [localDishes, setLocalDishes] = useState<Dish[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null); // dish id, or 0 for new
  const idCounter = useRef(-1);

  const dishes = localDishes ?? data ?? [];
  const hasExistingMenu = (data?.length ?? 0) > 0;
  const isSaving = isCreating || isUpdating;
  const isEditing = editingId !== null;

  const handleConfirmEdit = (formData: DishFormData) => {
    const price = parseFloat(formData.price);
    if (editingId === 0) {
      setLocalDishes([
        ...dishes,
        {
          id: idCounter.current--,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price,
          category: formData.category,
        },
      ]);
    } else {
      setLocalDishes(
        dishes.map((d) =>
          d.id === editingId
            ? {
                ...d,
                name: formData.name.trim(),
                description: formData.description.trim(),
                price,
                category: formData.category,
              }
            : d,
        ),
      );
    }
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setLocalDishes(dishes.filter((d) => d.id !== id));
  };

  const handleSave = () => {
    const onSuccess = () => {
      setLocalDishes(null);
      setIsEditMode(false);
      setEditingId(null);
      showNotification("Menu salvato con successo", NotificationType.Ok);
    };
    const onError = () =>
      showNotification("Errore nel salvataggio del menu", NotificationType.Err);

    if (hasExistingMenu) {
      updateMenu(dishes, { onSuccess, onError });
    } else {
      createMenu(dishes, { onSuccess, onError });
    }
  };

  if (isLoading) return <Loader />;

  const grouped = groupDishesByCategory(dishes);

  return (
    <div className="h-full overflow-y-auto p-6">
      {isSaving && <Loader />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UtensilsCrossed
            size={24}
            className={ThemeVariants.colors.text.brand}
          />
          <Label
            tag={LabelTags.h2}
            label="Menu del ristorante"
            size={LabelDimensions.xlarge}
            weight={LabelWeight.bold}
            noMargin
          />
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              hasExistingMenu
                ? `${ThemeVariants.colors.bg.success} ${ThemeVariants.colors.text.white} ${ThemeVariants.colors.border.all.success}`
                : `${ThemeVariants.colors.bg.danger} ${ThemeVariants.colors.text.white} ${ThemeVariants.colors.border.all.danger}`
            }`}
          >
            {hasExistingMenu ? "Attivo" : "Non configurato"}
          </span>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button
                iconLeft={<Plus size={18} />}
                label="Aggiungi piatto"
                dimension={ButtonDimensions.auto}
                variant="secondary"
                onClick={() => setEditingId(0)}
                disabled={isEditing}
                className="px-3 py-2"
              />
              <Button
                iconLeft={<Save size={18} />}
                label="Salva"
                dimension={ButtonDimensions.auto}
                variant="primary"
                onClick={handleSave}
                disabled={dishes.length === 0 || isEditing}
                className="px-3 py-2"
              />
            </>
          ) : (
            <Button
              iconLeft={<Pencil size={18} />}
              label="Modifica"
              dimension={ButtonDimensions.auto}
              variant="primary"
              onClick={() => setIsEditMode(true)}
              className="px-3 py-2"
            />
          )}
        </div>
      </div>

      {/* Empty state */}
      {dishes.length === 0 && !isEditing && (
        <div
          className={`flex flex-col items-center justify-center py-20 gap-4 ${ThemeVariants.colors.bg.surface} ${ThemeVariants.borderRadius.lg}`}
        >
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
              onClick={() => setEditingId(0)}
              className="px-4 py-2 mt-2"
            />
          )}
        </div>
      )}

      {/* New dish form */}
      {editingId === 0 && (
        <div className="mb-6">
          <div
            className={`flex items-center gap-2 mb-3 pb-2 ${ThemeVariants.colors.border.bottom.default}`}
          >
            <Label
              tag={LabelTags.h3}
              label="Nuovo piatto"
              size={LabelDimensions.large}
              weight={LabelWeight.semibold}
              noMargin
            />
          </div>
          <DishEditRow
            onConfirm={handleConfirmEdit}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* Dishes grouped by category */}
      {DISH_CATEGORIES.map((cat) => {
        const catDishes = grouped[cat] ?? [];
        return (
          <div key={cat} className="mb-6">
            <div
              className={`flex items-center gap-2 mb-3 pb-2 ${ThemeVariants.colors.border.bottom.default}`}
            >
              <Label
                tag={LabelTags.h3}
                label={cat}
                size={LabelDimensions.large}
                weight={LabelWeight.semibold}
                noMargin
              />
              <span
                className={`text-sm ${ThemeVariants.colors.text.secondary}`}
              >
                ({catDishes.length})
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {catDishes.map((dish) =>
                editingId === dish.id ? (
                  <DishEditRow
                    key={dish.id}
                    initial={dish}
                    onConfirm={handleConfirmEdit}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <DishRow
                    key={dish.id}
                    dish={dish}
                    onEdit={() => setEditingId(dish.id)}
                    onDelete={() => handleDelete(dish.id)}
                    isEditMode={isEditMode}
                    disabled={isEditing}
                  />
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
