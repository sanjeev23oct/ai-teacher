/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f13', // Dark background from reference
        surface: '#1a1a23', // Slightly lighter surface
        primary: '#2563eb', // Vibrant blue
        'primary-hover': '#1d4ed8',
        text: '#f3f4f6', // Light text
        'text-muted': '#9ca3af', // Muted text
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
