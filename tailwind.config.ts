import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "wvsu-blue": "var(--blue)",
        "wvsu-blue-dark": "var(--blue-dark)",
        "wvsu-blue-deeper": "var(--blue-deeper)",
        "wvsu-gold": "var(--gold)",
        "wvsu-white": "var(--white)",
        "wvsu-off-white": "var(--off-white)",
        "wvsu-light-blue": "var(--light-blue)",
        "wvsu-text": "var(--text)",
        "wvsu-muted": "var(--muted)",
        "wvsu-border": "var(--border)",
        "lost-red": "#e63946",
        "found-green": "#2a9d3f",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "serif"],
        mono: ['"DM Mono"', "monospace"],
        sans: ["Figtree", "sans-serif"],
      },
      keyframes: {
        ticker: {
          from: { transform: "translateX(100vw)" },
          to: { transform: "translateX(-100%)" },
        },
        slideDown: {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        ticker: "ticker 20s linear infinite",
        slideDown: "slideDown 0.4s ease",
      },
    },
  },
  plugins: [],
};
export default config;
