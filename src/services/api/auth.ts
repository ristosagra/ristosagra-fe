import { httpClient } from "../client/httpClient";
import type { SessionUser } from "../../features/staff/types/staff";

export type LoginResponse = {
  success: boolean;
  token?: string;
  //chi ha fatto l'accesso (nome e ruolo)
  user?: SessionUser;
};

export const AuthService = {
  login: (username: string, password: string): Promise<LoginResponse> =>
    httpClient.post(
      "/api/auth/login",
      { username, password },
      // il login non invia un eventuale token vecchio e un 401 non deve rimandare al login
      { auth: false },
    ),

  //chi ha fatto l'accesso, aggiornato (l'amministratore può avergli cambiato nome o ruolo)
  me: (): Promise<SessionUser> => httpClient.get("/api/auth/me"),
};
