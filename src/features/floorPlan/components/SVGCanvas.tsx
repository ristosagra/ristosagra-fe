import React from "react";
import type {
  CoordinateType,
  PanStartType,
  PlanMode,
  TableData,
  WallData,
  WallDragType,
  WallType,
} from "../../../types/floorPlan";
import {
  PLAN_CHAIR_R,
  PLAN_RECT_H,
  PLAN_RECT_W,
  PLAN_TABLE_R,
  TableShape,
} from "../constant/floorPlan";
import { chairPos } from "../helpers/chair";
import { getTableStyle } from "../helpers/tableStyle";
import { sharedEdge } from "../helpers/snap";

interface SVGCanvasProps {
  isEditing: boolean;
  hints: Record<PlanMode, string>;
  mode: PlanMode;
  tables: TableData[];
  walls: WallData[];
  svgRef: React.RefObject<SVGSVGElement | null>;
  hoveredTableId: string | null;
  panStart: PanStartType;
  curWall: WallType;
  didPan: React.RefObject<boolean>;
  cursor: CoordinateType;
  groupMap: Map<string, TableData[]>;
  selTable: TableData | null | undefined;
  mergeAnchor: string | null;
  selId: string | null;
  zoom: number;
  onSVGDown: (e: React.MouseEvent) => void;
  onMove: (e: React.MouseEvent) => void;
  onUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onSVGClick: (e: React.MouseEvent) => void;
  onWallClick: (
    wallId: string,
    e: React.MouseEvent,
    isEditing: boolean,
  ) => void;
  pts: (arr: CoordinateType[]) => string;
  setWallDrag: React.Dispatch<React.SetStateAction<WallDragType>>;
  getGroup: (gid: string) => TableData[];
  onTableDown: (e: React.MouseEvent, tid: string) => void;
  onTableClick: (e: React.MouseEvent, tid: string) => void;
  setHoveredTableId: React.Dispatch<React.SetStateAction<string | null>>;
  pan: CoordinateType;
}

