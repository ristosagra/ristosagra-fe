import { useState, useRef, useCallback, useEffect } from "react";
import { useFloorPlan, useSaveFloorPlan } from "../../hooks/useFloorPlan";
import { Loader } from "../../components/core/Loader";
import {
  addChair,
  chairPos,
  defaultChairs,
  hasCollision,
  removeChair,
  sharedEdge,
  snapIncoming,
} from "../../helpers/floorPlan";
import type {
  FloorPlanData,
  PlanGroupDrag,
  PlanMode,
  TableData,
  WallData,
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

// ─── Root Component ──────────────────────────────────────────────────────────
export default function RestaurantFloorPlan() {
  const { data: savedPlan, isLoading, isError } = useFloorPlan();
  const { mutate: savePlan, isPending: isSaving } = useSaveFloorPlan();
  const showNotification = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [tables, setTables] = useState<TableData[]>([]);
  const [walls, setWalls] = useState<WallData[]>([]);
  const [snapshot, setSnapshot] = useState<{
    tables: TableData[];
    walls: WallData[];
  } | null>(null);

  // Editing sub-states
  const [curWall, setCurWall] = useState<{ x: number; y: number }[] | null>(
    null,
  );
  const [mode, setMode] = useState<PlanMode>("view");
  const [shape, setShape] = useState<TableShapeConst>(TableShape.Round);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{
    mx: number;
    my: number;
    px: number;
    py: number;
  } | null>(null);
  const [dragging, setDragging] = useState<{
    id: string;
    ox: number;
    oy: number;
  } | null>(null);
  const [groupDrag, setGroupDrag] = useState<PlanGroupDrag | null>(null);
  const [wallDrag, setWallDrag] = useState<{
    wallId: string;
    pi: number;
  } | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [mergeAnchor, setMergeAnchor] = useState<string | null>(null); // ID of the anchor group/table in merge mode
  const [selId, setSelId] = useState<string | null>(null);
  const [modal, setModal] = useState({ open: false, tableId: "" });
  const [guest, setGuest] = useState("");
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
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

  const getGroup = useCallback(
    (gid: string) => tables.filter((t) => t.groupId === gid),
    [tables],
  );

  // ── Edit mode control ──
  const startEditing = () => {
    setSnapshot({
      tables: structuredClone(tables),
      walls: structuredClone(walls),
    });
    setIsEditing(true);
    setMode("view");
  };
  const cancelEditing = () => {
    if (snapshot) {
      setTables(snapshot.tables);
      setWalls(snapshot.walls);
    }
    setIsEditing(false);
    setSelId(null);
    setMergeAnchor(null);
    setCurWall(null);
    setMode("view");
  };
  const handleSave = () => {
    const data: FloorPlanData = { id: savedPlan?.id, tables, walls };
    savePlan(data, {
      onSuccess: () => {
        showNotification("✓ Piantina salvata!", NotificationType.Ok);
        setIsEditing(false);
        setSnapshot(null);
        setMode("view");
      },
      onError: () =>
        showNotification("❌ Errore nel salvataggio", NotificationType.Err),
    });
  };

  // ── Mouse handlers ──
  const onSVGDown = useCallback(
    (e: React.MouseEvent) => {
      didPan.current = false;
      // Pan su sfondo in qualsiasi modalità "view" (editing o meno) o modalità "pan" esplicita
      if (mode === "pan" || mode === "view" || e.button === 1)
        setPanStart({ mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y });
    },
    [mode, pan],
  );

  const updateWallPoint = useCallback(
    (
      point: { x: number; y: number },
      i: number,
      w: { x: number; y: number },
    ) => {
      return i === wallDrag!.pi ? { x: w.x, y: w.y } : point;
    },
    [wallDrag],
  );

  const updateWall = useCallback(
    (wl: WallData, w: { x: number; y: number }) => {
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

  const handleWallDrag = useCallback(
    (w: { x: number; y: number }) => {
      if (!wallDrag) return;
      didPan.current = true;
      setWalls((p) => p.map((wl) => updateWall(wl, w)));
    },
    [wallDrag, updateWall],
  );

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

  const onUp = useCallback(() => {
    setPanStart(null);
    setDragging(null);
    setGroupDrag(null);
    setWallDrag(null);
  }, []);

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

  const finishWall = useCallback(() => {
    if (curWall && curWall.length >= 2) {
      setWalls((p) => [...p, { id: `w-${Date.now()}`, points: curWall }]);
      showNotification("✓ Muro aggiunto!", NotificationType.Ok);
    }
    setCurWall(null);
  }, [curWall, showNotification]);

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
        const sp: Record<string, { x: number; y: number }> = {};
        for (const gt of gts) sp[gt.id] = { x: gt.x, y: gt.y };
        setGroupDrag({ groupId: t.groupId, startMouse: w, startPositions: sp });
      } else {
        setDragging({ id: tid, ox: w.x - t.x, oy: w.y - t.y });
      }
    },
    [isEditing, mode, tables, toWorld, getGroup],
  );

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

  const onWallClick = (wallId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditing && mode === "delete")
      setWalls((p) => p.filter((w) => w.id !== wallId));
  };

  // ── Booking (available always) ──
  const confirmBooking = () => {
    if (!guest.trim()) return;
    const t = tables.find((tt) => tt.id === modal.tableId);
    if (!t) return;
    const ids = t.groupId
      ? tables.filter((tt) => tt.groupId === t.groupId).map((tt) => tt.id)
      : [modal.tableId];
    setTables((p) =>
      p.map((tt) =>
        ids.includes(tt.id)
          ? { ...tt, reserved: true, reservedBy: guest.trim() }
          : tt,
      ),
    );
    setModal({ open: false, tableId: "" });
    setGuest("");
  };
  const cancelBooking = (id: string) => {
    const t = tables.find((tt) => tt.id === id);
    if (!t) return;
    const ids = t.groupId
      ? tables.filter((tt) => tt.groupId === t.groupId).map((tt) => tt.id)
      : [id];
    setTables((p) =>
      p.map((tt) =>
        ids.includes(tt.id)
          ? { ...tt, reserved: false, reservedBy: undefined }
          : tt,
      ),
    );
    setSelId(null);
  };

  // ── Seat editing (available always when selected) ──
  const editChairs = (id: string, delta: 1 | -1) => {
    setTables((p) =>
      p.map((t) =>
        t.id === id ? (delta === 1 ? addChair(t) : removeChair(t)) : t,
      ),
    );
  };

  // ── Derived ──
  const pts = (arr: { x: number; y: number }[]) =>
    arr.map((p) => `${p.x},${p.y}`).join(" ");
  const reserved = tables.filter((t) => t.reserved).length;
  const groupMap = new Map<string, TableData[]>();
  for (const t of tables)
    if (t.groupId) {
      if (!groupMap.has(t.groupId)) groupMap.set(t.groupId, []);
      groupMap.get(t.groupId)!.push(t);
    }

  const selTable = selId ? tables.find((t) => t.id === selId) : null;
  const selGroup = selTable?.groupId
    ? getGroup(selTable.groupId)
    : selTable
      ? [selTable]
      : [];
  const selSeats = selGroup.reduce((s, t) => s + t.chairs.length, 0);
  const selReserved = selGroup.some((t) => t.reserved);
  const selName = selGroup.find((t) => t.reservedBy)?.reservedBy;

  // Helper to compute table colors and state
  const getTableStyle = (table: TableData) => {
    const grp = table.groupId ? getGroup(table.groupId) : [table];
    const isReserved = grp.some((t) => t.reserved);
    const fill = isReserved ? "#dc2626" : "#16a34a";
    const strokeClr = isReserved ? "#991b1b" : "#166534";
    const glow = table.groupId
      ? isReserved
        ? "rgba(239,68,68,0.5)"
        : "rgba(168,85,247,0.5)"
      : isReserved
        ? "rgba(239,68,68,0.4)"
        : "rgba(34,197,94,0.4)";
    const isSel =
      selId === table.id ||
      (selTable?.groupId && selTable.groupId === table.groupId);
    const isMergeAnc =
      mergeAnchor === table.id ||
      (mergeAnchor &&
        tables.find((t) => t.id === mergeAnchor)?.groupId &&
        tables.find((t) => t.id === mergeAnchor)?.groupId === table.groupId);
    const reservedBy = grp.find((t) => t.reservedBy)?.reservedBy;
    return { fill, strokeClr, glow, isSel, isMergeAnc, reservedBy, isReserved };
  };

  const modeButtons: {
    key: PlanMode;
    label: string;
    icon: string;
    color: string;
  }[] = [
    { key: "view", label: "Visualizza", icon: "👁", color: "bg-sky-600" },
    { key: "add4", label: "Tavolo da 4", icon: "➕", color: "bg-emerald-600" },
    { key: "add8", label: "Tavolo da 8", icon: "➕", color: "bg-teal-600" },
    {
      key: "merge",
      label: "Unisci tavoli",
      icon: "🔗",
      color: "bg-purple-600",
    },
    { key: "move", label: "Sposta", icon: "✥", color: "bg-amber-500" },
    { key: "delete", label: "Elimina", icon: "🗑", color: "bg-rose-600" },
    { key: "wall", label: "Disegna muro", icon: "🧱", color: "bg-orange-600" },
  ];

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
          <div className="bg-neutral-900 border-b border-neutral-700 px-4 py-2 flex items-center justify-between shrink-0">
            {/* Zoom */}
            <div className="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-2 py-1 h-full">
              <button
                onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))}
                className="w-8 rounded bg-neutral-700 hover:bg-neutral-600 font-bold flex items-center justify-center transition-colors h-full cursor-pointer"
              >
                −
              </button>
              <span className="text-xs text-neutral-300 w-12 text-center tabular-nums h-full flex items-center justify-center">
                <p>{Math.round(zoom * 100)}%</p>
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(5, z * 1.2))}
                className="w-8 rounded bg-neutral-700 hover:bg-neutral-600 font-bold flex items-center justify-center transition-colors h-full cursor-pointer"
              >
                +
              </button>
              <div className="w-px bg-neutral-600 mx-1 h-full" />
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="text-xs text-neutral-400 hover:text-white px-3 rounded hover:bg-neutral-700 transition-colors h-full cursor-pointer"
              >
                Reset
              </button>
            </div>

            {/* Stats + Edit controls */}
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[
                  {
                    label: "TOTALI",
                    val: tables.length,
                    cls: "text-neutral-200",
                  },
                  {
                    label: "LIBERI",
                    val: tables.length - reserved,
                    cls: "text-emerald-400",
                  },
                  { label: "PRENOTATI", val: reserved, cls: "text-rose-400" },
                  {
                    label: "GRUPPI",
                    val: groupMap.size,
                    cls: "text-purple-400",
                  },
                ].map(({ label, val, cls }) => (
                  <div
                    key={label}
                    className="bg-neutral-800 rounded px-3 py-1 text-center border border-neutral-700"
                  >
                    <div className={`text-base font-bold tabular-nums ${cls}`}>
                      {val}
                    </div>
                    <div className="text-neutral-500 text-xs tracking-widest">
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit / Save / Cancel */}
              {isEditing ? (
                <div className="flex gap-2 h-full">
                  <button
                    onClick={cancelEditing}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-lg border border-neutral-500 transition-colors h-full cursor-pointer"
                  >
                    ✕ Annulla
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-lg border border-emerald-400 transition-colors h-full cursor-pointer"
                  >
                    {isSaving ? "⏳ Salvataggio…" : "💾 Salva"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-3 rounded-lg border border-amber-400 transition-colors h-full cursor-pointer"
                >
                  ✏️ Modifica
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Sidebar (only in edit mode) ── */}
            {isEditing && (
              <aside className="w-60 bg-neutral-900 border-r border-neutral-700 flex flex-col p-2 gap-1 shrink-0 overflow-y-auto">
                <p className="text-neutral-500 text-xs tracking-widest uppercase px-1 pt-1 pb-0.5">
                  Strumenti
                </p>
                {modeButtons.map(({ key, label, icon, color }) => {
                  const isActive = mode === key;
                  const buttonClass = isActive
                    ? `${color} text-white border-white/20 shadow-lg`
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border-neutral-700";
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setMode(key);
                        setSelId(null);
                        if (key !== "merge") setMergeAnchor(null);
                        if (key !== "wall" && curWall) finishWall();
                      }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-all border ${buttonClass}`}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}

                {/* Merge state */}
                {mode === "merge" && mergeAnchor && (
                  <div className="bg-purple-900/60 border border-purple-500 rounded-md px-2 py-2 text-xs">
                    <div className="text-purple-300 font-bold mb-1">
                      🔗 In corso…
                    </div>
                    <div className="text-purple-400 text-xs mb-2">
                      Clicca tavoli da aggiungere
                    </div>
                    <button
                      onClick={() => setMergeAnchor(null)}
                      className="w-full text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded py-1 transition-colors"
                    >
                      ✕ Fine unione
                    </button>
                  </div>
                )}

                {/* Shape */}
                <div className="mt-2 pt-2 border-t border-neutral-700">
                  <p className="text-neutral-500 text-xs tracking-widest uppercase px-1 pb-1.5">
                    Forma tavoli
                  </p>
                  <div className="flex gap-1">
                    {(
                      [
                        [TableShape.Round, "⭕", "Rotondo"],
                        [TableShape.Rect, "▬", "Rettang."],
                      ] as const
                    ).map(([s, ic, lb]) => (
                      <button
                        key={s}
                        onClick={() => setShape(s)}
                        className={`flex-1 py-1.5 rounded text-xs font-medium flex flex-col items-center gap-0.5 border transition-all
                      ${shape === s ? "bg-sky-600 text-white border-sky-400" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border-neutral-700"}`}
                      >
                        <span>{ic}</span>
                        <span>{lb}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wall controls */}
                {mode === "wall" && (
                  <div className="pt-2 border-t border-neutral-700 space-y-1">
                    <p className="text-neutral-500 text-xs px-1">
                      {curWall
                        ? `📍 ${curWall.length} punto/i`
                        : "Clicca per iniziare"}
                    </p>
                    {curWall && curWall.length >= 2 && (
                      <button
                        onClick={finishWall}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-md border border-orange-400 transition-colors"
                      >
                        ✓ Termina muro
                      </button>
                    )}
                    {curWall && (
                      <button
                        onClick={() => setCurWall(null)}
                        className="w-full bg-neutral-700 text-neutral-300 text-xs py-1.5 rounded-md transition-colors hover:bg-neutral-600"
                      >
                        ✕ Annulla
                      </button>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-auto pt-2 border-t border-neutral-700">
                  <p className="text-neutral-500 text-xs tracking-widest uppercase px-1 pb-1">
                    Legenda
                  </p>
                  {[
                    { cls: "bg-emerald-500", label: "Libero" },
                    { cls: "bg-rose-500", label: "Prenotato" },
                    { cls: "bg-amber-400", label: "Sedia" },
                    { cls: "bg-purple-500", label: "Uniti" },
                    {
                      cls: "bg-amber-900 border border-amber-700",
                      label: "Muro",
                    },
                  ].map(({ cls, label }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-1 py-0.5 text-xs text-neutral-400"
                    >
                      <span className={`w-3 h-3 rounded-sm ${cls} shrink-0`} />
                      {label}
                    </div>
                  ))}
                </div>
              </aside>
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
                    } = getTableStyle(table);

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
                          {table.size === 4 ? "T·4" : "T·8"}
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
                <div className="shrink-0 bg-neutral-900 border-t border-neutral-700 px-5 py-3 flex items-center gap-4 w-full">
                  <div className="min-w-40 shrink-0">
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      {selTable.groupId
                        ? `Gruppo (${selGroup.length} tavoli)`
                        : `Tavolo da ${selTable.size}`}
                      {selReserved && (
                        <span className="text-xs bg-rose-700 text-rose-200 px-1.5 py-0.5 rounded">
                          Prenotato
                        </span>
                      )}
                    </div>
                    <div className="text-neutral-400 text-xs mt-0.5">
                      {selTable.shape === TableShape.Round
                        ? "Rotondo"
                        : selTable.size === 4
                          ? "Quadrato"
                          : "Rettangolare"}
                      {selReserved && (
                        <span className="text-neutral-300 font-bold ml-1">
                          · {selName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Seat controls — always available when selected */}
                  <div className="flex gap-2 flex-1 overflow-x-auto py-0.5">
                    {selGroup.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-3 py-1.5 border border-neutral-700 shrink-0"
                      >
                        <span className="text-neutral-400 text-xs font-mono">
                          {t.size === 4 ? "T4" : "T8"}
                        </span>
                        <button
                          onClick={() => editChairs(t.id, -1)}
                          className="w-6 h-6 rounded bg-neutral-700 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
                        >
                          −
                        </button>
                        <span className="text-white font-bold tabular-nums w-5 text-center text-sm">
                          {t.chairs.length}
                        </span>
                        <button
                          onClick={() => editChairs(t.id, 1)}
                          className="w-6 h-6 rounded bg-neutral-700 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
                        >
                          +
                        </button>
                        <span className="text-neutral-500 text-xs">posti</span>
                      </div>
                    ))}
                  </div>

                  {selGroup.length > 1 && (
                    <div className="text-xs text-neutral-400 font-mono shrink-0">
                      Totale:{" "}
                      <span className="text-white font-bold">{selSeats}</span>{" "}
                      posti
                    </div>
                  )}

                  <div className="flex gap-2 shrink-0">
                    {selReserved ? (
                      <button
                        onClick={() => cancelBooking(selId!)}
                        className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg border border-rose-500 transition-colors"
                      >
                        Cancella prenotazione
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setModal({ open: true, tableId: selId! });
                          setGuest("");
                        }}
                        className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg border border-emerald-500 transition-colors"
                      >
                        Prenota
                      </button>
                    )}
                    <button
                      onClick={() => setSelId(null)}
                      className="px-3 py-2 rounded-lg border border-neutral-600 text-xs text-neutral-400 hover:bg-neutral-800 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Booking modal ── */}
          {modal.open && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-neutral-900 rounded-2xl shadow-2xl p-7 w-96 border border-neutral-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center text-xl border border-emerald-700">
                    📋
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Nuova Prenotazione
                    </h2>
                    {(() => {
                      const t = tables.find((tt) => tt.id === modal.tableId);
                      const grp = t?.groupId
                        ? getGroup(t.groupId)
                        : t
                          ? [t]
                          : [];
                      const seats = grp.reduce(
                        (s, tt) => s + tt.chairs.length,
                        0,
                      );
                      return (
                        <p className="text-xs text-neutral-500 font-mono">
                          {grp.length > 1
                            ? `Gruppo di ${grp.length} tavoli · `
                            : ""}
                          {seats} posti
                        </p>
                      );
                    })()}
                  </div>
                </div>
                <label
                  htmlFor="guest-input"
                  className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2"
                >
                  Nome cliente
                </label>
                <input
                  id="guest-input"
                  type="text"
                  value={guest}
                  onChange={(e) => setGuest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmBooking()}
                  placeholder="Es. Mario Rossi"
                  autoFocus
                  className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-5 font-mono"
                />
                <div className="flex gap-3">
                  <button
                    onClick={confirmBooking}
                    disabled={!guest.trim()}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition-colors border border-emerald-600 disabled:border-neutral-600"
                  >
                    Conferma
                  </button>
                  <button
                    onClick={() => setModal({ open: false, tableId: "" })}
                    className="px-5 py-2.5 rounded-lg border border-neutral-600 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
