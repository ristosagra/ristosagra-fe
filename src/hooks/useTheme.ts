import { useEffect } from "react";
import { useRestaurant } from "../features/restaurant/hook/useRestaurant";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_BRAND_COLOR,
  darkerShade,
  toBrandHex,
} from "../features/restaurant/constant/brandColors";
import {
  RestaurantTheme,
  type RestaurantThemeConst,
} from "../features/restaurant/types/restaurant";

//Ultimo aspetto usato, per applicarlo subito al caricamento senza aspettare il profilo
const THEME_KEY = "theme";
const BRAND_KEY = "brandColor";

//Colore della barra del browser sul cellulare (= sfondo della pagina, vedi --bg-base in index.css)
const BROWSER_BAR_COLOR: Record<RestaurantThemeConst, string> = {
  [RestaurantTheme.Dark]: "#0f0e0d",
  [RestaurantTheme.Light]: "#faf8f5",
};

//I valori arrivano da localStorage o dal backend: si accettano solo quelli previsti
const isTheme = (v: unknown): v is RestaurantThemeConst =>
  Object.values(RestaurantTheme).includes(v as RestaurantThemeConst);

//Applica tema e colore: data-theme sull'<html> e le due tonalità del colore (quella scelta
//per il tema scuro, una più scura per il chiaro) come variabili CSS, da cui index.css ricava
//tutte le varianti
const applyAppearance = (theme: unknown, brandColor: unknown) => {
  const safeTheme = isTheme(theme) ? theme : DEFAULT_APPEARANCE.theme;
  const safeColor = toBrandHex(brandColor) ?? DEFAULT_APPEARANCE.brandColor;
  const root = document.documentElement;
  root.dataset.theme = safeTheme;
  root.style.setProperty("--accent-dark", safeColor);
  root.style.setProperty("--accent-light", darkerShade(safeColor));
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", BROWSER_BAR_COLOR[safeTheme]);
  try {
    localStorage.setItem(THEME_KEY, safeTheme);
    localStorage.setItem(BRAND_KEY, safeColor);
  } catch {
    // localStorage non disponibile: al prossimo caricamento si aspetta il profilo
  }
};

export const applyCachedAppearance = () => {
  try {
    applyAppearance(
      localStorage.getItem(THEME_KEY),
      localStorage.getItem(BRAND_KEY),
    );
  } catch {
    applyAppearance(DEFAULT_APPEARANCE.theme, DEFAULT_APPEARANCE.brandColor);
  }
};

//Piattaforma (landing e registrazione): non c'è un ristorante, si usa sempre il tema chiaro
//col colore di Ristosagra
export const applyPlatformAppearance = () =>
  applyAppearance(RestaurantTheme.Light, DEFAULT_BRAND_COLOR);

//Tema e colore scelti dal ristorante: uguali per cassa e clienti
export const useTheme = () => {
  const { data: restaurant } = useRestaurant();
  const theme = restaurant?.theme;
  const brandColor = restaurant?.brandColor;

  useEffect(() => {
    if (theme && brandColor) applyAppearance(theme, brandColor);
  }, [theme, brandColor]);
};
