import { useCallback, useRef, useState } from "react";
import { isSmallScreen } from "../helpers/view";
import type {
  CoordinateType,
  FloorPlanData,
  PanStartType,
  PlanMode,
  TableData,
  WallData,
  WallDragType,
  WallType,
} from "../types/floorPlan";
import type { ModalType } from "../../../types/general";
import {
  type HeadsConst,
  type TableShapeConst,
  Heads,
  PLAN_DEFAULT_SEATS,
  RightPanel,
  type RightPanelConst,
  TableShape,
} from "../constant/floorPlan";
import { rectColumns } from "../helpers/dimensions";

export const useFloorPlanState = (
  savedPlan: FloorPlanData | null | undefined,
) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tables, setTables] = useState<TableData[]>(savedPlan?.tables ?? []);
  const [walls, setWalls] = useState<WallData[]>(savedPlan?.walls ?? []);

  // Editing sub-states
  const [curWall, setCurWall] = useState<WallType>(null);
  const [mode, setMode] = useState<PlanMode>("view");
  const [shape, setShape] = useState<TableShapeConst>(TableShape.Round);
  //posti del prossimo tavolo da aggiungere (la grandezza del tavolo dipende da questo valore)
  const [newSeats, setNewSeats] = useState<number>(PLAN_DEFAULT_SEATS);
  //capotavola compresi nei posti del prossimo tavolo rettangolare
  const [newHeads, setNewHeads] = useState<HeadsConst>(Heads.Both);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<CoordinateType>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<PanStartType>(null);
  const [wallDrag, setWallDrag] = useState<WallDragType>(null);
  const [cursor, setCursor] = useState<CoordinateType>({ x: 0, y: 0 });
  const [mergeAnchor, setMergeAnchor] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>({ open: false, tableId: "" });
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);
  const [hoveredBookingId, setHoveredBookingId] = useState<string | null>(null);
  //pannello aperto a destra: prenotazioni ai tavoli o prenotazioni online
  //(sul cellulare coprirebbe la piantina, quindi parte chiuso)
  const [rightPanel, setRightPanel] = useState<RightPanelConst | null>(() =>
    isSmallScreen() ? null : RightPanel.Bookings,
  );
  //prenotazione online in attesa di essere sistemata con un clic su un tavolo
  const [placingReservationId, setPlacingReservationId] = useState<
    string | null
  >(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const selTable = selId ? tables.find((t) => t.id === selId) : null;

  //serve per restituire tutti i tavoli che appartengono ad un gruppo
  const getGroup = useCallback(
    (gid: string) => tables.filter((t) => t.groupId === gid),
    [tables],
  );

  // ── Derived ──
  const pts = (arr: CoordinateType[]) =>
    arr.map((p) => `${p.x},${p.y}`).join(" ");
  const groupMap = new Map<string, TableData[]>();
  for (const t of tables)
    if (t.groupId) {
      if (!groupMap.has(t.groupId)) groupMap.set(t.groupId, []);
      groupMap.get(t.groupId)!.push(t);
    }

  const addHint = `Aggiungi tavolo da ${newSeats} posti · ${
    shape === TableShape.Round
      ? "Rotondo"
      : rectColumns({ size: newSeats, shape, heads: newHeads }) <= 1
        ? "Quadrato"
        : "Rettangolare"
  } · clicca un tavolo per selezionarlo`;
  const hints: Record<PlanMode, string> = {
    view: isEditing
      ? "Seleziona un tavolo per gestirlo"
      : "Seleziona un tavolo per vedere dettagli e prenotare",
    add: addHint,
    merge: mergeAnchor
      ? "Ancora impostata — clicca altri tavoli per unirli, poi Fine unione"
      : "Clicca un tavolo come ancora del gruppo",
    move: "Trascina tavoli (i gruppi si muovono insieme) · 🟡 per muri · clic = seleziona",
    delete:
      "Clic tavolo = elimina · Clic gruppo = separa · Clic muro = elimina",
    pan: "Trascina per navigare · Rotellina o due dita per lo zoom",
    wall: curWall
      ? `${curWall.length} punto/i · Clicca o Termina muro`
      : "Clicca per iniziare un muro",
  };

  return {
    // stati
    isEditing,
    setIsEditing,
    tables,
    setTables,
    walls,
    setWalls,
    mode,
    setMode,
    zoom,
    setZoom,
    pan,
    setPan,
    hoveredTableId,
    setHoveredTableId,
    hoveredBookingId,
    setHoveredBookingId,
    rightPanel,
    setRightPanel,
    placingReservationId,
    setPlacingReservationId,
    modal,
    setModal,
    selId,
    setSelId,
    mergeAnchor,
    setMergeAnchor,
    cursor,
    setCursor,
    panStart,
    setPanStart,
    shape,
    setShape,
    newSeats,
    setNewSeats,
    newHeads,
    setNewHeads,
    curWall,
    setCurWall,
    // derivati
    selTable,
    getGroup,
    hints,
    groupMap,
    pts,
    wallDrag,
    setWallDrag,
    // ref
    svgRef,
  };
};
