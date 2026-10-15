import { useState } from "react";
import { Accessibility, BookOpenText } from "lucide-react";
import type { SeatRef, TableData } from "../types/floorPlan";
import { Modal } from "../../../components/core/Modal";
import type { ModalType } from "../../../types/general";
import { Label } from "../../../components/core/Label";
import { LabelDimensions, LabelTags } from "../../../constant/label";
import { ThemeVariants } from "../../../constant/colors";
import { Button } from "../../../components/core/Button";
import { ButtonDimensions } from "../../../constant/button";
import { Input } from "../../../components/core/Input";
import { CounterCard } from "../../../components/core/CounterCard";
import { tableLabel } from "../helpers/chair";
import { useReservations } from "../../reservations/hook/useReservations";
import { SeatRequest } from "../../reservations/types/reservations";
import { SeatRequestTags } from "../../reservations/components/SeatRequestTags";
import {
  addHeadChair,
  addableHeads,
  applyBooking,
  freeHeadSeats,
  getUnit,
  selectSeats,
  unitOccupancy,
  unitSeats,
} from "../helpers/booking";

interface ModalFloorPlanProps {
  tables: TableData[];
  modal: ModalType;
  setTables: React.Dispatch<React.SetStateAction<TableData[]>>;
  setModal: (x: ModalType) => void;
}

//Riga con checkbox ed etichetta
const CheckRow = ({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (x: boolean) => void;
  label: string;
  icon?: React.ReactNode;
}) => (
  <label className="flex items-center gap-2 cursor-pointer select-none">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-emerald-500 cursor-pointer"
    />
    <Label
      tag={LabelTags.p}
      label={label}
      iconLeft={icon}
      color={ThemeVariants.colors.text.white}
      size={LabelDimensions.small}
      noMargin
    />
  </label>
);

//Scelta tra 1 e 2 (posti a capotavola o carrozzine)
const OneOrTwo = ({
  value,
  onChange,
  labels,
  max,
}: {
  value: number;
  onChange: (x: 1 | 2) => void;
  labels: [string, string];
  max: number;
}) => (
  <div className="flex gap-2 pl-6">
    {([1, 2] as const).map((n) => (
      <Button
        key={n}
        label={<span className="text-xs font-bold">{labels[n - 1]}</span>}
        onClick={() => onChange(n)}
        dimension={ButtonDimensions.auto}
        variant={value === n ? "primary" : "secondary"}
        disabled={n > max}
        className="px-2.5 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
      />
    ))}
  </div>
);

