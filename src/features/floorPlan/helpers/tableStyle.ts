import type { TableData } from "../types/floorPlan";

//funzione per avere la dimensione del tavolo
export const getTableStyle = (
  table: TableData,
  selTable: TableData | null | undefined,
  mergeAnchor: string | null,
  tables: TableData[],
  selId: string | null,
  getGroup: (gid: string) => TableData[],
) => {
  const grp = table.groupId ? getGroup(table.groupId) : [table];
  const isReserved = grp.some((t) => t.reserved);
  const fill = isReserved ? "#dc2626" : "#16a34a";
  const strokeClr = isReserved ? "#991b1b" : "#166534";
  const glow = table.groupId
    ? isReserved
      ? "rgba(239,68,68,0.5)"
      : "rgba(168,85,247,0.5)"
    : isReserved
      ? "rgba(239,68,68,0.4)"
      : "rgba(34,197,94,0.4)";
  const isSel =
    selId === table.id ||
    (selTable?.groupId && selTable.groupId === table.groupId);
  const isMergeAnc =
    mergeAnchor === table.id ||
    (mergeAnchor &&
      tables.find((t) => t.id === mergeAnchor)?.groupId &&
      tables.find((t) => t.id === mergeAnchor)?.groupId === table.groupId);
  const reservedBy = grp.find((t) => t.reservedBy)?.reservedBy;
  return { fill, strokeClr, glow, isSel, isMergeAnc, reservedBy, isReserved };
};
