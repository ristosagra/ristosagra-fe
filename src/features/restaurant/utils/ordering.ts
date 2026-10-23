import type { TakeawaySettings } from "../../orders/types/orders";
import {
  OrderingMode,
  PaymentTiming,
  ServiceMode,
  type RestaurantProfile,
} from "../types/restaurant";

//Regole che derivano da come l'amministratore fa funzionare il ristorante, usate da clienti,
//personale e cucina. I campi possono mancare se il backend non li ha ancora: valgono i predefiniti

//Le impostazioni che decidono quando si paga e se serve il tavolo
type PaymentRules = Pick<
  RestaurantProfile,
  "orderingMode" | "paymentTiming" | "serviceMode"
>;

//Si paga prima di mangiare, quindi prima che la cucina prepari: online, col ritiro al banco
//(si paga alla cassa e si ritira quando il numero è pronto) oppure alla cassa tipo sagra.
//Allora la cucina vede solo gli ordini pagati, in ordine di pagamento
export const paysBeforeKitchen = (p: PaymentRules | undefined) =>
  !!p &&
  (p.orderingMode === OrderingMode.PayOnline ||
    p.serviceMode === ServiceMode.Counter ||
    p.paymentTiming === PaymentTiming.BeforeMeal);

//Si paga alla cassa prima di mangiare (tipo sagra o ritiro al banco; online non conta)
export const isPayFirstAtCashier = (p: PaymentRules | undefined) =>
  !!p && p.orderingMode !== OrderingMode.PayOnline && paysBeforeKitchen(p);

//Gli ordini hanno pagato / da pagare da segnare: solo se i clienti ordinano dal sito e pagano
//alla cassa. Online sono già pagati; con Solo menù la cassa crea l'ordine quando il cliente
//paga (a fine pasto si incassa dai conti per tavolo)
export const marksOrdersPaid = (p: RestaurantProfile | undefined) =>
  p?.orderingMode === OrderingMode.PayAtCashier;

//Il cliente indica il tavolo (scritto o dal QR code) quando ordina dal sito già seduto: con
//ordine e pagamento dal sito, oppure pagando alla cassa a fine pasto (chi serve deve sapere
//dove portarlo). Se si paga alla cassa prima di mangiare il tavolo non si sa ancora
export const customerAsksTable = (p: PaymentRules | undefined) =>
  !!p &&
  (p.orderingMode === OrderingMode.PayOnline ||
    (p.orderingMode === OrderingMode.PayAtCashier && !paysBeforeKitchen(p)));

//Ordine sul posto creato dal personale: tavolo (obbligatorio) e nome solo a fine pasto. Se si
//paga prima (tipo sagra o ritiro al banco) il tavolo non si sa ancora: vale il numero d'ordine
export const staffOrderNeedsTable = (p: RestaurantProfile | undefined) =>
  !isPayFirstAtCashier(p);

//Il cliente ritira al banco quando il suo numero è pronto
export const usesCounterPickup = (p: RestaurantProfile | undefined) =>
  p?.serviceMode === ServiceMode.Counter;

//C'è un banco dove si consegnano gli ordini: col ritiro al banco tutti, altrimenti l'asporto (se attivo)
export const hasPickupDesk = (
  p: RestaurantProfile | undefined,
  takeaway: TakeawaySettings | undefined,
) => usesCounterPickup(p) || !!takeaway?.enabled;

//L'ordine si porta al tavolo: al banco si consegna solo l'asporto
export const takeawayOnlyDesk = (
  p: RestaurantProfile | undefined,
  takeaway: TakeawaySettings | undefined,
) => !!p && !usesCounterPickup(p) && !!takeaway?.enabled;

//I clienti ordinano dal sito (con Solo menù ordina la cassa)
export const customersOrderOnline = (p: RestaurantProfile | undefined) =>
  !!p && p.orderingMode !== OrderingMode.MenuOnly;

//Le comande passano dal capo cucina alle postazioni
export const usesKitchenDispatch = (p: RestaurantProfile | undefined) =>
  !!p?.kitchenDispatch && (p.kitchenStations ?? []).length > 0;
