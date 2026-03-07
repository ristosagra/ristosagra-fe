import type {
  SideConst,
  TableShapeConst,
  TableSizeConst,
} from "../features/floorPlan/constant/floorPlan";

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
  points: CoordinateType[];
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
  startMouse: CoordinateType;
  startPositions: Record<string, CoordinateType>;
}

export type ModeBtn = {
  key: PlanMode;
  label: string;
  icon: string;
  color: string;
};

export type WallType = CoordinateType[] | null;

export type SnapshotType = {
  tables: TableData[];
  walls: WallData[];
} | null;

export type CoordinateType = {
  x: number;
  y: number;
};

export type DraggingType = {
  id: string;
  ox: number;
  oy: number;
} | null;

export type PanStartType = {
  mx: number;
  my: number;
  px: number;
  py: number;
} | null;

export type WallDragType = {
  wallId: string;
  pi: number;
} | null;
