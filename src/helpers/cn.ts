//Unisce le classi CSS saltando quelle vuote (undefined, false, ""), che altrimenti
//finirebbero nel DOM come classi "undefined"/"false"
export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(" ");
