export const Colors = {
  text: {
    orange: "orange",
    red: "red",
    white: "white",
    black: "black",
    grayLight: "grayLight",
    grayDark: "grayDark",
  },
  bg: {
    grayDark: "grayDark",
    transparent: "transparent",
  },
  border: {
    grayLight: "grayLight",
    grayDark: "grayDark",
    black: "black",
  },
} as const;

export const ColorVariants = {
  text: {
    orange: "text-orange-300",
    red: "text-red-500",
    white: "text-white",
    black: "text-black",
    grayLight: "text-gray-500",
    grayDark: "text-gray-900",
  },
  bg: {
    grayDark: "bg-gray-900",
    transparent: "bg-transparent",
  },
  border: {
    grayLight: "border-gray-100",
    grayDark: "border-gray-900",
    black: "border-black",
  },
} as const;

export type TextColor = keyof typeof ColorVariants.text;
export type BgColor = keyof typeof ColorVariants.bg;
export type BorderColor = keyof typeof ColorVariants.border;
