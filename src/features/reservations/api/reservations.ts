import { httpClient } from "../../../services/client/httpClient";
import type {
  Availability,
  NewReservation,
  Reservation,
  ReservationUpdate,
} from "../types/reservations";

export const ReservationsService = {
  getReservations: (): Promise<Reservation[]> =>
    httpClient.get("/api/reservations"),

  getAvailability: (): Promise<Availability> =>
    httpClient.get("/api/reservations/availability"),

  createReservation: (data: NewReservation): Promise<Reservation> =>
    httpClient.post("/api/reservations", data),

  updateReservation: ({
    id,
    ...changes
  }: ReservationUpdate): Promise<Reservation> =>
    httpClient.patch(`/api/reservations/${id}`, changes),

  deleteReservation: (id: string): Promise<void> =>
    httpClient.delete(`/api/reservations/${id}`),
};
