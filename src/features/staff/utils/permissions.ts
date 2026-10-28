import { PagesCashier, type PagesCashierConst } from "../../../constant/pages";
import type { TakeawaySettings } from "../../orders/types/orders";
import {
  OrderingMode,
  type RestaurantProfile,
} from "../../restaurant/types/restaurant";
import {
  hasPickupDesk,
  isPayFirstAtCashier,
  takeawayOnlyDesk,
  usesKitchenDispatch,
} from "../../restaurant/utils/ordering";
import {
  STAFF_ROLE_LABELS,
  StaffRole,
  type SessionUser,
  type StaffMember,
  type StaffRoleConst,
} from "../types/staff";

//Cosa vede ogni ruolo nell'area del personale, adattato a come l'amministratore fa
//funzionare il ristorante. Nasconde soltanto: i permessi veri li controlla il backend

//Titolare e vice: stessi poteri su ristorante, ordini e cucina
export const isManager = (role: StaffRoleConst) =>
  role === StaffRole.Admin || role === StaffRole.Deputy;

//Il personale crea ordini solo se i clienti pagano alla cassa (col pagamento online pagano dal sito)
export const canCreateOrders = (profile: RestaurantProfile | undefined) =>
  !!profile && profile.orderingMode !== OrderingMode.PayOnline;

//Cameriere e caposala prendono ordini al tavolo solo se si paga a fine pasto (tipo
//ristorante): se si paga prima si ordina dal sito o alla cassa
const tableStaffTakesOrders = (profile: RestaurantProfile | undefined) =>
  canCreateOrders(profile) && !isPayFirstAtCashier(profile);

//Prende ordini al tavolo, da pagare alla cassa: solo sul posto, col tavolo, senza incassare
export const takesTableOrders = (role: StaffRoleConst) =>
  role === StaffRole.Waiter || role === StaffRole.HeadWaiter;

//Incassare (segnare gli ordini pagati) e modificare gli ordini
export const canTakePayments = (role: StaffRoleConst) =>
  isManager(role) || role === StaffRole.Cashier;

//Cambiare la disposizione di tavoli e muri (le prenotazioni ai tavoli le gestiscono anche i camerieri)
export const canEditFloorPlan = isManager;

//Smistare le comande alle postazioni della cucina
export const canDispatch = (role: StaffRoleConst) =>
  isManager(role) || role === StaffRole.Chef;

//Il caposala vede la cucina (anche lo smistamento) in sola lettura, per sapere cosa è pronto
export const kitchenReadOnly = (role: StaffRoleConst) =>
  role === StaffRole.HeadWaiter;

//Segnare un piatto esaurito (o di nuovo disponibile) durante il servizio: chi si accorge che
//è finito, cioè la cassa e il capo cucina (oltre a titolare e vice)
export const canMarkSoldOut = (role: StaffRoleConst) =>
  isManager(role) || role === StaffRole.Cashier || role === StaffRole.Chef;

//Ordine delle voci nella barra
const NAV_ORDER: PagesCashierConst[] = [
  PagesCashier.PROFILE,
  PagesCashier.FLORPLAN,
  PagesCashier.NEW_ORDER,
  PagesCashier.CASH,
  PagesCashier.KITCHEN,
  PagesCashier.PICKUP,
];

const ROLE_PAGES: Record<StaffRoleConst, PagesCashierConst[]> = {
  [StaffRole.Admin]: NAV_ORDER,
  [StaffRole.Deputy]: NAV_ORDER,
  [StaffRole.Cashier]: [
    PagesCashier.NEW_ORDER,
    PagesCashier.CASH,
    PagesCashier.PICKUP,
  ],
  [StaffRole.HeadWaiter]: [
    PagesCashier.FLORPLAN,
    PagesCashier.NEW_ORDER,
    PagesCashier.KITCHEN,
  ],
  [StaffRole.Waiter]: [PagesCashier.FLORPLAN, PagesCashier.NEW_ORDER],
  [StaffRole.Chef]: [PagesCashier.KITCHEN, PagesCashier.PICKUP],
  [StaffRole.Kitchen]: [PagesCashier.KITCHEN],
  [StaffRole.Counter]: [PagesCashier.PICKUP],
};

