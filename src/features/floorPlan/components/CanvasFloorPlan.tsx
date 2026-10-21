import { useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import type { FloorPlanData } from "../types/floorPlan";
import { RightPanel } from "../constant/floorPlan";
import { fitView } from "../helpers/view";
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
  canEditLayout,
}: {
  savedPlan: FloorPlanData | null | undefined;
  //false = niente modalità Modifica (tavoli e muri), solo prenotazioni
  canEditLayout: boolean;
}) => {
  const state = useFloorPlanState(savedPlan);
  const { data: reservations = [] } = useReservations();
  const placing = reservations.find((r) => r.id === state.placingReservationId);
  const events = useFloorPlanEvents({
    ...state,
    placingPeople: placing?.people,
  });
  const { mutate: savePlan } = useSaveFloorPlan();
  const {
    tables,
    walls,
    isEditing,
    zoom,
    mode,
    selId,
    selTable,
    rightPanel,
    mergeAnchor,
    curWall,
    svgRef,
    placingReservationId,
    setTables,
    setWalls,
    setIsEditing,
    setMode,
    setZoom,
    setPan,
    setSelId,
    setModal,
    setMergeAnchor,
    setCurWall,
    setRightPanel,
    setHoveredBookingId,
    setPlacingReservationId,
  } = state;

  //Inquadra tutta la piantina (sul cellulare a zoom 100% se ne vedrebbe solo una parte)
  const fitToScreen = () => {
    const view = fitView(tables, walls, svgRef.current);
    setZoom(view?.zoom ?? 1);
    setPan(view?.pan ?? { x: 0, y: 0 });
  };

  //All'apertura la piantina si adatta allo schermo
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current) return;
    didFit.current = true;
    fitToScreen();
  });

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

  //Ai componenti si passano solo le props che usano: spostando o zoomando la vista
  //(o muovendo il mouse) si ridisegna la piantina, non intestazione e pannelli
  return (
    //La piantina è sempre scura: anche con il tema chiaro pulsanti e input usano i colori del tema scuro
    <div
      data-theme="dark"
      className="flex flex-col h-full bg-neutral-950 font-mono text-white overflow-hidden w-full [color-scheme:dark]"
    >
      <HeaderFloorPlan
        savedPlan={savedPlan}
        tables={tables}
        walls={walls}
        isEditing={isEditing}
        canEditLayout={canEditLayout}
        zoom={zoom}
        rightPanel={rightPanel}
        setRightPanel={setRightPanel}
        setIsEditing={setIsEditing}
        setMode={setMode}
        setWalls={setWalls}
        setMergeAnchor={setMergeAnchor}
        setSelId={setSelId}
        setCurWall={setCurWall}
        setTables={setTables}
        setZoom={setZoom}
        onFitView={fitToScreen}
      />
      {/* Sul cellulare gli strumenti stanno sotto la piantina e i pannelli la coprono */}
      <div className="relative flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
        {isEditing && (
          <SideBarFloorPlan
            curWall={curWall}
            mode={mode}
            mergeAnchor={mergeAnchor}
            shape={state.shape}
            newSeats={state.newSeats}
            newHeads={state.newHeads}
            setShape={state.setShape}
            setNewSeats={state.setNewSeats}
            setNewHeads={state.setNewHeads}
            setCurWall={setCurWall}
            setWalls={setWalls}
            setMode={setMode}
            setMergeAnchor={setMergeAnchor}
            setSelId={setSelId}
            selTable={selTable}
            tables={tables}
            walls={walls}
            setTables={setTables}
          />
        )}
        {/* Il footer è posizionato rispetto alla sola colonna della piantina */}
        <div className="relative flex flex-1 min-h-0 overflow-hidden">
          <SVGCanvas {...state} {...events} />
          {/* Prenotazione online da sistemare: si sceglie il tavolo con un clic */}
          {placing && !isEditing && (
            <div className="absolute top-14 sm:top-20 left-1/2 -translate-x-1/2 z-10 w-max max-w-[calc(100%-1.5rem)] flex items-center gap-2 sm:gap-3 bg-amber-900/90 border border-amber-500 text-amber-100 text-sm pl-3 pr-1 py-1 rounded-2xl sm:rounded-full shadow-lg">
              <MapPin size={15} className="shrink-0" />
              <span className="min-w-0">
                Tocca un tavolo per sistemare <b>{placing.name}</b> ·{" "}
                {placing.people} {placing.people === 1 ? "persona" : "persone"}
              </span>
              <Button
                iconLeft={<X size={16} />}
                onClick={() => setPlacingReservationId(null)}
                dimension={ButtonDimensions.auto}
                variant="icon"
                className="w-8 h-8 shrink-0 text-amber-200 hover:text-white"
                ariaLabel="Annulla"
              />
            </div>
          )}
          {selTable && (
            <FooterFloorPlan
              selTable={selTable}
              tables={tables}
              selId={selId}
              isEditing={isEditing}
              setSelId={setSelId}
              setModal={setModal}
              setHoveredBookingId={setHoveredBookingId}
            />
          )}
        </div>
        {!isEditing && rightPanel === RightPanel.Bookings && (
          <BookingsPanelFloorPlan
            tables={tables}
            selTable={selTable}
            zoom={zoom}
            svgRef={svgRef}
            setPan={setPan}
            setSelId={setSelId}
            setTables={setTables}
            setHoveredBookingId={setHoveredBookingId}
            setRightPanel={setRightPanel}
          />
        )}
        {!isEditing && rightPanel === RightPanel.Online && (
          <OnlineReservationsPanelFloorPlan
            tables={tables}
            zoom={zoom}
            svgRef={svgRef}
            placingReservationId={placingReservationId}
            setPan={setPan}
            setSelId={setSelId}
            setTables={setTables}
            setHoveredBookingId={setHoveredBookingId}
            setRightPanel={setRightPanel}
            setPlacingReservationId={setPlacingReservationId}
          />
        )}
      </div>
      {state.modal.open && (
        <ModalFloorPlan
          tables={tables}
          modal={state.modal}
          setTables={setTables}
          setModal={setModal}
        />
      )}
    </div>
  );
};
