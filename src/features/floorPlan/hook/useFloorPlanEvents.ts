import { useEffect, useRef, useState } from "react";
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
import {
  TableShape,
  type HeadsConst,
  type TableShapeConst,
} from "../constant/floorPlan";
import { hasCollision } from "../helpers/collision";
import { NotificationType } from "../../../types/notification";
import { defaultChairs, nextTableName } from "../helpers/chair";
import { snapIncoming } from "../helpers/snap";
import { useNotification } from "../../../hooks/useNotification";
import { getUnit, hasBookings, unitOccupancy } from "../helpers/booking";
import { clampZoom } from "../helpers/view";
import type { ModalType } from "../../../types/general";

//Spostamento minimo (px) perché un tocco o un clic diventi un trascinamento
const DRAG_THRESHOLD = 5;

//Gesto a due dita in corso: distanza e punto medio iniziali, con zoom e pan di partenza
interface PinchStart {
  dist: number;
  mid: CoordinateType;
  zoom: number;
  pan: CoordinateType;
}

interface UseFloorPlanEventsProps {
  mode: PlanMode;
  pan: CoordinateType;
  zoom: number;
  tables: TableData[];
  wallDrag: WallDragType;
  isEditing: boolean;
  shape: TableShapeConst;
  newSeats: number;
  newHeads: HeadsConst;
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
  placingReservationId: string | null;
  setPlacingReservationId: (x: string | null) => void;
  setModal: (x: ModalType) => void;
  //persone della prenotazione da sistemare, per controllare che il tavolo abbia posti a sufficienza
  placingPeople?: number;
}

