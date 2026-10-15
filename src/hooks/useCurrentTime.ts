import { useEffect, useState } from "react";

//Ora attuale nel formato HH:MM, confrontabile con gli orari degli input "time"
const nowHHMM = () => new Date().toTimeString().slice(0, 5);

//Ora attuale aggiornata ogni 30 secondi
export const useCurrentTime = () => {
  const [time, setTime] = useState(nowHHMM);

  useEffect(() => {
    const timer = setInterval(() => setTime(nowHHMM()), 30000);
    return () => clearInterval(timer);
  }, []);

  return time;
};
