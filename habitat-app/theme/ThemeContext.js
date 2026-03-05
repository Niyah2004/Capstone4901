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
  // New tokens
  success: "#2d7a2d",
  successBg: "#e7ffd7",
  danger: "#e53935",
  overlay: "rgba(0,0,0,0.35)",
  wardrobeLocked: "#adadad",
  inputBg: "#f9f9f9",
  starsBanner: "#FFF8E1",
  starsBannerBorder: "#FFE082",
  starsBannerText: "#C17F00",
  progressCard: "#E8F5E9",
  progressCardBorder: "#C8E6C9",
  progressCardText: "#388E3C",
  progressBarBg: "#C8E6C9",
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
  // New tokens
  success: "#6FCF6F",
  successBg: "#1A3A1A",
  danger: "#FF6B6B",
  overlay: "rgba(0,0,0,0.6)",
  wardrobeLocked: "#3A3F47",
  inputBg: "#1E2530",
  starsBanner: "#2A2510",
  starsBannerBorder: "#5A4A00",
  starsBannerText: "#FFD54F",
  progressCard: "#0D2A10",
  progressCardBorder: "#1A4A1A",
  progressCardText: "#81C784",
  progressBarBg: "#1A4A1A",
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
