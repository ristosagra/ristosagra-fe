import {
  PLAN_ALL_SIDES,
  PLAN_CHAIR_DIST,
  PLAN_CHAIR_R,
  PLAN_OPP,
  PLAN_RECT_H,
  PLAN_RECT_W,
  PLAN_WALL_HALF,
  Side,
  TableShape,
  type SideConst,
  type TableShapeConst,
  type TableSizeConst,
} from "../constant/floorPlan";
import type { TableData, WallData } from "../types/floorPlan";

/** Restituisce il numero massimo di sedie posizionabili su un lato del tavolo.
 *  I tavoli da 4 accettano 1 sedia per lato, quelli da 8 ne accettano 3 su top/bottom e 1 su left/right. */
export function maxPerSide(side: SideConst, size: TableSizeConst) {
  if (size === 4) return 1;
  return side === "top" || side === "bottom" ? 3 : 1;
}

/** Calcola le posizioni (offset) lungo un lato per distribuire n sedie in modo uniforme e simmetrico. */
export function offsetsForCount(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [-0.5, 0.5];
  if (n === 3) return [-0.55, 0, 0.55];
  return Array.from({ length: n }, (_, i) => -0.6 + (1.2 * i) / (n - 1));
}

/** Sostituisce tutte le sedie di un lato specifico con un nuovo set di n sedie distribuite uniformemente. */
export function setSideChairs(
  chairs: TableData["chairs"],
  side: SideConst,
  count: number,
): TableData["chairs"] {
  return [
    ...chairs.filter((c) => c.side !== side),
    ...offsetsForCount(count).map((o) => ({ side, offset: o })),
  ];
}

/** Quando un lato viene bloccato (es. tavolo unito), redistribuisce le sedie di quel lato
 *  sugli altri lati liberi, partendo dal lato opposto, rispettando i limiti di capienza. */
export function redistributeOnBlock(
  chairs: TableData["chairs"],
  blocked: SideConst,
  allBlocked: SideConst[],
  size: TableSizeConst,
): TableData["chairs"] {
  const count = chairs.filter((c) => c.side === blocked).length;
  let result = chairs.filter((c) => c.side !== blocked);
  let toAdd = count;
  const order = [
    PLAN_OPP[blocked],
    ...PLAN_ALL_SIDES.filter((s) => s !== blocked && s !== PLAN_OPP[blocked]),
  ].filter((s) => !allBlocked.includes(s));
  for (const s of order) {
    if (toAdd <= 0) break;
    const cur = result.filter((c) => c.side === s).length;
    const add = Math.min(maxPerSide(s, size) - cur, toAdd);
    if (add > 0) {
      result = setSideChairs(result, s, cur + add);
      toAdd -= add;
    }
  }
  return result;
}

/** Genera la configurazione iniziale di sedie per un tavolo appena creato.
 *  I tavoli rotondi distribuiscono le sedie in cerchio, quelli rettangolari sui 4 lati. */
export function defaultChairs(
  size: TableSizeConst,
  shape: TableShapeConst,
): TableData["chairs"] {
  if (shape === "round")
    return Array.from({ length: size }, (_, i) => ({
      side: "round" as const,
      offset: (360 / size) * i,
    }));
  if (size === 4) return PLAN_ALL_SIDES.map((side) => ({ side, offset: 0 }));
  return [
    ...[-0.55, 0, 0.55].map((o) => ({ side: Side.Top, offset: o })),
    ...[-0.55, 0, 0.55].map((o) => ({ side: Side.Bottom, offset: o })),
    { side: Side.Left, offset: 0 },
    { side: Side.Right, offset: 0 },
  ];
}

/** Calcola la posizione x,y di una sedia rispetto al centro del tavolo.
 *  Per i tavoli rotondi usa la trigonometria, per i rettangolari usa offset rispetto ai bordi. */
export function chairPos(
  c: TableData["chairs"][0],
  shape: TableShapeConst,
  size: TableSizeConst,
): { x: number; y: number } {
  const g = 16;
  if (shape === "round" || c.side === "round") {
    const r = (c.offset * Math.PI) / 180;
    return {
      x: Math.cos(r) * PLAN_CHAIR_DIST[size],
      y: Math.sin(r) * PLAN_CHAIR_DIST[size],
    };
  }
  const hw = PLAN_RECT_W[size] / 2,
    hh = PLAN_RECT_H[size] / 2;
  switch (c.side) {
    case "top":
      return { x: c.offset * (hw * 0.85), y: -(hh + g) };
    case "bottom":
      return { x: c.offset * (hw * 0.85), y: hh + g };
    case "left":
      return { x: -(hw + g), y: c.offset * (hh * 0.7) };
    case "right":
      return { x: hw + g, y: c.offset * (hh * 0.7) };
  }
}

