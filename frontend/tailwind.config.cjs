/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
        },
        darkbg: {
          light: '#1f2937',
          DEFAULT: '#111827',
          darker: '#030712',
        },
        black: '#000000',
      },
    },
  },
  plugins: [],
}