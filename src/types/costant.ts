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

export const CATEGORIES = ["Antipasti", "Primi", "Secondi", "Dolci", "Bevande"];

export const ButtonDimensions = {
  small: "w-10 h-7",
  medium: "w-12 h-8",
  large: "w-14 h-9",
  label: "px-4 py-1.5",
} as const;

export type ButtonDimensionsConst =
  (typeof ButtonDimensions)[keyof typeof ButtonDimensions];

export const LabelTags = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
};

export type LabelTagsConst = (typeof LabelTags)[keyof typeof LabelTags];

export const TextDimensions = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  xlarge: "text-2xl",
  xxxxlarge: "text-8xl",
} as const;

export type TextDimensionsConst =
  (typeof TextDimensions)[keyof typeof TextDimensions];

export const TextWeight = {
  bold: "font-bold",
  semibold: "font-semibold",
  normal: "font-normal",
} as const;

export type TextWeightConst = (typeof TextWeight)[keyof typeof TextWeight];
