import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extracted directly from the Strollo logo.
        navy: {
          50: "#eef2f6",
          100: "#d9e2ea",
          200: "#b3c5d5",
          300: "#82a0b9",
          400: "#4f7295",
          500: "#33547a",
          600: "#243b5a", // primary — matches logo wordmark
          700: "#1c2f48",
          800: "#16253a",
          900: "#101b2c",
        },
        sky: {
          50: "#eef6fb",
          100: "#d7ebf4",
          200: "#b0d6e9",
          300: "#85bfdb",
          400: "#649fc4",
          500: "#4b83b2", // accent — matches logo leash/leg
          600: "#3c6a92",
          700: "#2f5474",
          800: "#253f57",
        },
        paper: "#f7f9fb",
        sand: "#e2e8ef",
        ink: "#1c2530",
      },
      fontFamily: {
        display: ["var(--font-baloo)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      keyframes: {
        // Each paw dims and steps back in, staggered via the standard
        // delay-* utilities — reads as a paw "landing" rather than a
        // generic pulse/spin.
        "paw-step": {
          "0%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "paw-step": "paw-step 1.3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
