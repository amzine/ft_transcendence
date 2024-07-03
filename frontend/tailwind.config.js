/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
	  './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        'app': '100px 1fr',
        'responsive': '70px 1fr',
        'chat': '1fr 4fr',
        'profile': '1fr 3fr',
      },
      gridTemplateRows: {
        'profile': '1fr 3fr',
      },
      keyframes: {
        mping: {
          '75%, 100%': {
              transform: 'scale(1.2)',
              opacity: 0
          }
        }
      },
      animation: {
        mping: 'mping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}

