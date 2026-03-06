import React from "react";
import { Modal } from "../core/Modal";
import { BookOpenText } from "lucide-react";
import type { TableData } from "../../types/floorPlan";
import type { ModalType } from "../../types/general";

interface ModalFloorPlanProps {
  tables: TableData[];
  guest: string;
  modal: ModalType;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setModal: (x: ModalType) => void;
  setGuest: (x: string) => void;
  getGroup: (gid: string) => TableData[];
}

export const ModalFloorPlan = ({
  tables,
  guest,
  modal,
  setTables,
  setModal,
  setGuest,
  getGroup,
}: ModalFloorPlanProps) => {
  const confirmBooking = () => {
    if (!guest.trim()) return;
    const t = tables.find((tt) => tt.id === modal.tableId);
    if (!t) return;
    const ids = t.groupId
      ? tables.filter((tt) => tt.groupId === t.groupId).map((tt) => tt.id)
      : [modal.tableId];
    setTables((p) =>
      p.map((tt) =>
        ids.includes(tt.id)
          ? { ...tt, reserved: true, reservedBy: guest.trim() }
          : tt,
      ),
    );
    setModal({ open: false, tableId: "" });
    setGuest("");
  };

  const subTitleFunc = (): React.ReactNode => {
    const t = tables.find((tt) => tt.id === modal.tableId);
    const grp = t?.groupId ? getGroup(t.groupId) : t ? [t] : [];
    const seats = grp.reduce((s, tt) => s + tt.chairs.length, 0);
    return (
      <p className="text-xs text-neutral-500 font-mono">
        {grp.length > 1 ? `Gruppo di ${grp.length} tavoli · ` : ""}
        {seats} posti
      </p>
    );
  };

  return (
    <Modal
      icon={<BookOpenText />}
      title="Nuova Prenotazione"
      subTitle={subTitleFunc()}
    >
      <label
        htmlFor="guest-input"
        className="block text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2"
      >
        Nome cliente
      </label>
      <input
        id="guest-input"
        type="text"
        value={guest}
        onChange={(e) => setGuest(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && confirmBooking()}
        placeholder="Es. Mario Rossi"
        autoFocus
        className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-5 font-mono"
      />
      <div className="flex gap-3">
        <button
          onClick={confirmBooking}
          disabled={!guest.trim()}
          className="flex-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm transition-colors border border-emerald-600 disabled:border-neutral-600"
        >
          Conferma
        </button>
        <button
          onClick={() => setModal({ open: false, tableId: "" })}
          className="px-5 py-2.5 rounded-lg border border-neutral-600 text-sm text-neutral-400 hover:bg-neutral-800 transition-colors"
        >
          Annulla
        </button>
      </div>
    </Modal>
  );
};