//Pagina che si apre dopo l'accesso
const HOME_PAGE: Record<StaffRoleConst, PagesCashierConst> = {
  [StaffRole.Admin]: PagesCashier.PROFILE,
  [StaffRole.Deputy]: PagesCashier.PROFILE,
  [StaffRole.Cashier]: PagesCashier.CASH,
  [StaffRole.HeadWaiter]: PagesCashier.FLORPLAN,
  [StaffRole.Waiter]: PagesCashier.FLORPLAN,
  [StaffRole.Chef]: PagesCashier.KITCHEN,
  [StaffRole.Kitchen]: PagesCashier.KITCHEN,
  [StaffRole.Counter]: PagesCashier.PICKUP,
};

//Pagine che il ruolo può aprire, nell'ordine della barra. Ritiro c'è col ritiro al banco
//e, se l'ordine si porta al tavolo, per consegnare l'asporto
export const staffPages = (
  role: StaffRoleConst,
  profile: RestaurantProfile | undefined,
  takeaway: TakeawaySettings | undefined,
): PagesCashierConst[] =>
  NAV_ORDER.filter(
    (p) =>
      ROLE_PAGES[role].includes(p) &&
      (p !== PagesCashier.NEW_ORDER ||
        (takesTableOrders(role)
          ? tableStaffTakesOrders(profile)
          : canCreateOrders(profile))) &&
      (p !== PagesCashier.PICKUP || hasPickupDesk(profile, takeaway)),
  );

export const staffHomePage = (role: StaffRoleConst) => HOME_PAGE[role];

//Perché un ruolo non serve con le impostazioni del ristorante (null = serve): il capo cucina
//solo con lo smistamento dall'app (con i bigliettini la cucina si divide a mano), il banco
//solo se c'è qualcosa da consegnare al banco. Chi ha già quel ruolo lo tiene, ma non ha pagine
export const roleUnavailableReason = (
  role: StaffRoleConst,
  profile: RestaurantProfile | undefined,
  takeaway: TakeawaySettings | undefined,
): string | null => {
  if (role === StaffRole.Chef && !usesKitchenDispatch(profile))
    return "serve solo con lo smistamento delle comande dall'app";
  if (role === StaffRole.Counter && !hasPickupDesk(profile, takeaway))
    return "serve solo col ritiro al banco o con l'asporto attivo";
  return null;
};

//Nome del ruolo: se l'ordine si porta al tavolo il banco consegna solo l'asporto
//(stesso ruolo e stesse credenziali: le due cose non capitano mai insieme)
export const staffRoleLabel = (
  role: StaffRoleConst,
  profile: RestaurantProfile | undefined,
  takeaway: TakeawaySettings | undefined,
) =>
  role === StaffRole.Counter && takeawayOnlyDesk(profile, takeaway)
    ? "Banco ritiro asporto"
    : STAFF_ROLE_LABELS[role];

//Gestione del personale: il titolare gestisce tutti (e solo lui nomina i vice);
//un vice gestisce gli altri ruoli e i propri dati, non il titolare né gli altri vice

const STAFF_ROLES_BY_MANAGER: StaffRoleConst[] = [
  StaffRole.Cashier,
  StaffRole.HeadWaiter,
  StaffRole.Waiter,
  StaffRole.Chef,
  StaffRole.Kitchen,
  StaffRole.Counter,
];

//Ruoli che chi gestisce il personale può dare
export const assignableRoles = (actor: StaffRoleConst): StaffRoleConst[] =>
  actor === StaffRole.Admin
    ? [StaffRole.Deputy, ...STAFF_ROLES_BY_MANAGER]
    : actor === StaffRole.Deputy
      ? STAFF_ROLES_BY_MANAGER
      : [];

//Modificare nome, username e password di una persona
export const canEditMember = (actor: SessionUser, member: StaffMember) =>
  actor.role === StaffRole.Admin ||
  (actor.role === StaffRole.Deputy &&
    (member.id === actor.id || !isManager(member.role)));

//Cambiarle ruolo e accesso o eliminarla: mai il titolare né se stessi
export const canManageMember = (actor: SessionUser, member: StaffMember) =>
  member.role !== StaffRole.Admin &&
  member.id !== actor.id &&
  (actor.role === StaffRole.Admin ||
    (actor.role === StaffRole.Deputy && !isManager(member.role)));