export const useFloorPlanEvents = ({
  mode,
  pan,
  zoom,
  isEditing,
  shape,
  newSeats,
  newHeads,
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
  placingReservationId,
  setPlacingReservationId,
  setModal,
  placingPeople,
}: UseFloorPlanEventsProps) => {
  const showNotification = useNotification();

  const [dragging, setDragging] = useState<DraggingType>(null);
  const [groupDrag, setGroupDrag] = useState<PlanGroupDrag | null>(null);
  const mouseDownPos = useRef<CoordinateType | null>(null);
  const didDrag = useRef(false);
  const didPan = useRef(false);
  //dita (o puntatori) appoggiati sulla piantina, per il pizzico a due dita
  const pointers = useRef(new Map<number, CoordinateType>());
  const pinch = useRef<PinchStart | null>(null);

  //Zoom con la rotellina (e con il pizzico sul trackpad, che arriva come ctrl+rotellina).
  //Listener nativo perché quelli di React sono passivi e non possono bloccare lo scroll/zoom della pagina.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const mx = e.clientX - r.left,
        my = e.clientY - r.top;
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const step = Math.max(-100, Math.min(100, dy));
      const nz = clampZoom(
        zoom * Math.exp(-step * (e.ctrlKey ? 0.01 : 0.0015)),
      );
      setPan((p) => ({
        x: mx - (mx - p.x) * (nz / zoom),
        y: my - (my - p.y) * (nz / zoom),
      }));
      setZoom(nz);
    };
    //Safari: il pizzico non deve zoomare tutta la pagina
    const preventGesture = (e: Event) => e.preventDefault();
    svg.addEventListener("wheel", onWheel, { passive: false });
    svg.addEventListener("gesturestart", preventGesture);
    return () => {
      svg.removeEventListener("wheel", onWheel);
      svg.removeEventListener("gesturestart", preventGesture);
    };
  }, [svgRef, zoom, setPan, setZoom]);

  //Distanza e punto medio (rispetto alla piantina) delle prime due dita
  const pinchGeometry = () => {
    const [a, b] = [...pointers.current.values()];
    const r = svgRef.current!.getBoundingClientRect();
    return {
      dist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      mid: { x: (a.x + b.x) / 2 - r.left, y: (a.y + b.y) / 2 - r.top },
    };
  };

  //Registra ogni dito appoggiato (in fase di cattura, prima che tavoli e muri fermino l'evento).
  //Con il secondo dito parte il pizzico: si annullano trascinamenti e pan con un dito.
  const onPointerDownCapture = (e: React.PointerEvent) => {
    // primo dito (o mouse): eventuali puntatori rimasti da gesti precedenti non contano più
    if (e.isPrimary) pointers.current.clear();
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size !== 2) return;
    didPan.current = true;
    setPanStart(null);
    setDragging(null);
    setGroupDrag(null);
    setWallDrag(null);
    pinch.current = { ...pinchGeometry(), zoom, pan };
  };

  //Pizzico in corso: zoom in base alla distanza delle dita, pan seguendo il punto medio
  const handlePinch = () => {
    const start = pinch.current!;
    const { dist, mid } = pinchGeometry();
    const nz = clampZoom((start.zoom * dist) / start.dist);
    const wx = (start.mid.x - start.pan.x) / start.zoom,
      wy = (start.mid.y - start.pan.y) / start.zoom;
    setZoom(nz);
    setPan({ x: mid.x - wx * nz, y: mid.y - wy * nz });
  };

  //Serve per la posizione del mouse all'interno della piantina
  const toWorld = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: (cx - r.left - pan.x) / zoom,
      y: (cy - r.top - pan.y) / zoom,
    };
  };

  //Gestisce il pointerdown sullo sfondo SVG (mouse, dito o penna). Se la modalità è pan, view
  //o si usa il tasto centrale del mouse, salva la posizione iniziale per iniziare il pan della mappa.
  const onSVGDown = (e: React.PointerEvent) => {
    if (pointers.current.size > 1) return;
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

  //gestisce il pointerup (o l'uscita dalla piantina), resetta tutti gli stati di drag attivi
  //(panStart, dragging, groupDrag, wallDrag) e chiude il pizzico se resta meno di due dita.
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    setPanStart(null);
    setDragging(null);
    setGroupDrag(null);
    setWallDrag(null);
  };

  //gestisce il click sullo sfondo SVG. In base alla modalità:
  //add — aggiunge un tavolo con posti, forma e capotavola scelti dove si clicca (se non ci sono collisioni)
  //wall — aggiunge un punto al muro in costruzione
  //view — deseleziona il tavolo selezionato
  const onSVGClick = (e: React.MouseEvent) => {
    if (didPan.current) return;
    const { x, y } = toWorld(e.clientX, e.clientY);
    if (!isEditing) {
      setSelId(null);
      return;
    }
    if (mode === "add") {
      // i capotavola hanno senso solo per i tavoli rettangolari
      const geom = {
        size: newSeats,
        shape,
        ...(shape === TableShape.Rect && { heads: newHeads }),
      };
      if (hasCollision(x, y, geom, tables, [])) {
        showNotification("❌ Sovrapposizione!", NotificationType.Err);
        return;
      }
      setTables((p) => [
        ...p,
        {
          id: `t-${Date.now()}`,
          name: nextTableName(p),
          x,
          y,
          ...geom,
          blockedSides: [],
          chairs: defaultChairs(geom),
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

  //gestisce il pointerdown su un tavolo. Se la modalità è move,
  //prepara il drag — singolo se il tavolo non ha gruppo, oppure di gruppo salvando le posizioni iniziali di tutti i tavoli del gruppo.
  //Nelle altre modalità l'evento arriva allo sfondo: trascinando da un tavolo si sposta la vista (utile sul cellulare).
  const onTableDown = (e: React.PointerEvent, tid: string) => {
    if (pointers.current.size > 1) return;
    didDrag.current = false;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    if (!isEditing || mode !== "move") return;
    e.stopPropagation();
    didPan.current = false;
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
      if (hasBookings(getGroup(t.groupId))) {
        showNotification(
          "🔒 Libera i posti prenotati prima di separare il gruppo",
          NotificationType.Err,
        );
        return;
      }
      setTables((p) =>
        p.map((tt) =>
          tt.groupId === t.groupId
            ? {
                ...tt,
                groupId: undefined,
                blockedSides: [],
                chairs: defaultChairs(tt),
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
    if (hasBookings(getUnit(t, tables))) {
      showNotification(
        "🔒 Libera i posti prenotati prima di unire i tavoli",
        NotificationType.Err,
      );
      return;
    }
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
    const newGid = anchorGid ?? `g-${Date.now()}`;
    const incomingTables = incomingGid
      ? tables.filter((tt) => tt.groupId === incomingGid)
      : [t];

    let updatedAll = [...tables];

    for (const incoming of incomingTables) {
      // Solo i tavoli già nel gruppo dell'ancora possono fare da aggancio
      // (mai il tavolo in arrivo o gli altri tavoli del suo vecchio gruppo)
      const liveGroup = updatedAll.filter(
        (tt) => tt.groupId === newGid || tt.id === mergeAnchor,
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
  //view — seleziona il tavolo (in modifica anche in add/move, così si può rinominare o ruotare)
  //delete — chiama handleDeleteMode
  //merge — chiama handleMergeMode
  //Ignora il click se c'è stato un drag.
  const onTableClick = (e: React.MouseEvent, tid: string) => {
    e.stopPropagation();
    if (didDrag.current || didPan.current) return;
    const t = tables.find((t) => t.id === tid);
    if (!t) return;

    //Prenotazione online da sistemare: il clic sul tavolo apre la prenotazione già compilata
    if (!isEditing && placingReservationId) {
      const { free } = unitOccupancy(getUnit(t, tables));
      if (placingPeople && free < placingPeople) {
        showNotification(
          `❌ Il tavolo ha solo ${free} posti liberi, ne servono ${placingPeople}`,
          NotificationType.Err,
        );
        return;
      }
      setSelId(tid);
      setModal({
        open: true,
        tableId: tid,
        reservationId: placingReservationId,
      });
      setPlacingReservationId(null);
      return;
    }

    if (mode === "view" || (isEditing && (mode === "add" || mode === "move"))) {
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

  //gestisce il pointerdown su un punto di un muro: in modalità move o wall inizia a trascinarlo
  const onWallPointDown = (
    e: React.PointerEvent,
    wallId: string,
    pi: number,
  ) => {
    if (!isEditing || (mode !== "move" && mode !== "wall")) return;
    if (pointers.current.size > 1) return;
    e.stopPropagation();
    didPan.current = false;
    setWallDrag({ wallId, pi });
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

  //è il gestore principale del pointermove. Fa più cose in sequenza:
  //con due dita gestisce il pizzico (zoom + pan) e basta
  //aggiorna la posizione del cursore nel mondo SVG (solo quando serve: anteprima del tavolo o del muro,
  //così negli altri casi muovere il mouse non ridisegna la piantina)
  //se c'è un pan attivo, sposta la vista
  //se si sta draggando un tavolo singolo, lo muove evitando collisioni
  //se si sta draggando un gruppo di tavoli, li muove tutti insieme evitando collisioni
  //chiama handleWallDrag per il drag dei muri
  const onMove = (e: React.PointerEvent) => {
    if (pointers.current.has(e.pointerId))
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      handlePinch();
      return;
    }
    const w = toWorld(e.clientX, e.clientY);
    if (isEditing && (mode === "add" || mode === "wall")) setCursor(w);
    if (panStart) {
      const dx = e.clientX - panStart.mx,
        dy = e.clientY - panStart.my;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
        didPan.current = true;
      // finché non supera la soglia non si sposta: un tocco su un tavolo resta un clic
      if (didPan.current) setPan({ x: panStart.px + dx, y: panStart.py + dy });
    }
    if (dragging) {
      const nx = w.x - dragging.ox,
        ny = w.y - dragging.oy;
      if (
        mouseDownPos.current &&
        (Math.abs(e.clientX - mouseDownPos.current.x) > DRAG_THRESHOLD ||
          Math.abs(e.clientY - mouseDownPos.current.y) > DRAG_THRESHOLD)
      )
        didDrag.current = true;
      const t = tables.find((t) => t.id === dragging.id);
      if (t && !hasCollision(nx, ny, t, tables, walls, [dragging.id]))
        setTables((p) =>
          p.map((tbl) =>
            tbl.id === dragging.id ? { ...tbl, x: nx, y: ny } : tbl,
          ),
        );
    }
    if (groupDrag) {
      const dx = w.x - groupDrag.startMouse.x,
        dy = w.y - groupDrag.startMouse.y;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)
        didDrag.current = true;

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
          t,
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
    onPointerDownCapture,
    onSVGDown,
    onSVGClick,
    onMove,
    onUp,
    onTableDown,
    onTableClick,
    onWallPointDown,
    onWallClick,
  };
};
