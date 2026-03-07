import { useRef, useState } from "react";
import type {
  CoordinateType,
  DraggingType,
  PanStartType,
  PlanGroupDrag,
  PlanMode,
  TableData,
  WallData,
  WallDragType,
  WallType,
} from "../types/floorPlan";
import type { TableShapeConst, TableSizeConst } from "../constant/floorPlan";
import { hasCollision } from "../helpers/collision";
import { NotificationType } from "../../../types/notification";
import { defaultChairs } from "../helpers/chair";
import { snapIncoming } from "../helpers/snap";
import { useNotification } from "../../../hooks/useNotification";

interface UseFloorPlanEventsProps {
  mode: PlanMode;
  pan: CoordinateType;
  zoom: number;
  tables: TableData[];
  wallDrag: WallDragType;
  isEditing: boolean;
  shape: TableShapeConst;
  walls: WallData[];
  panStart: PanStartType;
  mergeAnchor: string | null;
  curWall: WallType;
  selTable: TableData | null | undefined;
  svgRef: React.RefObject<SVGSVGElement | null>;
  getGroup: (gid: string) => TableData[];
  setPanStart: React.Dispatch<React.SetStateAction<PanStartType>>;
  setPan: React.Dispatch<React.SetStateAction<CoordinateType>>;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setWallDrag: React.Dispatch<React.SetStateAction<WallDragType>>;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setWalls: React.Dispatch<React.SetStateAction<WallData[]>>;
  setCursor: React.Dispatch<React.SetStateAction<CoordinateType>>;
  setSelId: React.Dispatch<React.SetStateAction<string | null>>;
  setCurWall: React.Dispatch<React.SetStateAction<WallType>>;
  setMergeAnchor: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useFloorPlanEvents = ({
  mode,
  pan,
  zoom,
  isEditing,
  shape,
  tables,
  walls,
  panStart,
  wallDrag,
  mergeAnchor,
  curWall,
  svgRef,
  setPan,
  setZoom,
  setPanStart,
  setWallDrag,
  setTables,
  setWalls,
  setCursor,
  setSelId,
  setCurWall,
  setMergeAnchor,
  getGroup,
}: UseFloorPlanEventsProps) => {
  const showNotification = useNotification();

  const [dragging, setDragging] = useState<DraggingType>(null);
  const [groupDrag, setGroupDrag] = useState<PlanGroupDrag | null>(null);
  const mouseDownPos = useRef<CoordinateType | null>(null);
  const didDrag = useRef(false);
  const didPan = useRef(false);

  //Serve per la posizione del mouse all'interno della piantina
  const toWorld = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: (cx - r.left - pan.x) / zoom,
      y: (cy - r.top - pan.y) / zoom,
    };
  };

  //Gestisce il mousedown sullo sfondo SVG. Se la modalità è pan, view o si usa il tasto centrale del mouse,
  //salva la posizione iniziale per iniziare il pan della mappa.
  const onSVGDown = (e: React.MouseEvent) => {
    didPan.current = false;
    // Pan su sfondo in qualsiasi modalità "view" (editing o meno) o modalità "pan" esplicita
    if (mode === "pan" || mode === "view" || e.button === 1)
      setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
  };

  //Aggiorna un singolo punto di un muro durante il drag. Se l'indice del punto corrisponde a quello che si sta trascinando,
  //restituisce le nuove coordinate, altrimenti lascia il punto invariato.
  const updateWallPoint = (
    point: CoordinateType,
    i: number,
    w: CoordinateType,
  ) => {
    return i === wallDrag!.pi ? { x: w.x, y: w.y } : point;
  };

  //Aggiorna un intero muro durante il drag.
  //Se il muro corrisponde a quello che si sta trascinando, mappa tutti i suoi punti attraverso updateWallPoint, altrimenti lo lascia invariato.
  const updateWall = (wl: WallData, w: CoordinateType) => {
    if (wl.id === wallDrag!.wallId) {
      return {
        ...wl,
        points: wl.points.map((point, i) => updateWallPoint(point, i, w)),
      };
    }
    return wl;
  };

  //Gestisce il trascinamento di un punto di un muro. Se c'è un wallDrag attivo,
  //aggiorna tutti i muri chiamando updateWall con le nuove coordinate.
  const handleWallDrag = (w: CoordinateType) => {
    if (!wallDrag) return;
    didPan.current = true;
    setWalls((p) => p.map((wl) => updateWall(wl, w)));
  };

  //gestisce il mouseup, resetta tutti gli stati di drag attivi (panStart, dragging, groupDrag, wallDrag).
  const onUp = () => {
    setPanStart(null);
    setDragging(null);
    setGroupDrag(null);
    setWallDrag(null);
  };

  //gestisce lo zoom con la rotella del mouse. Calcola il nuovo zoom e aggiusta il pan in modo che il punto sotto il cursore rimanga fisso durante lo zoom.
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const r = svgRef.current!.getBoundingClientRect();
    const mx = e.clientX - r.left,
      my = e.clientY - r.top;
    const nz = Math.min(5, Math.max(0.2, zoom * (e.deltaY < 0 ? 1.12 : 0.9)));
    setPan((p) => ({
      x: mx - (mx - p.x) * (nz / zoom),
      y: my - (my - p.y) * (nz / zoom),
    }));
    setZoom(nz);
  };

  //gestisce il click sullo sfondo SVG. In base alla modalità:
  //add4/add8 — aggiunge un tavolo da 4 o 8 posti dove si clicca (se non ci sono collisioni)
  //wall — aggiunge un punto al muro in costruzione
  //view — deseleziona il tavolo selezionato
  const onSVGClick = (e: React.MouseEvent) => {
    if (didPan.current) return;
    const { x, y } = toWorld(e.clientX, e.clientY);
    if (!isEditing) {
      setSelId(null);
      return;
    }
    if (mode === "add4" || mode === "add8") {
      const sz: TableSizeConst = mode === "add4" ? 4 : 8;
      if (hasCollision(x, y, sz, shape, tables, [])) {
        showNotification("❌ Sovrapposizione!", NotificationType.Err);
        return;
      }
      setTables((p) => [
        ...p,
        {
          id: `t-${Date.now()}`,
          x,
          y,
          size: sz,
          shape,
          reserved: false,
          blockedSides: [],
          chairs: defaultChairs(sz, shape),
        },
      ]);
      showNotification("✓ Tavolo aggiunto!", NotificationType.Ok);
    }
    if (mode === "wall") {
      if (curWall) setCurWall((p) => [...(p ?? []), { x, y }]);
      else setCurWall([{ x, y }]);
    }
    if (mode === "view") setSelId(null);
  };

  //gestisce il mousedown su un tavolo. Se la modalità è move,
  //prepara il drag — singolo se il tavolo non ha gruppo, oppure di gruppo salvando le posizioni iniziali di tutti i tavoli del gruppo.
  const onTableDown = (e: React.MouseEvent, tid: string) => {
    e.stopPropagation();
    didDrag.current = false;
    didPan.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    if (!isEditing || mode !== "move") return;
    const t = tables.find((t) => t.id === tid);
    if (!t) return;
    const w = toWorld(e.clientX, e.clientY);
    if (t.groupId) {
      const gts = getGroup(t.groupId);
      const sp: Record<string, CoordinateType> = {};
      for (const gt of gts) sp[gt.id] = { x: gt.x, y: gt.y };
      setGroupDrag({ groupId: t.groupId, startMouse: w, startPositions: sp });
    } else {
      setDragging({ id: tid, ox: w.x - t.x, oy: w.y - t.y });
    }
  };

  //gestisce il click su un tavolo in modalità delete. Se il tavolo fa parte di un gruppo,
  //separa tutti i tavoli del gruppo ripristinando le sedie di default. Se è singolo, lo elimina direttamente.
  const handleDeleteMode = (t: TableData, tid: string) => {
    if (t.groupId) {
      setTables((p) =>
        p.map((tt) =>
          tt.groupId === t.groupId
            ? {
                ...tt,
                groupId: undefined,
                blockedSides: [],
                chairs: defaultChairs(tt.size, tt.shape),
              }
            : tt,
        ),
      );
      showNotification("🔓 Gruppo separato", NotificationType.Info);
    } else {
      setTables((p) => p.filter((tt) => tt.id !== tid));
    }
    setSelId(null);
  };

  //gestisce l'unione di tavoli in modalità merge. Al primo click imposta l'ancora,
  //ai click successivi unisce i tavoli cliccati al gruppo dell'ancora, usando snapIncoming per agganciare fisicamente i tavoli uno accanto all'altro.
  const handleMergeMode = (t: TableData, tid: string) => {
    if (!mergeAnchor) {
      setMergeAnchor(tid);
      showNotification(
        "✓ Ancora impostata — clicca altri tavoli per unirli",
        NotificationType.Info,
      );
      return;
    }

    const anchorTable = tables.find((tt) => tt.id === mergeAnchor)!;
    if (
      tid === mergeAnchor ||
      (t.groupId && t.groupId === anchorTable?.groupId)
    ) {
      showNotification("Tavolo già nel gruppo", NotificationType.Info);
      return;
    }

    const anchorGid = anchorTable?.groupId;
    const incomingGid = t.groupId;
    const newGid = anchorGid ?? incomingGid ?? `g-${Date.now()}`;
    const incomingTables = incomingGid
      ? tables.filter((tt) => tt.groupId === incomingGid)
      : [t];

    let updatedAll = [...tables];

    for (const incoming of incomingTables) {
      const liveGroup = updatedAll.filter(
        (tt) =>
          tt.groupId === newGid ||
          tt.id === mergeAnchor ||
          (anchorGid && tt.groupId === anchorGid),
      );
      const liveIncoming = updatedAll.find((tt) => tt.id === incoming.id)!;
      const snap = snapIncoming(liveIncoming, liveGroup);

      if (snap) {
        const groupMap = new Map(snap.updatedGroup.map((tt) => [tt.id, tt]));
        updatedAll = updatedAll.map((tt) => {
          if (tt.id === snap.snapped.id)
            return { ...snap.snapped, groupId: newGid };
          if (groupMap.has(tt.id))
            return { ...groupMap.get(tt.id)!, groupId: newGid };
          return tt;
        });
      } else {
        updatedAll = updatedAll.map((tt) =>
          tt.id === incoming.id ? { ...tt, groupId: newGid } : tt,
        );
      }

      updatedAll = updatedAll.map((tt) =>
        tt.id === mergeAnchor || (anchorGid && tt.groupId === anchorGid)
          ? { ...tt, groupId: newGid }
          : tt,
      );
    }

    setTables(updatedAll);
    showNotification(
      "🔗 Tavolo unito! Clicca altri o premi Fine unione",
      NotificationType.Ok,
    );
  };

  //gestisce il click su un tavolo. In base alla modalità:
  //view — seleziona il tavolo
  //delete — chiama handleDeleteMode
  //merge — chiama handleMergeMode
  //Ignora il click se c'è stato un drag.
  const onTableClick = (e: React.MouseEvent, tid: string) => {
    e.stopPropagation();
    if (didDrag.current || didPan.current) return;
    const t = tables.find((t) => t.id === tid);
    if (!t) return;

    if (mode === "view") {
      setSelId(tid);
      return;
    }

    if (!isEditing) return;

    if (mode === "delete") {
      handleDeleteMode(t, tid);
      return;
    }

    if (mode === "merge") {
      handleMergeMode(t, tid);
    }
  };

  //gestisce il click su un muro. Se si è in modalità delete, elimina il muro cliccato.
  const onWallClick = (
    wallId: string,
    e: React.MouseEvent,
    isEditing: boolean,
  ) => {
    e.stopPropagation();
    if (isEditing && mode === "delete")
      setWalls((p) => p.filter((w) => w.id !== wallId));
  };

  //è il gestore principale del mousemove. Fa più cose in sequenza:
  //aggiorna la posizione del cursore nel mondo SVG
  //se c'è un pan attivo, sposta la vista
  //se si sta draggando un tavolo singolo, lo muove evitando collisioni
  //se si sta draggando un gruppo di tavoli, li muove tutti insieme evitando collisioni
  //chiama handleWallDrag per il drag dei muri
  const onMove = (e: React.MouseEvent) => {
    const w = toWorld(e.clientX, e.clientY);
    setCursor(w);
    if (panStart) {
      const dx = e.clientX - panStart.mx,
        dy = e.clientY - panStart.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didPan.current = true;
      setPan({ x: panStart.px + dx, y: panStart.py + dy });
    }
    if (dragging) {
      const nx = w.x - dragging.ox,
        ny = w.y - dragging.oy;
      if (
        mouseDownPos.current &&
        (Math.abs(e.clientX - mouseDownPos.current.x) > 4 ||
          Math.abs(e.clientY - mouseDownPos.current.y) > 4)
      )
        didDrag.current = true;
      const t = tables.find((t) => t.id === dragging.id);
      if (
        t &&
        !hasCollision(nx, ny, t.size, t.shape, tables, walls, [dragging.id])
      )
        setTables((p) =>
          p.map((tbl) =>
            tbl.id === dragging.id ? { ...tbl, x: nx, y: ny } : tbl,
          ),
        );
    }
    if (groupDrag) {
      const dx = w.x - groupDrag.startMouse.x,
        dy = w.y - groupDrag.startMouse.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didDrag.current = true;

      // IDs di tutti i tavoli del gruppo (da escludere dalla collision)
      const groupIds = Object.keys(groupDrag.startPositions);

      // Controlla che NESSUN tavolo del gruppo collida
      const wouldCollide = groupIds.some((id) => {
        const start = groupDrag.startPositions[id];
        const t = tables.find((t) => t.id === id);
        if (!t) return false;
        return hasCollision(
          start.x + dx,
          start.y + dy,
          t.size,
          t.shape,
          tables,
          walls,
          groupIds, // escludi tutti i tavoli del gruppo
        );
      });

      if (!wouldCollide) {
        setTables((p) =>
          p.map((t) =>
            t.groupId === groupDrag.groupId
              ? {
                  ...t,
                  x: groupDrag.startPositions[t.id].x + dx,
                  y: groupDrag.startPositions[t.id].y + dy,
                }
              : t,
          ),
        );
      }
    }
    handleWallDrag(w);
  };

  return {
    onSVGDown,
    onSVGClick,
    onMove,
    onUp,
    onWheel,
    onTableDown,
    onTableClick,
    onWallClick,
  };
};
