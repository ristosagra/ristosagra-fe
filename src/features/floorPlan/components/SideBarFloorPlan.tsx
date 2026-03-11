import React from "react";
import { SideBar } from "../../../components/core/SideBar";
import { type TableShapeConst, TableShape } from "../constant/floorPlan";
import { useNotification } from "../../../hooks/useNotification";
import type { WallType, PlanMode, WallData, ModeBtn } from "../types/floorPlan";
import { NotificationType } from "../../../types/notification";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";

interface SideBarFloorPlanProps {
  curWall: WallType;
  mode: PlanMode;
  mergeAnchor: string | null;
  shape: TableShapeConst;
  setShape: (x: TableShapeConst) => void;
  setCurWall: (x: WallType) => void;
  setWalls: React.Dispatch<React.SetStateAction<WallData[]>>;
  setMode: (x: PlanMode) => void;
  setMergeAnchor: (x: string | null) => void;
  setSelId: (x: string | null) => void;
}

export const SideBarFloorPlan = ({
  curWall,
  mode,
  mergeAnchor,
  shape,
  setShape,
  setCurWall,
  setWalls,
  setMode,
  setMergeAnchor,
  setSelId,
}: SideBarFloorPlanProps) => {
  const showNotification = useNotification();

  const legendSideBar = [
    { cls: "bg-emerald-500", label: "Libero" },
    { cls: "bg-rose-500", label: "Prenotato" },
    { cls: "bg-amber-400", label: "Sedia" },
    { cls: "bg-purple-500", label: "Uniti" },
    {
      cls: "bg-amber-900 border border-amber-700",
      label: "Muro",
    },
  ];

  const modeButtons: ModeBtn[] = [
    { key: "add4", label: "Tavolo da 4", icon: "➕" },
    { key: "add8", label: "Tavolo da 8", icon: "➕" },
    {
      key: "merge",
      label: "Unisci tavoli",
      icon: "🔗",
    },
    { key: "move", label: "Sposta", icon: "✥" },
    { key: "delete", label: "Elimina", icon: "🗑" },
    { key: "wall", label: "Disegna muro", icon: "🧱" },
  ];

  function finishWall() {
    if (curWall && curWall.length >= 2) {
      setWalls((p) => [...p, { id: `w-${Date.now()}`, points: curWall }]);
      showNotification("✓ Muro aggiunto!", NotificationType.Ok);
    }
    setCurWall(null);
  }

  return (
    <SideBar
      buttons={modeButtons}
      activeKey={mode}
      onButtonClick={(key) => {
        setMode(key);
        setSelId(null);
        if (key !== "merge") setMergeAnchor(null);
        if (key !== "wall" && curWall) finishWall();
      }}
    >
      {/* Merge state */}
      {mode === "merge" && mergeAnchor && (
        <div className="bg-purple-900/60 border border-purple-500 rounded-md px-2 py-2 text-xs">
          <div className="text-purple-300 font-bold mb-1">🔗 In corso…</div>
          <div className="text-purple-400 text-xs mb-2">
            Clicca tavoli da aggiungere
          </div>
          <button
            onClick={() => setMergeAnchor(null)}
            className="w-full text-xs text-neutral-400 hover:text-white bg-neutral-800 rounded py-1 transition-colors"
          >
            ✕ Fine unione
          </button>
        </div>
      )}

      {/* Shape */}
      <div className="mt-2 pt-2 border-t border-neutral-700">
        <Label
          tag={LabelTags.p}
          label="Forma tavoli"
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
          additionalClasses="uppercase px-1 pb-1.5"
        />
        <div className="flex gap-1">
          {(
            [
              [TableShape.Round, "⭕", "Rotondo"],
              [TableShape.Rect, "▬", "Rettang."],
            ] as const
          ).map(([s, ic, lb]) => (
            <button
              key={s}
              onClick={() => setShape(s)}
              className={`flex-1 py-1.5 rounded text-xs font-medium flex flex-col items-center gap-0.5 border transition-all
                          ${shape === s ? "bg-sky-600 text-white border-sky-400" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border-neutral-700"}`}
            >
              <span>{ic}</span>
              <span>{lb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wall controls */}
      {mode === "wall" && (
        <div className="pt-2 border-t border-neutral-700 space-y-1">
          <Label
            tag={LabelTags.p}
            label={
              curWall ? `📍 ${curWall.length} punto/i` : "Clicca per iniziare"
            }
            color={ThemeVariants.colors.text.secondary}
            size={LabelDimensions.small}
            noMargin
            additionalClasses="px-1"
          />
          {curWall && curWall.length >= 2 && (
            <button
              onClick={finishWall}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold py-2 rounded-md border border-orange-400 transition-colors"
            >
              ✓ Termina muro
            </button>
          )}
          {curWall && (
            <button
              onClick={() => setCurWall(null)}
              className="w-full bg-neutral-700 text-neutral-300 text-xs py-1.5 rounded-md transition-colors hover:bg-neutral-600"
            >
              ✕ Annulla
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-auto pt-2 border-t border-neutral-700">
        <Label
          tag={LabelTags.p}
          label="Legenda"
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
          additionalClasses="uppercase px-1 pb-1"
        />
        {legendSideBar.map(({ cls, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-1 py-0.5 text-xs text-neutral-400"
          >
            <span className={`w-3 h-3 rounded-sm ${cls} shrink-0`} />
            {label}
          </div>
        ))}
      </div>
    </SideBar>
  );
};
