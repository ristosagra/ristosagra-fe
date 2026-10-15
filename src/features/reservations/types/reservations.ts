//Prenotazione di posti fatta dal cliente (senza vedere la piantina).
//Quando la cassa la mette in piantina, le sedie hanno booking.id uguale all'id della prenotazione.
export interface Reservation {
  id: string;
  name: string;
  people: number;
  //orario di arrivo previsto (HH:MM)
  arrivalTime: string;
  //richieste del cliente sul tipo di posto
  seatRequests?: SeatRequestConst[];
  //altre richieste scritte dal cliente
  notes?: string;
  createdAt: string;
}

export const SeatRequest = {
  Wheelchair: "wheelchair",
  Head: "head",
  HighChair: "highchair",
} as const;

export type SeatRequestConst = (typeof SeatRequest)[keyof typeof SeatRequest];

export const SEAT_REQUEST_LABELS: Record<SeatRequestConst, string> = {
  [SeatRequest.Wheelchair]: "Carrozzina",
  [SeatRequest.Head]: "Capotavola",
  [SeatRequest.HighChair]: "Seggiolone",
};

//Ordine in cui si mostrano le richieste
export const SEAT_REQUESTS = Object.values(SeatRequest);

//Lunghezza massima delle altre richieste
export const NOTES_MAX = 200;

export type NewReservation = Pick<
  Reservation,
  "name" | "people" | "arrivalTime" | "seatRequests" | "notes"
>;

export type ReservationUpdate = Pick<Reservation, "id"> &
  Partial<NewReservation>;

//Posti ancora prenotabili dai clienti
export interface Availability {
  remainingSeats: number;
}

//Sotto questa soglia al cliente si mostra quanti posti restano
export const FEW_SEATS_THRESHOLD = 10;
