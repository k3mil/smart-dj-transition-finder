import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#08080a",
        foreground: "#f7f7fb",
        muted: "#a5a6b3",
        glass: "rgba(255,255,255,0.075)",
        line: "rgba(255,255,255,0.12)",
        hot: "#ff2d55",
        aqua: "#00d1ff",
        lime: "#b6ff4d",
        amber: "#ffd166"
      },
      boxShadow: {
        glow: "0 0 40px rgba(255,45,85,0.22)",
        cyan: "0 0 32px rgba(0,209,255,0.2)"
      },
      backdropBlur: {
        glass: "24px"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseRing: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.75" },
          "50%": { transform: "scale(1.04)", opacity: "1" }
        }
      },
      animation: {
        rise: "rise 480ms ease both",
        pulseRing: "pulseRing 3s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
