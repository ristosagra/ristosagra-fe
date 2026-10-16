import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Container } from "../../components/core/Container";
import { Label } from "../../components/core/Label";
import { Input } from "../../components/core/Input";
import { Button } from "../../components/core/Button";
import { CounterCard } from "../../components/core/CounterCard";
import { Loader } from "../../components/core/Loader";
import {
  useAvailability,
  useCreateReservation,
} from "../../features/reservations/hook/useReservations";
import {
  FEW_SEATS_THRESHOLD,
  NOTES_MAX,
  SEAT_REQUEST_LABELS,
  SEAT_REQUESTS,
  type Reservation,
  type SeatRequestConst,
} from "../../features/reservations/types/reservations";
import { SEAT_REQUEST_ICONS } from "../../features/reservations/constant/seatRequests";
import { useRestaurant } from "../../features/restaurant/hook/useRestaurant";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import {
  formatRanges,
  isWithinRanges,
  openRanges,
  openServices,
  todayWeekday,
} from "../../helpers/openingHours";
import { ButtonDimensions } from "../../constant/button";
import { LabelDimensions, LabelTags, LabelWeight } from "../../constant/label";
import { ThemeVariants } from "../../constant/colors";
import { useNotification } from "../../hooks/useNotification";
import { NotificationType } from "../../types/notification";
import { PERSON_NAME_MAX } from "../../constant/limits";

