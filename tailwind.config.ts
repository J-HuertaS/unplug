import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tailwind's default scale only has fractional steps up to 3.5 (0.5, 1.5,
      // 2.5, 3.5). This app's spacing (ported from 22px/36px/etc. design values)
      // uses steps beyond that — without these, classes like `px-5.5`/`p-8.5`
      // silently produce no CSS at all instead of erroring.
      spacing: {
        "4.5": "1.125rem",
        "5.5": "1.375rem",
        "6.5": "1.625rem",
        "7.5": "1.875rem",
        "8.5": "2.125rem",
        "9.5": "2.375rem",
      },
      fontFamily: {
        heading: ["var(--font-fredoka)", "system-ui", "sans-serif"],
        body: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      colors: {
        // Unplug design tokens, ported from the imported design file.
        ink: "#22332B",
        "ink-muted": "#6B7C72",
        "ink-soft": "#8A7B5E",
        "ink-faint": "#A79E88",
        cream: "#FBF7EE",
        "cream-deep": "#F1ECDE",
        "cream-shade": "#E7DECB",
        border: "#E4DCC7",
        "border-soft": "#EDE6D4",
        "border-faint": "#EFE8D8",
        green: {
          DEFAULT: "#1E5A44",
          deep: "#12261E",
          mid: "#2E7D5B",
          light: "#3E9E74",
          pale: "#8FD3A8",
          card: "#EAF3EC",
        },
        terracotta: {
          DEFAULT: "#C97C54",
          card: "#FCEEDD",
        },
        amber: {
          DEFAULT: "#E6A94E",
          deep: "#E08A3C",
          card: "#FBF0E0",
        },
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        popIn: {
          "0%": { transform: "scale(.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        rise: {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-260px 0" },
          "100%": { backgroundPosition: "260px 0" },
        },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        popIn: "popIn .5s ease both",
        rise: "rise .4s ease both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
