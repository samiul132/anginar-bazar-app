/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        //emerald
        primary: {
          50: "#FFEDEA",
          100: "#FFD6CC",
          200: "#FFB399",
          300: "#FF8F66",
          400: "#FF6C4D",
          500: "#FF5533",
          600: "#FF4422",
          700: "#FF5533",
          800: "#FF3A1A",
          900: "#FF2A00",
        },
        secondary: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        background: {
          light: "#FFFFFF",
          dark: "#1F2937",
        },
        text: {
          light: "#111827",
          dark: "#F9FAFB",
        },
      },
    },
  },
  plugins: [],
};
