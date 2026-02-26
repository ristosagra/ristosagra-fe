import type { CartType } from "../types/types";

export const postOrder = async (
  cart: CartType[],
): Promise<{ orderNumber: number }> => {
  const res = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cart),
  });
  if (!res.ok) throw new Error("Errore nella prenotazione");
  return res.json();
};
