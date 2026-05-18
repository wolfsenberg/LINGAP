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
        brand: {
          50:  "#eef9f4",
          100: "#d6f1e3",
          200: "#b0e3cb",
          300: "#7dcead",
          400: "#48b389",
          500: "#27976e",
          600: "#1a7a58",
          700: "#166248",
          800: "#154e3b",
          900: "#134132",
          950: "#09241d",
        },
        stellar: {
          blue: "#3e1bdb",
          light: "#7b61ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
