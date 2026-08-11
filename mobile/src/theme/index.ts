export const colors = {
  primary: "#F59E0B",
  primaryDark: "#D97706",
  primaryLight: "#FBBF24",
  primarySurface: "#FEF3C7",
  gold: "#FBBF24",
  goldLight: "#FDE68A",
  goldDark: "#D97706",

  surface: "#FFFFFF",
  surfaceSecondary: "#F9FAFB",
  surfaceTertiary: "#F3F4F6",
  surfaceAccent: "#FFF7E5",

  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",
  textInverse: "#FFFFFF",

  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  overlay: "rgba(0, 0, 0, 0.5)",
} as const;

export const darkColors = {
  ...colors,
  surface: "#0E0B16",
  surfaceSecondary: "#161322",
  surfaceTertiary: "#1A1728",
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B7280",
  textInverse: "#111827",
  border: "#2D2A3E",
  borderLight: "#262334",
} as const;

export const typography = {
  fontFamily: {
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 8,
  },
  premium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 42,
    elevation: 10,
  },
} as const;
