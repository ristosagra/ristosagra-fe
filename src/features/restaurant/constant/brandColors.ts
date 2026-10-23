import { RestaurantTheme, type RestaurantProfile } from "../types/restaurant";

//Colore del ristorante: esadecimale "#rrggbb". Con il tema scuro si usa così (sfondo dei
//pulsanti e testi colorati), con il tema chiaro una tonalità più scura per i testi

const HEX = /^#[0-9a-f]{6}$/i;

//Colori dei profili salvati quando si sceglieva tra 8 nomi: restano validi
const LEGACY_COLORS: Record<string, string> = {
  orange: "#e8712a",
  red: "#e05252",
  pink: "#e0558f",
  violet: "#9b6cf0",
  blue: "#4f8fe8",
  teal: "#2bb3a3",
  green: "#5fae4a",
  brown: "#b98055",
};

export const DEFAULT_BRAND_COLOR = LEGACY_COLORS.orange;

//Colore valido (anche da un vecchio nome) in minuscolo, altrimenti null: i valori arrivano
//dal backend o da localStorage
export const toBrandHex = (value: unknown): string | null =>
  typeof value !== "string"
    ? null
    : HEX.test(value)
      ? value.toLowerCase()
      : (LEGACY_COLORS[value] ?? null);

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;

const channels = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

//h 0–360, s e l 0–100
const hslToHex = (h: number, s: number, l: number) => {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) =>
    light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
};

//Tonalità più scura, per i testi colorati sul tema chiaro
export const darkerShade = (hex: string, amount = 0.15) =>
  toHex(
    ...(channels(hex).map((c) => c * (1 - amount)) as [number, number, number]),
  );

//Tinta (0–360), saturazione e luminosità (0–1) di un colore
const toHsl = (hex: string) => {
  const [r, g, b] = channels(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return { h: h * 60, s, l };
};

//Fino a che tinta vale ogni nome
const HUE_NAMES: [number, string][] = [
  [12, "Rosso"],
  [40, "Arancione"],
  [65, "Giallo"],
  [160, "Verde"],
  [190, "Turchese"],
  [215, "Azzurro"],
  [255, "Blu"],
  [290, "Viola"],
  [340, "Rosa"],
  [360, "Rosso"],
];

//Nome del colore, per il riepilogo del profilo (es. "Blu", "Marrone")
export const colorName = (hex: string) => {
  const { h, s, l } = toHsl(hex);
  if (s < 0.15) return "Grigio";
  if (h >= 12 && h < 50 && l < 0.4) return "Marrone";
  return HUE_NAMES.find(([until]) => h < until)?.[1] ?? "Rosso";
};

//Tavolozza del profilo: 24 tinte su tutto il cerchio dei colori, in due blocchi da 12 colonne,
//ognuna in 4 luminosità, più una riga di neutri. Righe da 12 colori
const LIGHTNESS = [36, 46, 56, 66];
const NEUTRALS = [
  "#3f3f46",
  "#52525b",
  "#71717a",
  "#a1a1aa",
  "#475569",
  "#64748b",
  "#94a3b8",
  "#57534e",
  "#78716c",
  "#8a5a33",
  "#a16207",
  "#b98055",
];

export const BRAND_SWATCH_ROWS: string[][] = [
  ...[0, 180].flatMap((start) =>
    LIGHTNESS.map((l) =>
      Array.from({ length: 12 }, (_, i) => hslToHex(start + i * 15, 72, l)),
    ),
  ),
  NEUTRALS,
];

//Aspetto usato finché il profilo non è caricato (o se il backend non lo indica)
export const DEFAULT_APPEARANCE: Pick<
  RestaurantProfile,
  "theme" | "brandColor"
> = {
  theme: RestaurantTheme.Dark,
  brandColor: DEFAULT_BRAND_COLOR,
};
