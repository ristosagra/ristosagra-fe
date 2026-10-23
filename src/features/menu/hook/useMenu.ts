import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadMenuApi } from "../api/loadMenuApi";
import type { RestaurantMenu } from "../types/menu";

//Piatti del menù di oggi (clienti e cassa)
export const useMenu = () =>
  useQuery({
    queryKey: ["menu"],
    queryFn: async () => (await loadMenuApi()).getMenu(),
    staleTime: 1000 * 60 * 5,
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
