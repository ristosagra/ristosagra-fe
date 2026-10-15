import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loadMenuApi } from "../api/loadMenuApi";
import type { Dish } from "../../../types/menuOrder";

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dishes: Dish[]) =>
      (await loadMenuApi()).createMenu(dishes),
    onSuccess: (data) => queryClient.setQueryData(["menu"], data),
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dishes: Dish[]) =>
      (await loadMenuApi()).updateMenu(dishes),
    onSuccess: (data) => queryClient.setQueryData(["menu"], data),
  });
};
