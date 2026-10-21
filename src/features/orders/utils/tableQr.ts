import { TABLE_NAME_MAX } from "../../../constant/limits";

//Il QR code sul tavolo apre il sito con ?tavolo=<nome del tavolo nella piantina>
export const TABLE_PARAM = "tavolo";

//Nome del tavolo ripulito, o null se manca o non è valido (il QR code si può falsificare)
export const cleanTableName = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const name = value.trim();
  return name && name.length <= TABLE_NAME_MAX ? name : null;
};

//Indirizzo da mettere nel QR code di un tavolo
export const tableQrUrl = (table: string) =>
  `${window.location.origin}/?${new URLSearchParams({ [TABLE_PARAM]: table })}`;
