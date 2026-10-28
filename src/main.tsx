import { createRoot } from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource/dm-serif-display/400.css";
import "@fontsource/dm-serif-display/400-italic.css";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NotificationProvider } from "./provider/Notification.tsx";
import {
  applyCachedAppearance,
  applyPlatformAppearance,
} from "./hooks/useTheme.ts";
import { HttpError } from "./services/client/httpClient.ts";
import { isPlatformHost } from "./helpers/site.ts";
import { IS_MOCKING } from "./constant/env.ts";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //Dati considerati aggiornati per 30 s: cambiando pagina non si rifanno le stesse richieste
      staleTime: 30_000,
      //Gli errori 4xx (es. 401, 404) non migliorano riprovando
      retry: (failureCount, error) =>
        !(error instanceof HttpError && error.status < 500) && failureCount < 2,
    },
  },
});

//Tema e colore dell'ultima visita, finché non arriva il profilo del ristorante (la
//piattaforma ha sempre il suo)
if (isPlatformHost) applyPlatformAppearance();
else applyCachedAppearance();

//Dati finti: una sagra appena registrata porta i suoi dati nell'indirizzo, da salvare prima
//che l'app li legga (il modulo si carica solo con VITE_MOCKING)
const ready = IS_MOCKING
  ? import("./mock/signupHandoff.ts").then((m) => m.consumeSignupHandoff())
  : Promise.resolve();

ready.then(() =>
  createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </QueryClientProvider>,
  ),
);
