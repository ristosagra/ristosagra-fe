export const TableSize = {
  Small: 4,
  Large: 8,
} as const;
export type TableSizeConst = (typeof TableSize)[keyof typeof TableSize];

export const TableShape = {
  Round: "round",
  Rect: "rect",
} as const;
export type TableShapeConst = (typeof TableShape)[keyof typeof TableShape];

export const Side = {
  Top: "top",
  Right: "right",
  Bottom: "bottom",
  Left: "left",
} as const;
export type SideConst = (typeof Side)[keyof typeof Side];

export const PLAN_TABLE_R: Record<TableSizeConst, number> = {
  [TableSize.Small]: 36,
  [TableSize.Large]: 52,
};
export const PLAN_CHAIR_DIST: Record<TableSizeConst, number> = {
  [TableSize.Small]: 56,
  8: 74,
};
export const PLAN_RECT_W: Record<TableSizeConst, number> = {
  [TableSize.Small]: 72,
  [TableSize.Large]: 170,
};
export const PLAN_RECT_H: Record<TableSizeConst, number> = {
  [TableSize.Small]: 72,
  [TableSize.Large]: 68,
};
export const PLAN_ALL_SIDES: SideConst[] = [
  Side.Top,
  Side.Right,
  Side.Bottom,
  Side.Left,
];
export const PLAN_OPP: Record<SideConst, SideConst> = {
  [Side.Top]: "bottom",
  [Side.Bottom]: "top",
  [Side.Left]: "right",
  [Side.Right]: "left",
};
export const PLAN_CHAIR_R = 11;
export const PLAN_WALL_HALF = 8;
