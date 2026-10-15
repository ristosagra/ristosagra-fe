import { Accessibility, Armchair, Baby, type LucideIcon } from "lucide-react";
import { SeatRequest, type SeatRequestConst } from "../types/reservations";

export const SEAT_REQUEST_ICONS: Record<SeatRequestConst, LucideIcon> = {
  [SeatRequest.Wheelchair]: Accessibility,
  [SeatRequest.Head]: Armchair,
  [SeatRequest.HighChair]: Baby,
};
