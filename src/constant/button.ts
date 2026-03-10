export const ButtonDimensions = {
  small: "w-10 h-7",
  medium: "w-12 h-8",
  large: "w-14 h-9",
  xlarge: "w-35 h-12",
  auto: "",
} as const;

export type ButtonDimensionsConst =
  (typeof ButtonDimensions)[keyof typeof ButtonDimensions];
