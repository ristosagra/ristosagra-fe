//Giorni della settimana, da lunedì a domenica
export const Weekday = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
} as const;
export type WeekdayConst = (typeof Weekday)[keyof typeof Weekday];

//Servizi di una giornata
export const Service = {
  Lunch: "lunch",
  Dinner: "dinner",
} as const;
export type ServiceConst = (typeof Service)[keyof typeof Service];

//Fascia oraria (HH:MM, from prima di to)
export interface TimeRange {
  from: string;
  to: string;
}

//Orario di un servizio; con open false il servizio quel giorno non c'è
export interface ServiceHours extends TimeRange {
  open: boolean;
}

//Un giorno è aperto se lo sono sia il giorno sia almeno uno dei due servizi.
//Gli orari restano salvati anche da chiuso, così riaprendo si ritrovano.
export interface DayHours {
  open: boolean;
  lunch: ServiceHours;
  dinner: ServiceHours;
}

export type WeeklyHours = Record<WeekdayConst, DayHours>;
