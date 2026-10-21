import type { CartType, ConfirmedOrder } from "../types/orders";

//Controlli sui dati del cliente salvati nel browser (carrello, ultimo ordine): quelli
//non validi o di una versione precedente vengono scartati

//Dopo questo tempo il numero dell'ultimo ordine non viene più riproposto
const ORDER_TTL_MS = 12 * 60 * 60 * 1000;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const isCart = (v: unknown): v is CartType[] =>
  Array.isArray(v) &&
  v.every(
    (item) =>
      isRecord(item) &&
      typeof item.quantity === "number" &&
      item.quantity > 0 &&
      isRecord(item.dish) &&
      typeof item.dish.id === "number" &&
      typeof item.dish.name === "string" &&
      typeof item.dish.price === "number",
  );

export const isRecentOrder = (v: unknown): v is ConfirmedOrder =>
  isRecord(v) &&
  typeof v.orderNumber === "number" &&
  isCart(v.items) &&
  typeof v.confirmedAt === "string" &&
  Date.now() - Date.parse(v.confirmedAt) < ORDER_TTL_MS;
