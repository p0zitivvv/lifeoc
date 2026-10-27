import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: {
          DEFAULT: "#121215",
          muted: "#18181b",
          subtle: "#222227",
          border: "#27272a",
        },
        primary: {
          DEFAULT: "#84cc16", // Lime
          hover: "#65a30d",
          muted: "rgba(132, 204, 22, 0.15)",
          border: "rgba(132, 204, 22, 0.3)",
        },
        accent: {
          green: "#10b981",
          blue: "#3b82f6",
          amber: "#f59e0b",
          purple: "#a855f7",
          rose: "#f43f5e",
          cyan: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
