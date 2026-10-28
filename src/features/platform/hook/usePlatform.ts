import { useMutation, useQuery } from "@tanstack/react-query";
import { PlatformService } from "../api/platform";
import { IS_MOCKING } from "../../../constant/env";
import type { SignupRequest } from "../types/platform";
import { slugError } from "../utils/slug";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof PlatformService> = IS_MOCKING
  ? () => import("../mock/platform").then((m) => m.fakePlatformApi)
  : () => Promise.resolve(PlatformService);

//Se l'indirizzo è libero: si chiede solo per indirizzi ben scritti
export const useSlugAvailability = (slug: string) =>
  useQuery({
    queryKey: ["slug", slug],
    queryFn: async () => (await loadApi()).checkSlug(slug),
    enabled: slugError(slug) === null,
    staleTime: 10_000,
  });

export const useSignup = () =>
  useMutation({
    mutationFn: async (request: SignupRequest) =>
      (await loadApi()).signup(request),
  });
