import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";

const STORAGE_KEY = "themeMode";

const LightColors = {
  primary: "#4CAF50",
  background: "#ffffff",
  card: "#ffffff",
  text: "#111111",
  border: "#e5e5e5",
  notification: "#ff3b30",
  muted: "#777777",
  tabBar: "#fff5f5ff",
};

const DarkColors = {
  primary: "#8BCF8F",
  background: "#12101a",
  card: "#1a1725",
  cardAlt: "#211e2f",
  text: "#fdf5c9",
  border: "#2d263f",
  notification: "#ff453a",
  muted: "#8b80a6",
  tabBar: "#1a1725",
  accent: "#fdf5c9",
  highlight: "#2d263f",
  shadow: "#fdf5c9",
};

const ColorfulColors = {
  primary: "#32CD32",
  background: "#E1F5FE",
  card: "#FFFFFF",
  cardAlt: "#B3E5FC",
  text: "#0D47A1",
  border: "#81D4FA",
  notification: "#FF4081",
  muted: "#1565C0",
  tabBar: "#E3F2FD",
  accent: "#4FC3F7",
  highlight: "#B3E5FC",
  shadow: "#0277BD",
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState("system"); // system | light | dark
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system" || stored === "colorful") {
          setModeState(stored);
        }
      } catch { }
      setHydrated(true);
    };
    load();
  }, []);

  const setMode = async (nextMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch { }
  };

  const resolvedScheme = mode === "system" ? systemScheme : mode;
  const isDark = resolvedScheme === "dark";
  const colors = mode === "colorful" ? ColorfulColors : isDark ? DarkColors : LightColors;

  const baseTheme = (isDark ? DarkTheme : DefaultTheme) || {};
  const baseThemeColors = baseTheme.colors || {};
  const theme = useMemo(
    () => ({
      ...baseTheme,
      colors: { ...baseThemeColors, ...colors },
    }),
    [baseTheme, baseThemeColors, colors]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      theme,
      hydrated,
      systemScheme,
    }),
    [mode, theme, hydrated, systemScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
