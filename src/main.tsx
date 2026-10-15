import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "./provider/Notification.tsx";
import { applyCachedAppearance } from "./hooks/useTheme.ts";

const queryClient = new QueryClient();

//Tema e colore dell'ultima visita, finché non arriva il profilo del ristorante
applyCachedAppearance();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </QueryClientProvider>,
);
