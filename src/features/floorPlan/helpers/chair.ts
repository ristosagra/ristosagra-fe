import {
  PLAN_ALL_SIDES,
  PLAN_OPP,
  Side,
  TableShape,
  type SideConst,
} from "../constant/floorPlan";
import type { TableData, CoordinateType, TableGeom } from "../types/floorPlan";
import {
  chairDist,
  rectColumns,
  rectHeight,
  rectSlotX,
  rectWidth,
  rotatePoint,
  tableHeads,
} from "./dimensions";

/** Trova il lato con più capacità libera su cui aggiungere una sedia.
 *  Ignora i lati bloccati dall'unione con altri tavoli. */
function findBestSideForChair(t: TableData): SideConst | null {
  const free = PLAN_ALL_SIDES.filter((s) => !t.blockedSides.includes(s));
  let bestSide: SideConst | null = null;
  let bestCap = 0;
  for (const s of free) {
    const cap = maxPerSide(s, t) - t.chairs.filter((c) => c.side === s).length;
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
 *  Le testate (left/right) accettano 1 sedia, i lati lunghi tante quante le colonne del tavolo. */
export function maxPerSide(side: SideConst, t: TableGeom) {
  return side === Side.Top || side === Side.Bottom ? rectColumns(t) : 1;
}

/** Calcola le posizioni (offset) lungo un lato per distribuire n sedie in modo uniforme e simmetrico. */
export function offsetsForCount(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [-0.5, 0.5];
  if (n === 3) return [-0.55, 0, 0.55];
  return Array.from({ length: n }, (_, i) => -0.6 + (1.2 * i) / (n - 1));
}

/** Calcola gli offset di n sedie su un lato. Sui lati lunghi le sedie occupano le colonne
 *  del tavolo (centrate), così quelle sopra e sotto restano una di fronte all'altra. */
function sideOffsets(side: SideConst, count: number, t: TableGeom): number[] {
  if (count <= 0) return [];
  if (side === Side.Left || side === Side.Right) return offsetsForCount(count);
  const k = rectColumns(t);
  const start = Math.floor((k - count) / 2);
  const usable = (rectWidth(t) / 2) * 0.85;
  return Array.from(
    { length: count },
    (_, i) => rectSlotX(start + i, k) / usable,
  );
}

/** Sostituisce tutte le sedie di un lato specifico con un nuovo set di n sedie distribuite uniformemente. */
export function setSideChairs(
  chairs: TableData["chairs"],
  side: SideConst,
  count: number,
  t: TableGeom,
): TableData["chairs"] {
  return [
    ...chairs.filter((c) => c.side !== side),
    ...sideOffsets(side, count, t).map((o) => ({ side, offset: o })),
  ];
}

/** Quando un lato viene bloccato (es. tavolo unito), redistribuisce le sedie di quel lato
 *  sugli altri lati liberi, partendo dal lato opposto, rispettando i limiti di capienza. */
export function redistributeOnBlock(
  chairs: TableData["chairs"],
  blocked: SideConst,
  allBlocked: SideConst[],
  t: TableGeom,
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
    const add = Math.min(maxPerSide(s, t) - cur, toAdd);
    if (add > 0) {
      result = setSideChairs(result, s, cur + add, t);
      toAdd -= add;
    }
  }
  return result;
}

/** Genera la configurazione iniziale di sedie per un tavolo.
 *  I tavoli rotondi distribuiscono le sedie in cerchio; quelli rettangolari mettono i capotavola
 *  scelti sulle testate (sinistra, poi destra) e dividono gli altri posti tra lato superiore e inferiore. */
export function defaultChairs(t: TableGeom): TableData["chairs"] {
  if (t.shape === TableShape.Round)
    return Array.from({ length: t.size }, (_, i) => ({
      side: "round" as const,
      offset: (360 / t.size) * i,
    }));
  const heads = tableHeads(t);
  const rest = t.size - heads;
  const top = Math.ceil(rest / 2),
    bottom = Math.floor(rest / 2);
  return [
    ...sideOffsets(Side.Top, top, t).map((o) => ({
      side: Side.Top,
      offset: o,
    })),
    ...sideOffsets(Side.Bottom, bottom, t).map((o) => ({
      side: Side.Bottom,
      offset: o,
    })),
    ...(heads >= 1 ? [{ side: Side.Left, offset: 0 }] : []),
    ...(heads === 2 ? [{ side: Side.Right, offset: 0 }] : []),
  ];
}

/** Calcola la posizione x,y di una sedia rispetto al centro del tavolo non ruotato.
 *  Per i tavoli rotondi usa la trigonometria, per i rettangolari usa offset rispetto ai bordi. */
export function chairPos(
  c: TableData["chairs"][0],
  t: TableGeom,
): CoordinateType {
  const g = 16;
  if (t.shape === TableShape.Round || c.side === "round") {
    const r = (c.offset * Math.PI) / 180;
    return {
      x: Math.cos(r) * chairDist(t),
      y: Math.sin(r) * chairDist(t),
    };
  }
  const hw = rectWidth(t) / 2,
    hh = rectHeight(t) / 2;
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

/** Posizione di una sedia rispetto al centro del tavolo, tenendo conto della rotazione. */
export function worldChairPos(
  c: TableData["chairs"][0],
  t: TableGeom,
): CoordinateType {
  return rotatePoint(chairPos(c, t), t.rotation);
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
  return { ...t, chairs: setSideChairs(t.chairs, bestSide, cur + 1, t) };
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
  return { ...t, chairs: setSideChairs(t.chairs, maxSide, maxN - 1, t) };
}

/** Ridimensiona un tavolo al nuovo numero di posti, rigenerando le sedie:
 *  la grandezza del tavolo cresce o diminuisce di conseguenza. */
export function resizeTable(t: TableData, size: number): TableData {
  return { ...t, size, chairs: defaultChairs({ ...t, size }) };
}

/** Ruota il tavolo di 90° in senso orario. Le sedie (e le loro prenotazioni) restano le stesse. */
export function rotateTable(t: TableData): TableData {
  return {
    ...t,
    rotation: (((t.rotation ?? 0) + 90) % 360) as TableData["rotation"],
  };
}

/** Nome proposto per un nuovo tavolo: "T-" seguito dal primo numero libero. */
export function nextTableName(tables: TableData[]) {
  const nums = tables
    .map((t) => /^T-(\d+)$/.exec(t.name ?? "")?.[1])
    .filter((n): n is string => !!n)
    .map(Number);
  return `T-${(nums.length ? Math.max(...nums) : 0) + 1}`;
}

/** Etichetta del tavolo: il nome se presente, altrimenti i posti. */
export function tableLabel(t: TableData) {
  return t.name?.trim() || `T·${t.chairs.length}`;
}
