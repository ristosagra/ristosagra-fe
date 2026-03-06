import { TableShape } from "../../constant/floorPlan";
import { addChair, removeChair } from "../../helpers/floorPlan";
import type { TableData } from "../../types/floorPlan";
import type { ModalType } from "../../types/general";

interface FooterFloorPlanProps {
  selTable: TableData;
  tables: TableData[];
  selId: string | null;
  getGroup: (gid: string) => TableData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setSelId: (x: string | null) => void;
  setGuest: (x: string) => void;
  setModal: (x: ModalType) => void;
}

export const FooterFloorPlan = ({
  selTable,
  tables,
  selId,
  getGroup,
  setTables,
  setSelId,
  setGuest,
  setModal,
}: FooterFloorPlanProps) => {
  const selGroup = selTable?.groupId
    ? getGroup(selTable.groupId)
    : selTable
      ? [selTable]
      : [];
  const selSeats = selGroup.reduce((s, t) => s + t.chairs.length, 0);
  const selReserved = selGroup.some((t) => t.reserved);
  const selName = selGroup.find((t) => t.reservedBy)?.reservedBy;

  const cancelBooking = (id: string) => {
    const t = tables.find((tt) => tt.id === id);
    if (!t) return;
    const ids = t.groupId
      ? tables.filter((tt) => tt.groupId === t.groupId).map((tt) => tt.id)
      : [id];
    setTables((p) =>
      p.map((tt) =>
        ids.includes(tt.id)
          ? { ...tt, reserved: false, reservedBy: undefined }
          : tt,
      ),
    );
    setSelId(null);
  };

  const editChairs = (id: string, delta: 1 | -1) => {
    setTables((p) =>
      p.map((t) =>
        t.id === id ? (delta === 1 ? addChair(t) : removeChair(t)) : t,
      ),
    );
  };

  return (
    <div className="shrink-0 bg-neutral-900 border-t border-neutral-700 px-5 py-3 flex items-center gap-4 w-full">
      <div className="min-w-40 shrink-0">
        <div className="text-white font-bold text-sm flex items-center gap-2">
          {selTable.groupId
            ? `Gruppo (${selGroup.length} tavoli)`
            : `Tavolo da ${selTable.size}`}
          {selReserved && (
            <span className="text-xs bg-rose-700 text-rose-200 px-1.5 py-0.5 rounded">
              Prenotato
            </span>
          )}
        </div>
        <div className="text-neutral-400 text-xs mt-0.5">
          {selTable.shape === TableShape.Round
            ? "Rotondo"
            : selTable.size === 4
              ? "Quadrato"
              : "Rettangolare"}
          {selReserved && (
            <span className="text-neutral-300 font-bold ml-1">· {selName}</span>
          )}
        </div>
      </div>

      {/* Seat controls — always available when selected */}
      <div className="flex gap-2 flex-1 overflow-x-auto py-0.5">
        {selGroup.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-3 py-1.5 border border-neutral-700 shrink-0"
          >
            <span className="text-neutral-400 text-xs font-mono">
              {t.size === 4 ? "T4" : "T8"}
            </span>
            <button
              onClick={() => editChairs(t.id, -1)}
              className="w-6 h-6 rounded bg-neutral-700 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
            >
              −
            </button>
            <span className="text-white font-bold tabular-nums w-5 text-center text-sm">
              {t.chairs.length}
            </span>
            <button
              onClick={() => editChairs(t.id, 1)}
              className="w-6 h-6 rounded bg-neutral-700 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center transition-colors"
            >
              +
            </button>
            <span className="text-neutral-500 text-xs">posti</span>
          </div>
        ))}
      </div>

      {selGroup.length > 1 && (
        <div className="text-xs text-neutral-400 font-mono shrink-0">
          Totale: <span className="text-white font-bold">{selSeats}</span> posti
        </div>
      )}

      <div className="flex gap-2 shrink-0">
        {selReserved ? (
          <button
            onClick={() => cancelBooking(selId!)}
            className="bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-lg border border-rose-500 transition-colors"
          >
            Cancella prenotazione
          </button>
        ) : (
          <button
            onClick={() => {
              setModal({ open: true, tableId: selId! });
              setGuest("");
            }}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg border border-emerald-500 transition-colors"
          >
            Prenota
          </button>
        )}
        <button
          onClick={() => setSelId(null)}
          className="px-3 py-2 rounded-lg border border-neutral-600 text-xs text-neutral-400 hover:bg-neutral-800 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
