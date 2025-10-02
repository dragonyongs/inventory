// 2025 Minimalist Color Palette (Monochromatic + Functional)
export const COLORS = {
  // Primary - Moonlit Grey scale
  primary: {
    50: "#f8f9fa",
    100: "#e9ecef",
    200: "#dee2e6",
    300: "#ced4da",
    400: "#adb5bd",
    500: "#6c757d", // Main
    600: "#495057",
    700: "#343a40",
    800: "#212529",
    900: "#0d1117",
  },

  // Functional colors - Minimal & Clean
  functional: {
    success: "#10b981", // Emerald green
    error: "#ef4444", // Clean red
    warning: "#f59e0b", // Amber
    info: "#3b82f6", // Blue
  },

  // Neutral backgrounds
  background: {
    default: "#ffffff",
    paper: "#fafafa",
    elevated: "#ffffff",
  },

  // Text hierarchy
  text: {
    primary: "#0d1117",
    secondary: "#6c757d",
    disabled: "#adb5bd",
  },

  // Borders
  border: {
    light: "#e9ecef",
    default: "#dee2e6",
    dark: "#adb5bd",
  },
} as const;

// Typography scale (clean hierarchy)
export const TYPOGRAPHY = {
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Spacing scale (8px base)
export const SPACING = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
} as const;

// Border radius (minimal)
export const RADIUS = {
  none: "0",
  sm: "0.25rem", // 4px
  base: "0.5rem", // 8px
  lg: "0.75rem", // 12px
  xl: "1rem", // 16px
  full: "9999px",
} as const;

// Shadows (subtle)
export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
} as const;

// Animation durations (fast & smooth)
export const TRANSITIONS = {
  fast: "150ms",
  base: "200ms",
  slow: "300ms",
  ease: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;
