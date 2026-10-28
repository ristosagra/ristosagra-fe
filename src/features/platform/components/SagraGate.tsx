import { HttpError } from "../../../services/client/httpClient";
import { useRestaurant } from "../../restaurant/hook/useRestaurant";
import { SagraUnavailable } from "./SagraUnavailable";

interface SagraGateProps {
  children: React.ReactNode;
  //la login resta aperta anche se la sagra non è attiva: il titolare la prepara
  allowInactive?: boolean;
}

//Pagine pubbliche della sagra: se l'indirizzo non è di nessuna sagra (404) o la sagra non è
//attiva lo si dice al posto della pagina. Mentre il profilo arriva si mostra la pagina,
//così le sagre attive non aspettano niente in più
export const SagraGate = ({ children, allowInactive }: SagraGateProps) => {
  const { data: restaurant, error } = useRestaurant();

  if (error instanceof HttpError && error.status === 404)
    return <SagraUnavailable reason="missing" />;
  if (restaurant?.active === false && !allowInactive)
    return <SagraUnavailable reason="offline" name={restaurant.name} />;
  return <>{children}</>;
};