/** Trova il lato con più capacità libera su cui aggiungere una sedia.
 *  Ignora i lati bloccati dall'unione con altri tavoli. */
function findBestSideForChair(t: TableData): SideConst | null {
  const free = PLAN_ALL_SIDES.filter((s) => !t.blockedSides.includes(s));
  let bestSide: SideConst | null = null;
  let bestCap = 0;
  for (const s of free) {
    const cap =
      maxPerSide(s, t.size) - t.chairs.filter((c) => c.side === s).length;
    if (cap > bestCap) {
      bestCap = cap;
      bestSide = s;
    }
  }
  return bestSide;
}

/** Aggiunge una sedia a un tavolo rotondo, posizionandola nell'arco angolare più ampio
 *  tra le sedie esistenti per mantenerle distribuite uniformemente. */
function addRoundChair(t: TableData): TableData {
  const angles = t.chairs.map((c) => c.offset).sort((a, b) => a - b);
  let best = 0;
  let maxG = 0;
  if (angles.length > 0) {
    for (let i = 0; i < angles.length; i++) {
      const nxt = i === angles.length - 1 ? angles[0] + 360 : angles[i + 1];
      const g = nxt - angles[i];
      if (g > maxG) {
        maxG = g;
        best = angles[i] + g / 2;
      }
    }
    if (best >= 360) best -= 360;
  }
  return {
    ...t,
    chairs: [...t.chairs, { side: "round" as const, offset: best }],
  };
}

/** Aggiunge una sedia al tavolo: delega ad addRoundChair se rotondo,
 *  altrimenti trova il lato con più spazio disponibile e aggiunge lì. */
export function addChair(t: TableData): TableData {
  if (t.shape === "round") {
    return addRoundChair(t);
  }
  const bestSide = findBestSideForChair(t);
  if (!bestSide) return t;
  const cur = t.chairs.filter((c) => c.side === bestSide).length;
  return { ...t, chairs: setSideChairs(t.chairs, bestSide, cur + 1) };
}

/** Rimuove una sedia dal tavolo: per i rotondi toglie l'ultima,
 *  per i rettangolari rimuove dal lato con più sedie. */
export function removeChair(t: TableData): TableData {
  if (t.chairs.length === 0) return t;
  if (t.shape === "round") return { ...t, chairs: t.chairs.slice(0, -1) };
  const free = PLAN_ALL_SIDES.filter((s) => !t.blockedSides.includes(s));
  let maxSide: SideConst | null = null,
    maxN = 0;
  for (const s of free) {
    const n = t.chairs.filter((c) => c.side === s).length;
    if (n > maxN) {
      maxN = n;
      maxSide = s;
    }
  }
  if (!maxSide || maxN === 0) return { ...t, chairs: t.chairs.slice(0, -1) };
  return { ...t, chairs: setSideChairs(t.chairs, maxSide, maxN - 1) };
}

/** Aggancia (snap) un tavolo in ingresso al lato più vicino di un tavolo nel gruppo.
 *  Aggiorna i blockedSides e redistribuisce le sedie su entrambi i tavoli coinvolti.
 *  Funziona solo con tavoli rettangolari. Ritorna null se non è possibile fare snap. */
export function snapIncoming(
  incoming: TableData,
  group: TableData[],
): { snapped: TableData; updatedGroup: TableData[] } | null {
  if (incoming.shape !== "rect") return null;
  let bestDist = Infinity;
  let bestResult: ReturnType<typeof snapIncoming> = null;

  for (const target of group) {
    if (target.shape !== "rect") continue;
    const hw1 = PLAN_RECT_W[target.size] / 2,
      hh1 = PLAN_RECT_H[target.size] / 2;
    const hw2 = PLAN_RECT_W[incoming.size] / 2,
      hh2 = PLAN_RECT_H[incoming.size] / 2;

    const candidates = [
      {
        s1: Side.Right,
        s2: Side.Left,
        nx: target.x + hw1 + hw2,
        ny: target.y,
      },
      {
        s1: Side.Left,
        s2: Side.Right,
        nx: target.x - hw1 - hw2,
        ny: target.y,
      },
      {
        s1: Side.Bottom,
        s2: Side.Top,
        nx: target.x,
        ny: target.y + hh1 + hh2,
      },
      {
        s1: Side.Top,
        s2: Side.Bottom,
        nx: target.x,
        ny: target.y - hh1 - hh2,
      },
    ];

    for (const { s1, s2, nx, ny } of candidates) {
      if (target.blockedSides.includes(s1)) continue;
      const dist = Math.hypot(incoming.x - nx, incoming.y - ny);
      if (dist < bestDist) {
        bestDist = dist;
        const b1 = [...new Set([...target.blockedSides, s1])];
        const b2 = [...new Set([...incoming.blockedSides, s2])];
        bestResult = {
          snapped: {
            ...incoming,
            x: nx,
            y: ny,
            blockedSides: b2,
            chairs: redistributeOnBlock(incoming.chairs, s2, b2, incoming.size),
          },
          updatedGroup: group.map((t) =>
            t.id === target.id
              ? {
                  ...t,
                  blockedSides: b1,
                  chairs: redistributeOnBlock(t.chairs, s1, b1, t.size),
                }
              : t,
          ),
        };
      }
    }
  }
  return bestResult;
}

