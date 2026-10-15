import { useQuery } from "@tanstack/react-query";
import { loadFloorPlanApi } from "../api/loadFloorPlanApi";

export const useFloorPlan = () =>
  useQuery({
    queryKey: ["floor-plan"],
    queryFn: async () => (await loadFloorPlanApi()).getFloorPlan(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
