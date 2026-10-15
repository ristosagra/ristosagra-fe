import { useState } from "react";
import { Accessibility, ClipboardList, UserCheck, X } from "lucide-react";
import type { CoordinateType, TableData } from "../types/floorPlan";
import {
  allUnits,
  bookingSummaries,
  cancelBooking,
  formatSeatedTime,
  setBookingSeated,
  unitOccupancy,
} from "../helpers/booking";
import { tableLabel } from "../helpers/chair";
import { panToCenter } from "../helpers/view";
import type { RightPanelConst } from "../constant/floorPlan";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { Label } from "../../../components/core/Label";
import { ButtonDimensions } from "../../../constant/button";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";

const BookingFilter = {
  All: "all",
  Waiting: "waiting",
  Seated: "seated",
} as const;
type BookingFilterConst = (typeof BookingFilter)[keyof typeof BookingFilter];

const FILTERS: { key: BookingFilterConst; label: string }[] = [
  { key: BookingFilter.All, label: "Tutte" },
  { key: BookingFilter.Waiting, label: "In attesa" },
  { key: BookingFilter.Seated, label: "Seduti" },
];

interface BookingsPanelFloorPlanProps {
  tables: TableData[];
  selTable: TableData | null | undefined;
  zoom: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  setPan: (x: CoordinateType) => void;
  setSelId: (x: string | null) => void;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setHoveredBookingId: (x: string | null) => void;
  setRightPanel: (x: RightPanelConst | null) => void;
}

