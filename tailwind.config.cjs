/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hospital-blue': '#0077b6',
        'alert-red': '#ef4444',
        'warning-yellow': '#f59e0b',
        'safe-green': '#10b981',
      }
    },
  },
  plugins: [],
}