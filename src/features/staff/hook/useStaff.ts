import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StaffService } from "../api/staff";
import { IS_MOCKING } from "../../../constant/env";
import type { NewStaffMember, StaffUpdate } from "../types/staff";

//Servizio reale o finto: il finto si carica solo con VITE_MOCKING
const loadApi: () => Promise<typeof StaffService> = IS_MOCKING
  ? () => import("../mock/staff").then((m) => m.fakeStaffApi)
  : () => Promise.resolve(StaffService);

export const useStaff = () =>
  useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await loadApi()).getStaff(),
  });

//Dopo ogni modifica si rilegge l'elenco (e chi ha fatto l'accesso, se ha cambiato il proprio nome)
const useStaffMutation = <T>(run: (input: T) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useCreateStaff = () =>
  useStaffMutation(async (member: NewStaffMember) =>
    (await loadApi()).createStaff(member),
  );

export const useUpdateStaff = () =>
  useStaffMutation(
    async ({ id, changes }: { id: string; changes: StaffUpdate }) =>
      (await loadApi()).updateStaff(id, changes),
  );

export const useDeleteStaff = () =>
  useStaffMutation(async (id: string) => (await loadApi()).deleteStaff(id));
