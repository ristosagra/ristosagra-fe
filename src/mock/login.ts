import { fakeDelay } from "./store";
import type { LoginResponse } from "../services/api/auth";

//Credenziali valide solo con i dati finti (VITE_MOCKING): non finiscono nel bundle di produzione
const CREDENTIALS = { username: "admin", password: "admin" };

export const fakeAuthApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    await fakeDelay(800);
    const success =
      username === CREDENTIALS.username && password === CREDENTIALS.password;
    return success ? { success, token: "fake-jwt-token-12345" } : { success };
  },
};
