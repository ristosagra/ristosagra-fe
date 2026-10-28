import { useEffect, useState } from "react";

//Il valore, ma solo quando smette di cambiare per `ms` millisecondi (es. per non chiedere
//al backend se un indirizzo è libero a ogni lettera)
export const useDebouncedValue = <T>(value: T, ms: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);

  return debounced;
};
