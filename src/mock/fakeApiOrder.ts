export interface Order {
  id: number;
  customer: string;
  items: string[];
  status: "In Preparazione" | "Pronto" | "Consegnato";
}

// Ordini finti
export const orders: Order[] = [
  {
    id: 1,
    customer: "Mario Rossi",
    items: ["Pizza Margherita", "Acqua"],
    status: "In Preparazione",
  },
  {
    id: 2,
    customer: "Luigi Bianchi",
    items: ["Pasta al Pomodoro", "Vino Rosso"],
    status: "Pronto",
  },
  {
    id: 3,
    customer: "Anna Verdi",
    items: ["Insalata Mista", "Pane"],
    status: "Consegnato",
  },
];
