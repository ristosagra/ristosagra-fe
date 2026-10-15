import { TableShape, type SideConst } from "../constant/floorPlan";
import type {
  Chair,
  ChairBooking,
  FloorPlanData,
  TableData,
  WallData,
} from "../types/floorPlan";
import { defaultChairs } from "../helpers/chair";
import { createMockStore } from "../../../mock/store";

function chair(side: SideConst | "round", offset: number): Chair {
  return { side, offset };
}

//Assegna una prenotazione alle sedie con gli indici indicati (quelle in wheelchairIndexes sono per una carrozzina)
function book(
  chairs: Chair[],
  indexes: number[],
  booking: ChairBooking,
  wheelchairIndexes: number[] = [],
) {
  return chairs.map((c, i) =>
    indexes.includes(i)
      ? {
          ...c,
          booking: wheelchairIndexes.includes(i)
            ? { ...booking, wheelchair: true }
            : booking,
        }
      : c,
  );
}

export function generateFakeFloorPlan(): FloorPlanData {
  const rossi = {
    id: "b-1700000000001",
    name: "Rossi",
    arrivalTime: "20:30",
  };
  const ferrari = {
    id: "b-1700000000002",
    name: "Ferrari",
    seatedAt: new Date().toISOString(),
  };
  const bianchi = { id: "b-1700000000003", name: "Bianchi" };
  const verdi = {
    id: "b-1700000000004",
    name: "Verdi",
    arrivalTime: "21:00",
  };

  const tables: TableData[] = [
    {
      id: "t-1",
      name: "T-1",
      x: 180,
      y: 160,
      size: 4,
      shape: TableShape.Round,
      blockedSides: [],
      // 2 persone, una di fronte all'altra
      chairs: book(
        [0, 90, 180, 270].map((o) => chair(TableShape.Round, o)),
        [0, 2],
        rossi,
      ),
    },
    {
      id: "t-2",
      name: "T-2",
      x: 340,
      y: 160,
      size: 4,
      shape: TableShape.Round,
      blockedSides: [],
      chairs: [0, 90, 180, 270].map((o) => chair(TableShape.Round, o)),
    },
    {
      id: "t-3",
      name: "T-3",
      x: 500,
      y: 160,
      size: 8,
      shape: TableShape.Round,
      blockedSides: [],
      chairs: [0, 45, 90, 135, 180, 225, 270, 315].map((o) =>
        chair(TableShape.Round, o),
      ),
    },
    {
      id: "t-4",
      name: "T-4",
      x: 200,
      y: 360,
      size: 4,
      shape: "rect",
      groupId: "g-mock-1",
      blockedSides: ["right"],
      chairs: book(
        [chair("top", 0), chair("bottom", 0), chair("left", 0)],
        [0, 1, 2],
        ferrari,
      ),
    },
    {
      id: "t-5",
      name: "T-5",
      x: 272,
      y: 360,
      size: 4,
      shape: "rect",
      groupId: "g-mock-1",
      blockedSides: ["left"],
      chairs: book(
        [chair("top", 0), chair("bottom", 0), chair("right", 0)],
        [0, 1, 2],
        ferrari,
      ),
    },
    {
      id: "t-6",
      name: "T-6",
      x: 580,
      y: 360,
      size: 8,
      shape: "rect",
      blockedSides: [],
      // ordine sedie: 3 sopra, 3 sotto, testata sinistra, testata destra
      chairs: book(
        book(
          defaultChairs({ size: 8, shape: TableShape.Rect }),
          [6, 0, 3],
          bianchi,
          [6],
        ),
        [1, 4],
        verdi,
      ),
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

//Piantina finta salvata nel browser (vedi createMockStore)
export const floorPlanStore = createMockStore(
  "floorPlan",
  generateFakeFloorPlan,
);
