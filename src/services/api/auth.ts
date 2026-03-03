import { httpClient } from "../client/httpClient";

export const AuthService = {
  login: (username: string, password: string): Promise<{ success: boolean }> =>
    httpClient.post("/api/auth/login", { username, password }),
};
