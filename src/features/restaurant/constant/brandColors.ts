import {
  BrandColor,
  RestaurantTheme,
  type BrandColorConst,
  type RestaurantProfile,
} from "../types/restaurant";

//"dark" è usato con il tema scuro e come sfondo dei pulsanti,
//"light" (più scuro) per i testi colorati con il tema chiaro
export const BRAND_PALETTE: Record<
  BrandColorConst,
  { label: string; dark: string; light: string }
> = {
  [BrandColor.Orange]: {
    label: "Arancione",
    dark: "#e8712a",
    light: "#d4601e",
  },
  [BrandColor.Red]: { label: "Rosso", dark: "#e05252", light: "#c53030" },
  [BrandColor.Pink]: { label: "Rosa", dark: "#e0558f", light: "#c2185b" },
  [BrandColor.Violet]: { label: "Viola", dark: "#9b6cf0", light: "#7048d0" },
  [BrandColor.Blue]: { label: "Blu", dark: "#4f8fe8", light: "#2563b0" },
  [BrandColor.Teal]: { label: "Turchese", dark: "#2bb3a3", light: "#0f8a7c" },
  [BrandColor.Green]: { label: "Verde", dark: "#5fae4a", light: "#3f7f2c" },
  [BrandColor.Brown]: { label: "Marrone", dark: "#b98055", light: "#8a5a33" },
};

export const BRAND_COLORS = Object.values(BrandColor);

//Aspetto usato finché il profilo non è caricato (o se il backend non lo indica)
export const DEFAULT_APPEARANCE: Pick<
  RestaurantProfile,
  "theme" | "brandColor"
> = {
  theme: RestaurantTheme.Dark,
  brandColor: BrandColor.Orange,
};
