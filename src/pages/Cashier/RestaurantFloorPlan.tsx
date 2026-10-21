import { Loader } from "../../components/core/Loader";
import { useFloorPlan } from "../../features/floorPlan/hook/useFloorPlan";
import { CanvasFloorPlan } from "../../features/floorPlan/components/CanvasFloorPlan";
import { ErrorFloorPlan } from "../../features/floorPlan/components/ErrorFloorPlan";

//canEditLayout: può cambiare tavoli e muri (solo l'amministratore); gli altri gestiscono le prenotazioni
export default function RestaurantFloorPlan({
  canEditLayout,
}: {
  canEditLayout: boolean;
}) {
  const { data: savedPlan, isLoading, isError } = useFloorPlan();

  if (isError) return <ErrorFloorPlan />;
  if (isLoading) return <Loader />;

  return (
    <CanvasFloorPlan savedPlan={savedPlan} canEditLayout={canEditLayout} />
  );
}
