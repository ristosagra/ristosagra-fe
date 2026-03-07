import { PLAN_RECT_H, PLAN_RECT_W, Side } from "../constant/floorPlan";
import type { TableData } from "../types/floorPlan";
import { redistributeOnBlock } from "./chair";

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
