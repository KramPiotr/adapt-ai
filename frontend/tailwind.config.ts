
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "#283618",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "#283618",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "#5C6757",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "#283618",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "#283618",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "#283618",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        ripple: {
          "0%": { transform: "scale(1)", opacity: "0.4" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        wave: {
          "0%": { transform: "scaleY(1)" },
          "50%": { transform: "scaleY(0.5)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        ripple: "ripple 1s ease-out infinite",
        wave: "wave 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
