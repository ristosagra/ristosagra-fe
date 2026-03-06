import { useNotificationContext } from "../../hooks/useNotificationContext";
import { NotificationType } from "../../types/notification";

const styles: Record<NotificationType, string> = {
  ok: "bg-emerald-700 border-emerald-500",
  err: "bg-rose-700 border-rose-500",
  info: "bg-purple-700 border-purple-500",
};

export const Toast = () => {
  const { notification } = useNotificationContext();
  if (!notification) return null;

  return (
    <div
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-white text-xs px-4 py-2 rounded-full shadow-xl border transition-all ${styles[notification.type]}`}
    >
      {notification.message}
    </div>
  );
};