export const ModalFloorPlan = ({
  tables,
  modal,
  setTables,
  setModal,
}: ModalFloorPlanProps) => {
  const table = tables.find((tt) => tt.id === modal.tableId);
  const unit = table ? getUnit(table, tables) : [];
  const { total, booked, free } = unitOccupancy(unit);
  const freeHeads = freeHeadSeats(unit).length;
  //Prenotazione online da sistemare: nome, persone e orario arrivano da lì
  const { data: reservations = [] } = useReservations();
  const reservation = modal.reservationId
    ? reservations.find((r) => r.id === modal.reservationId)
    : undefined;

  // Se il tavolo è vuoto di default si prenota tutto allo stesso nome
  const [sameName, setSameName] = useState(!reservation && booked === 0);
  const [guest, setGuest] = useState(reservation?.name ?? "");
  const [arrival, setArrival] = useState(reservation?.arrivalTime ?? "");
  const [people, setPeople] = useState(reservation?.people ?? 2);
  //le richieste del cliente (carrozzina, capotavola) preimpostano le opzioni del capotavola
  const requests = reservation?.seatRequests ?? [];
  const wantsWheelchair = requests.includes(SeatRequest.Wheelchair);
  const [addHead, setAddHead] = useState(
    wantsWheelchair || requests.includes(SeatRequest.Head),
  );
  const [wheelchair, setWheelchair] = useState(wantsWheelchair);
  const [wheelchairCount, setWheelchairCount] = useState<1 | 2>(1);

  //Prenotazione parziale: i posti si scelgono in fila (vedi selectSeats). Se la fila arriva
  //a una testata vuota si può aggiungere lì un posto a capotavola: si propone solo la testata
  //che la prenotazione occuperebbe davvero.
  const withAddedHead = (cand: ReturnType<typeof addableHeads>[number]) => {
    const next = addHeadChair(tables, cand);
    return getUnit(
      next.find((t) => t.id === table!.id)!,
      next,
    );
  };
  const wanted = Math.max(people, 1);
  const preview =
    sameName || !table ? null : selectSeats(unit, Math.min(wanted, free));
  const addable =
    preview && !preview.some((s) => s.head)
      ? addableHeads(unit).find((cand) => {
          const newIndex = unit.find((t) => t.id === cand.tableId)!.chairs
            .length;
          return selectSeats(
            withAddedHead(cand),
            Math.min(wanted, free + 1),
          )?.some((s) => s.tableId === cand.tableId && s.index === newIndex);
        })
      : undefined;
  const useAddedHead = !sameName && addHead && !!addable;
  const maxPeople = sameName ? free : free + (useAddedHead ? 1 : 0);
  const count = sameName ? free : Math.min(wanted, maxPeople);
  const selected: SeatRef[] | null = sameName
    ? unitSeats(unit).filter((s) => !s.booked)
    : table
      ? selectSeats(useAddedHead ? withAddedHead(addable!) : unit, count)
      : null;
  const hasHead = !!selected?.some((s) => s.head);
  const wheelchairs =
    wheelchair && hasHead
      ? sameName
        ? Math.min(wheelchairCount, freeHeads)
        : 1
      : 0;
  //una prenotazione online va sistemata per intero
  const missingSeats = reservation ? reservation.people - count : 0;
  const canConfirm =
    !!guest.trim() && !!selected && count >= 1 && missingSeats <= 0;

  const closeModal = () => setModal({ open: false, tableId: "" });

  //Con "stesso nome" prenota tutti i posti liberi, altrimenti solo quelli per le persone indicate,
  //in fila dopo le prenotazioni esistenti (o dal capotavola se il tavolo è vuoto)
  const confirmBooking = () => {
    if (!canConfirm || !selected) return;
    const wheelchairSeats = selected
      .filter((s) => s.head)
      .slice(0, wheelchairs);
    setTables((p) =>
      applyBooking(
        useAddedHead ? addHeadChair(p, addable!) : p,
        selected,
        {
          id: reservation?.id ?? `b-${Date.now()}`,
          name: guest.trim(),
          ...(arrival && { arrivalTime: arrival }),
        },
        wheelchairSeats,
      ),
    );
    closeModal();
  };

  return (
    <Modal
      icon={<BookOpenText />}
      title={reservation ? "Sistema prenotazione online" : "Nuova Prenotazione"}
      subTitle={
        <Label
          tag={LabelTags.p}
          label={`${unit.map(tableLabel).join(" + ")} · ${free} ${free === 1 ? "posto libero" : "posti liberi"} su ${total}`}
          color={ThemeVariants.colors.text.secondary}
          size={LabelDimensions.small}
          noMargin
        />
      }
    >
      {reservation ? (
        /* Dati della prenotazione online (si modificano dal pannello Online) */
        <div className="mb-5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2">
          <div className="text-white font-bold">{reservation.name}</div>
          <div className="text-xs text-neutral-400">
            {reservation.people}{" "}
            {reservation.people === 1 ? "persona" : "persone"} · arrivo{" "}
            <span className="text-amber-300">{reservation.arrivalTime}</span>
          </div>
          <SeatRequestTags reservation={reservation} />
          {missingSeats > 0 && (
            <div className="text-xs text-rose-300 mt-1">
              Posti liberi insufficienti: ne mancano {missingSeats}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-1">
            <CheckRow
              checked={sameName}
              onChange={setSameName}
              label="Prenotazione allo stesso nome"
            />
          </div>
          <Label
            tag={LabelTags.p}
            label={
              sameName
                ? free === 1
                  ? "L'unico posto libero verrà prenotato a questo nome"
                  : `Tutti i ${free} posti liberi verranno prenotati a questo nome`
                : "I posti verranno assegnati uno dopo l'altro, senza lasciare posti liberi tra un gruppo e l'altro"
            }
            color={ThemeVariants.colors.text.secondary}
            size={LabelDimensions.small}
            noMargin
            additionalClasses="mb-5 text-xs"
          />

          <Label
            tag={LabelTags.p}
            label="Nome cliente"
            additionalClasses="uppercase mb-2"
            size={LabelDimensions.small}
            color={ThemeVariants.colors.text.secondary}
            noMargin
          />
          <Input
            type="text"
            placeholder="Es. Mario Rossi"
            value={guest}
            setValue={setGuest}
            variant="secondary"
            className="w-full focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-5"
            autoFocus
          />

          <Label
            tag={LabelTags.p}
            label="Orario di arrivo (facoltativo)"
            additionalClasses="uppercase mb-2"
            size={LabelDimensions.small}
            color={ThemeVariants.colors.text.secondary}
            noMargin
          />
          <Input
            type="time"
            placeholder="20:30"
            value={arrival}
            setValue={setArrival}
            variant="secondary"
            className="w-32 [color-scheme:dark] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-5"
          />

          {!sameName && (
            <>
              <Label
                tag={LabelTags.p}
                label="Numero di persone"
                additionalClasses="uppercase mb-2"
                size={LabelDimensions.small}
                color={ThemeVariants.colors.text.secondary}
                noMargin
              />
              <div className="flex items-center gap-3 mb-5">
                <CounterCard
                  quantity={count}
                  decrement={() => setPeople(Math.max(1, count - 1))}
                  increment={() => setPeople(Math.min(maxPeople, count + 1))}
                />
                <Label
                  tag={LabelTags.p}
                  label={`min 1 · max ${maxPeople}`}
                  color={ThemeVariants.colors.text.secondary}
                  size={LabelDimensions.small}
                  noMargin
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Capotavola (solo tavoli o gruppi rettangolari) */}
      {!sameName && (addable || hasHead) && (
        <div className="flex flex-col gap-2 mb-5">
          {addable && (
            <CheckRow
              checked={addHead}
              onChange={setAddHead}
              label="Aggiungi un posto a capotavola"
            />
          )}
          {hasHead && (
            <div className={useAddedHead ? "pl-6" : "flex flex-col gap-2"}>
              {!useAddedHead && (
                <Label
                  tag={LabelTags.p}
                  label="La prenotazione comprende il posto a capotavola"
                  color={ThemeVariants.colors.text.secondary}
                  size={LabelDimensions.small}
                  noMargin
                  additionalClasses="text-xs"
                />
              )}
              <CheckRow
                checked={wheelchair}
                onChange={setWheelchair}
                label={
                  useAddedHead
                    ? "Per carrozzina"
                    : "Il capotavola è per una carrozzina"
                }
                icon={<Accessibility size={15} />}
              />
            </div>
          )}
        </div>
      )}
      {sameName && freeHeads > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          <CheckRow
            checked={wheelchair}
            onChange={setWheelchair}
            label="Carrozzina a capotavola"
            icon={<Accessibility size={15} />}
          />
          {wheelchair && freeHeads === 2 && (
            <OneOrTwo
              value={wheelchairs}
              onChange={setWheelchairCount}
              labels={["Un capotavola", "Entrambi"]}
              max={freeHeads}
            />
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          label="Conferma"
          onClick={confirmBooking}
          dimension={ButtonDimensions.auto}
          variant="success"
          disabled={!canConfirm}
          className="px-3 py-2 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:border-neutral-500"
        />
        <Button
          label="Annulla"
          onClick={closeModal}
          dimension={ButtonDimensions.auto}
          variant="secondary"
          className="px-3 py-2"
        />
      </div>
    </Modal>
  );
};
