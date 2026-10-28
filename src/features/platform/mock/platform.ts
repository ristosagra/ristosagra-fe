import { fakeDelay } from "../../../mock/store";
import { HttpError } from "../../../services/client/httpClient";
import { sagraUrl } from "../../../helpers/site";
import type {
  SignupRequest,
  SignupResponse,
  SlugAvailability,
} from "../types/platform";
import { signupRequestValid } from "../utils/signupForm";
import { slugError } from "../utils/slug";
import { encodeHandoff } from "./handoff";

//Registrazione finta (VITE_MOCKING). I dati finti di una sagra stanno nel localStorage del
//suo sottodominio, quindi qui non si vedono le altre sagre: ogni indirizzo valido è libero.
//Non c'è un servizio di pagamento: si va subito alla login della nuova sagra, come dopo un
//pagamento riuscito, portandole i dati nel frammento dell'indirizzo (vedi mock/handoff.ts)
export const fakePlatformApi = {
  checkSlug: async (slug: string): Promise<SlugAvailability> => {
    await fakeDelay(300);
    return { available: slugError(slug) === null };
  },

  signup: async (request: SignupRequest): Promise<SignupResponse> => {
    await fakeDelay(1000);
    if (!signupRequestValid(request)) throw new HttpError(400);
    const { restaurantName, owner, billing, slug } = request;
    return {
      slug,
      checkoutUrl:
        sagraUrl(slug, "/login?attivazione=ok") +
        encodeHandoff({ restaurantName, owner, billing }),
    };
  },
};
