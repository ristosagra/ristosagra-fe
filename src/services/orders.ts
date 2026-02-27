import type { Order } from "../types/types";

export const getOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Errore nel caricamento degli ordini");
  return res.json();
};

export const updateOrderPayment = async (
  id: number,
  paid: boolean,
): Promise<void> => {
  const res = await fetch(`/api/orders/${id}/payment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paid }),
  });
  if (!res.ok) throw new Error("Errore nell'aggiornamento del pagamento");
};
