//Ruolo di chi lavora nel ristorante: decide cosa vede nell'area del personale
export const StaffRole = {
  //il titolare (uno solo): vede e decide tutto, compreso il personale
  Admin: "admin",
  //nominato dal titolare: stessi poteri, ma non può toccare il titolare né gli altri vice
  Deputy: "deputy",
  //crea gli ordini al bancone e incassa
  Cashier: "cashier",
  //responsabile di sala: tavoli e prenotazioni, ordini ai tavoli, comande della cucina in sola lettura
  HeadWaiter: "headWaiter",
  //vede i tavoli e prende gli ordini al tavolo
  Waiter: "waiter",
  //riceve tutte le comande e le smista alle postazioni della cucina
  Chef: "chef",
  //prepara le comande (con lo smistamento, quelle della sua postazione)
  Kitchen: "kitchen",
  //col ritiro al banco: chiama i numeri pronti e consegna gli ordini
  Counter: "counter",
} as const;
export type StaffRoleConst = (typeof StaffRole)[keyof typeof StaffRole];

export const STAFF_ROLES = Object.values(StaffRole);

export const STAFF_ROLE_LABELS: Record<StaffRoleConst, string> = {
  [StaffRole.Admin]: "Amministratore",
  [StaffRole.Deputy]: "Vice amministratore",
  [StaffRole.Cashier]: "Cassa",
  [StaffRole.HeadWaiter]: "Caposala",
  [StaffRole.Waiter]: "Cameriere",
  [StaffRole.Chef]: "Capo cucina",
  [StaffRole.Kitchen]: "Cucina",
  [StaffRole.Counter]: "Banco ritiro",
};

//Chi ha fatto l'accesso (lo dice il backend al login e con /api/auth/me)
export interface SessionUser {
  id: string;
  name: string;
  role: StaffRoleConst;
}

//Persona del ristorante con il suo accesso: la password non torna mai dal backend
export interface StaffMember extends SessionUser {
  username: string;
  //false = non può accedere (l'account resta, es. per la prossima sagra)
  enabled: boolean;
}

//Nuova persona: username e password li sceglie l'amministratore
export interface NewStaffMember extends Omit<StaffMember, "id"> {
  password: string;
}

//Modifica: solo i campi cambiati; la password solo se va cambiata
export type StaffUpdate = Partial<NewStaffMember>;

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 40;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;
