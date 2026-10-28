import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RestaurantService } from "../api/restaurant";
import { IS_MOCKING } from "../../../constant/env";
import type {
  RestaurantProfile,
  RestaurantProfileUpdate,
} from "../types/restaurant";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof RestaurantService> = IS_MOCKING
  ? () => import("../mock/restaurant").then((m) => m.fakeRestaurantApi)
  : () => Promise.resolve(RestaurantService);

//refetchInterval: per ricontrollare spesso (es. mentre si aspetta la conferma del pagamento)
export const useRestaurant = (options?: { refetchInterval?: number | false }) =>
  useQuery({
    queryKey: ["restaurant"],
    queryFn: async () => (await loadApi()).getProfile(),
    refetchInterval: options?.refetchInterval,
  });

//Le modifiche si vedono subito (tema e colore compresi); se il salvataggio fallisce si torna indietro
export const useUpdateRestaurant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (changes: RestaurantProfileUpdate) =>
      (await loadApi()).updateProfile(changes),
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
