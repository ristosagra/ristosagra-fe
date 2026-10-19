import { useRef, useState } from "react";
import { useMenu } from "./useMenu";
import { useCreateMenu, useUpdateMenu } from "./useSaveMenu";
import type { Dish } from "../../../types/menuOrder";

//Piatto come esce dal form di modifica (l'id lo assegna la bozza)
export type DishData = Omit<Dish, "id">;

//Bozza del menù modificato nel profilo del ristorante: i cambi restano in locale
//finché non si salva. Tiene anche il piatto (id, 0 per uno nuovo) o la categoria in modifica
export const useMenuDraft = () => {
  const { data, isLoading } = useMenu();
  const { mutateAsync: createMenu } = useCreateMenu();
  const { mutateAsync: updateMenu } = useUpdateMenu();

  const [draft, setDraft] = useState<Dish[] | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  const idCounter = useRef(-1);

  const dishes = draft ?? data ?? [];
  const hasExistingMenu = (data?.length ?? 0) > 0;

  const saveDish = (dish: DishData) => {
    setDraft(
      editingId === 0
        ? [...dishes, { ...dish, id: idCounter.current-- }]
        : dishes.map((d) => (d.id === editingId ? { ...d, ...dish } : d)),
    );
    setEditingId(null);
  };

  //Rinomina una categoria: tutti i suoi piatti passano al nuovo nome
  const renameCategory = (name: string) => {
    setDraft(
      dishes.map((d) =>
        d.category === renamingCat ? { ...d, category: name } : d,
      ),
    );
    setRenamingCat(null);
  };

  const deleteDish = (id: number) =>
    setDraft(dishes.filter((d) => d.id !== id));

  const reset = () => {
    setDraft(null);
    setEditingId(null);
    setRenamingCat(null);
  };

  //Salva la bozza (se c'è): crea il menù se non era ancora configurato
  const save = async () => {
    if (!draft) return;
    await (hasExistingMenu ? updateMenu : createMenu)(draft);
    setDraft(null);
  };

  return {
    dishes,
    isLoading,
    hasExistingMenu,
    isDirty: draft !== null,
    //un piatto o una categoria in modifica vanno confermati (o annullati) prima di salvare
    isBusy: editingId !== null || renamingCat !== null,
    editingId,
    setEditingId,
    renamingCat,
    setRenamingCat,
    saveDish,
    renameCategory,
    deleteDish,
    reset,
    save,
  };
};

export type MenuDraft = ReturnType<typeof useMenuDraft>;
