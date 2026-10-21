import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth/session";

//Dati pubblici (servono anche ai clienti): tutto il resto è del personale
const PUBLIC_QUERIES = [
  "restaurant",
  "menu",
  "takeaway-settings",
  "reservations-availability",
  "pickup-board",
];

//Uscita dall'area del personale: toglie token e utente e cancella dalla memoria i dati riservati
//(ordini, prenotazioni con i nomi dei clienti, personale...), utile sui dispositivi condivisi
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    clearSession();
    queryClient.removeQueries({
      predicate: (q) => !PUBLIC_QUERIES.includes(String(q.queryKey[0])),
    });
    navigate("/login", { replace: true });
  };
};
