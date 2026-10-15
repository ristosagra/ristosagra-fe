import { PLAN_ZOOM_MAX, PLAN_ZOOM_MIN } from "../constant/floorPlan";
import type { CoordinateType, TableData, WallData } from "../types/floorPlan";
import { bodyHalfExtents } from "./dimensions";

//Spazio attorno al piano del tavolo occupato dalle sedie
const CHAIRS_MARGIN = 36;

/** Zoom limitato tra il minimo e il massimo consentiti. */
export const clampZoom = (z: number) =>
  Math.min(PLAN_ZOOM_MAX, Math.max(PLAN_ZOOM_MIN, z));

/** Vero sugli schermi stretti (cellulare), dove i pannelli coprono la piantina. */
export const isSmallScreen = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 639px)").matches;

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

/** Zoom e spostamento che fanno stare tutta la piantina (tavoli e muri) nello schermo,
 *  senza ingrandire oltre il 100%. Null se la piantina è vuota. */
export function fitView(
  tables: TableData[],
  walls: WallData[],
  svg: SVGSVGElement | null,
  padding = 24,
): { zoom: number; pan: CoordinateType } | null {
  if (!svg) return null;
  const points: CoordinateType[] = walls.flatMap((w) => w.points);
  for (const t of tables) {
    const { hw, hh } = bodyHalfExtents(t);
    points.push(
      { x: t.x - hw - CHAIRS_MARGIN, y: t.y - hh - CHAIRS_MARGIN },
      { x: t.x + hw + CHAIRS_MARGIN, y: t.y + hh + CHAIRS_MARGIN },
    );
  }
  const r = svg.getBoundingClientRect();
  if (points.length === 0 || r.width === 0 || r.height === 0) return null;
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const zoom = clampZoom(
    Math.min(
      1,
      (r.width - 2 * padding) / Math.max(1, maxX - minX),
      (r.height - 2 * padding) / Math.max(1, maxY - minY),
    ),
  );
  return {
    zoom,
    pan: {
      x: r.width / 2 - ((minX + maxX) / 2) * zoom,
      y: r.height / 2 - ((minY + maxY) / 2) * zoom,
    },
  };
}
