import { httpClient } from "../../../services/client/httpClient";
import type {
  SignupRequest,
  SignupResponse,
  SlugAvailability,
} from "../types/platform";

//Chiamate del dominio principale (landing): pubbliche, senza token
export const PlatformService = {
  //l'indirizzo <slug>.ristosagra.it è libero?
  checkSlug: (slug: string): Promise<SlugAvailability> =>
    httpClient.get(`/api/signup/slug/${encodeURIComponent(slug)}`),

  //crea la sagra (non attiva) e il titolare, risponde con la pagina di pagamento
  signup: (request: SignupRequest): Promise<SignupResponse> =>
    httpClient.post("/api/signup", request, { auth: false }),
};
