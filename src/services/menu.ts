import type { Dish } from "../types/types";

export const getDishes = async (): Promise<Dish[]> => {
  const res = await fetch("/api/menu");
  if (!res.ok) throw new Error("Errore nel caricamento del menù");
  return res.json();
};
