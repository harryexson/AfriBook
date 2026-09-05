// Palette is deliberately narrow: amber is the only brand accent, ink carries
// type and high-contrast chrome, and everything else is a warm neutral. Colour
// in this app comes from photography, not from UI surfaces — see
// design-system/afribook/MASTER.md and src/lib/images.ts.
export const colors = {
  primary: "#F59E0B",
  primaryDark: "#D97706",
  primaryLight: "#FBBF24",
  primarySurface: "#FEF3C7",
  gold: "#FBBF24",
  goldLight: "#FDE68A",
  goldDark: "#D97706",

  // `canvas` is the page ground; `surface` is the content plane that sits on
  // it. Keeping them distinct is what lets cards read without borders.
  canvas: "#F7F7F5",
  surface: "#FFFFFF",
  surfaceSecondary: "#F7F7F5",
  surfaceTertiary: "#EEEDE9",
  surfaceAccent: "#FFF7E5",

  // Ink, not black — matches the web app's --color-text-primary exactly.
  ink: "#1C1B19",
  textPrimary: "#1C1B19",
  textSecondary: "#6E6A63",
  textTertiary: "#A6A199",
  textInverse: "#FFFFFF",

  border: "#E6E4DF",
  borderLight: "#F1F0ED",

  success: "#10B981",
  successLight: "#D1FAE5",
  error: "#EF4444",
  errorLight: "#FEE2E2",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  info: "#3B82F6",
  infoLight: "#DBEAFE",

  overlay: "rgba(0, 0, 0, 0.5)",
  // Scrim under text laid over photography.
  photoScrim: "rgba(20, 20, 22, 0.42)",
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
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 22,
  "3xl": 28,
  full: 9999,
} as const;

// One quiet elevation family. Depth here is a whisper: cards are separated by
// the canvas/surface tone step and whitespace, not by drop shadows. The old
// scale ran to 20% opacity at 42px blur, which muddies every card edge and is
// the single biggest reason the previous UI read as unfinished.
export const shadows = {
  sm: {
    shadowColor: "#1C1B19",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#1C1B19",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  lg: {
    shadowColor: "#1C1B19",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  xl: {
    shadowColor: "#1C1B19",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 6,
  },
  // Reserved for surfaces that genuinely float above content: sticky action
  // bars and sheets. Not for cards in a list.
  premium: {
    shadowColor: "#1C1B19",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
