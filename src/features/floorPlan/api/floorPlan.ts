import { httpClient } from "../../../services/client/httpClient";
import type { FloorPlanData } from "../types/floorPlan";

export const FloorPlanService = {
  getFloorPlan: (): Promise<FloorPlanData | null> =>
    httpClient.get("/api/floor-plan"),

  saveFloorPlan: (plan: FloorPlanData): Promise<FloorPlanData> =>
    httpClient.post("/api/floor-plan", plan),
};
