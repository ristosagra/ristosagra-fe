import { TableShape, TableStatus } from "../constant/floorPlan";
import type { TableData } from "../types/floorPlan";
import type { ModalType } from "../../../types/general";
import { tableLabel } from "../helpers/chair";
import { Button } from "../../../components/core/Button";
import { X } from "lucide-react";
import { ButtonDimensions } from "../../../constant/button";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { bookingSummaries, getUnit, unitOccupancy } from "../helpers/booking";
import { rectColumns } from "../helpers/dimensions";

interface FooterFloorPlanProps {
  selTable: TableData;
  tables: TableData[];
  selId: string | null;
  isEditing: boolean;
  setSelId: (x: string | null) => void;
  setModal: (x: ModalType) => void;
  setHoveredBookingId: (x: string | null) => void;
}

export const FooterFloorPlan = ({
  selTable,
  tables,
  selId,
  isEditing,
  setSelId,
  setModal,
  setHoveredBookingId,
}: FooterFloorPlanProps) => {
  const selGroup = getUnit(selTable, tables);
  const { total, free, status } = unitOccupancy(selGroup);
  const bookings = bookingSummaries(selGroup);
  const seated = bookings
    .filter((b) => b.seatedAt)
    .reduce((s, b) => s + b.seats, 0);

  const close = () => {
    setHoveredBookingId(null);
    setSelId(null);
  };

  return (
    <div className="shrink-0 bg-neutral-900 border-t border-neutral-700 px-5 py-3 flex items-center gap-4 w-full bottom-0 absolute">
      <div className="min-w-40 shrink-0">
        <div className="text-white font-bold text-sm flex items-center gap-2">
          {selGroup.map(tableLabel).join(" + ")}
          {status === TableStatus.Full && (
            <span className="text-xs bg-rose-700 text-rose-200 px-1.5 py-0.5 rounded">
              Completo
            </span>
          )}
          {status === TableStatus.Partial && (
            <span className="text-xs bg-amber-700 text-amber-100 px-1.5 py-0.5 rounded">
              Parziale
            </span>
          )}
        </div>
        <div className="text-neutral-400 text-xs mt-0.5">
          {selTable.groupId ? `Gruppo di ${selGroup.length} tavoli` : ""}
          {!selTable.groupId &&
            (selTable.shape === TableShape.Round
              ? "Rotondo"
              : rectColumns(selTable) <= 1
                ? "Quadrato"
                : "Rettangolare")}
          <span className="text-neutral-300 font-bold ml-1">
            · {free} {free === 1 ? "libero" : "liberi"} su {total}
          </span>
          {seated > 0 && (
            <span className="text-emerald-400 font-bold ml-1">
              · {seated} {seated === 1 ? "seduto" : "seduti"}
            </span>
          )}
        </div>
      </div>

      {isEditing && selGroup.length > 1 && (
        <Label
          tag={LabelTags.p}
          label={`Totale: ${total} posti`}
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
        />
      )}

      {/* Prenota e chiudi sempre all'estrema destra */}
      <div className="flex gap-2 shrink-0 ml-auto">
        {!isEditing && (
          <Button
            label="Prenota"
            onClick={() => setModal({ open: true, tableId: selId! })}
            dimension={ButtonDimensions.auto}
            variant="success"
            disabled={free === 0}
            className="px-2 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:border-neutral-500"
          />
        )}
        <Button
          iconLeft={<X />}
          onClick={close}
          dimension={ButtonDimensions.auto}
          variant="active"
          isActive
          className="px-1 py-1"
        />
      </div>
    </div>
  );
};
