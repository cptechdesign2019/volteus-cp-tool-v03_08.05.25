// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        // Official Clearpoint Brand Colors
        primary: {
          25: 'rgb(var(--primary-25) / <alpha-value>)',
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          950: 'rgb(var(--primary-950) / <alpha-value>)',
          DEFAULT: '#162944',
        },
        accent: {
          50: 'rgb(var(--accent-amber-50) / <alpha-value>)',
          100: 'rgb(var(--accent-amber-100) / <alpha-value>)',
          200: 'rgb(var(--accent-amber-200) / <alpha-value>)',
          300: 'rgb(var(--accent-amber-300) / <alpha-value>)',
          400: 'rgb(var(--accent-amber-400) / <alpha-value>)',
          500: 'rgb(var(--accent-amber-500) / <alpha-value>)',
          600: 'rgb(var(--accent-amber-600) / <alpha-value>)',
          700: 'rgb(var(--accent-amber-700) / <alpha-value>)',
          800: 'rgb(var(--accent-amber-800) / <alpha-value>)',
          900: 'rgb(var(--accent-amber-900) / <alpha-value>)',
          DEFAULT: '#F4B400',
        },
        // Complete Official Clearpoint Palette
        clearpoint: {
          navy: 'rgb(var(--navy) / <alpha-value>)',       // #162944
          royal: 'rgb(var(--royal) / <alpha-value>)',     // #203B56
          indigo: 'rgb(var(--indigo) / <alpha-value>)',   // #345F94
          cyan: 'rgb(var(--cyan) / <alpha-value>)',       // #29ABE2
          amber: 'rgb(var(--amber) / <alpha-value>)',     // #F4B400
          black: 'rgb(var(--black) / <alpha-value>)',     // #000000
          silver: 'rgb(var(--silver) / <alpha-value>)',   // #CCCCCC
          coral: 'rgb(var(--coral) / <alpha-value>)',     // #FF6B57
          charcoal: 'rgb(var(--charcoal) / <alpha-value>)', // #292929
          slateGray: 'rgb(var(--slateGray) / <alpha-value>)', // #7A7A7A
          crimson: 'rgb(var(--crimson) / <alpha-value>)', // #D6433B
          alabaster: 'rgb(var(--alabaster) / <alpha-value>)', // #FAFAFA
          platinum: 'rgb(var(--platinum) / <alpha-value>)', // #F0F0F0
        },
        // Semantic colors using Clearpoint palette
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--destructive) / <alpha-value>)',
        info: 'rgb(var(--info) / <alpha-value>)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};