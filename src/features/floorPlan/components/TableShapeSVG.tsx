import { Accessibility } from "lucide-react";
import {
  PLAN_CHAIR_R,
  PLAN_FREE_CHAIR,
  TableShape,
} from "../constant/floorPlan";
import type { Chair, TableGeom } from "../types/floorPlan";
import { chairPos } from "../helpers/chair";
import { rectHeight, rectWidth, tableRadius } from "../helpers/dimensions";
import { formatSeatedTime } from "../helpers/booking";

interface TableShapeSVGProps {
  geom: TableGeom;
  chairs: Chair[];
  fill: string;
  strokeClr: string;
  label: string;
  subLabel?: string;
  //orario del prossimo arrivo previsto, mostrato sotto le scritte
  arrival?: string;
  bookingColors?: Record<string, string>;
  highlightBookingId?: string | null;
}

const MAX_LABEL = 12;

//Stile di una sedia: libera (vuota), prenotata in attesa (anello del colore della prenotazione)
//o con i commensali seduti (piena del colore della prenotazione)
const chairStyle = (color: string | undefined, seated: boolean) => {
  if (!color)
    return {
      fill: PLAN_FREE_CHAIR.fill,
      stroke: PLAN_FREE_CHAIR.stroke,
      strokeWidth: 2,
    };
  if (seated)
    return { fill: color, stroke: "rgba(0,0,0,0.55)", strokeWidth: 2 };
  return { fill: PLAN_FREE_CHAIR.fill, stroke: color, strokeWidth: 3.5 };
};

//Disegna sedie e piano del tavolo centrati in (0,0), ruotati secondo il tavolo.
//Le scritte restano sempre dritte.
export const TableShapeSVG = ({
  geom,
  chairs,
  fill,
  strokeClr,
  label,
  subLabel,
  arrival,
  bookingColors = {},
  highlightBookingId,
}: TableShapeSVGProps) => {
  const w = rectWidth(geom),
    h = rectHeight(geom),
    r = tableRadius(geom);
  const text =
    label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1)}…` : label;

  return (
    <>
      <g transform={`rotate(${geom.rotation ?? 0})`}>
        {/* Chairs */}
        {chairs.map((c, i) => {
          const { x, y } = chairPos(c, geom);
          const color = c.booking ? bookingColors[c.booking.id] : undefined;
          const seated = !!c.booking?.seatedAt;
          const isHl = !!c.booking && c.booking.id === highlightBookingId;
          const st = chairStyle(color, seated);
          const wheelchair = !!c.booking?.wheelchair;
          // il posto per la carrozzina è un po' più grande per contenere l'icona
          const r =
            (wheelchair ? PLAN_CHAIR_R + 3 : PLAN_CHAIR_R) + (isHl ? 2 : 0);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={st.fill}
                stroke={isHl ? "#ffffff" : st.stroke}
                strokeWidth={isHl ? 3 : st.strokeWidth}
                style={{ transition: "r 0.15s" }}
              >
                {c.booking && (
                  <title>
                    {`${c.booking.name}${wheelchair ? " · carrozzina" : ""}${
                      c.booking.arrivalTime
                        ? ` · arrivo ${c.booking.arrivalTime}`
                        : ""
                    } · ${
                      c.booking.seatedAt
                        ? `seduti dalle ${formatSeatedTime(c.booking.seatedAt)}`
                        : "in attesa"
                    }`}
                  </title>
                )}
              </circle>
              {/* Icona della carrozzina, sempre dritta anche se il tavolo è ruotato */}
              {wheelchair && (
                <g
                  transform={`translate(${x},${y}) rotate(${-(geom.rotation ?? 0)})`}
                  style={{ pointerEvents: "none" }}
                >
                  <Accessibility
                    x={-8}
                    y={-8}
                    size={16}
                    strokeWidth={2.5}
                    color={seated ? "#171717" : color}
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* Body */}
        {geom.shape === TableShape.Round ? (
          <>
            <circle r={r + 2} fill={strokeClr} />
            <circle r={r} fill={fill} style={{ transition: "fill 0.4s" }} />
            <circle
              r={r - 6}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1.5"
            />
          </>
        ) : (
          <>
            <rect
              x={-w / 2 - 2}
              y={-h / 2 - 2}
              width={w + 4}
              height={h + 4}
              rx="10"
              fill={strokeClr}
            />
            <rect
              x={-w / 2}
              y={-h / 2}
              width={w}
              height={h}
              rx="8"
              fill={fill}
              style={{ transition: "fill 0.4s" }}
            />
            <rect
              x={-w / 2 + 6}
              y={-h / 2 + 6}
              width={w - 12}
              height={h - 12}
              rx="4"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1.5"
            />
          </>
        )}
      </g>

      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.95)"
        fontSize="11"
        fontWeight="bold"
        dy={arrival ? -11 : subLabel ? -6 : 0}
        style={{
          pointerEvents: "none",
          fontFamily: "monospace",
          letterSpacing: "0.05em",
        }}
      >
        {text}
      </text>
      {subLabel && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(255,255,255,0.75)"
          fontSize="9"
          dy={arrival ? 2 : 8}
          style={{ pointerEvents: "none", fontFamily: "monospace" }}
        >
          {subLabel}
        </text>
      )}
      {arrival && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="#fcd34d"
          fontSize="9"
          fontWeight="bold"
          dy="14"
          style={{ pointerEvents: "none", fontFamily: "monospace" }}
        >
          {`🕐 ${arrival}`}
        </text>
      )}
    </>
  );
};
