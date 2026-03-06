import type {
  SideConst,
  TableShapeConst,
  TableSizeConst,
} from "../constant/floorPlan";

export interface Chair {
  side: SideConst | "round";
  offset: number;
}

export interface TableData {
  id: string;
  x: number;
  y: number;
  size: TableSizeConst;
  shape: TableShapeConst;
  reserved: boolean;
  reservedBy?: string;
  groupId?: string;
  blockedSides: SideConst[];
  chairs: Chair[];
}

export interface WallData {
  id: string;
  points: { x: number; y: number }[];
}

export interface FloorPlanData {
  id?: string;
  tables: TableData[];
  walls: WallData[];
  updatedAt?: string;
}

export type PlanMode =
  | "view"
  | "add4"
  | "add8"
  | "move"
  | "delete"
  | "pan"
  | "wall"
  | "merge";

export interface PlanGroupDrag {
  groupId: string;
  startMouse: { x: number; y: number };
  startPositions: Record<string, { x: number; y: number }>;
}

export type ModeBtn = {
  key: PlanMode;
  label: string;
  icon: string;
  color: string;
};
