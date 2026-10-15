import { useState } from "react";
import { useNotification } from "../../../hooks/useNotification";
import type {
  TableData,
  WallData,
  FloorPlanData,
  PlanMode,
  WallType,
  SnapshotType,
} from "../types/floorPlan";
import { NotificationType } from "../../../types/notification";
import { useSaveFloorPlan } from "../hook/useSaveFloorPlan";
import { Button } from "../../../components/core/Button";
import {
  ClipboardList,
  Globe,
  Hourglass,
  LocateFixed,
  Minus,
  Pencil,
  Plus,
  Save,
  X,
} from "lucide-react";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import {
  allUnits,
  bookingSummaries,
  hasBookings,
  isPlaced,
} from "../helpers/booking";
import {
  PLAN_ZOOM_MAX,
  PLAN_ZOOM_MIN,
  RightPanel,
  type RightPanelConst,
} from "../constant/floorPlan";
import { useReservations } from "../../reservations/hook/useReservations";

interface HeaderFloorPlanProps {
  tables: TableData[];
  isEditing: boolean;
  walls: WallData[];
  zoom: number;
  savedPlan: FloorPlanData | null | undefined;
  rightPanel: RightPanelConst | null;
  setRightPanel: (x: RightPanelConst | null) => void;
  setIsEditing: (x: boolean) => void;
  setMode: (x: PlanMode) => void;
  setWalls: React.Dispatch<React.SetStateAction<WallData[]>>;
  setMergeAnchor: (x: string | null) => void;
  setSelId: (x: string | null) => void;
  setCurWall: (x: WallType) => void;
  setTables: (value: React.SetStateAction<TableData[]>) => void;
  setZoom: (value: React.SetStateAction<number>) => void;
  //inquadra tutta la piantina
  onFitView: () => void;
}

