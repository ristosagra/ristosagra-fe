import { useNotificationContext } from "./useNotificationContext";

export const useNotification = () => {
  const { showNotification } = useNotificationContext();
  return showNotification;
};
