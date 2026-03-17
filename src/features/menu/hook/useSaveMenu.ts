import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuService } from "../api/menu";
import { fakeCreateMenu, fakeUpdateMenu } from "../mock/menu";
import type { Dish } from "../../../types/menuOrder";

export const useCreateMenu = () => {
  const queryClient = useQueryClient();
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation({
    mutationFn: isMocking
      ? (dishes: Dish[]) => fakeCreateMenu(dishes)
      : (dishes: Dish[]) => MenuService.createMenu(dishes),
    onSuccess: (data) => {
      queryClient.setQueryData(["menu", isMocking], data);
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation({
    mutationFn: isMocking
      ? (dishes: Dish[]) => fakeUpdateMenu(dishes)
      : (dishes: Dish[]) => MenuService.updateMenu(dishes),
    onSuccess: (data) => {
      queryClient.setQueryData(["menu", isMocking], data);
    },
  });
};
