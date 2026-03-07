import {
  TableShape,
  PLAN_WALL_HALF,
  PLAN_CHAIR_DIST,
  PLAN_CHAIR_R,
  PLAN_RECT_W,
  PLAN_RECT_H,
  type TableSizeConst,
  type TableShapeConst,
} from "../constant/floorPlan";
import type { CoordinateType, TableData, WallData } from "../types/floorPlan";
import { closestPointOnSeg, segsIntersect } from "./geometry";

/** Verifica se un singolo segmento di muro (AB) collide con un tavolo nella posizione data.
 *  Per i tavoli rotondi usa la distanza dal punto più vicino sul segmento.
 *  Per i rettangolari controlla se gli endpoint del segmento finiscono dentro il bounding box
 *  o se il segmento interseca uno dei 4 lati del rettangolo. */
function checkSegmentCollision(
  pos: CoordinateType,
  segA: CoordinateType,
  segB: CoordinateType,
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
