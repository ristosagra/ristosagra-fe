import { readHandoff } from "../features/platform/mock/handoff";
import { billingStore } from "../features/platform/mock/billingStore";
import { addEdition } from "../features/platform/utils/edition";
import { restaurantStore } from "../features/restaurant/mock/restaurant";
import { staffStore } from "../features/staff/mock/auth";
import { StaffRole } from "../features/staff/types/staff";

//Solo dati finti: la sagra appena registrata su ristosagra.it arriva qui con i suoi dati nel
//frammento dell'indirizzo (vedi features/platform/mock/handoff.ts). Si leggono una volta
//prima del primo render, si tolgono subito dall'indirizzo e diventano i dati finti di questa
//sagra: nome, titolare (username = email) unico membro del personale, edizione pagata
export const consumeSignupHandoff = () => {
  const handoff = readHandoff(window.location.hash);
  if (!handoff) return;
  const url = new URL(window.location.href);
  url.hash = "";
  window.history.replaceState(window.history.state, "", url);

  const { restaurantName, owner, billing } = handoff;
  restaurantStore.set({ ...restaurantStore.get(), name: restaurantName });
  staffStore.set([
    {
      id: "s-admin",
      name: owner.name,
      role: StaffRole.Admin,
      username: owner.email,
      password: owner.password,
      enabled: true,
    },
  ]);
  billingStore.set({
    paidUntil: addEdition(null, new Date()),
    details: billing,
  });
};
