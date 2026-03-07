import type { CoordinateType } from "../../types/floorPlan";

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
  a: CoordinateType,
  b: CoordinateType,
  c: CoordinateType,
  d: CoordinateType,
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
