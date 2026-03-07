import {
  PLAN_ALL_SIDES,
  PLAN_OPP,
  Side,
  PLAN_CHAIR_DIST,
  PLAN_RECT_W,
  PLAN_RECT_H,
  type SideConst,
  type TableSizeConst,
  type TableShapeConst,
} from "../constant/floorPlan";
import type { TableData, CoordinateType } from "../../../types/floorPlan";

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
): CoordinateType {
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

/** Aggiunge una sedia al tavolo: delega ad addRoundChair se rotondo,
 *  altrimenti trova il lato con più spazio disponibile e aggiunge lì. */
export function addChair(t: TableData): TableData {
  if (t.shape === "round") {
    if (t.chairs.length >= 12) return t;
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
  if (t.chairs.length === 1) return t;
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
