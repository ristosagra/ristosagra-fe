import { IS_MOCKING } from "../../../constant/env";
import { FloorPlanService } from "./floorPlan";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
export const loadFloorPlanApi: () => Promise<typeof FloorPlanService> =
  IS_MOCKING
    ? () => import("../mock/floorPlan").then((m) => m.fakeFloorPlanApi)
    : () => Promise.resolve(FloorPlanService);
