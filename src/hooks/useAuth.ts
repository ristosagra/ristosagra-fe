import { useMutation } from "@tanstack/react-query";
import { AuthService } from "../services/api/auth";
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
