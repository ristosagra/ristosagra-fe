import { useQuery } from "@tanstack/react-query";
import { generateFakeDishes } from "../mock/menu";
import { MenuService } from "../api/menu";

export const useMenu = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery({
    queryKey: ["menu", isMocking],
    queryFn: isMocking ? () => generateFakeDishes() : MenuService.getMenu,
    staleTime: 1000 * 60 * 5,
  });
};
