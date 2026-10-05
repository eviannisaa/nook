"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};

const SWAP_MS = 240;

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const byUser = useRef(false);

  const setThemeByUser: React.Dispatch<React.SetStateAction<Theme>> = (value) => {
    byUser.current = true;
    setTheme(value);
  };

  useEffect(() => {
    let saved: Theme | null = null;
    try {
      saved = localStorage.getItem("theme") as Theme | null;
    } catch {
      return;
    }
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("light", theme === "light");
    root.style.setProperty("--theme-swap", `${SWAP_MS}ms`);
    try {
      localStorage.setItem("theme", theme);
    } catch {}

    if (!byUser.current) return;
    byUser.current = false;

    root.classList.add("theme-swapping");
    const t = window.setTimeout(() => root.classList.remove("theme-swapping"), SWAP_MS);
    return () => window.clearTimeout(t);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeByUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
