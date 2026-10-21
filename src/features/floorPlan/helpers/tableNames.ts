import { cleanTableName } from "../../orders/utils/tableQr";
import type { FloorPlanData } from "../types/floorPlan";

//Nomi dei tavoli della piantina, senza doppioni e in ordine (T-2 prima di T-10)
export const tableNames = (plan: FloorPlanData | null | undefined): string[] =>
  [
    ...new Set(
      (plan?.tables ?? [])
        .map((t) => cleanTableName(t.name))
        .filter((n): n is string => n !== null),
    ),
  ].sort((a, b) => a.localeCompare(b, "it", { numeric: true }));
