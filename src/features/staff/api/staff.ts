import { httpClient } from "../../../services/client/httpClient";
import type { NewStaffMember, StaffMember, StaffUpdate } from "../types/staff";

//Personale del ristorante: solo l'amministratore
export const StaffService = {
  getStaff: (): Promise<StaffMember[]> => httpClient.get("/api/staff"),

  createStaff: (member: NewStaffMember): Promise<StaffMember> =>
    httpClient.post("/api/staff", member),

  updateStaff: (id: string, changes: StaffUpdate): Promise<StaffMember> =>
    httpClient.patch(`/api/staff/${encodeURIComponent(id)}`, changes),

  deleteStaff: (id: string): Promise<void> =>
    httpClient.delete(`/api/staff/${encodeURIComponent(id)}`),
};
