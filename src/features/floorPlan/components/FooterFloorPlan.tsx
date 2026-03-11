import { TableShape } from "../constant/floorPlan";
import type { TableData } from "../types/floorPlan";
import type { ModalType } from "../../../types/general";
import { addChair, removeChair } from "../helpers/chair";
import { Button } from "../../../components/core/Button";
import { Minus, Plus, X } from "lucide-react";
import { ButtonDimensions } from "../../../constant/button";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";

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
    <div className="shrink-0 bg-neutral-900 border-t border-neutral-700 px-5 py-3 flex items-center gap-4 w-full bottom-0 absolute">
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
            <Label
              tag={LabelTags.p}
              label={t.id}
              color={ThemeVariants.colors.text.secondary}
              size={LabelDimensions.small}
              noMargin
              additionalClasses="uppercase"
            />
            <Button
              iconLeft={<Minus />}
              onClick={() => editChairs(t.id, -1)}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="hover:bg-rose-700 px-1"
            />
            <Label
              tag={LabelTags.p}
              label={`${t.chairs.length}`}
              color={ThemeVariants.colors.text.white}
              size={LabelDimensions.small}
              noMargin
            />
            <Button
              iconLeft={<Plus />}
              onClick={() => editChairs(t.id, 1)}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="hover:bg-emerald-700 px-1"
            />
            <Label
              tag={LabelTags.p}
              label="Posti"
              color={ThemeVariants.colors.text.secondary}
              size={LabelDimensions.small}
              noMargin
            />
          </div>
        ))}
      </div>

      {selGroup.length > 1 && (
        <Label
          tag={LabelTags.p}
          label={`Totale: ${selSeats} posti`}
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
        />
      )}

      <div className="flex gap-2 shrink-0">
        {selReserved ? (
          <Button
            label="Cancella prenotazione"
            onClick={() => cancelBooking(selId!)}
            dimension={ButtonDimensions.auto}
            variant="danger"
            className="px-2"
          />
        ) : (
          <Button
            label="Prenota"
            onClick={() => {
              setModal({ open: true, tableId: selId! });
              setGuest("");
            }}
            dimension={ButtonDimensions.auto}
            variant="success"
            className="px-2"
          />
        )}
        <Button
          iconLeft={<X />}
          onClick={() => setSelId(null)}
          dimension={ButtonDimensions.auto}
          variant="active"
          isActive
          className="px-1 py-1"
        />
      </div>
    </div>
  );
};
