import { useState } from "react";
import { Check, Globe, MapPin, Pencil, Undo2, X } from "lucide-react";
import type { CoordinateType, TableData } from "../types/floorPlan";
import type { RightPanelConst } from "../constant/floorPlan";
import {
  cancelBooking,
  getUnit,
  isPlaced,
  placedTables,
  resizeBookingOnMap,
  updateBookingDetails,
} from "../helpers/booking";
import { tableLabel } from "../helpers/chair";
import { panToCenter } from "../helpers/view";
import {
  useDeleteReservation,
  useReservations,
  useUpdateReservation,
} from "../../reservations/hook/useReservations";
import type { Reservation } from "../../reservations/types/reservations";
import { SeatRequestTags } from "../../reservations/components/SeatRequestTags";
import { Button } from "../../../components/core/Button";
import { Input } from "../../../components/core/Input";
import { Label } from "../../../components/core/Label";
import { CounterCard } from "../../../components/core/CounterCard";
import { ButtonDimensions } from "../../../constant/button";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { useNotification } from "../../../hooks/useNotification";
import { NotificationType } from "../../../types/notification";

interface OnlineReservationsPanelProps {
  tables: TableData[];
  zoom: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  placingReservationId: string | null;
  setPan: (x: CoordinateType) => void;
  setSelId: (x: string | null) => void;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setHoveredBookingId: (x: string | null) => void;
  setRightPanel: (x: RightPanelConst | null) => void;
  setPlacingReservationId: (x: string | null) => void;
}

type Draft = Pick<Reservation, "id" | "name" | "people" | "arrivalTime">;

