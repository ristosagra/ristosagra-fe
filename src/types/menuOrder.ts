export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  allergens?: string[];
  //finito per oggi (solo nel menù di oggi, GET /api/menu): non si può ordinare
  soldOut?: boolean;
}
