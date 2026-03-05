import { httpClient } from "../client/httpClient";

// ─── Types (shared) ──────────────────────────────────────────────────────────
export type TableSize = 4 | 8;
export type TableShape = "round" | "rect";
export type Side = "top" | "right" | "bottom" | "left";

export interface Chair {
  side: Side | "round";
  offset: number;
}
export interface TableData {
  id: string;
  x: number;
  y: number;
  size: TableSize;
  shape: TableShape;
  reserved: boolean;
  reservedBy?: string;
  groupId?: string;
  blockedSides: Side[];
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

// ─── Fake generator ───────────────────────────────────────────────────────────
function chair(side: Side | "round", offset: number): Chair {
  return { side, offset };
}

export function generateFakeFloorPlan(): FloorPlanData {
  const tables: TableData[] = [
    {
      id: "t-1",
      x: 180,
      y: 160,
      size: 4,
      shape: "round",
      reserved: true,
      reservedBy: "Rossi",
      blockedSides: [],
      chairs: [0, 90, 180, 270].map((o) => chair("round", o)),
    },
    {
      id: "t-2",
      x: 340,
      y: 160,
      size: 4,
      shape: "round",
      reserved: false,
      blockedSides: [],
      chairs: [0, 90, 180, 270].map((o) => chair("round", o)),
    },
    {
      id: "t-3",
      x: 500,
      y: 160,
      size: 8,
      shape: "round",
      reserved: false,
      blockedSides: [],
      chairs: [0, 45, 90, 135, 180, 225, 270, 315].map((o) =>
        chair("round", o),
      ),
    },
    {
      id: "t-4",
      x: 200,
      y: 360,
      size: 4,
      shape: "rect",
      reserved: false,
      groupId: "g-mock-1",
      blockedSides: ["right"],
      chairs: [chair("top", 0), chair("bottom", 0), chair("left", 0)],
    },
    {
      id: "t-5",
      x: 344,
      y: 360,
      size: 4,
      shape: "rect",
      reserved: true,
      reservedBy: "Ferrari",
      groupId: "g-mock-1",
      blockedSides: ["left"],
      chairs: [chair("top", 0), chair("bottom", 0), chair("right", 0)],
    },
    {
      id: "t-6",
      x: 580,
      y: 360,
      size: 8,
      shape: "rect",
      reserved: false,
      blockedSides: [],
      chairs: [
        ...[-0.55, 0, 0.55].map((o) => chair("top", o)),
        ...[-0.55, 0, 0.55].map((o) => chair("bottom", o)),
        chair("left", 0),
        chair("right", 0),
      ],
    },
  ];

  const walls: WallData[] = [
    {
      id: "w-1",
      points: [
        { x: 80, y: 80 },
        { x: 720, y: 80 },
        { x: 720, y: 520 },
        { x: 80, y: 520 },
        { x: 80, y: 80 },
      ],
    },
    {
      id: "w-2",
      points: [
        { x: 80, y: 280 },
        { x: 390, y: 280 },
      ],
    },
  ];

  return {
    id: "floor-plan-1",
    tables,
    walls,
    updatedAt: new Date().toISOString(),
  };
}

export const FloorPlanService = {
  getFloorPlan: (): Promise<FloorPlanData | null> =>
    httpClient.get("/api/floor-plan"),

  saveFloorPlan: (plan: FloorPlanData): Promise<FloorPlanData> =>
    httpClient.post("/api/floor-plan", plan),
};
