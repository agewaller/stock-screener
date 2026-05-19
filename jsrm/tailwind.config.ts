import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        riskBg: "#0b1020",
        riskPanel: "#11172a",
        riskBorder: "#1f2742",
        riskText: "#e6ebf5",
        riskMuted: "#8b94ad",
        level0: "#3b82f6",
        level1: "#22c55e",
        level2: "#eab308",
        level3: "#f97316",
        level4: "#ef4444",
        level5: "#a21caf",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Hiragino Sans",
          "Noto Sans JP",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