/** Calcola il segmento di bordo condiviso tra due tavoli rettangolari adiacenti.
 *  Usato per disegnare la linea viola di connessione tra tavoli uniti. Ritorna null se non si toccano. */
export function sharedEdge(t1: TableData, t2: TableData) {
  if (t1.shape !== "rect" || t2.shape !== "rect") return null;
  const hw1 = PLAN_RECT_W[t1.size] / 2,
    hh1 = PLAN_RECT_H[t1.size] / 2;
  const hw2 = PLAN_RECT_W[t2.size] / 2,
    hh2 = PLAN_RECT_H[t2.size] / 2;
  const T = 4;
  const chkV = (
    ax: number,
    bx: number,
    ay: number,
    ah: number,
    by: number,
    bh: number,
  ) => {
    if (Math.abs(ax - bx) > T) return null;
    const t = Math.max(ay - ah, by - bh),
      b = Math.min(ay + ah, by + bh);
    return b > t ? { x1: ax, y1: t, x2: ax, y2: b } : null;
  };
  const chkH = (
    ay: number,
    by: number,
    ax: number,
    aw: number,
    bx: number,
    bw: number,
  ) => {
    if (Math.abs(ay - by) > T) return null;
    const l = Math.max(ax - aw, bx - bw),
      r = Math.min(ax + aw, bx + bw);
    return r > l ? { x1: l, y1: ay, x2: r, y2: ay } : null;
  };
  return (
    chkV(t1.x + hw1, t2.x - hw2, t1.y, hh1, t2.y, hh2) ||
    chkV(t1.x - hw1, t2.x + hw2, t1.y, hh1, t2.y, hh2) ||
    chkH(t1.y + hh1, t2.y - hh2, t1.x, hw1, t2.x, hw2) ||
    chkH(t1.y - hh1, t2.y + hh2, t1.x, hw1, t2.x, hw2)
  );
}

/** Trova il punto più vicino su un segmento AB rispetto al punto P.
 *  Usato per il calcolo della collisione tra tavoli rotondi e muri. */
export function closestPointOnSeg(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { x: ax, y: ay };
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return { x: ax + t * dx, y: ay + t * dy };
}

/** Verifica se due segmenti AB e CD si intersecano.
 *  Usato per rilevare la collisione tra tavoli rettangolari e i segmenti dei muri. */
