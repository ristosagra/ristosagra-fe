import { useQuery } from "@tanstack/react-query";
import { loadMenuApi } from "../api/loadMenuApi";

export const useMenu = () =>
  useQuery({
    queryKey: ["menu"],
    queryFn: async () => (await loadMenuApi()).getMenu(),
    staleTime: 1000 * 60 * 5,
  });
