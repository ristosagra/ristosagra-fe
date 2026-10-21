import { useEffect, useState } from "react";

interface PersistOptions<T> {
  //sessionStorage: dura finché la scheda è aperta (anche se il telefono la ricarica)
  storage?: "local" | "session";
  //scarta i dati salvati non validi (o di una versione precedente)
  validate: (value: unknown) => value is T;
  //valore che vince su quello salvato, letto solo all'apertura (es. il tavolo del QR code);
  //undefined = si usa quello salvato
  preferred?: () => T | undefined;
}

const getStorage = (kind: "local" | "session") => {
  try {
    return kind === "local" ? localStorage : sessionStorage;
  } catch {
    return null;
  }
};

const read = <T>(key: string, fallback: T, options: PersistOptions<T>): T => {
  try {
    const raw = getStorage(options.storage ?? "local")?.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return options.validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

//Come useState, ma il valore sopravvive al ricaricamento della pagina: sul cellulare il browser
//ricarica spesso le schede in background e senza questo il cliente perderebbe carrello e numero d'ordine
export const usePersistentState = <T>(
  key: string,
  initial: T,
  options: PersistOptions<T>,
) => {
  const [value, setValue] = useState<T>(() => {
    const preferred = options.preferred?.();
    return preferred !== undefined ? preferred : read(key, initial, options);
  });
  const kind = options.storage ?? "local";

  useEffect(() => {
    const storage = getStorage(kind);
    try {
      if (value === null || value === undefined) storage?.removeItem(key);
      else storage?.setItem(key, JSON.stringify(value));
    } catch {
      // spazio esaurito o storage non disponibile: il valore resta solo in memoria
    }
  }, [key, kind, value]);

  return [value, setValue] as const;
};