export const HeaderFloorPlan = ({
  tables,
  isEditing,
  walls,
  zoom,
  savedPlan,
  rightPanel,
  setRightPanel,
  setIsEditing,
  setMode,
  setWalls,
  setMergeAnchor,
  setSelId,
  setCurWall,
  setTables,
  setZoom,
  onFitView,
}: HeaderFloorPlanProps) => {
  const showNotification = useNotification();
  const { mutate: savePlan, isPending: isSaving } = useSaveFloorPlan();

  const [snapshot, setSnapshot] = useState<SnapshotType>(null);

  //tavoli con almeno un posto prenotato
  const reserved = tables.filter((t) => hasBookings([t])).length;
  //posti prenotati e liberi su tutta la piantina
  const totalSeats = tables.reduce((s, t) => s + t.chairs.length, 0);
  const bookedSeats = tables.reduce(
    (s, t) => s + t.chairs.filter((c) => c.booking).length,
    0,
  );
  //prenotazioni online non ancora sistemate in piantina
  const { data: reservations = [] } = useReservations();
  const toPlace = reservations.filter((r) => !isPlaced(tables, r.id)).length;
  const togglePanel = (panel: RightPanelConst) =>
    setRightPanel(rightPanel === panel ? null : panel);

  const bookingsCount = allUnits(tables).reduce(
    (s, u) => s + bookingSummaries(u).length,
    0,
  );

  const startEditing = () => {
    setSnapshot({
      tables: structuredClone(tables),
      walls: structuredClone(walls),
    });
    setIsEditing(true);
    setMode("view");
  };

  const cancelEditing = () => {
    if (snapshot) {
      setTables(snapshot.tables);
      setWalls(snapshot.walls);
    }
    setIsEditing(false);
    setSelId(null);
    setMergeAnchor(null);
    setCurWall(null);
    setMode("view");
  };

  const handleSave = () => {
    const data: FloorPlanData = { id: savedPlan?.id, tables, walls };
    savePlan(data, {
      onSuccess: () => {
        showNotification("✓ Piantina salvata!", NotificationType.Ok);
        setIsEditing(false);
        setSnapshot(null);
        setMode("view");
      },
      onError: () =>
        showNotification("❌ Errore nel salvataggio", NotificationType.Err),
    });
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-700 px-2 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
      {/* Zoom */}
      <div className="flex items-center gap-1 bg-neutral-800 rounded-lg px-1 sm:px-1.5 py-1">
        <Button
          onClick={() => setZoom((z) => Math.max(PLAN_ZOOM_MIN, z / 1.2))}
          iconLeft={<Minus />}
          variant="icon"
          dimension={ButtonDimensions.auto}
          className={`cursor-pointer w-8 h-8 sm:h-7 ${ThemeVariants.colors.text.secondary}`}
          ariaLabel="Riduci lo zoom"
        />
        <span className="w-11 text-center tabular-nums h-full flex items-center justify-center">
          <Label
            tag={LabelTags.p}
            label={`${Math.round(zoom * 100)}%`}
            size={LabelDimensions.small}
            color={ThemeVariants.colors.text.secondary}
            noMargin
          />
        </span>
        <Button
          onClick={() => setZoom((z) => Math.min(PLAN_ZOOM_MAX, z * 1.2))}
          iconLeft={<Plus />}
          variant="icon"
          dimension={ButtonDimensions.auto}
          className={`cursor-pointer w-8 h-8 sm:h-7 ${ThemeVariants.colors.text.secondary}`}
          ariaLabel="Aumenta lo zoom"
        />
        <div className="w-px bg-neutral-600 mx-1 h-full" />
        <Button
          onClick={onFitView}
          iconLeft={<LocateFixed size={18} />}
          variant="icon"
          dimension={ButtonDimensions.auto}
          className={`cursor-pointer w-8 h-8 sm:h-7 ${ThemeVariants.colors.text.secondary}`}
          ariaLabel="Adatta la piantina allo schermo"
        />
      </div>

      {/* Stats + Edit controls */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div className="flex gap-2">
          {[
            {
              label: "TAVOLI",
              free: tables.length - reserved,
              booked: reserved,
            },
            {
              label: "POSTI",
              free: totalSeats - bookedSeats,
              booked: bookedSeats,
            },
          ].map(({ label, free, booked }) => (
            <div
              key={label}
              title={`${label}: ${free} ${free === 1 ? "libero" : "liberi"}, ${booked} ${booked === 1 ? "prenotato" : "prenotati"}`}
              className="bg-neutral-800 rounded px-2 py-1 text-center border border-neutral-700"
            >
              {/* Sul cellulare solo i numeri (verde liberi, rosso prenotati) */}
              <div className="flex items-baseline justify-center gap-1 tabular-nums whitespace-nowrap">
                <span className="text-sm sm:text-base font-bold text-emerald-400">
                  {free}
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">
                  {free === 1 ? "libero" : "liberi"}
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-sm sm:text-base font-bold text-rose-400">
                  {booked}
                </span>
                <span className="hidden sm:inline text-xs text-neutral-400">
                  {booked === 1 ? "prenotato" : "prenotati"}
                </span>
              </div>
              <div className="text-neutral-500 text-[10px] sm:text-xs tracking-widest">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Edit / Save / Cancel */}
        {isEditing ? (
          <div className="flex gap-2 h-full">
            <Button
              iconLeft={<X size={16} />}
              onClick={cancelEditing}
              dimension={ButtonDimensions.auto}
              label="Annulla"
              variant="secondary"
              className={`px-2.5 sm:px-3 py-2.5 ${ThemeVariants.colors.border.all.brand}`}
            />
            <Button
              iconLeft={isSaving ? <Hourglass size={16} /> : <Save size={16} />}
              onClick={handleSave}
              dimension={ButtonDimensions.auto}
              label={isSaving ? "Salvataggio…" : "Salva"}
              variant="success"
              disabled={isSaving}
              className={`px-2.5 sm:px-3 py-2.5 disabled:cursor-wait ${ThemeVariants.colors.border.all.brand}`}
            />
          </div>
        ) : (
          <div className="flex gap-2 h-full">
            {/* Apre/chiude i pannelli a destra: prenotazioni ai tavoli e prenotazioni online */}
            <Button
              iconLeft={<ClipboardList size={16} />}
              onClick={() => togglePanel(RightPanel.Bookings)}
              dimension={ButtonDimensions.auto}
              ariaLabel="Prenotazioni ai tavoli"
              label={
                <span className="ml-1 text-sm whitespace-nowrap flex items-center gap-1.5">
                  <span className="hidden sm:inline">Prenotazioni</span>
                  <span className="text-xs bg-neutral-600 text-white rounded-full px-1.5 font-bold">
                    {bookingsCount}
                  </span>
                </span>
              }
              variant="active"
              isActive={rightPanel === RightPanel.Bookings}
              className="px-2 py-2.5"
            />
            <Button
              iconLeft={<Globe size={16} />}
              onClick={() => togglePanel(RightPanel.Online)}
              dimension={ButtonDimensions.auto}
              ariaLabel="Prenotazioni online"
              label={
                <span className="ml-1 text-sm whitespace-nowrap flex items-center gap-1.5">
                  <span className="hidden sm:inline">Online</span>
                  {toPlace > 0 && (
                    <span className="text-xs bg-amber-500 text-neutral-950 rounded-full px-1.5 font-bold">
                      {toPlace}
                    </span>
                  )}
                </span>
              }
              variant="active"
              isActive={rightPanel === RightPanel.Online}
              className="px-2 py-2.5"
            />
            <Button
              iconLeft={<Pencil size={16} />}
              onClick={startEditing}
              dimension={ButtonDimensions.auto}
              label={
                <span className="hidden sm:inline ml-1 text-base">
                  Modifica
                </span>
              }
              ariaLabel="Modifica la piantina"
              variant="primary"
              className={`px-2.5 sm:px-3 py-2.5 ${ThemeVariants.colors.border.all.brand}`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
