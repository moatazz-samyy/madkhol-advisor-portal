import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        // Madkhol brand palette — derived from Brand Guidelines PDF swatches
        deep: {
          DEFAULT: "#0A2E1F",
          900: "#06231A",
          800: "#0A2E1F",
          700: "#0C3D2E",
        },
        madkhol: {
          DEFAULT: "#1F8A5A",
          50: "#EAF7EF",
          100: "#D6EFDD",
          200: "#A8DDBA",
          300: "#6BE07F",
          400: "#3CCB75",
          500: "#2BBE7E",
          600: "#1F8A5A",
          700: "#156E47",
          800: "#0C3D2E",
          900: "#06231A",
        },
        lime: {
          pastel: "#DCEFD0",
          soft: "#E8F4DD",
        },
        cream: "#F5F2E8",
        ash: {
          DEFAULT: "#D9E0DD",
          50: "#F7F9F8",
          100: "#EEF2F0",
          200: "#D9E0DD",
          300: "#B7C2BD",
          400: "#8A968F",
          500: "#5E6964",
          600: "#3D4843",
        },
        background: "#FAFBFA",
        surface: "#FFFFFF",
        foreground: "#0A2E1F",
        muted: "#5E6964",
        border: "#E7ECE9",
      },
      fontFamily: {
        sans: [
          "var(--font-tajawal)",
          "var(--font-rubik)",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-tajawal)",
          "var(--font-rubik)",
          "system-ui",
          "sans-serif",
        ],
        script: ["var(--font-pacifico)", "cursive"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(10,46,31,0.04), 0 1px 3px rgba(10,46,31,0.06)",
        soft: "0 8px 24px -12px rgba(10,46,31,0.18)",
        ring: "0 0 0 4px rgba(43,190,126,0.18)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #0C3D2E 0%, #156E47 35%, #2BBE7E 75%, #6BE07F 100%)",
        "brand-soft":
          "linear-gradient(135deg, #DCEFD0 0%, #E8F4DD 50%, #F5F2E8 100%)",
        "brand-radial":
          "radial-gradient(circle at 30% 30%, #2BBE7E 0%, #0C3D2E 70%)",
      },
    },
  },
  plugins: [],
};
export default config;
