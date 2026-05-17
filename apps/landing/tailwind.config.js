/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1a6b4a',
          hover: '#22c55e',
          light: '#e1f5ee',
          accent: '#ef9f27',
          bronce: '#cd7f32',
          plata: '#9ca3af',
          oro: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
