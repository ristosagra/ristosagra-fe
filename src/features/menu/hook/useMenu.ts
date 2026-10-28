import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadMenuApi } from "../api/loadMenuApi";
import type { RestaurantMenu } from "../types/menu";
import type { Dish } from "../../../types/menuOrder";

//Il menù si rilegge spesso: durante il servizio un piatto può finire
const MENU_REFRESH_MS = 60_000;

//Piatti del menù di oggi (clienti e cassa), con quelli esauriti
export const useMenu = () =>
  useQuery({
    queryKey: ["menu"],
    queryFn: async () => (await loadMenuApi()).getMenu(),
    refetchInterval: MENU_REFRESH_MS,
  });

//Tutti i menù con i loro giorni (profilo)
export const useMenus = () =>
  useQuery({
    queryKey: ["menus"],
    queryFn: async () => (await loadMenuApi()).getMenus(),
  });

//Salva l'elenco dei menù: anche il menù di oggi può essere cambiato
export const useSaveMenus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (menus: RestaurantMenu[]) =>
      (await loadMenuApi()).saveMenus(menus),
    onSuccess: (saved) => {
      queryClient.setQueryData(["menus"], saved);
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

//Piatto esaurito (o di nuovo disponibile) durante il servizio: si vede subito, e se il
//salvataggio fallisce si torna indietro
export const useSetSoldOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, soldOut }: { id: number; soldOut: boolean }) =>
      (await loadMenuApi()).setSoldOut(id, soldOut),
    onMutate: async ({ id, soldOut }) => {
      await queryClient.cancelQueries({ queryKey: ["menu"] });
      const previous = queryClient.getQueryData<Dish[]>(["menu"]);
      if (previous)
        queryClient.setQueryData(
          ["menu"],
          previous.map((d) => (d.id === id ? { ...d, soldOut } : d)),
        );
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous)
        queryClient.setQueryData(["menu"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["menu"] }),
  });
};
