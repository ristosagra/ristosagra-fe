import type { FloorPlanData } from "../types/floorPlan";
import { useFloorPlanEvents } from "../hook/useFloorPlanEvents";
import { useFloorPlanState } from "../hook/useFloorPlanState";
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
    <div className="flex flex-col h-[calc(100vh-73px)] bg-neutral-950 font-mono text-white overflow-hidden w-full">
      <HeaderFloorPlan savedPlan={savedPlan} {...state} />
      <div className="flex flex-1 overflow-hidden">
        {state.isEditing && <SideBarFloorPlan {...state} />}
        <SVGCanvas {...state} {...events} />
        {state.selTable && (
          <FooterFloorPlan {...state} selTable={state.selTable} />
        )}
      </div>
      {state.modal.open && <ModalFloorPlan {...state} />}
    </div>
  );
};
