import type {
  HeadsConst,
  RotationConst,
  SideConst,
  TableShapeConst,
} from "../constant/floorPlan";

//Prenotazione assegnata a un singolo posto: tutti i posti con lo stesso id sono prenotati allo stesso nome
export interface ChairBooking {
  id: string;
  name: string;
  //orario (ISO) in cui i commensali sono arrivati e si sono seduti
  seatedAt?: string;
  //posto riservato a una carrozzina (solo sui capotavola)
  wheelchair?: boolean;
  //orario di arrivo previsto (HH:MM)
  arrivalTime?: string;
}

export interface Chair {
  side: SideConst | "round";
  offset: number;
  booking?: ChairBooking;
}

export interface TableData {
  id: string;
  //nome visibile del tavolo (es. "T-1")
  name?: string;
  x: number;
  y: number;
  //numero di posti per cui è dimensionato il tavolo (ne determina la grandezza)
  size: number;
  shape: TableShapeConst;
  //capotavola compresi nei posti (solo rettangolari); se assente si usa il default in base ai posti
  heads?: HeadsConst;
  rotation?: RotationConst;
  groupId?: string;
  blockedSides: SideConst[];
  chairs: Chair[];
}

//Dati che determinano forma e ingombro di un tavolo
export type TableGeom = Pick<
  TableData,
  "size" | "shape" | "heads" | "rotation"
>;

//Riepilogo di una prenotazione all'interno di un tavolo o gruppo
export interface BookingSummary {
  id: string;
  name: string;
  seats: number;
  color: string;
  seatedAt?: string;
  arrivalTime?: string;
  wheelchairs: number;
}

//Riferimento a un posto con la sua posizione assoluta (x,y) e relativa al tavolo non ruotato (lx,ly)
export interface SeatRef {
  tableId: string;
  index: number;
  x: number;
  y: number;
  lx: number;
  ly: number;
  booked: boolean;
  //capotavola di un tavolo rettangolare (si prenota solo se richiesto)
  head: boolean;
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
  "view" | "add" | "move" | "delete" | "pan" | "wall" | "merge";

export interface PlanGroupDrag {
  groupId: string;
  startMouse: CoordinateType;
  startPositions: Record<string, CoordinateType>;
}

export type ModeBtn = {
  key: PlanMode;
  label: string;
  icon: string;
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
