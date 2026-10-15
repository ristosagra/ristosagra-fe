import React from "react";
import type {
  CoordinateType,
  PanStartType,
  PlanMode,
  TableData,
  WallData,
  WallType,
} from "../types/floorPlan";
import {
  TableShape,
  type HeadsConst,
  type TableShapeConst,
} from "../constant/floorPlan";
import { defaultChairs, nextTableName, tableLabel } from "../helpers/chair";
import { getTableStyle } from "../helpers/tableStyle";
import { sharedEdge } from "../helpers/snap";
import { groupOutlinePath } from "../helpers/outline";
import { tableRadius } from "../helpers/dimensions";
import { expectedArrivals } from "../helpers/booking";
import { hasCollision } from "../helpers/collision";
import { TableShapeSVG } from "./TableShapeSVG";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";

interface SVGCanvasProps {
  isEditing: boolean;
  hints: Record<PlanMode, string>;
  mode: PlanMode;
  shape: TableShapeConst;
  newSeats: number;
  newHeads: HeadsConst;
  hoveredBookingId: string | null;
  tables: TableData[];
  walls: WallData[];
  svgRef: React.RefObject<SVGSVGElement | null>;
  hoveredTableId: string | null;
  panStart: PanStartType;
  curWall: WallType;
  cursor: CoordinateType;
  groupMap: Map<string, TableData[]>;
  selTable: TableData | null | undefined;
  mergeAnchor: string | null;
  selId: string | null;
  zoom: number;
  onPointerDownCapture: (e: React.PointerEvent) => void;
  onSVGDown: (e: React.PointerEvent) => void;
  onMove: (e: React.PointerEvent) => void;
  onUp: (e: React.PointerEvent) => void;
  onSVGClick: (e: React.MouseEvent) => void;
  onWallClick: (
    wallId: string,
    e: React.MouseEvent,
    isEditing: boolean,
  ) => void;
  pts: (arr: CoordinateType[]) => string;
  onWallPointDown: (e: React.PointerEvent, wallId: string, pi: number) => void;
  getGroup: (gid: string) => TableData[];
  onTableDown: (e: React.PointerEvent, tid: string) => void;
  onTableClick: (e: React.MouseEvent, tid: string) => void;
  setHoveredTableId: React.Dispatch<React.SetStateAction<string | null>>;
  pan: CoordinateType;
}

const PURPLE_DASH = {
  fill: "none",
  stroke: "#a855f7",
  strokeWidth: 2.5,
  strokeDasharray: "5,3",
  opacity: 0.7,
  style: { pointerEvents: "none" as const },
};

//Prossimo arrivo previsto sul tavolo (es. "20:30", o "20:30 +1" se ce ne sono altri)
const arrivalLabel = (table: TableData) => {
  const times = expectedArrivals(table);
  if (times.length === 0) return undefined;
  return times.length > 1 ? `${times[0]} +${times.length - 1}` : times[0];
};

