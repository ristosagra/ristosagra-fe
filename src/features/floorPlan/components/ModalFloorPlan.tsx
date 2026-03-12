import React from "react";
import { BookOpenText } from "lucide-react";
import type { TableData } from "../types/floorPlan";
import { Modal } from "../../../components/core/Modal";
import type { ModalType } from "../../../types/general";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { Input } from "../../../components/core/Input";

interface ModalFloorPlanProps {
  tables: TableData[];
  guest: string;
  modal: ModalType;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setModal: (x: ModalType) => void;
  setGuest: React.Dispatch<React.SetStateAction<string>>;
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
      <Label
        tag={LabelTags.p}
        label={`${grp.length > 1 ? `Gruppo di ${grp.length} tavoli · ` : ""} ${seats} posti`}
        color={ThemeVariants.colors.text.secondary}
        size={LabelDimensions.small}
        noMargin
      />
    );
  };

  return (
    <Modal
      icon={<BookOpenText />}
      title="Nuova Prenotazione"
      subTitle={subTitleFunc()}
    >
      <Label
        tag={LabelTags.p}
        label="Nome cliente"
        additionalClasses="uppercase mb-2"
        size={LabelDimensions.small}
        color={ThemeVariants.colors.text.secondary}
        noMargin
      />
      <Input
        type="text"
        placeholder="Es. Mario Rossi"
        value={guest}
        setValue={setGuest}
        variant="secondary"
        className="w-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-5"
        autoFocus
      />
      <div className="flex gap-3">
        <Button
          label="Conferma"
          onClick={confirmBooking}
          dimension={ButtonDimensions.auto}
          variant="success"
          disabled={!guest.trim()}
          className="px-3 py-2 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:border-neutral-500"
        />
        <Button
          label="Annulla"
          onClick={() => setModal({ open: false, tableId: "" })}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          disabled={!guest.trim()}
          className="px-3 py-2"
        />
      </div>
    </Modal>
  );
};
