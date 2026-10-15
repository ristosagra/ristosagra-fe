//Tema del sito, scelto dal ristorante e usato anche dai clienti
export const RestaurantTheme = {
  Dark: "dark",
  Light: "light",
} as const;

export type RestaurantThemeConst =
  (typeof RestaurantTheme)[keyof typeof RestaurantTheme];

//Colore delle parti colorate (pulsanti, titoli, prezzi...), scelto da una palette
export const BrandColor = {
  Orange: "orange",
  Red: "red",
  Pink: "pink",
  Violet: "violet",
  Blue: "blue",
  Teal: "teal",
  Green: "green",
  Brown: "brown",
} as const;

export type BrandColorConst = (typeof BrandColor)[keyof typeof BrandColor];

//Dati del profilo del ristorante mostrati a cassa e clienti
export interface RestaurantProfile {
  name: string;
  theme: RestaurantThemeConst;
  brandColor: BrandColorConst;
}

export type RestaurantProfileUpdate = Partial<RestaurantProfile>;

//Lunghezza massima del nome, perché stia nella barra in alto
export const RESTAURANT_NAME_MAX = 40;
