import { nowHHMM } from "../helpers/openingHours";
import { useNow } from "./useNow";

//Ora attuale nel formato HH:MM (confrontabile con gli orari degli input "time"), aggiornata ogni 30 secondi
export const useCurrentTime = () => nowHHMM(new Date(useNow(30000)));
