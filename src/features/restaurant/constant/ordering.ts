import { OrderingMode, type OrderingModeConst } from "../types/restaurant";

//Nomi delle modalità di ordine, uguali nelle impostazioni e nel riepilogo del profilo
export const ORDERING_MODE_LABELS: Record<OrderingModeConst, string> = {
  [OrderingMode.MenuOnly]: "Solo menù",
  [OrderingMode.PayAtCashier]: "Ordine dal sito, pagamento alla cassa",
  [OrderingMode.PayOnline]: "Ordine e pagamento dal sito",
};
