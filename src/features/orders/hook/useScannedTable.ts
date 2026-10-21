import { useEffect } from "react";
import { usePersistentState } from "../../../hooks/usePersistentState";
import { getUrlParam, removeUrlParams } from "../../../helpers/urlParams";
import { cleanTableName, TABLE_PARAM } from "../utils/tableQr";

const isTable = (v: unknown): v is string | null =>
  v === null || cleanTableName(v) === v;

//Tavolo del QR code inquadrato dal cliente: resta finché la scheda è aperta (un QR code
//nuovo vince su quello salvato) e sparisce dall'indirizzo, così non finisce nei link condivisi
export const useScannedTable = () => {
  const [table] = usePersistentState<string | null>("ristosagra.table", null, {
    storage: "session",
    validate: isTable,
    preferred: () => cleanTableName(getUrlParam(TABLE_PARAM)) ?? undefined,
  });

  useEffect(() => removeUrlParams(TABLE_PARAM), []);

  return table;
};
