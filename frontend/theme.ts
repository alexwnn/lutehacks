import { Platform, useColorScheme } from "react-native";

export const Colors = {
  light: {
    bg: "#F0F7F5",
    card: "#FFFFFF",
    primary: "#0D4A45",
    mint: "#C8E6E0",
    text: "#1A1A1A",
    textSecondary: "#6B6B6B",
    selectedFill: "#E8F5F2",
    borderUnselected: "#D0D0D0",
  },
  dark: {
    bg: "#000000",
    card: "#191b1e",
    primary: "#2DD4BF",
    mint: "#334155",
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    selectedFill: "#134E4A",
    borderUnselected: "#475569",
  },
};

export type ThemeColors = (typeof Colors)["light"];

export function getColors(isDark: boolean): ThemeColors {
  return isDark ? Colors.dark : Colors.light;
}

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return getColors(scheme === "dark");
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 50,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 26,
  hero: 48,
  giant: 80,
};

export const cardShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  android: { elevation: 2 },
});

export const cardShadowMd = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
});
