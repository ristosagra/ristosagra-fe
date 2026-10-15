import { TableShape } from "../constant/floorPlan";
import type { CoordinateType, TableData } from "../types/floorPlan";
import { bodyHalfExtents } from "./dimensions";

type Rect = { x1: number; y1: number; x2: number; y2: number };

/** Raggruppa coordinate che distano meno di `tol` (es. tavoli alti 68 e 72 affiancati)
 *  e restituisce una funzione che mappa ogni valore al rappresentante del suo cluster. */
function clusterValues(values: number[], tol = 3) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const reps = new Map<number, number>();
  let rep = sorted[0];
  for (const v of sorted) {
    if (v - rep > tol) rep = v;
    reps.set(v, rep);
  }
  return (v: number) => reps.get(v)!;
}

/** Rimuove i vertici intermedi allineati (stessa x o stessa y dei vicini). */
function simplify(loop: CoordinateType[]) {
  return loop.filter((p, i) => {
    const prev = loop[(i - 1 + loop.length) % loop.length];
    const next = loop[(i + 1) % loop.length];
    return !(
      (prev.x === p.x && p.x === next.x) ||
      (prev.y === p.y && p.y === next.y)
    );
  });
}

/** Converte un poligono in un path SVG con gli angoli arrotondati. */
function roundedPath(loop: CoordinateType[], radius: number) {
  const n = loop.length;
  const corners = loop.map((v, i) => {
    const p = loop[(i - 1 + n) % n];
    const q = loop[(i + 1) % n];
    const lp = Math.hypot(p.x - v.x, p.y - v.y);
    const lq = Math.hypot(q.x - v.x, q.y - v.y);
    const r = Math.min(radius, lp / 2, lq / 2);
    return {
      v,
      a: { x: v.x + ((p.x - v.x) / lp) * r, y: v.y + ((p.y - v.y) / lp) * r },
      b: { x: v.x + ((q.x - v.x) / lq) * r, y: v.y + ((q.y - v.y) / lq) * r },
    };
  });
  return (
    corners
      .map(
        ({ v, a, b }, i) =>
          `${i === 0 ? "M" : "L"}${a.x},${a.y} Q${v.x},${v.y} ${b.x},${b.y}`,
      )
      .join(" ") + " Z"
  );
}

/** Calcola il contorno unico (unione) dei tavoli rettangolari di un gruppo, allargati di `pad`.
 *  Così la linea tratteggiata del gruppo gira attorno all'insieme dei tavoli
 *  invece di passare sopra ai tavoli vicini. Restituisce un path SVG (anche con più anelli). */
export function groupOutlinePath(tables: TableData[], pad = 8, radius = 14) {
  const raw: Rect[] = tables
    .filter((t) => t.shape === TableShape.Rect)
    .map((t) => {
      const ext = bodyHalfExtents(t);
      const hw = ext.hw + pad,
        hh = ext.hh + pad;
      return { x1: t.x - hw, y1: t.y - hh, x2: t.x + hw, y2: t.y + hh };
    });
  if (raw.length === 0) return "";

  const sx = clusterValues(raw.flatMap((r) => [r.x1, r.x2]));
  const sy = clusterValues(raw.flatMap((r) => [r.y1, r.y2]));
  const rects = raw.map((r) => ({
    x1: sx(r.x1),
    y1: sy(r.y1),
    x2: sx(r.x2),
    y2: sy(r.y2),
  }));
  const xs = [...new Set(rects.flatMap((r) => [r.x1, r.x2]))].sort(
    (a, b) => a - b,
  );
  const ys = [...new Set(rects.flatMap((r) => [r.y1, r.y2]))].sort(
    (a, b) => a - b,
  );

  // Griglia compressa: una cella è piena se è coperta da almeno un rettangolo
  const filled = (i: number, j: number) =>
    i >= 0 &&
    j >= 0 &&
    i < xs.length - 1 &&
    j < ys.length - 1 &&
    rects.some(
      (r) =>
        r.x1 <= xs[i] &&
        xs[i + 1] <= r.x2 &&
        r.y1 <= ys[j] &&
        ys[j + 1] <= r.y2,
    );

  // Lati di confine orientati in senso orario (l'interno resta sempre a destra)
  const edges = new Map<string, CoordinateType[]>();
  const addEdge = (a: CoordinateType, b: CoordinateType) => {
    const k = `${a.x},${a.y}`;
    if (!edges.has(k)) edges.set(k, []);
    edges.get(k)!.push(b);
  };
  for (let j = 0; j < ys.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      if (!filled(i, j)) continue;
      const tl = { x: xs[i], y: ys[j] },
        tr = { x: xs[i + 1], y: ys[j] },
        br = { x: xs[i + 1], y: ys[j + 1] },
        bl = { x: xs[i], y: ys[j + 1] };
      if (!filled(i, j - 1)) addEdge(tl, tr);
      if (!filled(i + 1, j)) addEdge(tr, br);
      if (!filled(i, j + 1)) addEdge(br, bl);
      if (!filled(i - 1, j)) addEdge(bl, tl);
    }

  // Concatena i lati in anelli chiusi
  const paths: string[] = [];
  for (const [startKey, outs] of edges) {
    while (outs.length > 0) {
      const [sxv, syv] = startKey.split(",").map(Number);
      const loop: CoordinateType[] = [{ x: sxv, y: syv }];
      let cur = outs.pop()!;
      while (`${cur.x},${cur.y}` !== startKey) {
        loop.push(cur);
        const next = edges.get(`${cur.x},${cur.y}`)?.pop();
        if (!next) break;
        cur = next;
      }
      const simple = simplify(loop);
      if (simple.length >= 3) paths.push(roundedPath(simple, radius));
    }
  }
  return paths.join(" ");
}
