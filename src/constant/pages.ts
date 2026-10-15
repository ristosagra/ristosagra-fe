export const PagesCustomer = {
  HOME: "home",
  MENU: "menu",
  CART: "cart",
  RESERVATION: "reservation",
  BOOK_TABLE: "book-table",
} as const;

export type PagesCustomerConst =
  (typeof PagesCustomer)[keyof typeof PagesCustomer];

export const PagesCashier = {
  PROFILE: "profile",
  FLORPLAN: "florplan",
  CASH: "cash",
} as const;

export type PagesCashierConst =
  (typeof PagesCashier)[keyof typeof PagesCashier];
