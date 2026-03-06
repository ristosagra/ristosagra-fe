import { useState, useRef, useCallback, useEffect } from "react";
import { useFloorPlan } from "../../hooks/useFloorPlan";
import { Loader } from "../../components/core/Loader";
import {
  chairPos,
  defaultChairs,
  getTableStyle,
  hasCollision,
  sharedEdge,
  snapIncoming,
} from "../../helpers/floorPlan";
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
} from "../../types/floorPlan";
import {
  PLAN_CHAIR_R,
  PLAN_RECT_H,
  PLAN_RECT_W,
  PLAN_TABLE_R,
  TableShape,
  type TableShapeConst,
  type TableSizeConst,
} from "../../constant/floorPlan";
import { useNotification } from "../../hooks/useNotification";
import { NotificationType } from "../../types/notification";
import { SideBarFloorPlan } from "../../components/FloorPlan/SideBarFloorPlan";
import { HeaderFloorPlan } from "../../components/FloorPlan/HeaderFloorPlan";
import { ModalFloorPlan } from "../../components/FloorPlan/ModalFloorPlan";
import type { ModalType } from "../../types/general";
import { FooterFloorPlan } from "../../components/FloorPlan/FooterFloorPlan";

// ─── Root Component ──────────────────────────────────────────────────────────
export default function RestaurantFloorPlan() {
  const { data: savedPlan, isLoading, isError } = useFloorPlan();
  const showNotification = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);
  const [walls, setWalls] = useState<WallData[]>([]);

  // Editing sub-states
  const [curWall, setCurWall] = useState<WallType>(null);
  const [mode, setMode] = useState<PlanMode>("view");
  const [shape, setShape] = useState<TableShapeConst>(TableShape.Round);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<CoordinateType>({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<PanStartType>(null);
  const [dragging, setDragging] = useState<DraggingType>(null);
  const [groupDrag, setGroupDrag] = useState<PlanGroupDrag | null>(null);
  const [wallDrag, setWallDrag] = useState<WallDragType>(null);
  const [cursor, setCursor] = useState<CoordinateType>({ x: 0, y: 0 });
  const [mergeAnchor, setMergeAnchor] = useState<string | null>(null);
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalType>({ open: false, tableId: "" });
  const [guest, setGuest] = useState("");
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const mouseDownPos = useRef<CoordinateType | null>(null);
  const didDrag = useRef(false);
  const didPan = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Load saved plan into state
  useEffect(() => {
    if (savedPlan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTables(savedPlan.tables);
      setWalls(savedPlan.walls);
    }
  }, [savedPlan]);

  //Serve per la posizione del mouse all'interno della piantina
  const toWorld = useCallback(
    (cx: number, cy: number) => {
      const r = svgRef.current!.getBoundingClientRect();
      return {
        x: (cx - r.left - pan.x) / zoom,
        y: (cy - r.top - pan.y) / zoom,
      };
    },
    [pan, zoom],
  );

  //serve per restituire tutti i tavoli che appartengono ad un gruppo
  const getGroup = useCallback(
    (gid: string) => tables.filter((t) => t.groupId === gid),
    [tables],
  );

  // ── Mouse handlers ──
  //Gestisce il mousedown sullo sfondo SVG. Se la modalità è pan, view o si usa il tasto centrale del mouse,
  //salva la posizione iniziale per iniziare il pan della mappa.
  const onSVGDown = useCallback(
    (e: React.MouseEvent) => {
      didPan.current = false;
      // Pan su sfondo in qualsiasi modalità "view" (editing o meno) o modalità "pan" esplicita
      if (mode === "pan" || mode === "view" || e.button === 1)
        setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
    },
    [mode, pan],
  );

  //Aggiorna un singolo punto di un muro durante il drag. Se l'indice del punto corrisponde a quello che si sta trascinando,
  //restituisce le nuove coordinate, altrimenti lascia il punto invariato.
  const updateWallPoint = useCallback(
    (point: CoordinateType, i: number, w: CoordinateType) => {
      return i === wallDrag!.pi ? { x: w.x, y: w.y } : point;
    },
    [wallDrag],
  );

  //Aggiorna un intero muro durante il drag.
  //Se il muro corrisponde a quello che si sta trascinando, mappa tutti i suoi punti attraverso updateWallPoint, altrimenti lo lascia invariato.
  const updateWall = useCallback(
    (wl: WallData, w: CoordinateType) => {
      if (wl.id === wallDrag!.wallId) {
        return {
          ...wl,
          points: wl.points.map((point, i) => updateWallPoint(point, i, w)),
        };
      }
      return wl;
    },
    [wallDrag, updateWallPoint],
  );

  //Gestisce il trascinamento di un punto di un muro. Se c'è un wallDrag attivo,
  //aggiorna tutti i muri chiamando updateWall con le nuove coordinate.
  const handleWallDrag = useCallback(
    (w: CoordinateType) => {
      if (!wallDrag) return;
      didPan.current = true;
      setWalls((p) => p.map((wl) => updateWall(wl, w)));
    },
    [wallDrag, updateWall],
  );

  //è il gestore principale del mousemove. Fa più cose in sequenza:
  //aggiorna la posizione del cursore nel mondo SVG
  //se c'è un pan attivo, sposta la vista
  //se si sta draggando un tavolo singolo, lo muove evitando collisioni
  //se si sta draggando un gruppo di tavoli, li muove tutti insieme evitando collisioni
  //chiama handleWallDrag per il drag dei muri
  const onMove = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [panStart, dragging, groupDrag, tables, toWorld, walls, handleWallDrag],
  );

  //gestisce il mouseup, resetta tutti gli stati di drag attivi (panStart, dragging, groupDrag, wallDrag).
  const onUp = useCallback(() => {
    setPanStart(null);
    setDragging(null);
    setGroupDrag(null);
    setWallDrag(null);
  }, []);

  //gestisce lo zoom con la rotella del mouse. Calcola il nuovo zoom e aggiusta il pan in modo che il punto sotto il cursore rimanga fisso durante lo zoom.
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
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
    },
    [zoom],
  );

  //gestisce il click sullo sfondo SVG. In base alla modalità:
  //add4/add8 — aggiunge un tavolo da 4 o 8 posti dove si clicca (se non ci sono collisioni)
  //wall — aggiunge un punto al muro in costruzione
  //view — deseleziona il tavolo selezionato
  const onSVGClick = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [mode, shape, curWall, toWorld, isEditing, showNotification, tables],
  );

  //gestisce il mousedown su un tavolo. Se la modalità è move,
  //prepara il drag — singolo se il tavolo non ha gruppo, oppure di gruppo salvando le posizioni iniziali di tutti i tavoli del gruppo.
  const onTableDown = useCallback(
    (e: React.MouseEvent, tid: string) => {
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
    },
    [isEditing, mode, tables, toWorld, getGroup],
  );

  //gestisce il click su un tavolo in modalità delete. Se il tavolo fa parte di un gruppo,
  //separa tutti i tavoli del gruppo ripristinando le sedie di default. Se è singolo, lo elimina direttamente.
  const handleDeleteMode = useCallback(
    (t: TableData, tid: string) => {
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
    },
    [showNotification],
  );

  //gestisce l'unione di tavoli in modalità merge. Al primo click imposta l'ancora,
  //ai click successivi unisce i tavoli cliccati al gruppo dell'ancora, usando snapIncoming per agganciare fisicamente i tavoli uno accanto all'altro.
  const handleMergeMode = useCallback(
    (t: TableData, tid: string) => {
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
    },
    [tables, mergeAnchor, showNotification],
  );

  //gestisce il click su un tavolo. In base alla modalità:
  //view — seleziona il tavolo
  //delete — chiama handleDeleteMode
  //merge — chiama handleMergeMode
  //Ignora il click se c'è stato un drag.
  const onTableClick = useCallback(
    (e: React.MouseEvent, tid: string) => {
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
    },
    [mode, tables, isEditing, handleDeleteMode, handleMergeMode],
  );

  //gestisce il click su un muro. Se si è in modalità delete, elimina il muro cliccato.
  const onWallClick = (wallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing && mode === "delete")
      setWalls((p) => p.filter((w) => w.id !== wallId));
  };

  // ── Derived ──
  const pts = (arr: CoordinateType[]) =>
    arr.map((p) => `${p.x},${p.y}`).join(" ");
  const groupMap = new Map<string, TableData[]>();
  for (const t of tables)
    if (t.groupId) {
      if (!groupMap.has(t.groupId)) groupMap.set(t.groupId, []);
      groupMap.get(t.groupId)!.push(t);
    }

  const selTable = selId ? tables.find((t) => t.id === selId) : null;

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

  // ── Error states ──
  if (isError)
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 font-mono text-rose-400">
        <div className="text-center space-y-3">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm">Errore nel caricamento della piantina</p>
        </div>
      </div>
    );

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="flex flex-col h-[calc(100vh-73px)] bg-neutral-950 font-mono text-white overflow-hidden w-full">
          {/* ── Header ── */}
          <HeaderFloorPlan
            tables={tables}
            setIsEditing={setIsEditing}
            setMode={setMode}
            setWalls={setWalls}
            setMergeAnchor={setMergeAnchor}
            setSelId={setSelId}
            setCurWall={setCurWall}
            isEditing={isEditing}
            walls={walls}
            zoom={zoom}
            savedPlan={savedPlan}
            groupMap={groupMap}
            setTables={setTables}
            setZoom={setZoom}
            setPan={setPan}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* ── Sidebar (only in edit mode) ── */}
            {isEditing && (
              <SideBarFloorPlan
                setShape={setShape}
                curWall={curWall}
                setCurWall={setCurWall}
                mode={mode}
                mergeAnchor={mergeAnchor}
                shape={shape}
                setWalls={setWalls}
                setMode={setMode}
                setMergeAnchor={setMergeAnchor}
                setSelId={setSelId}
              />
            )}

            {/* ── Canvas ── */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
              {/* Hint */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                <div className="bg-neutral-900/90 text-neutral-300 text-xs px-3 py-1.5 rounded-full border border-neutral-700 backdrop-blur-sm shadow-lg">
                  {hints[mode]}
                </div>
              </div>

              {/* Empty state */}
              {tables.length === 0 && walls.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <div className="text-7xl mb-4 opacity-10">🍴</div>
                  <p className="text-neutral-600 text-sm">
                    {isEditing
                      ? "Usa gli strumenti per creare la piantina"
                      : "Nessuna piantina salvata"}
                  </p>
                </div>
              )}

              {/* SVG */}
              <svg
                ref={svgRef}
                className={`flex-1 select-none
              ${
                hoveredTableId
                  ? "cursor-pointer" // sopra un tavolo
                  : mode === "add4" || mode === "add8" || mode === "wall"
                    ? "cursor-crosshair" // aggiunta elementi
                    : mode === "delete"
                      ? "cursor-not-allowed" // elimina
                      : panStart
                        ? "cursor-grabbing" // sta panando
                        : "cursor-grab" // sfondo libero = pan
              }
            `}
                style={{
                  background: `repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px),#1a1a1a`,
                  width: `100%`,
                }}
                onMouseDown={onSVGDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onWheel={onWheel}
                onClick={onSVGClick}
              >
                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Walls */}
                  {walls.map((wl) => (
                    <g key={wl.id}>
                      <polyline
                        points={pts(wl.points)}
                        fill="none"
                        stroke="rgba(0,0,0,0.4)"
                        strokeWidth="14"
                        strokeLinecap={TableShape.Round}
                        strokeLinejoin={TableShape.Round}
                      />
                      <polyline
                        points={pts(wl.points)}
                        fill="none"
                        stroke="#92400e"
                        strokeWidth="10"
                        strokeLinecap={TableShape.Round}
                        strokeLinejoin={TableShape.Round}
                        className={
                          isEditing && mode === "delete" ? "cursor-pointer" : ""
                        }
                        onMouseEnter={(e) => {
                          if (isEditing && mode === "delete")
                            (e.target as SVGElement).setAttribute(
                              "stroke",
                              "#ef4444",
                            );
                        }}
                        onMouseLeave={(e) => {
                          (e.target as SVGElement).setAttribute(
                            "stroke",
                            "#92400e",
                          );
                        }}
                        onClick={(e) => onWallClick(wl.id, e)}
                      />
                      <polyline
                        points={pts(wl.points)}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                        strokeLinecap={TableShape.Round}
                        strokeLinejoin={TableShape.Round}
                        opacity="0.5"
                        style={{ pointerEvents: "none" }}
                      />
                      {wl.points.map((p, i) => (
                        <circle
                          key={p.x + p.y + i}
                          cx={p.x}
                          cy={p.y}
                          r={
                            isEditing && (mode === "move" || mode === "wall")
                              ? 9
                              : 5
                          }
                          fill={
                            isEditing && (mode === "move" || mode === "wall")
                              ? "#f59e0b"
                              : "#b45309"
                          }
                          stroke={
                            isEditing && (mode === "move" || mode === "wall")
                              ? "#fff"
                              : "#f59e0b"
                          }
                          strokeWidth="2"
                          style={{
                            cursor:
                              isEditing && (mode === "move" || mode === "wall")
                                ? "grab"
                                : "default",
                            transition: "r 0.15s",
                          }}
                          onMouseDown={(e) => {
                            if (
                              isEditing &&
                              (mode === "move" || mode === "wall")
                            ) {
                              e.stopPropagation();
                              didPan.current = false;
                              setWallDrag({ wallId: wl.id, pi: i });
                            }
                          }}
                        />
                      ))}
                    </g>
                  ))}

                  {/* Wall in progress */}
                  {curWall && curWall.length > 0 && (
                    <g>
                      <polyline
                        points={pts([...curWall, cursor])}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="8"
                        strokeLinecap={TableShape.Round}
                        strokeLinejoin={TableShape.Round}
                        opacity="0.5"
                        strokeDasharray="12,5"
                        style={{ pointerEvents: "none" }}
                      />
                      <polyline
                        points={pts(curWall)}
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="8"
                        strokeLinecap={TableShape.Round}
                        strokeLinejoin={TableShape.Round}
                        style={{ pointerEvents: "none" }}
                      />
                      {curWall.map((p, i) => (
                        <circle
                          key={p.x + p.y + i}
                          cx={p.x}
                          cy={p.y}
                          r={5}
                          fill="#f97316"
                          stroke="white"
                          strokeWidth="1.5"
                          style={{ pointerEvents: "none" }}
                        />
                      ))}
                    </g>
                  )}

                  {/* Shared edges */}
                  {Array.from(groupMap.entries()).map(([gid, gtables]) => {
                    const lines: React.ReactNode[] = [];
                    for (let i = 0; i < gtables.length; i++)
                      for (let j = i + 1; j < gtables.length; j++) {
                        const edge = sharedEdge(gtables[i], gtables[j]);
                        if (edge)
                          lines.push(
                            <line
                              key={`e-${i}-${j}`}
                              x1={edge.x1}
                              y1={edge.y1}
                              x2={edge.x2}
                              y2={edge.y2}
                              stroke="#a855f7"
                              strokeWidth="3"
                              opacity="0.9"
                              style={{ pointerEvents: "none" }}
                            />,
                          );
                        else
                          lines.push(
                            <line
                              key={`d-${i}-${j}`}
                              x1={gtables[i].x}
                              y1={gtables[i].y}
                              x2={gtables[j].x}
                              y2={gtables[j].y}
                              stroke="#a855f7"
                              strokeWidth="2"
                              strokeDasharray="8,5"
                              opacity="0.5"
                              style={{ pointerEvents: "none" }}
                            />,
                          );
                      }
                    return <g key={gid}>{lines}</g>;
                  })}

                  {/* Tables */}
                  {tables.map((table) => {
                    const {
                      fill,
                      strokeClr,
                      glow,
                      isSel,
                      isMergeAnc,
                      reservedBy,
                      isReserved,
                    } = getTableStyle(
                      table,
                      selTable,
                      mergeAnchor,
                      tables,
                      selId,
                      getGroup,
                    );

                    return (
                      <g
                        key={table.id}
                        transform={`translate(${table.x},${table.y})`}
                        onMouseDown={(e) => onTableDown(e, table.id)}
                        onClick={(e) => onTableClick(e, table.id)}
                        onMouseEnter={() => setHoveredTableId(table.id)}
                        onMouseLeave={() => setHoveredTableId(null)}
                        className="cursor-pointer"
                        style={{
                          filter: isMergeAnc
                            ? "drop-shadow(0 0 14px #a855f7)"
                            : isSel
                              ? "drop-shadow(0 0 12px #f59e0b)"
                              : `drop-shadow(0 0 8px ${glow}) drop-shadow(0 3px 6px rgba(0,0,0,0.4))`,
                        }}
                      >
                        {/* Group ring */}
                        {table.groupId &&
                          (table.shape === TableShape.Round ? (
                            <circle
                              r={PLAN_TABLE_R[table.size] + 8}
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2.5"
                              strokeDasharray="5,3"
                              opacity="0.7"
                              style={{ pointerEvents: "none" }}
                            />
                          ) : (
                            <rect
                              x={-PLAN_RECT_W[table.size] / 2 - 8}
                              y={-PLAN_RECT_H[table.size] / 2 - 8}
                              width={PLAN_RECT_W[table.size] + 16}
                              height={PLAN_RECT_H[table.size] + 16}
                              rx="14"
                              fill="none"
                              stroke="#a855f7"
                              strokeWidth="2.5"
                              strokeDasharray="5,3"
                              opacity="0.7"
                              style={{ pointerEvents: "none" }}
                            />
                          ))}

                        {/* Chairs */}
                        {table.chairs.map((c, i) => {
                          const { x, y } = chairPos(c, table.shape, table.size);
                          return (
                            <circle
                              key={x + y + i}
                              cx={x}
                              cy={y}
                              r={PLAN_CHAIR_R}
                              fill="#d97706"
                              stroke="#92400e"
                              strokeWidth="2"
                              opacity="0.9"
                            />
                          );
                        })}

                        {/* Body */}
                        {table.shape === TableShape.Round ? (
                          <>
                            <circle
                              r={PLAN_TABLE_R[table.size] + 2}
                              fill={strokeClr}
                            />
                            <circle
                              r={PLAN_TABLE_R[table.size]}
                              fill={fill}
                              style={{ transition: "fill 0.4s" }}
                            />
                            <circle
                              r={PLAN_TABLE_R[table.size] - 6}
                              fill="none"
                              stroke="rgba(255,255,255,0.15)"
                              strokeWidth="1.5"
                            />
                          </>
                        ) : (
                          <>
                            <rect
                              x={-PLAN_RECT_W[table.size] / 2 - 2}
                              y={-PLAN_RECT_H[table.size] / 2 - 2}
                              width={PLAN_RECT_W[table.size] + 4}
                              height={PLAN_RECT_H[table.size] + 4}
                              rx="10"
                              fill={strokeClr}
                            />
                            <rect
                              x={-PLAN_RECT_W[table.size] / 2}
                              y={-PLAN_RECT_H[table.size] / 2}
                              width={PLAN_RECT_W[table.size]}
                              height={PLAN_RECT_H[table.size]}
                              rx="8"
                              fill={fill}
                              style={{ transition: "fill 0.4s" }}
                            />
                            <rect
                              x={-PLAN_RECT_W[table.size] / 2 + 6}
                              y={-PLAN_RECT_H[table.size] / 2 + 6}
                              width={PLAN_RECT_W[table.size] - 12}
                              height={PLAN_RECT_H[table.size] - 12}
                              rx="4"
                              fill="none"
                              stroke="rgba(255,255,255,0.12)"
                              strokeWidth="1.5"
                            />
                          </>
                        )}
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="rgba(255,255,255,0.95)"
                          fontSize="11"
                          fontWeight="bold"
                          dy="-7"
                          style={{
                            pointerEvents: "none",
                            fontFamily: "monospace",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {table.groupId ? "🔗" : ""}
                          {`T·${table.chairs.length}`}
                        </text>
                        <text
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="rgba(255,255,255,0.75)"
                          fontSize="9"
                          dy="8"
                          style={{
                            pointerEvents: "none",
                            fontFamily: "monospace",
                          }}
                        >
                          {isReserved
                            ? (reservedBy?.slice(0, 11) ?? "")
                            : "Libero"}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* ── Selection / booking / seat panel ── */}
              {selTable && (
                <FooterFloorPlan
                  selTable={selTable}
                  getGroup={getGroup}
                  tables={tables}
                  setTables={setTables}
                  setSelId={setSelId}
                  setGuest={setGuest}
                  setModal={setModal}
                  selId={selId}
                />
              )}
            </div>
          </div>

          {/* ── Booking modal ── */}
          {modal.open && (
            <ModalFloorPlan
              tables={tables}
              guest={guest}
              modal={modal}
              setTables={setTables}
              setModal={setModal}
              setGuest={setGuest}
              getGroup={getGroup}
            />
          )}
        </div>
      )}
    </>
  );
}
