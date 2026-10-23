import { useRef, useState } from "react";
import { useMenus, useSaveMenus } from "./useMenu";
import { WEEKDAYS } from "../../../constant/openingHours";
import type { Dish } from "../../../types/menuOrder";
import type { WeekdayConst } from "../../../types/openingHours";
import type { RestaurantMenu } from "../types/menu";
import { activeMenu, newMenuId } from "../utils/menuUtils";

//Piatto come esce dal form di modifica (l'id lo assegna la bozza)
export type DishData = Omit<Dish, "id">;

//Bozza dei menù modificati nel profilo: i cambi restano in locale finché non si salva.
//Tiene il menù aperto (all'inizio quello di oggi) e, dentro quello, il piatto (id, 0 per uno
//nuovo) o la categoria in modifica
export const useMenusDraft = () => {
  const { data, isLoading, isError } = useMenus();
  const { mutateAsync: saveMenus } = useSaveMenus();

  const [draft, setDraft] = useState<RestaurantMenu[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [renamingCat, setRenamingCat] = useState<string | null>(null);
  //id provvisori (negativi) dei piatti nuovi, unici tra tutti i menù
  const idCounter = useRef(-1);

  const menus = draft ?? data ?? [];
  const active = activeMenu(menus);
  const current = menus.find((m) => m.id === selectedId) ?? active ?? menus[0];
  const dishes = current?.dishes ?? [];

  const updateCurrent = (change: (m: RestaurantMenu) => RestaurantMenu) =>
    current &&
    setDraft(menus.map((m) => (m.id === current.id ? change(m) : m)));
  const setDishes = (next: Dish[]) =>
    updateCurrent((m) => ({ ...m, dishes: next }));

  const saveDish = (dish: DishData) => {
    setDishes(
      editingId === 0
        ? [...dishes, { ...dish, id: idCounter.current-- }]
        : dishes.map((d) => (d.id === editingId ? { ...d, ...dish } : d)),
    );
    setEditingId(null);
  };

  //Rinomina una categoria: tutti i suoi piatti passano al nuovo nome
  const renameCategory = (name: string) => {
    setDishes(
      dishes.map((d) =>
        d.category === renamingCat ? { ...d, category: name } : d,
      ),
    );
    setRenamingCat(null);
  };

  const deleteDish = (id: number) =>
    setDishes(dishes.filter((d) => d.id !== id));

  //Menù nuovo e vuoto: prende i giorni che non hanno ancora un menù
  const addMenu = () => {
    const id = newMenuId();
    const freeDays = WEEKDAYS.filter(
      (d) => !menus.some((m) => m.days.includes(d)),
    );
    setDraft([
      ...menus,
      { id, name: `Menù ${menus.length + 1}`, days: freeDays, dishes: [] },
    ]);
    setSelectedId(id);
  };

  //Copia del menù aperto, senza giorni (es. il weekend partendo dal feriale)
  const duplicateMenu = () => {
    if (!current) return;
    const id = newMenuId();
    setDraft([
      ...menus,
      {
        id,
        name: `${current.name} (copia)`,
        days: [],
        dishes: current.dishes.map((d) => ({ ...d, id: idCounter.current-- })),
      },
    ]);
    setSelectedId(id);
  };

  const deleteMenu = () => {
    if (!current) return;
    setDraft(menus.filter((m) => m.id !== current.id));
    setSelectedId(null);
  };

  const renameMenu = (name: string) => updateCurrent((m) => ({ ...m, name }));

  //Un giorno sta in un solo menù: sceglierlo per il menù aperto lo toglie dagli altri
  const toggleDay = (day: WeekdayConst) => {
    if (!current) return;
    const adding = !current.days.includes(day);
    setDraft(
      menus.map((m) =>
        m.id === current.id
          ? {
              ...m,
              days: WEEKDAYS.filter((d) =>
                d === day ? adding : m.days.includes(d),
              ),
            }
          : adding
            ? { ...m, days: m.days.filter((d) => d !== day) }
            : m,
      ),
    );
  };

  //Cambiando menù si chiude quello che si stava modificando dentro
  const selectMenu = (id: string) => {
    setSelectedId(id);
    setEditingId(null);
    setRenamingCat(null);
  };

  const reset = () => {
    setDraft(null);
    setSelectedId(null);
    setEditingId(null);
    setRenamingCat(null);
  };

  //Salva la bozza (se c'è), con i nomi senza spazi in più
  const save = async () => {
    if (!draft) return;
    await saveMenus(draft.map((m) => ({ ...m, name: m.name.trim() })));
    setDraft(null);
  };

  return {
    menus,
    current,
    isLoading,
    isError,
    isDirty: draft !== null,
    //un piatto o una categoria in modifica vanno confermati (o annullati) prima di salvare
    isBusy: editingId !== null || renamingCat !== null,
    //del menù aperto
    dishes,
    editingId,
    setEditingId,
    renamingCat,
    setRenamingCat,
    saveDish,
    renameCategory,
    deleteDish,
    selectMenu,
    addMenu,
    duplicateMenu,
    deleteMenu,
    renameMenu,
    toggleDay,
    reset,
    save,
  };
};

export type MenusDraft = ReturnType<typeof useMenusDraft>;
