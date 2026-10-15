import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fakeRestaurantApi } from "../mock/restaurant";
import { RestaurantService } from "../api/restaurant";
import type {
  RestaurantProfile,
  RestaurantProfileUpdate,
} from "../types/restaurant";

const isMocking = () => import.meta.env.VITE_MOCKING === "true";
const api = () => (isMocking() ? fakeRestaurantApi : RestaurantService);

export const useRestaurant = () =>
  useQuery({
    queryKey: ["restaurant"],
    queryFn: () => api().getProfile(),
  });

//Le modifiche si vedono subito (tema e colore compresi); se il salvataggio fallisce si torna indietro
export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (changes: RestaurantProfileUpdate) =>
      api().updateProfile(changes),
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: ["restaurant"] });
      const previous = queryClient.getQueryData<RestaurantProfile>([
        "restaurant",
      ]);
      if (previous)
        queryClient.setQueryData(["restaurant"], { ...previous, ...changes });
      return { previous };
    },
    onError: (_err, _changes, context) => {
      if (context?.previous)
        queryClient.setQueryData(["restaurant"], context.previous);
    },
    onSuccess: (saved) => queryClient.setQueryData(["restaurant"], saved),
  });
};
