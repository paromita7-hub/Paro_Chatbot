import type { Config } from "tailwindcss";

// Design tokens for Paro.
//
// Palette: a quiet graphite workspace (not pure black) with a muted sage
// accent - deliberately avoiding both the "warm cream + terracotta" and
// "near-black + neon" defaults. Borders are hairlines, not shadows; radius
// is small and consistent, not pill-shaped.
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#17181C",
        surface: "#1E2025",
        "surface-raised": "#262931",
        "surface-hover": "#2B2E36",
        hairline: "#32353D",
        ink: "#ECEAE4",
        "ink-muted": "#9A9CA6",
        "ink-faint": "#6B6D76",
        accent: {
          DEFAULT: "#7FA98C",
          strong: "#98C0A6",
          muted: "#3C4A41",
        },
        danger: {
          DEFAULT: "#C97066",
          strong: "#DA8A80",
        },
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        lg: "10px",
      },
      maxWidth: {
        prose: "48rem",
      },
      keyframes: {
        "pulse-cursor": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.15" },
        },
      },
      animation: {
        "pulse-cursor": "pulse-cursor 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
