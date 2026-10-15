import { useEffect } from "react";
import { useRestaurant } from "../features/restaurant/hook/useRestaurant";
import {
  BRAND_PALETTE,
  DEFAULT_APPEARANCE,
} from "../features/restaurant/constant/brandColors";
import type {
  BrandColorConst,
  RestaurantThemeConst,
} from "../features/restaurant/types/restaurant";

//Ultimo aspetto usato, per applicarlo subito al caricamento senza aspettare il profilo
const THEME_KEY = "theme";
const BRAND_KEY = "brandColor";

//Applica tema e colore: data-theme sull'<html> e le due tonalità del colore
//come variabili CSS, da cui index.css ricava tutte le varianti
const applyAppearance = (
  theme: RestaurantThemeConst,
  brandColor: BrandColorConst,
) => {
  const root = document.documentElement;
  const color =
    BRAND_PALETTE[brandColor] ?? BRAND_PALETTE[DEFAULT_APPEARANCE.brandColor];
  root.dataset.theme = theme;
  root.style.setProperty("--accent-dark", color.dark);
  root.style.setProperty("--accent-light", color.light);
  try {
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(BRAND_KEY, brandColor);
  } catch {
    // localStorage non disponibile: al prossimo caricamento si aspetta il profilo
  }
};

export const applyCachedAppearance = () => {
  try {
    applyAppearance(
      (localStorage.getItem(THEME_KEY) as RestaurantThemeConst | null) ??
        DEFAULT_APPEARANCE.theme,
      (localStorage.getItem(BRAND_KEY) as BrandColorConst | null) ??
        DEFAULT_APPEARANCE.brandColor,
    );
  } catch {
    applyAppearance(DEFAULT_APPEARANCE.theme, DEFAULT_APPEARANCE.brandColor);
  }
};

//Tema e colore scelti dal ristorante: uguali per cassa e clienti
export const useTheme = () => {
  const { data: restaurant } = useRestaurant();
  const theme = restaurant?.theme;
  const brandColor = restaurant?.brandColor;

  useEffect(() => {
    if (theme && brandColor) applyAppearance(theme, brandColor);
  }, [theme, brandColor]);
};
