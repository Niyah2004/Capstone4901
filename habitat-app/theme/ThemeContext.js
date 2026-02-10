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
  background: "#0F172A",
  card: "#171A1E",
  text: "#F5F7FA",
  border: "#2A2F36",
  notification: "#ff453a",
  muted: "#A0A7B4",
  tabBar: "#121417",
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
        if (stored === "light" || stored === "dark" || stored === "system") {
          setModeState(stored);
        }
      } catch {}
      setHydrated(true);
    };
    load();
  }, []);

  const setMode = async (nextMode) => {
    setModeState(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch {}
  };

  const resolvedScheme = mode === "system" ? systemScheme : mode;
  const isDark = resolvedScheme === "dark";
  const colors = isDark ? DarkColors : LightColors;

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const theme = useMemo(
    () => ({
      ...baseTheme,
      colors: { ...baseTheme.colors, ...colors },
    }),
    [baseTheme, colors]
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
