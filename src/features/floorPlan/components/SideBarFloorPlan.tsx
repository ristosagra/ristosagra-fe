import React from "react";
import { SideBar } from "../../../components/core/SideBar";
import {
  type HeadsConst,
  type TableShapeConst,
  Heads,
  PLAN_BOOKING_COLORS,
  PLAN_FREE_CHAIR,
  PLAN_MIN_SEATS,
  TableShape,
} from "../constant/floorPlan";
import { useNotification } from "../../../hooks/useNotification";
import type {
  WallType,
  PlanMode,
  WallData,
  ModeBtn,
  TableData,
} from "../types/floorPlan";
import { NotificationType } from "../../../types/notification";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { Check, Link, Lock, RotateCw, X } from "lucide-react";
import { CounterCard } from "../../../components/core/CounterCard";
import { Input } from "../../../components/core/Input";
import { tableHeads } from "../helpers/dimensions";
import { useTableEditor } from "../hook/useTableEditor";

//Lunghezza massima del nome di un tavolo (sulla piantina se ne vedono 12 caratteri)
const TABLE_NAME_MAX = 20;

const HEADS_OPTIONS: { value: HeadsConst; label: string }[] = [
  { value: Heads.Both, label: "Entrambi" },
  { value: Heads.One, label: "Uno solo" },
  { value: Heads.None, label: "Nessuno" },
];

//Titolo di sezione della barra laterale
const SectionTitle = ({ label }: { label: string }) => (
  <Label
    tag={LabelTags.p}
    label={label}
    color={ThemeVariants.colors.text.secondary}
    size={LabelDimensions.small}
    noMargin
    additionalClasses="uppercase px-1 pb-1.5"
  />
);

//Scelta dei capotavola: entrambi, uno solo o nessuno
const HeadsPicker = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (x: HeadsConst) => void;
}) => (
  <div className="flex gap-1">
    {HEADS_OPTIONS.map((opt) => (
      <Button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        variant={value === opt.value ? "primary" : "secondary"}
        dimension={ButtonDimensions.auto}
        label={<span className="text-xs font-bold px-0.5">{opt.label}</span>}
        className="py-2 sm:py-1.5"
        fullWidth
      />
    ))}
  </div>
);

interface SideBarFloorPlanProps {
  curWall: WallType;
  mode: PlanMode;
  mergeAnchor: string | null;
  shape: TableShapeConst;
  newSeats: number;
  newHeads: HeadsConst;
  setShape: (x: TableShapeConst) => void;
  setNewSeats: React.Dispatch<React.SetStateAction<number>>;
  setNewHeads: (x: HeadsConst) => void;
  setCurWall: (x: WallType) => void;
  setWalls: React.Dispatch<React.SetStateAction<WallData[]>>;
  setMode: (x: PlanMode) => void;
  setMergeAnchor: (x: string | null) => void;
  setSelId: (x: string | null) => void;
  selTable: TableData | null | undefined;
  tables: TableData[];
  walls: WallData[];
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
}