//Pannello laterale con tutte le prenotazioni divise per tavolo:
//si cerca per nome (o nome tavolo), si filtra per stato e si segnano gli arrivi senza aprire i tavoli
export const BookingsPanelFloorPlan = ({
  tables,
  selTable,
  zoom,
  svgRef,
  setPan,
  setSelId,
  setTables,
  setHoveredBookingId,
  setRightPanel,
}: BookingsPanelFloorPlanProps) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BookingFilterConst>(BookingFilter.All);

  const q = query.trim().toLowerCase();
  const units = allUnits(tables)
    .map((unit) => ({
      unit,
      label: unit.map(tableLabel).join(" + "),
      bookings: bookingSummaries(unit),
      occupancy: unitOccupancy(unit),
    }))
    .filter(({ bookings }) => bookings.length > 0)
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    );

  const all = units.flatMap((u) => u.bookings);
  const people = all.reduce((s, b) => s + b.seats, 0);
  const seatedPeople = all
    .filter((b) => b.seatedAt)
    .reduce((s, b) => s + b.seats, 0);

  //Applica ricerca e filtro: se la ricerca corrisponde al nome del tavolo si mostrano tutte le sue prenotazioni
  const visible = units
    .map((u) => ({
      ...u,
      bookings: u.bookings.filter(
        (b) =>
          (filter === BookingFilter.All ||
            (filter === BookingFilter.Seated) === !!b.seatedAt) &&
          (!q ||
            b.name.toLowerCase().includes(q) ||
            u.label.toLowerCase().includes(q)),
      ),
    }))
    .filter((u) => u.bookings.length > 0);

  //Seleziona il tavolo e centra la piantina su di esso
  const focusUnit = (unit: TableData[]) => {
    setSelId(unit[0].id);
    const pan = panToCenter(unit, svgRef.current, zoom);
    if (pan) setPan(pan);
  };

  const removeBooking = (bookingId: string) => {
    setTables((p) => cancelBooking(p, bookingId));
    setHoveredBookingId(null);
  };

  const toggleSeated = (bookingId: string, isSeated: boolean) =>
    setTables((p) =>
      setBookingSeated(
        p,
        bookingId,
        isSeated ? undefined : new Date().toISOString(),
      ),
    );

  return (
    <aside className="w-72 bg-neutral-900 border-l border-neutral-700 flex flex-col shrink-0 overflow-hidden">
      {/* Intestazione */}
      <div className="px-3 pt-3 pb-2 border-b border-neutral-700 space-y-2">
        <div className="flex items-center justify-between">
          <Label
            tag={LabelTags.p}
            iconLeft={<ClipboardList size={16} />}
            label="Prenotazioni"
            color={ThemeVariants.colors.text.white}
            size={LabelDimensions.small}
            noMargin
            additionalClasses="font-bold"
          />
          <Button
            iconLeft={<X size={16} />}
            onClick={() => setRightPanel(null)}
            dimension={ButtonDimensions.auto}
            variant="icon"
            className="text-neutral-400 hover:text-white p-1"
          />
        </div>
        <div className="text-xs text-neutral-400">
          {people} {people === 1 ? "persona" : "persone"} ·{" "}
          <span className="text-emerald-400 font-bold">
            {seatedPeople} {seatedPeople === 1 ? "seduta" : "sedute"}
          </span>{" "}
          · {people - seatedPeople} in attesa
        </div>
        <Input
          type="text"
          placeholder="Cerca nome o tavolo…"
          value={query}
          setValue={setQuery}
          variant="secondary"
          className="w-full text-sm py-1.5"
        />
        <div className="flex gap-1">
          {FILTERS.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => setFilter(key)}
              variant={filter === key ? "primary" : "secondary"}
              dimension={ButtonDimensions.auto}
              label={<span className="text-xs font-bold">{label}</span>}
              className="py-1"
              fullWidth
            />
          ))}
        </div>
      </div>

      {/* Elenco per tavolo */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {visible.length === 0 && (
          <Label
            tag={LabelTags.p}
            label={
              all.length === 0
                ? "Nessuna prenotazione. Clicca un tavolo e premi Prenota."
                : "Nessuna prenotazione trovata"
            }
            color={ThemeVariants.colors.text.secondary}
            size={LabelDimensions.small}
            noMargin
            additionalClasses="px-1 py-2"
          />
        )}
        {visible.map(({ unit, label, bookings, occupancy }) => {
          const isSel = !!selTable && unit.some((t) => t.id === selTable.id);
          return (
            <div
              key={unit[0].id}
              className={`rounded-lg border ${
                isSel
                  ? "border-amber-500 bg-neutral-800"
                  : "border-neutral-700 bg-neutral-800/50"
              }`}
            >
              <div
                onClick={() => focusUnit(unit)}
                className="flex items-center justify-between px-2.5 py-1.5 border-b border-neutral-700 cursor-pointer hover:bg-neutral-700/50 rounded-t-lg"
              >
                <span className="text-sm font-bold text-white truncate">
                  {label}
                </span>
                <span className="text-xs text-neutral-400 shrink-0 ml-2">
                  {occupancy.free} {occupancy.free === 1 ? "libero" : "liberi"}{" "}
                  su {occupancy.total}
                </span>
              </div>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => focusUnit(unit)}
                  onMouseEnter={() => setHoveredBookingId(b.id)}
                  onMouseLeave={() => setHoveredBookingId(null)}
                  className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-neutral-700/50"
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border-2"
                    style={
                      b.seatedAt
                        ? { background: b.color, borderColor: b.color }
                        : { borderColor: b.color }
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-bold flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{b.name}</span>
                      {b.wheelchairs > 0 && (
                        <Accessibility
                          size={14}
                          className="text-neutral-300 shrink-0"
                          aria-label="Carrozzina"
                        />
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {b.seats} {b.seats === 1 ? "posto" : "posti"} ·{" "}
                      {b.seatedAt ? (
                        <span className="text-emerald-400">
                          seduti dalle {formatSeatedTime(b.seatedAt)}
                        </span>
                      ) : (
                        <>
                          in attesa
                          {b.arrivalTime && (
                            <span className="text-amber-300 font-bold">
                              {" "}
                              · arrivo {b.arrivalTime}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  {/* Il clic sui pulsanti non deve selezionare il tavolo */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 shrink-0"
                  >
                    <Button
                      iconLeft={<UserCheck size={14} />}
                      label={
                        <span className="text-xs ml-1">
                          {b.seatedAt ? "Seduti" : "Arrivati"}
                        </span>
                      }
                      onClick={() => toggleSeated(b.id, !!b.seatedAt)}
                      dimension={ButtonDimensions.auto}
                      variant={b.seatedAt ? "success" : "secondary"}
                      className="px-1.5 py-1 hover:brightness-125"
                    />
                    <Button
                      iconLeft={<X size={14} />}
                      onClick={() => removeBooking(b.id)}
                      dimension={ButtonDimensions.auto}
                      variant="secondary"
                      className="hover:bg-rose-700 p-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
