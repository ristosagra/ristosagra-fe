import { useMutation, useQuery } from "@tanstack/react-query";
import { AuthService } from "../services/api/auth";
import { getSessionUser, setSessionUser } from "../services/auth/session";
import { IS_MOCKING } from "../constant/env";

//Servizio reale o finto: il finto (con le credenziali di prova) si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof AuthService> = IS_MOCKING
  ? () => import("../mock/login").then((m) => m.fakeAuthApi)
  : () => Promise.resolve(AuthService);

export const useLogin = () =>
  useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => (await loadApi()).login(username, password),
  });

//Chi ha fatto l'accesso: si parte da quello salvato e si riconferma col backend
//(se nel frattempo l'amministratore gli ha tolto l'accesso, il 401 riporta al login)
export const useCurrentUser = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const user = await (await loadApi()).me();
      setSessionUser(user);
      return user;
    },
    initialData: getSessionUser() ?? undefined,
    //quello salvato va comunque riconfermato subito
    initialDataUpdatedAt: 0,
  });
