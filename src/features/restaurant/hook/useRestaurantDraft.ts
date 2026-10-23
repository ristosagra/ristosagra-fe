import { useState } from "react";
import { useRestaurant, useUpdateRestaurant } from "./useRestaurant";
import type { RestaurantProfileUpdate } from "../types/restaurant";

//Bozza delle modifiche al profilo del ristorante fatte in una sezione del Profilo: si vedono
//subito nella sezione (profile = salvato + bozza) e si inviano solo i campi cambiati
export const useRestaurantDraft = () => {
  const { data: restaurant } = useRestaurant();
  const { mutateAsync: updateRestaurant } = useUpdateRestaurant();
  const [draft, setDraft] = useState<RestaurantProfileUpdate>({});

  const isDirty = Object.keys(draft).length > 0;

  //Nomi senza spazi in più (locale e postazioni della cucina)
  const save = async () => {
    if (!isDirty) return;
    const { name, kitchenStations } = draft;
    await updateRestaurant({
      ...draft,
      ...(name !== undefined && { name: name.trim() }),
      ...(kitchenStations && {
        kitchenStations: kitchenStations.map((s) => ({
          ...s,
          name: s.name.trim(),
        })),
      }),
    });
    setDraft({});
  };

  return {
    restaurant,
    profile: restaurant && { ...restaurant, ...draft },
    draft,
    isDirty,
    edit: (changes: RestaurantProfileUpdate) =>
      setDraft((d) => ({ ...d, ...changes })),
    reset: () => setDraft({}),
    save,
  };
};
