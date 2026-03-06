import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FloorPlanService } from "../services/api/floorPlan";
import { generateFakeFloorPlan } from "../mock/floorPlan";
import type { FloorPlanData } from "../types/floorPlan";

const QUERY_KEY = ["floor-plan"] as const;

// ─── Fetch floor plan ─────────────────────────────────────────────────────────
export const useFloorPlan = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery<FloorPlanData | null>({
    queryKey: QUERY_KEY,
    queryFn: isMocking
      ? async () => {
          // Simulate network latency
          await new Promise((r) => setTimeout(r, 600));
          return generateFakeFloorPlan();
        }
      : FloorPlanService.getFloorPlan,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

// ─── Save floor plan ──────────────────────────────────────────────────────────
export const useSaveFloorPlan = () => {
  const queryClient = useQueryClient();
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useMutation<FloorPlanData, Error, FloorPlanData>({
    mutationFn: isMocking
      ? async (data: FloorPlanData) => {
          await new Promise((r) => setTimeout(r, 800));
          return {
            ...data,
            id: data.id ?? "floor-plan-1",
            updatedAt: new Date().toISOString(),
          };
        }
      : FloorPlanService.saveFloorPlan,

    onSuccess: (saved) => {
      queryClient.setQueryData(QUERY_KEY, saved);
    },
  });
};