//Prenotazione di posti dal cliente: nome, persone, orario di arrivo ed eventuali richieste sul posto
//(la piantina non è visibile).
//Quando restano pochi posti si mostra quanti e non si può prenotare per più persone.
export const BookTable = () => {
  const { data: availability, isLoading } = useAvailability();
  const { mutate: createReservation, isPending } = useCreateReservation();
  const { data: restaurant } = useRestaurant();
  const showNotification = useNotification();
  const now = useCurrentTime();

  const [name, setName] = useState("");
  const [people, setPeople] = useState(2);
  const [arrivalTime, setArrivalTime] = useState("");
  const [requests, setRequests] = useState<SeatRequestConst[]>([]);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);

  const remaining = availability?.remainingSeats ?? 0;
  const soldOut = remaining === 0;
  const count = Math.min(Math.max(people, 1), Math.max(remaining, 1));
  //Si prenota solo per oggi, negli orari di apertura e per un orario non ancora passato
  const today = restaurant?.openingHours[todayWeekday()];
  const services = today ? openServices(today) : [];
  const closedNow = !!today && !services.some((s) => now <= today[s].to);
  const arrivalValid =
    !today ||
    (isWithinRanges(openRanges(today), arrivalTime) && arrivalTime >= now);
  const canSubmit =
    !!name.trim() &&
    !!arrivalTime &&
    arrivalValid &&
    !soldOut &&
    !closedNow &&
    count <= remaining;

  //mantiene le richieste nell'ordine dell'elenco
  const toggleRequest = (r: SeatRequestConst) =>
    setRequests((prev) =>
      SEAT_REQUESTS.filter((x) =>
        x === r ? !prev.includes(r) : prev.includes(x),
      ),
    );

  const submit = () => {
    if (!canSubmit) return;
    createReservation(
      {
        name: name.trim(),
        people: count,
        arrivalTime,
        ...(requests.length > 0 && { seatRequests: requests }),
        ...(notes.trim() && { notes: notes.trim() }),
      },
      {
        onSuccess: (reservation) => setConfirmed(reservation),
        onError: () =>
          showNotification(
            "Non ci sono più abbastanza posti liberi",
            NotificationType.Err,
          ),
      },
    );
  };

  if (isLoading) return <Loader />;

  const cardClass = `${ThemeVariants.colors.bg.surface} ${ThemeVariants.colors.border.all.brand} ${ThemeVariants.borderRadius.xl} w-full max-w-lg p-5 sm:p-6`;

  if (confirmed) {
    const confirmedRequests = [
      ...(confirmed.seatRequests ?? []).map((r) => SEAT_REQUEST_LABELS[r]),
      ...(confirmed.notes ? [`"${confirmed.notes}"`] : []),
    ];
    return (
      <Container>
        <div className="min-h-full flex flex-col justify-center items-center py-8 sm:py-10 px-4 sm:px-5">
          <div
            className={`${cardClass} flex flex-col items-center gap-2 text-center`}
          >
            <CalendarCheck
              size={40}
              className={ThemeVariants.colors.text.brand}
            />
            <Label
              label="Prenotazione confermata"
              tag={LabelTags.h2}
              size={LabelDimensions.xlarge}
              weight={LabelWeight.bold}
              fontFamily={ThemeVariants.fontFamily.display}
              noMargin
            />
            <Label
              label={`${confirmed.name} · ${confirmed.people} ${confirmed.people === 1 ? "persona" : "persone"} · arrivo alle ${confirmed.arrivalTime}`}
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              color={ThemeVariants.colors.text.secondary}
              noMargin
            />
            {confirmedRequests.length > 0 && (
              <Label
                label={`Richieste: ${confirmedRequests.join(" · ")}`}
                tag={LabelTags.p}
                size={LabelDimensions.small}
                color={ThemeVariants.colors.text.secondary}
                noMargin
                additionalClasses="[overflow-wrap:anywhere]"
              />
            )}
            <Label
              label="Ti aspettiamo! Presentati alla cassa con il nome della prenotazione."
              tag={LabelTags.p}
              size={LabelDimensions.small}
              color={ThemeVariants.colors.text.secondary}
              noMargin
            />
            <Button
              label="Nuova prenotazione"
              onClick={() => {
                setConfirmed(null);
                setName("");
                setArrivalTime("");
                setRequests([]);
                setNotes("");
              }}
              dimension={ButtonDimensions.auto}
              variant="secondary"
              className="h-11 px-4 mt-3"
            />
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {isPending && <Loader />}
      <div className="min-h-full flex flex-col justify-center items-center py-8 sm:py-10 px-4 sm:px-5">
        <div className={`${cardClass} space-y-5`}>
          <div>
            <Label
              label="Prenota un posto"
              tag={LabelTags.h2}
              size={LabelDimensions.xlarge}
              weight={LabelWeight.bold}
              fontFamily={ThemeVariants.fontFamily.display}
              noMargin
            />
            <Label
              label="Indica il nome, quante persone siete e a che ora arrivate: al tavolo ci pensiamo noi."
              tag={LabelTags.p}
              size={LabelDimensions.small}
              color={ThemeVariants.colors.text.secondary}
              noMargin
            />
          </div>

          {closedNow || soldOut ? (
            <Label
              label={
                closedNow
                  ? services.length === 0
                    ? "Oggi il locale è chiuso: non si può prenotare."
                    : "Per oggi il locale ha chiuso: non si può più prenotare."
                  : "Siamo al completo: al momento non ci sono posti disponibili."
              }
              tag={LabelTags.p}
              size={LabelDimensions.medium}
              weight={LabelWeight.semibold}
              variant="danger"
              noMargin
              additionalClasses="py-2"
            />
          ) : (
            <>
              <div>
                <Label
                  label="Nome"
                  tag={LabelTags.p}
                  size={LabelDimensions.small}
                  color={ThemeVariants.colors.text.secondary}
                  noMargin
                  additionalClasses="mb-1.5"
                />
                <Input
                  type="text"
                  name="name"
                  placeholder="Es. Mario Rossi"
                  value={name}
                  setValue={setName}
                  variant="secondary"
                  className="w-full"
                  autoComplete="name"
                  maxLength={PERSON_NAME_MAX}
                  ariaLabel="Nome"
                />
              </div>

              <div>
                <Label
                  label="Quante persone?"
                  tag={LabelTags.p}
                  size={LabelDimensions.small}
                  color={ThemeVariants.colors.text.secondary}
                  noMargin
                  additionalClasses="mb-1.5"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <CounterCard
                    quantity={count}
                    decrement={() => setPeople(Math.max(1, count - 1))}
                    increment={() => setPeople(Math.min(remaining, count + 1))}
                  />
                  {remaining < FEW_SEATS_THRESHOLD && (
                    <Label
                      label={
                        remaining === 1
                          ? "Resta solo 1 posto"
                          : `Restano solo ${remaining} posti`
                      }
                      tag={LabelTags.p}
                      size={LabelDimensions.small}
                      weight={LabelWeight.semibold}
                      variant="danger"
                      noMargin
                    />
                  )}
                </div>
              </div>

              <div>
                <Label
                  label="Orario di arrivo"
                  tag={LabelTags.p}
                  size={LabelDimensions.small}
                  color={ThemeVariants.colors.text.secondary}
                  noMargin
                  additionalClasses="mb-1.5"
                />
                <Input
                  type="time"
                  placeholder="20:00"
                  value={arrivalTime}
                  setValue={setArrivalTime}
                  variant="secondary"
                  className="w-36"
                  ariaLabel="Orario di arrivo"
                />
                {today && (
                  <p
                    className={`text-sm mt-1.5 ${arrivalTime && !arrivalValid ? ThemeVariants.colors.text.danger : ThemeVariants.colors.text.secondary}`}
                  >
                    Orari di oggi: {formatRanges(openRanges(today))}
                  </p>
                )}
              </div>

              <div>
                <Label
                  label="Richieste sul posto (facoltativo)"
                  tag={LabelTags.p}
                  size={LabelDimensions.small}
                  color={ThemeVariants.colors.text.secondary}
                  noMargin
                  additionalClasses="mb-1.5"
                />
                <div className="flex flex-wrap gap-2 mb-2">
                  {SEAT_REQUESTS.map((r) => {
                    const Icon = SEAT_REQUEST_ICONS[r];
                    return (
                      <Button
                        key={r}
                        iconLeft={<Icon size={15} />}
                        label={
                          <span className="text-sm ml-1.5">
                            {SEAT_REQUEST_LABELS[r]}
                          </span>
                        }
                        onClick={() => toggleRequest(r)}
                        dimension={ButtonDimensions.auto}
                        variant={requests.includes(r) ? "primary" : "secondary"}
                        className="px-3 py-2"
                      />
                    );
                  })}
                </div>
                <Input
                  type="text"
                  placeholder="Altre richieste, es. vicino all'uscita"
                  value={notes}
                  setValue={setNotes}
                  maxLength={NOTES_MAX}
                  variant="secondary"
                  className="w-full"
                  ariaLabel="Altre richieste"
                />
              </div>

              <Button
                label="Prenota"
                fullWidth
                dimension={ButtonDimensions.auto}
                onClick={submit}
                variant="primary"
                disabled={!canSubmit || isPending}
                className="h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </>
          )}
        </div>
      </div>
    </Container>
  );
};