export const SideBarFloorPlan = ({
  curWall,
  mode,
  mergeAnchor,
  shape,
  newSeats,
  newHeads,
  setShape,
  setNewSeats,
  setNewHeads,
  setCurWall,
  setWalls,
  setMode,
  setMergeAnchor,
  setSelId,
  selTable,
  tables,
  walls,
  setTables,
}: SideBarFloorPlanProps) => {
  const showNotification = useNotification();
  const { isLocked, rename, editChairs, setHeads, rotate } = useTableEditor({
    tables,
    walls,
    setTables,
  });

  const isAdding = mode === "add";

  const legendSideBar = [
    { cls: "bg-emerald-500", label: "Libero" },
    { cls: "bg-amber-500", label: "Parzialmente prenotato" },
    { cls: "bg-rose-500", label: "Completo" },
    {
      cls: "rounded-full border-2",
      style: {
        background: PLAN_FREE_CHAIR.fill,
        borderColor: PLAN_FREE_CHAIR.stroke,
      },
      label: "Posto libero",
    },
    {
      cls: "rounded-full border-2",
      style: {
        background: PLAN_FREE_CHAIR.fill,
        borderColor: PLAN_BOOKING_COLORS[0],
      },
      label: "Prenotato, in attesa (colore = nome)",
    },
    {
      cls: "rounded-full",
      style: { background: PLAN_BOOKING_COLORS[0] },
      label: "Commensale arrivato e seduto",
    },
    { cls: "bg-purple-500", label: "Uniti" },
    {
      cls: "bg-amber-900 border border-amber-700",
      label: "Muro",
    },
  ];

  const modeButtons: ModeBtn[] = [
    { key: "add", label: "Tavolo", icon: "➕" },
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
          <div className="text-purple-300 font-bold mb-1">
            <Label
              tag={LabelTags.p}
              iconLeft={<Link size={14} />}
              label="In corso…"
              size={LabelDimensions.small}
              noMargin
            />
          </div>
          <div className="text-purple-400 mb-2">
            <Label
              tag={LabelTags.p}
              label="Clicca tavoli da aggiungere"
              size={LabelDimensions.small}
              noMargin
            />
          </div>
          <Button
            onClick={() => setMergeAnchor(null)}
            variant="secondary"
            dimension={ButtonDimensions.auto}
            iconLeft={<X size={14} />}
            label="Fine unione"
            className="py-2 sm:py-1"
            fullWidth
          />
        </div>
      )}

      {/* Nuovo tavolo: forma, posti (la grandezza segue il numero di posti) e capotavola */}
      {isAdding && (
        <div className="mt-2 pt-2 border-t border-neutral-700 space-y-2">
          <div>
            <SectionTitle label="Forma tavoli" />
            <div className="flex gap-1">
              {(
                [
                  [TableShape.Round, "⭕", "Rotondo"],
                  [TableShape.Rect, "▬", "Rettang."],
                ] as const
              ).map(([s, ic, lb]) => (
                <Button
                  key={s}
                  onClick={() => setShape(s)}
                  variant={shape === s ? "primary" : "secondary"}
                  dimension={ButtonDimensions.auto}
                  iconLeft={ic}
                  label={lb}
                  className="flex flex-col py-1.5 sm:py-1"
                  fullWidth
                />
              ))}
            </div>
          </div>

          <div>
            <SectionTitle label="Posti a sedere" />
            <div className="flex items-center justify-between px-1">
              <CounterCard
                quantity={newSeats}
                decrement={() =>
                  setNewSeats((n) => Math.max(PLAN_MIN_SEATS, n - 1))
                }
                increment={() => setNewSeats((n) => n + 1)}
              />
              <Label
                tag={LabelTags.p}
                label={`min ${PLAN_MIN_SEATS}`}
                color={ThemeVariants.colors.text.secondary}
                size={LabelDimensions.small}
                noMargin
              />
            </div>
          </div>

          {/* Capotavola compresi nei posti (solo tavoli rettangolari) */}
          {shape === TableShape.Rect && (
            <div>
              <SectionTitle label="Capotavola compresi" />
              <HeadsPicker value={newHeads} onChange={setNewHeads} />
            </div>
          )}
        </div>
      )}

      {/* Sposta: modifica del tavolo selezionato */}
      {mode === "move" && (
        <div className="mt-2 pt-2 border-t border-neutral-700 space-y-2">
          <SectionTitle label="Tavolo selezionato" />
          {!selTable ? (
            <Label
              tag={LabelTags.p}
              label="Clicca un tavolo per cambiarne nome, posti, capotavola e rotazione"
              color={ThemeVariants.colors.text.secondary}
              size={LabelDimensions.small}
              noMargin
              additionalClasses="px-1 text-xs"
            />
          ) : (
            <>
              <Input
                type="text"
                placeholder="Nome tavolo"
                value={selTable.name ?? ""}
                setValue={(name) => rename(selTable, name)}
                maxLength={TABLE_NAME_MAX}
                variant="secondary"
                className="w-full text-sm"
              />

              <div>
                <SectionTitle label="Posti a sedere" />
                <div className="px-1">
                  <CounterCard
                    quantity={selTable.chairs.length}
                    decrement={() => editChairs(selTable, -1)}
                    increment={() => editChairs(selTable, 1)}
                  />
                </div>
              </div>

              {selTable.shape === TableShape.Rect && (
                <>
                  <div>
                    <SectionTitle label="Capotavola" />
                    <HeadsPicker
                      value={tableHeads(selTable)}
                      onChange={(h) => setHeads(selTable, h)}
                    />
                  </div>
                  <Button
                    onClick={() => rotate(selTable)}
                    variant="secondary"
                    dimension={ButtonDimensions.auto}
                    iconLeft={<RotateCw size={15} />}
                    label="Ruota 90°"
                    className="py-2 sm:py-1.5"
                    fullWidth
                  />
                </>
              )}

              {isLocked(selTable) && (
                <Label
                  tag={LabelTags.p}
                  iconLeft={<Lock size={13} />}
                  label="Posti prenotati: liberali per cambiare posti e capotavola"
                  color={ThemeVariants.colors.text.secondary}
                  size={LabelDimensions.small}
                  noMargin
                  additionalClasses="px-1 text-xs"
                />
              )}
              {selTable.blockedSides.length > 0 && (
                <Label
                  tag={LabelTags.p}
                  iconLeft={<Link size={13} />}
                  label="Tavolo unito ad altri: capotavola e rotazione bloccati"
                  color={ThemeVariants.colors.text.secondary}
                  size={LabelDimensions.small}
                  noMargin
                  additionalClasses="px-1 text-xs"
                />
              )}
            </>
          )}
        </div>
      )}

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
            <Button
              onClick={finishWall}
              variant="primary"
              dimension={ButtonDimensions.auto}
              iconLeft={<Check size={15} />}
              label="Termina muro"
              className="py-2"
              fullWidth
            />
          )}
          {curWall && (
            <Button
              onClick={finishWall}
              variant="secondary"
              dimension={ButtonDimensions.auto}
              iconLeft={<X size={14} />}
              label="Annulla"
              className="py-2 sm:py-1"
              fullWidth
            />
          )}
        </div>
      )}

      {/* Legend (sul cellulare non c'è spazio: resta solo sugli schermi grandi) */}
      <div className="hidden sm:block mt-auto pt-2 border-t border-neutral-700">
        <Label
          tag={LabelTags.p}
          label="Legenda"
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
          additionalClasses="uppercase px-1 pb-1"
        />
        {legendSideBar.map(({ cls, style, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-1 py-0.5 text-xs text-neutral-400"
          >
            <span
              className={`w-3 h-3 rounded-sm ${cls} shrink-0`}
              style={style}
            />
            {label}
          </div>
        ))}
      </div>
    </SideBar>
  );
};
