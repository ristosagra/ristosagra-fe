import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fakeReservationsApi } from "../mock/reservations";
import { ReservationsService } from "../api/reservations";
import type { NewReservation, ReservationUpdate } from "../types/reservations";

const isMocking = () => import.meta.env.VITE_MOCKING === "true";
const api = () => (isMocking() ? fakeReservationsApi : ReservationsService);

//Elenco delle prenotazioni (lato ristorante), aggiornato spesso per vedere quelle nuove
export const useReservations = () =>
  useQuery({
    queryKey: ["reservations"],
    queryFn: () => api().getReservations(),
    refetchInterval: 15000,
  });

//Posti ancora prenotabili (lato cliente)
export const useAvailability = () =>
  useQuery({
    queryKey: ["reservations-availability"],
    queryFn: () => api().getAvailability(),
    refetchInterval: 30000,
  });

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewReservation) => api().createReservation(data),
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
    mutationFn: (data: ReservationUpdate) => api().updateReservation(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
};

export const useDeleteReservation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api().deleteReservation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
};
