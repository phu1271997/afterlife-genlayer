import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: "#0A0E1A",
        parchment: "#F4EFE6",
        gold: "#D4A574",
        spirit: "#A78BFA",
        active: "#65A30D",
        grace: "#D97706",
        executed: "#B8860B",
        alert: "#7F1D1D",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        quote: ["var(--font-spectral)", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        halo: "0 0 0 1px rgba(212, 165, 116, 0.18), 0 18px 60px rgba(5, 8, 15, 0.55)",
        candle: "0 0 40px rgba(212, 165, 116, 0.35)",
      },
      backgroundImage: {
        stars:
          "radial-gradient(circle at 20% 20%, rgba(167,139,250,0.2), transparent 24%), radial-gradient(circle at 80% 0%, rgba(212,165,116,0.2), transparent 28%), linear-gradient(180deg, #0A0E1A 0%, #111829 55%, #090C15 100%)",
        parchment:
          "linear-gradient(180deg, rgba(244,239,230,0.96), rgba(238,231,218,0.92)), radial-gradient(circle at top left, rgba(212,165,116,0.10), transparent 30%)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(0,-12px,0)" },
        },
        shimmer: {
          "0%": { opacity: "0.55", transform: "scale(0.98)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
          "100%": { opacity: "0.55", transform: "scale(0.98)" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.9", transform: "scaleY(1)" },
          "50%": { opacity: "1", transform: "scaleY(1.08)" },
        },
        seal: {
          "0%": { transform: "scale(0.7) rotate(-9deg)", opacity: "0" },
          "70%": { transform: "scale(1.06) rotate(2deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        drift: "drift 12s ease-in-out infinite",
        shimmer: "shimmer 4.5s ease-in-out infinite",
        flicker: "flicker 2.2s ease-in-out infinite",
        seal: "seal 0.65s ease-out forwards",
        rise: "rise 0.8s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