export const SVGCanvas = ({
  isEditing,
  hints,
  mode,
  shape,
  newSeats,
  newHeads,
  hoveredBookingId,
  tables,
  walls,
  svgRef,
  hoveredTableId,
  panStart,
  curWall,
  cursor,
  groupMap,
  selTable,
  mergeAnchor,
  selId,
  zoom,
  onPointerDownCapture,
  onSVGDown,
  onMove,
  onUp,
  onSVGClick,
  onWallClick,
  pts,
  onWallPointDown,
  getGroup,
  onTableDown,
  onTableClick,
  setHoveredTableId,
  pan,
}: SVGCanvasProps) => {
  const isAdding = isEditing && mode === "add";
  const ghostGeom = {
    size: newSeats,
    shape,
    ...(shape === TableShape.Rect && { heads: newHeads }),
  };
  const ghostCollides =
    isAdding && hasCollision(cursor.x, cursor.y, ghostGeom, tables, []);
  //punti dei muri trascinabili (in modalità Sposta o Muro)
  const wallPointsActive = isEditing && (mode === "move" || mode === "wall");

  return (
    <>
      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-max max-w-[calc(100%-1.5rem)]">
          <div className="bg-neutral-900/90 text-neutral-300 text-xs text-center px-3 py-1.5 rounded-2xl sm:rounded-full border border-neutral-700 backdrop-blur-sm shadow-lg">
            {hints[mode]}
          </div>
        </div>

        {/* Empty state */}
        {tables.length === 0 && walls.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <div className="text-7xl mb-4 opacity-10">🍴</div>
            <Label
              tag={LabelTags.p}
              label={
                isEditing
                  ? "Usa gli strumenti per creare la piantina"
                  : "Nessuna piantina salvata"
              }
              color={ThemeVariants.colors.text.secondary}
              size={LabelDimensions.small}
              noMargin
            />
          </div>
        )}

        {/* SVG */}
        <svg
          ref={svgRef}
          className={`group flex-1 select-none touch-none
              ${
                hoveredTableId
                  ? "cursor-pointer" // sopra un tavolo
                  : mode === "add" || mode === "wall"
                    ? "cursor-crosshair" // aggiunta elementi
                    : mode === "delete"
                      ? "cursor-not-allowed" // elimina
                      : panStart
                        ? "cursor-grabbing" // sta panando
                        : "cursor-grab" // sfondo libero = pan
              }
            `}
          style={{
            background: `repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.04) 39px,rgba(255,255,255,0.04) 40px),#1a1a1a`,
            width: `100%`,
          }}
          onPointerDownCapture={onPointerDownCapture}
          onPointerDown={onSVGDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={onUp}
          onClick={onSVGClick}
        >
          <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
            {/* Walls */}
            {walls.map((wl) => (
              <g key={wl.id}>
                <polyline
                  points={pts(wl.points)}
                  fill="none"
                  stroke="rgba(0,0,0,0.4)"
                  strokeWidth="14"
                  strokeLinecap={TableShape.Round}
                  strokeLinejoin={TableShape.Round}
                />
                <polyline
                  points={pts(wl.points)}
                  fill="none"
                  stroke="#92400e"
                  strokeWidth="10"
                  strokeLinecap={TableShape.Round}
                  strokeLinejoin={TableShape.Round}
                  className={
                    isEditing && mode === "delete" ? "cursor-pointer" : ""
                  }
                  onMouseEnter={(e) => {
                    if (isEditing && mode === "delete")
                      (e.target as SVGElement).setAttribute(
                        "stroke",
                        "#ef4444",
                      );
                  }}
                  onMouseLeave={(e) => {
                    (e.target as SVGElement).setAttribute("stroke", "#92400e");
                  }}
                  onClick={(e) => onWallClick(wl.id, e, isEditing)}
                />
                <polyline
                  points={pts(wl.points)}
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2"
                  strokeLinecap={TableShape.Round}
                  strokeLinejoin={TableShape.Round}
                  opacity="0.5"
                  style={{ pointerEvents: "none" }}
                />
                {wl.points.map((p, i) => (
                  <g
                    key={i}
                    onPointerDown={(e) => onWallPointDown(e, wl.id, i)}
                    style={{ cursor: wallPointsActive ? "grab" : "default" }}
                  >
                    {/* Area di presa più grande del punto, comoda da prendere con il dito */}
                    {wallPointsActive && (
                      <circle cx={p.x} cy={p.y} r={20} fill="transparent" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={wallPointsActive ? 9 : 5}
                      fill={wallPointsActive ? "#f59e0b" : "#b45309"}
                      stroke={wallPointsActive ? "#fff" : "#f59e0b"}
                      strokeWidth="2"
                      style={{ transition: "r 0.15s" }}
                    />
                  </g>
                ))}
              </g>
            ))}

            {/* Wall in progress */}
            {curWall && curWall.length > 0 && (
              <g>
                <polyline
                  points={pts([...curWall, cursor])}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="8"
                  strokeLinecap={TableShape.Round}
                  strokeLinejoin={TableShape.Round}
                  opacity="0.5"
                  strokeDasharray="12,5"
                  style={{ pointerEvents: "none" }}
                />
                <polyline
                  points={pts(curWall)}
                  fill="none"
                  stroke="#fb923c"
                  strokeWidth="8"
                  strokeLinecap={TableShape.Round}
                  strokeLinejoin={TableShape.Round}
                  style={{ pointerEvents: "none" }}
                />
                {curWall.map((p, i) => (
                  <circle
                    key={p.x + p.y + i}
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill="#f97316"
                    stroke="white"
                    strokeWidth="1.5"
                    style={{ pointerEvents: "none" }}
                  />
                ))}
              </g>
            )}

            {/* Shared edges */}
            {Array.from(groupMap.entries()).map(([gid, gtables]) => {
              const lines: React.ReactNode[] = [];
              for (let i = 0; i < gtables.length; i++)
                for (let j = i + 1; j < gtables.length; j++) {
                  const edge = sharedEdge(gtables[i], gtables[j]);
                  if (edge)
                    lines.push(
                      <line
                        key={`e-${i}-${j}`}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke="#a855f7"
                        strokeWidth="3"
                        opacity="0.9"
                        style={{ pointerEvents: "none" }}
                      />,
                    );
                  else
                    lines.push(
                      <line
                        key={`d-${i}-${j}`}
                        x1={gtables[i].x}
                        y1={gtables[i].y}
                        x2={gtables[j].x}
                        y2={gtables[j].y}
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray="8,5"
                        opacity="0.5"
                        style={{ pointerEvents: "none" }}
                      />,
                    );
                }
              return (
                <g key={gid}>
                  {lines}
                  {/* Contorno unico del gruppo: non passa sopra ai tavoli uniti */}
                  <path d={groupOutlinePath(gtables)} {...PURPLE_DASH} />
                </g>
              );
            })}

            {/* Tables */}
            {tables.map((table) => {
              const {
                fill,
                strokeClr,
                glow,
                isSel,
                isMergeAnc,
                bookingColors,
              } = getTableStyle(
                table,
                selTable,
                mergeAnchor,
                tables,
                selId,
                getGroup,
              );

              return (
                <g
                  key={table.id}
                  transform={`translate(${table.x},${table.y})`}
                  onPointerDown={(e) => onTableDown(e, table.id)}
                  onClick={(e) => onTableClick(e, table.id)}
                  onMouseEnter={() => setHoveredTableId(table.id)}
                  onMouseLeave={() => setHoveredTableId(null)}
                  className="cursor-pointer"
                  style={{
                    filter: isMergeAnc
                      ? "drop-shadow(0 0 14px #a855f7)"
                      : isSel
                        ? "drop-shadow(0 0 12px #f59e0b)"
                        : `drop-shadow(0 0 8px ${glow}) drop-shadow(0 3px 6px rgba(0,0,0,0.4))`,
                  }}
                >
                  {/* Group ring (i rettangolari usano il contorno unico del gruppo) */}
                  {table.groupId && table.shape === TableShape.Round && (
                    <circle r={tableRadius(table) + 8} {...PURPLE_DASH} />
                  )}

                  <TableShapeSVG
                    geom={table}
                    chairs={table.chairs}
                    fill={fill}
                    strokeClr={strokeClr}
                    label={tableLabel(table)}
                    subLabel={`${table.groupId ? "🔗 " : ""}${table.chairs.length} posti`}
                    arrival={arrivalLabel(table)}
                    bookingColors={bookingColors}
                    highlightBookingId={hoveredBookingId}
                  />
                </g>
              );
            })}

            {/* Anteprima del tavolo da aggiungere: segue il cursore e mostra la grandezza in base ai posti */}
            {isAdding && !hoveredTableId && (
              <g className="opacity-0 group-hover:opacity-100">
                <g
                  transform={`translate(${cursor.x},${cursor.y})`}
                  opacity={0.5}
                  style={{ pointerEvents: "none" }}
                >
                  <TableShapeSVG
                    geom={ghostGeom}
                    chairs={defaultChairs(ghostGeom)}
                    fill={ghostCollides ? "#dc2626" : "#16a34a"}
                    strokeClr={ghostCollides ? "#991b1b" : "#166534"}
                    label={nextTableName(tables)}
                    subLabel={`${newSeats} posti`}
                  />
                </g>
              </g>
            )}
          </g>
        </svg>
      </div>
    </>
  );
};
