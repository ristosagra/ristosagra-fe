import { useState, useEffect } from "react";

export const Theme = {
  Dark: "dark",
  Light: "light",
} as const;

export type ThemeConst = (typeof Theme)[keyof typeof Theme];

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeConst>(
    () => (localStorage.getItem("theme") as ThemeConst) ?? Theme.Dark,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === Theme.Dark ? Theme.Light : Theme.Dark));

  const isDark = theme === Theme.Dark;

  return { theme, isDark, toggleTheme };
};
