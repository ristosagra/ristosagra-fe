import { TableStatus, type TableStatusConst } from "../constant/floorPlan";
import type { TableData } from "../types/floorPlan";
import { bookingSummaries, unitOccupancy } from "./booking";

const STATUS_COLORS: Record<
  TableStatusConst,
  { fill: string; stroke: string; glow: string }
> = {
  [TableStatus.Free]: {
    fill: "#16a34a",
    stroke: "#166534",
    glow: "rgba(34,197,94,0.4)",
  },
  [TableStatus.Partial]: {
    fill: "#d97706",
    stroke: "#92400e",
    glow: "rgba(245,158,11,0.45)",
  },
  [TableStatus.Full]: {
    fill: "#dc2626",
    stroke: "#991b1b",
    glow: "rgba(239,68,68,0.4)",
  },
};

//funzione per avere lo stile del tavolo (stato delle prenotazioni, selezione, colori dei posti)
export const getTableStyle = (
  table: TableData,
  selTable: TableData | null | undefined,
  mergeAnchor: string | null,
  tables: TableData[],
  selId: string | null,
  getGroup: (gid: string) => TableData[],
) => {
  const grp = table.groupId ? getGroup(table.groupId) : [table];
  const { status } = unitOccupancy(grp);
  const { fill, stroke: strokeClr, glow: statusGlow } = STATUS_COLORS[status];
  const glow =
    table.groupId && status === TableStatus.Free
      ? "rgba(168,85,247,0.5)"
      : statusGlow;
  const isSel =
    selId === table.id ||
    (selTable?.groupId && selTable.groupId === table.groupId);
  const isMergeAnc =
    mergeAnchor === table.id ||
    (mergeAnchor &&
      tables.find((t) => t.id === mergeAnchor)?.groupId &&
      tables.find((t) => t.id === mergeAnchor)?.groupId === table.groupId);
  const bookingColors = Object.fromEntries(
    bookingSummaries(grp).map((b) => [b.id, b.color]),
  );
  return { fill, strokeClr, glow, isSel, isMergeAnc, bookingColors };
};
