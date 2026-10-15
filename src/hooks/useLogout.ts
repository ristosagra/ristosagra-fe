import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { clearToken } from "../services/auth/session";

//Dati pubblici (servono anche ai clienti): tutto il resto è della cassa
const PUBLIC_QUERIES = [
  "restaurant",
  "menu",
  "takeaway-settings",
  "reservations-availability",
];

//Uscita dalla cassa: toglie il token e cancella dalla memoria i dati riservati
//(ordini, prenotazioni con i nomi dei clienti...), utile sui dispositivi condivisi
export const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return () => {
    clearToken();
    queryClient.removeQueries({
      predicate: (q) => !PUBLIC_QUERIES.includes(String(q.queryKey[0])),
    });
    navigate("/login", { replace: true });
  };
};
