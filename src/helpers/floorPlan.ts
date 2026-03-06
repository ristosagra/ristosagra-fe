import {
  PLAN_ALL_SIDES,
  PLAN_CHAIR_DIST,
  PLAN_OPP,
  PLAN_RECT_H,
  PLAN_RECT_W,
  Side,
  type SideConst,
  type TableShapeConst,
  type TableSizeConst,
} from "../constant/floorPlan";
import type { TableData } from "../types/floorPlan";

export function maxPerSide(side: SideConst, size: TableSizeConst) {
  if (size === 4) return 1;
  return side === "top" || side === "bottom" ? 3 : 1;
}

export function offsetsForCount(n: number): number[] {
  if (n <= 0) return [];
  if (n === 1) return [0];
  if (n === 2) return [-0.5, 0.5];
  if (n === 3) return [-0.55, 0, 0.55];
  return Array.from({ length: n }, (_, i) => -0.6 + (1.2 * i) / (n - 1));
}

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

export function addChair(t: TableData): TableData {
  if (t.shape === "round") {
    const angles = t.chairs.map((c) => c.offset).sort((a, b) => a - b);
    let best = 0,
      maxG = 0;
    if (angles.length === 0) best = 0;
    else {
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
  const free = PLAN_ALL_SIDES.filter((s) => !t.blockedSides.includes(s));
  let bestSide: SideConst | null = null,
    bestCap = 0;
  for (const s of free) {
    const cap =
      maxPerSide(s, t.size) - t.chairs.filter((c) => c.side === s).length;
    if (cap > bestCap) {
      bestCap = cap;
      bestSide = s;
    }
  }
  if (!bestSide) return t;
  const cur = t.chairs.filter((c) => c.side === bestSide).length;
  return { ...t, chairs: setSideChairs(t.chairs, bestSide, cur + 1) };
}

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

export function segsIntersect(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
) {
  const d1x = bx - ax,
    d1y = by - ay;
  const d2x = dx - cx,
    d2y = dy - cy;
  const cross = d1x * d2y - d1y * d2x;
  if (cross === 0) return false;
  const t = ((cx - ax) * d2y - (cy - ay) * d2x) / cross;
  const u = ((cx - ax) * d1y - (cy - ay) * d1x) / cross;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
