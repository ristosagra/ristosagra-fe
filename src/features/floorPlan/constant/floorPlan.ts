//Posti proposti di default quando si aggiunge un tavolo
export const PLAN_DEFAULT_SEATS = 4;

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

//Quanti capotavola (testate) sono compresi nei posti di un tavolo rettangolare
export const Heads = {
  None: 0,
  One: 1,
  Both: 2,
} as const;
export type HeadsConst = (typeof Heads)[keyof typeof Heads];

//Rotazione del tavolo, a scatti di 90° in senso orario
export type RotationConst = 0 | 90 | 180 | 270;

export const TableStatus = {
  Free: "free",
  Partial: "partial",
  Full: "full",
} as const;
export type TableStatusConst = (typeof TableStatus)[keyof typeof TableStatus];

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

//Numero minimo di posti per tavolo (non c'è un massimo)
export const PLAN_MIN_SEATS = 2;

//Distanza tra due sedie consecutive sui lati lunghi dei tavoli rettangolari
export const PLAN_SEAT_SPACING = 50;

//Colori dei posti: liberi e prenotati (un colore per ogni prenotazione dello stesso tavolo)
export const PLAN_FREE_CHAIR = { fill: "#262626", stroke: "#a3a3a3" };
export const PLAN_BOOKING_COLORS = [
  "#38bdf8",
  "#f472b6",
  "#facc15",
  "#a3e635",
  "#818cf8",
  "#2dd4bf",
  "#fb923c",
  "#e879f9",
];
