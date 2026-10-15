import { createMockStore, fakeDelay } from "../../../mock/store";
import { floorPlanStore } from "../../floorPlan/mock/floorPlan";
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

export const fakeReservationsApi = {
  getReservations: async (): Promise<Reservation[]> => {
    await fakeDelay();
    return reservationsStore.get();
  },

  getAvailability: async (): Promise<Availability> => {
    await fakeDelay(300);
    return computeAvailability();
  },

  createReservation: async (data: NewReservation): Promise<Reservation> => {
    await fakeDelay(800);
    if (data.people > computeAvailability().remainingSeats)
      throw new Error("Posti insufficienti");
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
    const updated = reservationsStore
      .get()
      .map((r) => (r.id === id ? { ...r, ...changes } : r));
    reservationsStore.set(updated);
    return updated.find((r) => r.id === id)!;
  },

  deleteReservation: async (id: string): Promise<void> => {
    await fakeDelay();
    reservationsStore.set(reservationsStore.get().filter((r) => r.id !== id));
  },
};
