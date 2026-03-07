import { useQuery } from "@tanstack/react-query";
import { FloorPlanService } from "../../../services/api/floorPlan";
import { generateFakeFloorPlan } from "../../../mock/floorPlan";
import type { FloorPlanData } from "../../../types/floorPlan";

export const useFloorPlan = () => {
  const isMocking = import.meta.env.VITE_MOCKING === "true";

  return useQuery<FloorPlanData | null>({
    queryKey: ["floor-plan"],
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
