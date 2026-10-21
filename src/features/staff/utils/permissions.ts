import { PagesCashier, type PagesCashierConst } from "../../../constant/pages";
import {
  OrderingMode,
  type RestaurantProfile,
} from "../../restaurant/types/restaurant";
import {
  isPayFirstAtCashier,
  usesCounterPickup,
} from "../../restaurant/utils/ordering";
import {
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

//Il cameriere prende ordini al tavolo solo se si paga a fine pasto (tipo ristorante):
//tipo sagra si ordina dal sito o alla cassa e si paga prima di sedersi
const waiterTakesOrders = (profile: RestaurantProfile | undefined) =>
  canCreateOrders(profile) && !isPayFirstAtCashier(profile);

//Incassare (segnare gli ordini pagati) e modificare gli ordini
export const canTakePayments = (role: StaffRoleConst) =>
  isManager(role) || role === StaffRole.Cashier;

//Cambiare la disposizione di tavoli e muri (le prenotazioni ai tavoli le gestiscono anche i camerieri)
export const canEditFloorPlan = isManager;

//Smistare le comande alle postazioni della cucina
export const canDispatch = (role: StaffRoleConst) =>
  isManager(role) || role === StaffRole.Chef;

//Consegnare gli ordini al banco (col ritiro al banco)
export const canHandOver = (role: StaffRoleConst) =>
  isManager(role) ||
  role === StaffRole.Cashier ||
  role === StaffRole.Chef ||
  role === StaffRole.Counter;

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
  [StaffRole.Waiter]: PagesCashier.FLORPLAN,
  [StaffRole.Chef]: PagesCashier.KITCHEN,
  [StaffRole.Kitchen]: PagesCashier.KITCHEN,
  [StaffRole.Counter]: PagesCashier.PICKUP,
};

//Pagine che il ruolo può aprire, nell'ordine della barra
export const staffPages = (
  role: StaffRoleConst,
  profile: RestaurantProfile | undefined,
): PagesCashierConst[] =>
  NAV_ORDER.filter(
    (p) =>
      ROLE_PAGES[role].includes(p) &&
      (p !== PagesCashier.NEW_ORDER ||
        (role === StaffRole.Waiter
          ? waiterTakesOrders(profile)
          : canCreateOrders(profile))) &&
      (p !== PagesCashier.PICKUP || usesCounterPickup(profile)),
  );

export const staffHomePage = (role: StaffRoleConst) => HOME_PAGE[role];

//Gestione del personale: il titolare gestisce tutti (e solo lui nomina i vice);
//un vice gestisce gli altri ruoli e i propri dati, non il titolare né gli altri vice

const STAFF_ROLES_BY_MANAGER: StaffRoleConst[] = [
  StaffRole.Cashier,
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
