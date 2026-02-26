import { useQuery } from "@tanstack/react-query";
import { getDishes } from "../services/menu";
import { generateFakeDishes } from "../mock/fakeMenu";

export const useMenu = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery({
    queryKey: ["menu", isMocking],
    queryFn: isMocking ? () => generateFakeDishes() : getDishes,
    staleTime: 1000 * 60 * 5,
  });
};
