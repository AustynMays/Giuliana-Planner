import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import theme from "@/constants/colors";

export type ThemeMode = "system" | "light" | "dark";
type Palette = { [Key in keyof typeof theme.light]: string };
type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colors: Palette;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const MODE_KEY = "senior-planner-theme";

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const systemMode = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    AsyncStorage.getItem(MODE_KEY).then((saved) => {
      if (saved === "system" || saved === "light" || saved === "dark") {
        setModeState(saved);
      }
    }).catch(() => undefined);
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem(MODE_KEY, nextMode).catch(() => undefined);
  };

  const selectedMode = mode === "system" ? systemMode : mode;
  const value = useMemo(
    () => ({
      mode,
      setMode,
      colors: selectedMode === "dark" ? theme.dark : theme.light,
    }),
    [mode, selectedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