//Pannello delle prenotazioni fatte dai clienti: quelle da sistemare in piantina
//e quelle già sistemate, collegate ai posti tramite lo stesso id
export const OnlineReservationsPanelFloorPlan = ({
  tables,
  zoom,
  svgRef,
  placingReservationId,
  setPan,
  setSelId,
  setTables,
  setHoveredBookingId,
  setRightPanel,
  setPlacingReservationId,
}: OnlineReservationsPanelProps) => {
  const { data: reservations = [] } = useReservations();
  const { mutate: updateReservation, isPending: isSaving } =
    useUpdateReservation();
  const { mutate: deleteReservation } = useDeleteReservation();
  const showNotification = useNotification();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const byArrival = [...reservations].sort((a, b) =>
    a.arrivalTime.localeCompare(b.arrivalTime),
  );
  const waiting = byArrival.filter((r) => !isPlaced(tables, r.id));
  const placed = byArrival.filter((r) => isPlaced(tables, r.id));

  const focus = (r: Reservation) => {
    const first = placedTables(tables, r.id)[0];
    if (!first) return;
    const unit = getUnit(first, tables);
    setSelId(first.id);
    const pan = panToCenter(unit, svgRef.current, zoom);
    if (pan) setPan(pan);
  };

  //Toglie dalla piantina senza eliminare la prenotazione
  const unplace = (id: string) => {
    setTables((p) => cancelBooking(p, id));
    setHoveredBookingId(null);
  };

  //Eliminare la prenotazione la toglie anche dalla piantina
  const remove = (r: Reservation) =>
    deleteReservation(r.id, {
      onSuccess: () => {
        setTables((p) => cancelBooking(p, r.id));
        setConfirmDeleteId(null);
        if (placingReservationId === r.id) setPlacingReservationId(null);
        showNotification(
          `Prenotazione di ${r.name} eliminata`,
          NotificationType.Info,
        );
      },
    });

  //Salva le modifiche; se è già in piantina aggiorna i posti: se ne servono di più si usano
  //quelli liberi consecutivi, altrimenti la prenotazione viene tolta e va sistemata di nuovo
  const save = () => {
    if (!draft || !draft.name.trim() || !draft.arrivalTime) return;
    const changes = { ...draft, name: draft.name.trim() };
    updateReservation(changes, {
      onSuccess: () => {
        setDraft(null);
        if (!isPlaced(tables, changes.id)) return;
        const res = resizeBookingOnMap(
          updateBookingDetails(tables, changes.id, {
            name: changes.name,
            arrivalTime: changes.arrivalTime,
          }),
          changes.id,
          changes.people,
        );
        setTables(res.tables);
        if (res.removed)
          showNotification(
            `Non ci sono posti vicini liberi: ${changes.name} è stato tolto dalla piantina, sistemalo di nuovo`,
            NotificationType.Err,
          );
      },
      onError: () =>
        showNotification(
          "Errore nel salvataggio della prenotazione",
          NotificationType.Err,
        ),
    });
  };

  const renderRow = (r: Reservation, isOnMap: boolean) => {
    if (draft?.id === r.id)
      return (
        <div key={r.id} className="px-2.5 py-2 space-y-2 bg-neutral-800">
          <Input
            type="text"
            placeholder="Nome"
            value={draft.name}
            setValue={(v) =>
              setDraft((d) =>
                d ? { ...d, name: typeof v === "function" ? v(d.name) : v } : d,
              )
            }
            variant="secondary"
            className="w-full text-sm py-1"
          />
          <div className="flex items-center gap-2">
            <CounterCard
              quantity={draft.people}
              decrement={() =>
                setDraft((d) =>
                  d ? { ...d, people: Math.max(1, d.people - 1) } : d,
                )
              }
              increment={() =>
                setDraft((d) => (d ? { ...d, people: d.people + 1 } : d))
              }
            />
            <Input
              type="time"
              placeholder="20:00"
              value={draft.arrivalTime}
              setValue={(v) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        arrivalTime:
                          typeof v === "function" ? v(d.arrivalTime) : v,
                      }
                    : d,
                )
              }
              variant="secondary"
              className="w-24 text-sm py-1 [color-scheme:dark]"
            />
          </div>
          <div className="flex justify-end gap-1">
            <Button
              iconLeft={<X size={14} />}
              label={<span className="text-xs ml-1">Annulla</span>}
              onClick={() => setDraft(null)}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="px-2 py-1"
            />
            <Button
              iconLeft={<Check size={14} />}
              label={<span className="text-xs ml-1">Salva</span>}
              onClick={save}
              dimension={ButtonDimensions.auto}
              variant="success"
              disabled={!draft.name.trim() || !draft.arrivalTime || isSaving}
              className="px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      );

    const where = placedTables(tables, r.id).map(tableLabel).join(" + ");
    const isPlacing = placingReservationId === r.id;
    return (
      <div
        key={r.id}
        onClick={() => isOnMap && focus(r)}
        onMouseEnter={() => isOnMap && setHoveredBookingId(r.id)}
        onMouseLeave={() => isOnMap && setHoveredBookingId(null)}
        className={`flex items-start gap-2 px-2.5 py-2 ${isOnMap ? "cursor-pointer hover:bg-neutral-700/50" : ""} ${isPlacing ? "bg-amber-900/40" : ""}`}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white font-bold truncate">{r.name}</div>
          <div className="text-xs text-neutral-400">
            {r.people} {r.people === 1 ? "persona" : "persone"} ·{" "}
            <span className="text-amber-300">{r.arrivalTime}</span>
          </div>
          {isOnMap && (
            <div className="flex items-center gap-1 text-xs text-neutral-300">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{where}</span>
            </div>
          )}
          <SeatRequestTags reservation={r} />
        </div>
        {/* Azioni in colonna: Sistema/Togli sopra, modifica ed elimina sotto.
            Il clic sui pulsanti non deve selezionare il tavolo */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col gap-1 w-[4.75rem] shrink-0"
        >
          {confirmDeleteId === r.id ? (
            <>
              <span className="text-xs text-rose-300 text-center py-1">
                Eliminare?
              </span>
              <div className="flex gap-1">
                <Button
                  label={<span className="text-xs">Sì</span>}
                  onClick={() => remove(r)}
                  dimension={ButtonDimensions.auto}
                  variant="danger"
                  className="flex-1 py-1"
                />
                <Button
                  label={<span className="text-xs">No</span>}
                  onClick={() => setConfirmDeleteId(null)}
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  className="flex-1 py-1"
                />
              </div>
            </>
          ) : (
            <>
              {isOnMap ? (
                <Button
                  iconLeft={<Undo2 size={14} />}
                  label={<span className="text-xs ml-1">Togli</span>}
                  onClick={() => unplace(r.id)}
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  fullWidth
                  className="py-1"
                />
              ) : (
                <Button
                  iconLeft={<MapPin size={14} />}
                  label={
                    <span className="text-xs ml-1">
                      {isPlacing ? "Annulla" : "Sistema"}
                    </span>
                  }
                  onClick={() =>
                    setPlacingReservationId(isPlacing ? null : r.id)
                  }
                  dimension={ButtonDimensions.auto}
                  variant={isPlacing ? "primary" : "secondary"}
                  fullWidth
                  className="py-1"
                />
              )}
              <div className="flex gap-1">
                <Button
                  iconLeft={<Pencil size={14} />}
                  onClick={() =>
                    setDraft({
                      id: r.id,
                      name: r.name,
                      people: r.people,
                      arrivalTime: r.arrivalTime,
                    })
                  }
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  className="flex-1 py-1"
                />
                <Button
                  iconLeft={<X size={14} />}
                  onClick={() => setConfirmDeleteId(r.id)}
                  dimension={ButtonDimensions.auto}
                  variant="secondary"
                  className="flex-1 py-1 hover:bg-rose-700"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const section = (
    title: string,
    list: Reservation[],
    isOnMap: boolean,
    empty: string,
  ) => (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800/50">
      <div className="px-2.5 py-1.5 border-b border-neutral-700 text-sm font-bold text-white">
        {title} ({list.length})
      </div>
      {list.length === 0 ? (
        <div className="px-2.5 py-2 text-xs text-neutral-400">{empty}</div>
      ) : (
        /* Divisorio tra una prenotazione e l'altra */
        <div className="divide-y divide-neutral-600">
          {list.map((r) => renderRow(r, isOnMap))}
        </div>
      )}
    </div>
  );

  return (
    <aside className="w-72 bg-neutral-900 border-l border-neutral-700 flex flex-col shrink-0 overflow-hidden">
      <div className="px-3 pt-3 pb-2 border-b border-neutral-700 space-y-1">
        <div className="flex items-center justify-between">
          <Label
            tag={LabelTags.p}
            iconLeft={<Globe size={16} />}
            label="Prenotazioni online"
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
          Premi «Sistema» e poi clicca un tavolo per metterle in piantina
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {section(
          "Da sistemare",
          waiting,
          false,
          "Nessuna prenotazione da sistemare",
        )}
        {section(
          "In piantina",
          placed,
          true,
          "Nessuna prenotazione in piantina",
        )}
      </div>
    </aside>
  );
};
