import { useCallback, useRef, useState } from "react";
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
import { type TableShapeConst, TableShape } from "../constant/floorPlan";

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
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<CoordinateType>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<PanStartType>(null);
  const [wallDrag, setWallDrag] = useState<WallDragType>(null);
  const [cursor, setCursor] = useState<CoordinateType>({ x: 0, y: 0 });
  const [mergeAnchor, setMergeAnchor] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>({ open: false, tableId: "" });
  const [guest, setGuest] = useState("");
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const didPan = useRef(false);
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

  const hints: Record<PlanMode, string> = {
    view: isEditing
      ? "Clicca un tavolo per gestirlo"
      : "Clicca un tavolo per vedere dettagli e prenotare",
    add4: `Aggiungi tavolo da 4 · ${shape === TableShape.Round ? "Rotondo" : "Quadrato"}`,
    add8: `Aggiungi tavolo da 8 · ${shape === TableShape.Round ? "Rotondo" : "Rettangolare"}`,
    merge: mergeAnchor
      ? "Ancora impostata — clicca altri tavoli per unirli, poi Fine unione"
      : "Clicca un tavolo come ancora del gruppo",
    move: "Trascina tavoli (i gruppi si muovono insieme) · 🟡 per muri",
    delete:
      "Clic tavolo = elimina · Clic gruppo = separa · Clic muro = elimina",
    pan: "Trascina per navigare · Rotellina per zoom",
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
    guest,
    setGuest,
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
    didPan,
  };
};
