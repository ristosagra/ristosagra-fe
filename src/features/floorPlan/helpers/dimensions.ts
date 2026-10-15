import {
  PLAN_ALL_SIDES,
  PLAN_SEAT_SPACING,
  TableShape,
  type RotationConst,
  type SideConst,
} from "../constant/floorPlan";
import type { CoordinateType, TableGeom } from "../types/floorPlan";

/** Capotavola compresi nei posti. Se non scelti esplicitamente: nessuno con 2 posti,
 *  altrimenti 2 con posti pari e 1 con posti dispari. */
export function tableHeads(t: TableGeom) {
  if (t.shape === TableShape.Round) return 0;
  if (t.heads !== undefined) return Math.min(t.heads, t.size);
  if (t.size <= 2) return 0;
  return t.size % 2 === 0 ? 2 : 1;
}

/** Numero di colonne di sedie sui lati lunghi di un tavolo rettangolare:
 *  i posti che non sono capotavola si dividono tra lato superiore e inferiore. */
export function rectColumns(t: TableGeom) {
  return Math.max(1, Math.ceil((t.size - tableHeads(t)) / 2));
}

/** Larghezza (non ruotata) di un tavolo rettangolare: cresce di PLAN_SEAT_SPACING per ogni colonna. */
export function rectWidth(t: TableGeom) {
  const k = rectColumns(t);
  return k <= 1 ? 72 : PLAN_SEAT_SPACING * k + 20;
}

/** Altezza (non ruotata) di un tavolo rettangolare: quadrato con 1 colonna, poi leggermente più basso. */
export function rectHeight(t: TableGeom) {
  return rectColumns(t) <= 1 ? 72 : 68;
}

/** Raggio di un tavolo rotondo in base ai posti (4 → 36, 8 → 52). */
export function tableRadius(t: TableGeom) {
  return 20 + 4 * t.size;
}

/** Distanza delle sedie dal centro di un tavolo rotondo. */
export function chairDist(t: TableGeom) {
  return tableRadius(t) + 20;
}

/** Posizione orizzontale (rispetto al centro) della colonna i su k colonne. */
export function rectSlotX(i: number, k: number) {
  return (i - (k - 1) / 2) * PLAN_SEAT_SPACING;
}

/** Vero se il tavolo è ruotato di 90° o 270° (larghezza e altezza si scambiano). */
function isQuarterTurn(t: TableGeom) {
  return (t.rotation ?? 0) % 180 !== 0;
}

/** Semi-larghezza e semi-altezza del piano del tavolo nella piantina, tenendo conto della rotazione. */
export function bodyHalfExtents(t: TableGeom) {
  if (t.shape === TableShape.Round) {
    const r = tableRadius(t);
    return { hw: r, hh: r };
  }
  const hw = rectWidth(t) / 2,
    hh = rectHeight(t) / 2;
  return isQuarterTurn(t) ? { hw: hh, hh: hw } : { hw, hh };
}

/** Ruota un punto attorno al centro del tavolo (rotazione SVG, senso orario). */
export function rotatePoint(
  p: CoordinateType,
  rotation: RotationConst = 0,
): CoordinateType {
  switch (rotation) {
    case 90:
      return { x: -p.y, y: p.x };
    case 180:
      return { x: -p.x, y: -p.y };
    case 270:
      return { x: p.y, y: -p.x };
    default:
      return p;
  }
}

/** Converte un lato della piantina (es. "right") nel lato corrispondente del tavolo non ruotato. */
export function toLocalSide(side: SideConst, rotation: RotationConst = 0) {
  const i = PLAN_ALL_SIDES.indexOf(side);
  return PLAN_ALL_SIDES[(i - rotation / 90 + 4) % 4];
}
