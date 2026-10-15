import { httpClient } from "../client/httpClient";

export type LoginResponse = { success: boolean; token?: string };

export const AuthService = {
  login: (username: string, password: string): Promise<LoginResponse> =>
    httpClient.post(
      "/api/auth/login",
      { username, password },
      // il login non invia un eventuale token vecchio e un 401 non deve rimandare al login
      { auth: false },
    ),
};
