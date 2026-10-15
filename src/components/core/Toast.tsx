import { useNotificationContext } from "../../hooks/useNotificationContext";
import { NotificationType } from "../../types/notification";
import { cn } from "../../helpers/cn";

const styles: Record<NotificationType, string> = {
  ok: "bg-emerald-700 border-emerald-500",
  err: "bg-rose-700 border-rose-500",
  info: "bg-purple-700 border-purple-500",
};

export const Toast = () => {
  const { notification } = useNotificationContext();

  //Il contenitore resta sempre nel DOM così i lettori di schermo annunciano i messaggi
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-[max(1rem,env(safe-area-inset-top))] sm:top-20 left-1/2 -translate-x-1/2 z-[60] w-max max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      {notification && (
        <div
          className={cn(
            "text-white text-center px-4 py-2 rounded-xl shadow-xl border transition-all",
            styles[notification.type],
          )}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};
