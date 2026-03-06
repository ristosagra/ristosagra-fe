import { useState, useCallback } from "react";
import type { NotificationType } from "../types/notification";
import { NotificationContext } from "../context/Notification";

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 2500);
    },
    [],
  );

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
