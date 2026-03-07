import { Loader } from "../../components/core/Loader";
import { useFloorPlan } from "../../features/floorPlan/hook/useFloorPlan";
import { CanvasFloorPlan } from "../../features/floorPlan/components/CanvasFloorPlan";
import { ErrorFloorPlan } from "../../features/floorPlan/components/ErrorFloorPlan";

// ─── Root Component ──────────────────────────────────────────────────────────
export default function RestaurantFloorPlan() {
  const { data: savedPlan, isLoading, isError } = useFloorPlan();

  if (isError) return <ErrorFloorPlan />;
  if (isLoading) return <Loader />;

  return <CanvasFloorPlan savedPlan={savedPlan} />;
}
