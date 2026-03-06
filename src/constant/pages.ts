export const PagesCustomer = {
  HOME: "home",
  MENU: "menu",
  CART: "cart",
  RESERVATION: "reservation",
} as const;

export type PagesCustomerConst =
  (typeof PagesCustomer)[keyof typeof PagesCustomer];

export const PagesCashier = {
  HOME: "home",
  FLORPLAN: "florplan",
  CASH: "cash",
} as const;

export type PagesCashierConst =
  (typeof PagesCashier)[keyof typeof PagesCashier];
