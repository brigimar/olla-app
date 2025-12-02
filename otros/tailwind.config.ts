// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Colores para tu proyecto de Abuelas
      colors: {
        abuela: {
          primary: '#f97316', // orange-500
          secondary: '#ea580c', // orange-600
          accent: '#f59e0b', // amber-500
        },
      },
    },
  },
  plugins: [],
}