import { fakeDelay } from "./store";
import type { LoginResponse } from "../services/api/auth";
import type { SessionUser } from "../features/staff/types/staff";
import {
  currentMockUser,
  mockToken,
  staffStore,
} from "../features/staff/mock/staff";

//Accesso con le persone del personale finto (vedi features/staff/mock/staff.ts, una per ruolo:
//admin, cassa, cameriere, cucina, con password uguale allo username). Solo con VITE_MOCKING:
//non finiscono nel bundle di produzione
export const fakeAuthApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    await fakeDelay(800);
    const member = staffStore
      .get()
      .find(
        (m) =>
          m.enabled &&
          m.username.toLowerCase() === username.trim().toLowerCase() &&
          m.password === password,
      );
    if (!member) return { success: false };
    const { id, name, role } = member;
    return { success: true, token: mockToken(id), user: { id, name, role } };
  },

  me: async (): Promise<SessionUser> => {
    await fakeDelay(200);
    const { id, name, role } = currentMockUser();
    return { id, name, role };
  },
};
