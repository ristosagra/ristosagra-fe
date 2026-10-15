import type { CoordinateType, TableData } from "../types/floorPlan";

/** Spostamento della vista che porta al centro della piantina i tavoli indicati
 *  (un po' più in alto, per non finire sotto al footer). */
export function panToCenter(
  unit: TableData[],
  svg: SVGSVGElement | null,
  zoom: number,
): CoordinateType | null {
  if (!svg || unit.length === 0) return null;
  const r = svg.getBoundingClientRect();
  const cx = unit.reduce((s, t) => s + t.x, 0) / unit.length;
  const cy = unit.reduce((s, t) => s + t.y, 0) / unit.length;
  return { x: r.width / 2 - cx * zoom, y: r.height / 2 - 30 - cy * zoom };
}
