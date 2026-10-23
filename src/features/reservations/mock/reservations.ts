import { createMockStore, fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import {
  isWithinRanges,
  nowHHMM,
  openRanges,
  todayWeekday,
} from "../../../helpers/openingHours";
import { floorPlanStore } from "../../floorPlan/mock/floorPlan";
import { readProfile } from "../../restaurant/mock/restaurant";
import { requireRole } from "../../staff/mock/auth";
import { StaffRole } from "../../staff/types/staff";
import type {
  Availability,
  NewReservation,
  Reservation,
  ReservationUpdate,
} from "../types/reservations";

//Prenotazioni finte salvate nel browser. "Rossi" è già in piantina (stesso id della prenotazione sul tavolo T-1).
const reservationsStore = createMockStore<Reservation[]>("reservations", () => [
  {
    id: "b-1700000000001",
    name: "Rossi",
    people: 2,
    arrivalTime: "20:30",
    createdAt: new Date().toISOString(),
  },
  {
    id: "r-1700000000101",
    name: "Colombo",
    people: 4,
    arrivalTime: "20:00",
    seatRequests: ["highchair"],
    notes: "Se possibile vicino all'uscita",
    createdAt: new Date().toISOString(),
  },
  {
    id: "r-1700000000102",
    name: "Esposito",
    people: 2,
    arrivalTime: "20:45",
    seatRequests: ["wheelchair"],
    createdAt: new Date().toISOString(),
  },
]);

//Posti liberi in piantina meno le persone delle prenotazioni non ancora sistemate
const computeAvailability = (): Availability => {
  const tables = floorPlanStore.get()?.tables ?? [];
  const chairs = tables.flatMap((t) => t.chairs);
  const placedIds = new Set(chairs.flatMap((c) => c.booking?.id ?? []));
  const freeSeats = chairs.filter((c) => !c.booking).length;
  const waiting = reservationsStore
    .get()
    .filter((r) => !placedIds.has(r.id))
    .reduce((s, r) => s + r.people, 0);
  return { remainingSeats: Math.max(0, freeSeats - waiting) };
};

//Prenotazioni del personale: gestori, caposala e camerieri
const requireFloorStaff = () =>
  requireRole(StaffRole.HeadWaiter, StaffRole.Waiter);

//Regole che il backend deve applicare (vedi API.md): arrivo oggi, negli orari di apertura e non
//già passato; posti sufficienti (altrimenti 409)
export const fakeReservationsApi = {
  getReservations: async (): Promise<Reservation[]> => {
    await fakeDelay();
    requireFloorStaff();
    return reservationsStore.get();
  },

  getAvailability: async (): Promise<Availability> => {
    await fakeDelay(300);
    return computeAvailability();
  },

  createReservation: async (data: NewReservation): Promise<Reservation> => {
    await fakeDelay(800);
    const today = openRanges(readProfile().openingHours[todayWeekday()]);
    if (
      !data.name.trim() ||
      !Number.isInteger(data.people) ||
      data.people < 1 ||
      !isWithinRanges(today, data.arrivalTime) ||
      data.arrivalTime < nowHHMM()
    )
      throw new HttpError(400);
    if (data.people > computeAvailability().remainingSeats)
      throw new HttpError(409);
    const reservation: Reservation = {
      ...data,
      id: `r-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    reservationsStore.set([...reservationsStore.get(), reservation]);
    return reservation;
  },

  updateReservation: async ({
    id,
    ...changes
  }: ReservationUpdate): Promise<Reservation> => {
    await fakeDelay();
    requireFloorStaff();
    const all = reservationsStore.get();
    const current = all.find((r) => r.id === id);
    if (!current) throw new HttpError(404);
    const updated = { ...current, ...changes };
    reservationsStore.set(all.map((r) => (r.id === id ? updated : r)));
    return updated;
  },

  deleteReservation: async (id: string): Promise<void> => {
    await fakeDelay();
    requireFloorStaff();
    reservationsStore.set(reservationsStore.get().filter((r) => r.id !== id));
  },
};
