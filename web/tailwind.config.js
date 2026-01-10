module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'netflix-black': '#141414',
        'netflix-gray': '#221f1f',
        'netflix-red': '#e50914',
        'crunchyroll-purple': '#f47521',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      screens: {
        'xs': '320px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
};