import theme from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export function useColors() {
  const { colors } = useTheme();
  return {
    ...colors,
    spacing: theme.spacing,
    radius: theme.radius,
    typography: theme.typography,
    fontFamily: theme.fontFamily,
  };
}