export const SVGCanvas = ({
  isEditing,
  hints,
  mode,
  tables,
  walls,
  svgRef,
  hoveredTableId,
  panStart,
  curWall,
  didPan,
  cursor,
  groupMap,
  selTable,
  mergeAnchor,
  selId,
  zoom,
  onSVGDown,
  onMove,
  onUp,
  onWheel,
  onSVGClick,
  onWallClick,
  pts,
  setWallDrag,
  getGroup,
  onTableDown,
  onTableClick,
  setHoveredTableId,
  pan,
}: SVGCanvasProps) => {
  return (
    <>
      {/* ── Canvas ── */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Hint */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-neutral-900/90 text-neutral-300 text-xs px-3 py-1.5 rounded-full border border-neutral-700 backdrop-blur-sm shadow-lg">
            {hints[mode]}
          </div>
        </div>

        {/* Empty state */}
        {tables.length === 0 && walls.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <div className="text-7xl mb-4 opacity-10">🍴</div>
            <p className="text-neutral-600 text-sm">
              {isEditing
                ? "Usa gli strumenti per creare la piantina"
                : "Nessuna piantina salvata"}
            </p>
          </div>
        )}

        {/* SVG */}
        <svg
          ref={svgRef}
          className={`flex-1 select-none
              ${
                hoveredTableId
                  ? "cursor-pointer" // sopra un tavolo
                  : mode === "add4" || mode === "add8" || mode === "wall"
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
          onMouseDown={onSVGDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onWheel={onWheel}
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
                  <circle
                    key={p.x + p.y + i}
                    cx={p.x}
                    cy={p.y}
                    r={
                      isEditing && (mode === "move" || mode === "wall") ? 9 : 5
                    }
                    fill={
                      isEditing && (mode === "move" || mode === "wall")
                        ? "#f59e0b"
                        : "#b45309"
                    }
                    stroke={
                      isEditing && (mode === "move" || mode === "wall")
                        ? "#fff"
                        : "#f59e0b"
                    }
                    strokeWidth="2"
                    style={{
                      cursor:
                        isEditing && (mode === "move" || mode === "wall")
                          ? "grab"
                          : "default",
                      transition: "r 0.15s",
                    }}
                    onMouseDown={(e) => {
                      if (isEditing && (mode === "move" || mode === "wall")) {
                        e.stopPropagation();
                        didPan.current = false;
                        setWallDrag({ wallId: wl.id, pi: i });
                      }
                    }}
                  />
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
              return <g key={gid}>{lines}</g>;
            })}

            {/* Tables */}
            {tables.map((table) => {
              const {
                fill,
                strokeClr,
                glow,
                isSel,
                isMergeAnc,
                reservedBy,
                isReserved,
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
                  onMouseDown={(e) => onTableDown(e, table.id)}
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
                  {/* Group ring */}
                  {table.groupId &&
                    (table.shape === TableShape.Round ? (
                      <circle
                        r={PLAN_TABLE_R[table.size] + 8}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray="5,3"
                        opacity="0.7"
                        style={{ pointerEvents: "none" }}
                      />
                    ) : (
                      <rect
                        x={-PLAN_RECT_W[table.size] / 2 - 8}
                        y={-PLAN_RECT_H[table.size] / 2 - 8}
                        width={PLAN_RECT_W[table.size] + 16}
                        height={PLAN_RECT_H[table.size] + 16}
                        rx="14"
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeDasharray="5,3"
                        opacity="0.7"
                        style={{ pointerEvents: "none" }}
                      />
                    ))}

                  {/* Chairs */}
                  {table.chairs.map((c, i) => {
                    const { x, y } = chairPos(c, table.shape, table.size);
                    return (
                      <circle
                        key={x + y + i}
                        cx={x}
                        cy={y}
                        r={PLAN_CHAIR_R}
                        fill="#d97706"
                        stroke="#92400e"
                        strokeWidth="2"
                        opacity="0.9"
                      />
                    );
                  })}

                  {/* Body */}
                  {table.shape === TableShape.Round ? (
                    <>
                      <circle
                        r={PLAN_TABLE_R[table.size] + 2}
                        fill={strokeClr}
                      />
                      <circle
                        r={PLAN_TABLE_R[table.size]}
                        fill={fill}
                        style={{ transition: "fill 0.4s" }}
                      />
                      <circle
                        r={PLAN_TABLE_R[table.size] - 6}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1.5"
                      />
                    </>
                  ) : (
                    <>
                      <rect
                        x={-PLAN_RECT_W[table.size] / 2 - 2}
                        y={-PLAN_RECT_H[table.size] / 2 - 2}
                        width={PLAN_RECT_W[table.size] + 4}
                        height={PLAN_RECT_H[table.size] + 4}
                        rx="10"
                        fill={strokeClr}
                      />
                      <rect
                        x={-PLAN_RECT_W[table.size] / 2}
                        y={-PLAN_RECT_H[table.size] / 2}
                        width={PLAN_RECT_W[table.size]}
                        height={PLAN_RECT_H[table.size]}
                        rx="8"
                        fill={fill}
                        style={{ transition: "fill 0.4s" }}
                      />
                      <rect
                        x={-PLAN_RECT_W[table.size] / 2 + 6}
                        y={-PLAN_RECT_H[table.size] / 2 + 6}
                        width={PLAN_RECT_W[table.size] - 12}
                        height={PLAN_RECT_H[table.size] - 12}
                        rx="4"
                        fill="none"
                        stroke="rgba(255,255,255,0.12)"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.95)"
                    fontSize="11"
                    fontWeight="bold"
                    dy="-7"
                    style={{
                      pointerEvents: "none",
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {table.groupId ? "🔗" : ""}
                    {`T·${table.chairs.length}`}
                  </text>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="rgba(255,255,255,0.75)"
                    fontSize="9"
                    dy="8"
                    style={{
                      pointerEvents: "none",
                      fontFamily: "monospace",
                    }}
                  >
                    {isReserved ? (reservedBy?.slice(0, 11) ?? "") : "Libero"}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </>
  );
};
