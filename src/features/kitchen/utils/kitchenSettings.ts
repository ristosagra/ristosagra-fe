import type { KitchenStation } from "../../restaurant/types/restaurant";

//Postazioni non valide: con lo smistamento ne serve almeno una, con nomi presenti e diversi
export const kitchenSettingsError = (
  dispatch: boolean,
  stations: KitchenStation[],
): string | null => {
  if (!dispatch) return null;
  if (stations.length === 0) return "Aggiungi almeno una postazione";
  const names = stations.map((s) => s.name.trim().toLowerCase());
  if (names.some((n) => !n)) return "Ogni postazione deve avere un nome";
  return new Set(names).size === names.length
    ? null
    : "Due postazioni hanno lo stesso nome";
};

//Id di una postazione nuova (il backend lo conserva così com'è)
export const newStationId = () => `st-${Date.now()}`;
