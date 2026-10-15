import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FloorPlanData } from "../types/floorPlan";
import { FloorPlanService } from "../api/floorPlan";
import { floorPlanStore } from "../mock/floorPlan";

export const useSaveFloorPlan = () => {
  const queryClient = useQueryClient();
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation<FloorPlanData, Error, FloorPlanData>({
    mutationFn: isMocking
      ? async (data: FloorPlanData) => {
          await new Promise((r) => setTimeout(r, 800));
          const saved = {
            ...data,
            id: data.id ?? "floor-plan-1",
            updatedAt: new Date().toISOString(),
          };
          floorPlanStore.set(saved);
          return saved;
        }
      : FloorPlanService.saveFloorPlan,

    onSuccess: (saved) => {
      queryClient.setQueryData(["floor-plan"], saved);
    },
  });
};
