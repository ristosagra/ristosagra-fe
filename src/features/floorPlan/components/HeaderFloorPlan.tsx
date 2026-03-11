import { useState } from "react";
import { useNotification } from "../../../hooks/useNotification";
import type {
  TableData,
  WallData,
  FloorPlanData,
  PlanMode,
  WallType,
  CoordinateType,
  SnapshotType,
} from "../types/floorPlan";
import { NotificationType } from "../../../types/notification";
import { useSaveFloorPlan } from "../hook/useSaveFloorPlan";
import { Button } from "../../../components/core/Button";
import { Hourglass, Minus, Pencil, Plus, Save, X } from "lucide-react";
import { ButtonDimensions } from "../../../constant/button";
import { ThemeVariants } from "../../../constant/colors";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";

interface HeaderFloorPlanProps {
  tables: TableData[];
  isEditing: boolean;
  walls: WallData[];
  zoom: number;
  savedPlan: FloorPlanData | null | undefined;
  groupMap: Map<string, TableData[]>;
  setIsEditing: (x: boolean) => void;
  setMode: (x: PlanMode) => void;
  setWalls: React.Dispatch<React.SetStateAction<WallData[]>>;
  setMergeAnchor: (x: string | null) => void;
  setSelId: (x: string | null) => void;
  setCurWall: (x: WallType) => void;
  setTables: (value: React.SetStateAction<TableData[]>) => void;
  setZoom: (value: React.SetStateAction<number>) => void;
  setPan: (x: CoordinateType) => void;
}

export const HeaderFloorPlan = ({
  tables,
  isEditing,
  walls,
  zoom,
  savedPlan,
  groupMap,
  setIsEditing,
  setMode,
  setWalls,
  setMergeAnchor,
  setSelId,
  setCurWall,
  setTables,
  setZoom,
  setPan,
}: HeaderFloorPlanProps) => {
  const showNotification = useNotification();
  const { mutate: savePlan, isPending: isSaving } = useSaveFloorPlan();

  const [snapshot, setSnapshot] = useState<SnapshotType>(null);

  const reserved = tables.filter((t) => t.reserved).length;

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
    <div className="bg-neutral-900 border-b border-neutral-700 px-4 py-2 flex items-center justify-between shrink-0">
      {/* Zoom */}
      <div className="flex items-center gap-1.5 bg-neutral-800 rounded-lg px-2 py-1 h-full">
        <Button
          onClick={() => setZoom((z) => Math.max(0.2, z / 1.2))}
          iconLeft={<Minus />}
          variant="icon"
          dimension={ButtonDimensions.small}
          className={`cursor-pointer ${ThemeVariants.colors.text.secondary}`}
        />
        <span className="w-12 text-center tabular-nums h-full flex items-center justify-center">
          <Label
            tag={LabelTags.p}
            label={`${Math.round(zoom * 100)}%`}
            size={LabelDimensions.small}
            color={ThemeVariants.colors.text.secondary}
            noMargin
          />
        </span>
        <Button
          onClick={() => setZoom((z) => Math.min(5, z * 1.2))}
          iconLeft={<Plus />}
          variant="icon"
          dimension={ButtonDimensions.small}
          className={`cursor-pointer ${ThemeVariants.colors.text.secondary}`}
        />
        <div className="w-px bg-neutral-600 mx-1 h-full" />
        <Button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          label="Reset"
          variant="icon"
          dimension={ButtonDimensions.medium}
          className={`cursor-pointer ${ThemeVariants.colors.text.secondary}`}
        />
      </div>

      {/* Stats + Edit controls */}
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {[
            {
              label: "TOTALI",
              val: tables.length,
              cls: "text-neutral-200",
            },
            {
              label: "LIBERI",
              val: tables.length - reserved,
              cls: "text-emerald-400",
            },
            { label: "PRENOTATI", val: reserved, cls: "text-rose-400" },
            {
              label: "GRUPPI",
              val: groupMap.size,
              cls: "text-purple-400",
            },
          ].map(({ label, val, cls }) => (
            <div
              key={label}
              className="bg-neutral-800 rounded px-3 py-1 text-center border border-neutral-700"
            >
              <div className={`text-base font-bold tabular-nums ${cls}`}>
                {val}
              </div>
              <div className="text-neutral-500 text-xs tracking-widest">
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
              className={`px-5 py-3 ${ThemeVariants.colors.border.all.brand}`}
            />
            <Button
              iconLeft={isSaving ? <Hourglass size={16} /> : <Save size={16} />}
              onClick={handleSave}
              dimension={ButtonDimensions.auto}
              label={isSaving ? "Salvataggio…" : "Salva"}
              variant="success"
              className={`px-5 py-3 ${ThemeVariants.colors.border.all.brand}`}
            />
          </div>
        ) : (
          <Button
            iconLeft={<Pencil size={16} />}
            onClick={startEditing}
            dimension={ButtonDimensions.auto}
            label="Modifica"
            variant="primary"
            className={`px-5 py-3 ${ThemeVariants.colors.border.all.brand}`}
          />
        )}
      </div>
    </div>
  );
};
