export const ButtonDimensions = {
  small: "w-10 h-7",
  medium: "w-12 h-8",
  large: "w-14 h-9",
  label: "px-4 py-1.5",
} as const;

export type ButtonDimensionsConst =
  (typeof ButtonDimensions)[keyof typeof ButtonDimensions];
