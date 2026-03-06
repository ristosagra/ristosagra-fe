export const LabelTags = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  p: "p",
} as const;

export type LabelTagsConst = (typeof LabelTags)[keyof typeof LabelTags];

export const LabelDimensions = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
  xlarge: "text-2xl",
  xxxxlarge: "text-8xl",
} as const;

export type LabelDimensionsConst =
  (typeof LabelDimensions)[keyof typeof LabelDimensions];

export const LabelWeight = {
  bold: "font-bold",
  semibold: "font-semibold",
  normal: "font-normal",
} as const;

export type LabelWeightConst = (typeof LabelWeight)[keyof typeof LabelWeight];
