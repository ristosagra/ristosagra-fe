import { createContext } from "react";
import type { NotificationType } from "../types/notification";

export interface NotificationContextType {
  notification: { message: string; type: NotificationType } | null;
  showNotification: (message: string, type: NotificationType) => void;
}

export const NotificationContext =
  createContext<NotificationContextType | null>(null);