export function segsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
) {
  const d1x = b.x - a.x,
    d1y = b.y - a.y;
  const d2x = d.x - c.x,
    d2y = d.y - c.y;
  const cross = d1x * d2y - d1y * d2x;
  if (cross === 0) return false;
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / cross;
  const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Verifica se un singolo segmento di muro (AB) collide con un tavolo nella posizione data.
 *  Per i tavoli rotondi usa la distanza dal punto più vicino sul segmento.
 *  Per i rettangolari controlla se gli endpoint del segmento finiscono dentro il bounding box
 *  o se il segmento interseca uno dei 4 lati del rettangolo. */
function checkSegmentCollision(
  pos: { x: number; y: number },
  segA: { x: number; y: number },
  segB: { x: number; y: number },
  sh: TableShapeConst,
  sz: TableSizeConst,
  helpers: {
    circR: (size: TableSizeConst) => number;
    rectHW: (size: TableSizeConst) => number;
    rectHH: (size: TableSizeConst) => number;
  },
) {
  if (sh === TableShape.Round) {
    const cp = closestPointOnSeg(pos.x, pos.y, segA.x, segA.y, segB.x, segB.y);
    return (
      Math.hypot(pos.x - cp.x, pos.y - cp.y) <
      helpers.circR(sz) + PLAN_WALL_HALF
    );
  }

  const hw = helpers.rectHW(sz),
    hh = helpers.rectHH(sz);
  const left = pos.x - hw - PLAN_WALL_HALF,
    right = pos.x + hw + PLAN_WALL_HALF;
  const top = pos.y - hh - PLAN_WALL_HALF,
    bottom = pos.y + hh + PLAN_WALL_HALF;

  if (segA.x >= left && segA.x <= right && segA.y >= top && segA.y <= bottom)
    return true;
  if (segB.x >= left && segB.x <= right && segB.y >= top && segB.y <= bottom)
    return true;

  return (
    segsIntersect(
      { x: segA.x, y: segA.y },
      { x: segB.x, y: segB.y },
      { x: left, y: top },
      { x: right, y: top },
    ) ||
    segsIntersect(
      { x: segA.x, y: segA.y },
      { x: segB.x, y: segB.y },
      { x: right, y: top },
      { x: right, y: bottom },
    ) ||
    segsIntersect(
      { x: segA.x, y: segA.y },
      { x: segB.x, y: segB.y },
      { x: right, y: bottom },
      { x: left, y: bottom },
    ) ||
    segsIntersect(
      { x: segA.x, y: segA.y },
      { x: segB.x, y: segB.y },
      { x: left, y: bottom },
      { x: left, y: top },
    )
  );
}

/** Itera su tutti i segmenti di tutti i muri e verifica se uno di essi collide
 *  con un tavolo nella posizione data. Delega il controllo a checkSegmentCollision
 *  per ogni coppia di punti consecutivi del muro. */
function checkWallCollision(
  x: number,
  y: number,
  sz: TableSizeConst,
  sh: TableShapeConst,
  walls: WallData[],
  helpers: {
    circR: (size: TableSizeConst) => number;
    rectHW: (size: TableSizeConst) => number;
    rectHH: (size: TableSizeConst) => number;
  },
) {
  return walls.some((wl) => {
    for (let i = 0; i < wl.points.length - 1; i++) {
      const { x: ax, y: ay } = wl.points[i];
      const { x: bx, y: by } = wl.points[i + 1];
      if (
        checkSegmentCollision(
          { x, y },
          { x: ax, y: ay },
          { x: bx, y: by },
          sh,
          sz,
          helpers,
        )
      )
        return true;
    }
    return false;
  });
}

/** Punto di ingresso principale per il rilevamento delle collisioni.
 *  Calcola i bounding volume effettivi (sedie incluse) e verifica in sequenza:
 *  1. Tavolo vs tutti gli altri tavoli (cerchio/cerchio, rect/rect, misto)
 *  2. Tavolo vs tutti i segmenti dei muri
 *  Accetta excludeIds per ignorare i tavoli del gruppo che si sta spostando. */
export function hasCollision(
  x: number,
  y: number,
  sz: TableSizeConst,
  sh: TableShapeConst,
  tables: TableData[],
  walls: WallData[],
  excludeIds: string[] = [],
) {
  const g = 16;
  const circR = (size: TableSizeConst) => PLAN_CHAIR_DIST[size] + PLAN_CHAIR_R;
  const rectHW = (size: TableSizeConst) =>
    PLAN_RECT_W[size] / 2 + g + PLAN_CHAIR_R;
  const rectHH = (size: TableSizeConst) =>
    PLAN_RECT_H[size] / 2 + g + PLAN_CHAIR_R;

  // ── Tavolo vs Tavolo ──────────────────────────────────────────────────
  const tableHit = tables.some((t) => {
    if (excludeIds.includes(t.id)) return false;

    if (sh === TableShape.Round && t.shape === TableShape.Round)
      return Math.hypot(x - t.x, y - t.y) < circR(sz) + circR(t.size);

    if (sh === "rect" && t.shape === "rect") {
      const hw1 = rectHW(sz),
        hh1 = rectHH(sz);
      const hw2 = rectHW(t.size),
        hh2 = rectHH(t.size);
      return !(
        x + hw1 <= t.x - hw2 ||
        x - hw1 >= t.x + hw2 ||
        y + hh1 <= t.y - hh2 ||
        y - hh1 >= t.y + hh2
      );
    }

    const [circ, rect] =
      sh === TableShape.Round
        ? [
            { cx: x, cy: y, r: circR(sz) },
            { rx: t.x, ry: t.y, hw: rectHW(t.size), hh: rectHH(t.size) },
          ]
        : [
            { cx: t.x, cy: t.y, r: circR(t.size) },
            { rx: x, ry: y, hw: rectHW(sz), hh: rectHH(sz) },
          ];
    const nx = Math.max(
      rect.rx - rect.hw,
      Math.min(circ.cx, rect.rx + rect.hw),
    );
    const ny = Math.max(
      rect.ry - rect.hh,
      Math.min(circ.cy, rect.ry + rect.hh),
    );
    return Math.hypot(circ.cx - nx, circ.cy - ny) < circ.r;
  });

  if (tableHit) return true;

  // ── Tavolo vs Muri ────────────────────────────────────────────────────
  return checkWallCollision(x, y, sz, sh, walls, { circR, rectHW, rectHH });
}
