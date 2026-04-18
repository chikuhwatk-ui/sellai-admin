"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
type Density = "comfortable" | "compact";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  density: Density;
  setDensity: (d: Density) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_KEY = "sellai.theme";
const DENSITY_KEY = "sellai.density";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [density, setDensityState] = useState<Density>("comfortable");

  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_KEY) as Theme | null) ?? "dark";
    const savedDensity = (localStorage.getItem(DENSITY_KEY) as Density | null) ?? "comfortable";
    setThemeState(savedTheme);
    setDensityState(savedDensity);
    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.density = savedDensity;
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  };

  const setDensity = (d: Density) => {
    setDensityState(d);
    document.documentElement.dataset.density = d;
    localStorage.setItem(DENSITY_KEY, d);
  };

  return (
    <Ctx.Provider value={{ theme, setTheme, density, setDensity }}>{children}</Ctx.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
