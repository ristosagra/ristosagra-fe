import { MessageSquareText } from "lucide-react";
import { SEAT_REQUEST_LABELS, type Reservation } from "../types/reservations";
import { SEAT_REQUEST_ICONS } from "../constant/seatRequests";

//Richieste del cliente sul posto, mostrate alla cassa (piantina, sempre scura)
export const SeatRequestTags = ({
  reservation,
}: {
  reservation: Pick<Reservation, "seatRequests" | "notes">;
}) => {
  const requests = reservation.seatRequests ?? [];
  if (requests.length === 0 && !reservation.notes) return null;

  return (
    <div className="mt-1 space-y-1">
      {requests.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {requests.map((r) => {
            const Icon = SEAT_REQUEST_ICONS[r];
            return (
              <span
                key={r}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-sky-900/50 text-sky-200 border border-sky-700/70"
              >
                <Icon size={11} />
                {SEAT_REQUEST_LABELS[r]}
              </span>
            );
          })}
        </div>
      )}
      {reservation.notes && (
        <div className="flex gap-1 text-xs italic text-neutral-300">
          <MessageSquareText size={12} className="shrink-0 mt-0.5" />
          <span className="min-w-0 break-words">{reservation.notes}</span>
        </div>
      )}
    </div>
  );
};
