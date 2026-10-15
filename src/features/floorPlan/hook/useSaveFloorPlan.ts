import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FloorPlanData } from "../types/floorPlan";
import { loadFloorPlanApi } from "../api/loadFloorPlanApi";

export const useSaveFloorPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: FloorPlanData) =>
      (await loadFloorPlanApi()).saveFloorPlan(plan),
    onSuccess: (saved) => queryClient.setQueryData(["floor-plan"], saved),
  });
};
