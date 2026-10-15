//Archivio dei dati finti (VITE_MOCKING) salvato nel localStorage del browser:
//così cliente (/) e cassa (/dashboard) vedono gli stessi ordini, prenotazioni e piantina.
//Per ripartire dai dati iniziali basta cancellare le chiavi "ristosagra.mock.*".
export const createMockStore = <T>(key: string, seed: () => T) => {
  const storageKey = `ristosagra.mock.${key}`;

  const set = (value: T) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // localStorage non disponibile: i dati restano solo in memoria
    }
    cache = value;
  };

  let cache: T | undefined;

  const get = (): T => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      if (cache !== undefined) return cache;
    }
    const value = seed();
    set(value);
    return value;
  };

  return { get, set };
};

//Simula la latenza di rete delle chiamate finte
export const fakeDelay = (ms = 400) =>
  new Promise((resolve) => setTimeout(resolve, ms));
