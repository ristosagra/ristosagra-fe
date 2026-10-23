import { useEffect, useState } from "react";

//Istante attuale (ms) aggiornato ogni intervalMs: per i timer (es. da quanto è in cucina un ordine)
export const useNow = (intervalMs = 15000) => {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
};
