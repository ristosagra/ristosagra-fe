import { useState, useCallback, useRef, useEffect } from "react";
import type { NotificationType } from "../types/notification";
import { NotificationContext } from "../context/Notification";

const DURATION_MS = 2500;

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  //Ogni nuovo messaggio riparte da 2,5 s: il timer del precedente non lo chiude in anticipo
  const showNotification = useCallback(
    (message: string, type: NotificationType) => {
      clearTimeout(timer.current);
      setNotification({ message, type });
      timer.current = setTimeout(() => setNotification(null), DURATION_MS);
    },
    [],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <NotificationContext.Provider value={{ notification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
