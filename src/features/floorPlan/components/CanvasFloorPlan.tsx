import type { FloorPlanData } from "../types/floorPlan";
import { useFloorPlanEvents } from "../hook/useFloorPlanEvents";
import { useFloorPlanState } from "../hook/useFloorPlanState";
import { BookingsPanelFloorPlan } from "./BookingsPanelFloorPlan";
import { FooterFloorPlan } from "./FooterFloorPlan";
import { HeaderFloorPlan } from "./HeaderFloorPlan";
import { ModalFloorPlan } from "./ModalFloorPlan";
import { SideBarFloorPlan } from "./SideBarFloorPlan";
import { SVGCanvas } from "./SVGCanvas";

export const CanvasFloorPlan = ({
  savedPlan,
}: {
  savedPlan: FloorPlanData | null | undefined;
}) => {
  const state = useFloorPlanState(savedPlan);
  const events = useFloorPlanEvents(state);

  return (
    <div className="flex flex-col h-[calc(100vh-71px)] bg-neutral-950 font-mono text-white overflow-hidden w-full mt-1.5">
      <HeaderFloorPlan savedPlan={savedPlan} {...state} />
      <div className="flex flex-1 overflow-hidden">
        {state.isEditing && <SideBarFloorPlan {...state} />}
        {/* Il footer è posizionato rispetto alla sola colonna della piantina */}
        <div className="relative flex flex-1 overflow-hidden">
          <SVGCanvas {...state} {...events} />
          {state.selTable && (
            <FooterFloorPlan {...state} selTable={state.selTable} />
          )}
        </div>
        {!state.isEditing && state.showBookings && (
          <BookingsPanelFloorPlan {...state} />
        )}
      </div>
      {state.modal.open && <ModalFloorPlan {...state} />}
    </div>
  );
};
