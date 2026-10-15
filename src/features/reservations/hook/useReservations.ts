import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ReservationsService } from "../api/reservations";
import { IS_MOCKING } from "../../../constant/env";
import type { NewReservation, ReservationUpdate } from "../types/reservations";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof ReservationsService> = IS_MOCKING
  ? () => import("../mock/reservations").then((m) => m.fakeReservationsApi)
  : () => Promise.resolve(ReservationsService);

//Elenco delle prenotazioni (lato ristorante), aggiornato spesso per vedere quelle nuove
export const useReservations = () =>
  useQuery({
    queryKey: ["reservations"],
    queryFn: async () => (await loadApi()).getReservations(),
    refetchInterval: 15000,
  });

//Posti ancora prenotabili (lato cliente)
export const useAvailability = () =>
  useQuery({
    queryKey: ["reservations-availability"],
    queryFn: async () => (await loadApi()).getAvailability(),
    refetchInterval: 30000,
  });

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NewReservation) =>
      (await loadApi()).createReservation(data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({
        queryKey: ["reservations-availability"],
      });
    },
  });
};

export const useUpdateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: ReservationUpdate) =>
      (await loadApi()).updateReservation(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await loadApi()).deleteReservation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
};
