import {
  OrderingMode,
  PaymentTiming,
  ServiceMode,
  type RestaurantProfile,
} from "../types/restaurant";

//Regole che derivano da come l'amministratore fa funzionare il ristorante, usate da clienti,
//personale e cucina. I campi possono mancare se il backend non li ha ancora: valgono i predefiniti

//Si paga prima che la cucina prepari: online, oppure alla cassa tipo sagra.
//Allora la cucina vede solo gli ordini pagati, in ordine di pagamento
export const paysBeforeKitchen = (p: RestaurantProfile | undefined) =>
  !!p &&
  (p.orderingMode === OrderingMode.PayOnline ||
    p.paymentTiming === PaymentTiming.BeforeMeal);

//Tipo sagra: si paga alla cassa prima di sedersi (con il pagamento online non conta)
export const isPayFirstAtCashier = (p: RestaurantProfile | undefined) =>
  !!p &&
  p.orderingMode !== OrderingMode.PayOnline &&
  p.paymentTiming === PaymentTiming.BeforeMeal;

//Il cliente indica il tavolo quando ordina dal sito: solo se ordina già seduto
//(pagamento online o alla cassa a fine pasto)
export const customerAsksTable = (
  p:
    | Pick<
        RestaurantProfile,
        "orderingMode" | "paymentTiming" | "tableOrdering"
      >
    | undefined,
) =>
  !!p &&
  !!p.tableOrdering &&
  (p.orderingMode === OrderingMode.PayOnline ||
    (p.orderingMode === OrderingMode.PayAtCashier &&
      p.paymentTiming !== PaymentTiming.BeforeMeal));

//Il cliente ritira al banco quando il suo numero è pronto
export const usesCounterPickup = (p: RestaurantProfile | undefined) =>
  p?.serviceMode === ServiceMode.Counter;

//Le comande passano dal capo cucina alle postazioni
export const usesKitchenDispatch = (p: RestaurantProfile | undefined) =>
  !!p?.kitchenDispatch && (p.kitchenStations ?? []).length > 0;
