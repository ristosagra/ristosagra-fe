import { useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import type { FloorPlanData } from "../types/floorPlan";
import { RightPanel } from "../constant/floorPlan";
import { useFloorPlanEvents } from "../hook/useFloorPlanEvents";
import { useFloorPlanState } from "../hook/useFloorPlanState";
import { useSaveFloorPlan } from "../hook/useSaveFloorPlan";
import { useReservations } from "../../reservations/hook/useReservations";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { BookingsPanelFloorPlan } from "./BookingsPanelFloorPlan";
import { OnlineReservationsPanelFloorPlan } from "./OnlineReservationsPanelFloorPlan";
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
  const { data: reservations = [] } = useReservations();
  const placing = reservations.find((r) => r.id === state.placingReservationId);
  const events = useFloorPlanEvents({
    ...state,
    placingPeople: placing?.people,
  });
  const { mutate: savePlan } = useSaveFloorPlan();
  const { tables, walls, isEditing } = state;

  //Fuori dalla modalità Modifica le prenotazioni messe/tolte in piantina vengono salvate subito,
  //così restano collegate alle prenotazioni online e i posti disponibili per i clienti sono aggiornati
  const lastSaved = useRef(tables);
  useEffect(() => {
    if (isEditing || tables === lastSaved.current) return;
    const timer = setTimeout(() => {
      lastSaved.current = tables;
      savePlan({ id: savedPlan?.id, tables, walls });
    }, 600);
    return () => clearTimeout(timer);
  }, [tables, walls, isEditing, savedPlan?.id, savePlan]);

  return (
    //La piantina è sempre scura: anche con il tema chiaro pulsanti e input usano i colori del tema scuro
    <div
      data-theme="dark"
      className="flex flex-col h-[calc(100vh-71px)] bg-neutral-950 font-mono text-white overflow-hidden w-full mt-1.5 [color-scheme:dark]"
    >
      <HeaderFloorPlan savedPlan={savedPlan} {...state} />
      <div className="flex flex-1 overflow-hidden">
        {state.isEditing && <SideBarFloorPlan {...state} />}
        {/* Il footer è posizionato rispetto alla sola colonna della piantina */}
        <div className="relative flex flex-1 overflow-hidden">
          <SVGCanvas {...state} {...events} />
          {/* Prenotazione online da sistemare: si sceglie il tavolo con un clic */}
          {placing && !isEditing && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-amber-900/90 border border-amber-500 text-amber-100 text-sm px-3 py-1.5 rounded-full shadow-lg">
              <MapPin size={15} />
              <span>
                Clicca un tavolo per sistemare <b>{placing.name}</b> ·{" "}
                {placing.people} {placing.people === 1 ? "persona" : "persone"}
              </span>
              <Button
                iconLeft={<X size={14} />}
                onClick={() => state.setPlacingReservationId(null)}
                dimension={ButtonDimensions.auto}
                variant="icon"
                className="p-0.5 text-amber-200 hover:text-white"
              />
            </div>
          )}
          {state.selTable && (
            <FooterFloorPlan {...state} selTable={state.selTable} />
          )}
        </div>
        {!isEditing && state.rightPanel === RightPanel.Bookings && (
          <BookingsPanelFloorPlan {...state} />
        )}
        {!isEditing && state.rightPanel === RightPanel.Online && (
          <OnlineReservationsPanelFloorPlan {...state} />
        )}
      </div>
      {state.modal.open && <ModalFloorPlan {...state} />}
    </div>
  );
};
