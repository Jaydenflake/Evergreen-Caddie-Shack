/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          500: '#10b981',
          600: '#059669',
          900: '#064e3b',
          950: '#022c22',
        },
        teal: {
          400: '#2dd4bf',
          600: '#0d9488',
        },
        purple: {
          500: '#a855f7',
          600: '#9333ea',
          900: '#581c87',
          950: '#3b0764',
        },
        slate: {
          950: '#020617',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-evergreen': 'linear-gradient(135deg, #020617 0%, #022c22 50%, #3b0764 100%)',
      },
    },
  },
  plugins: [],
}
