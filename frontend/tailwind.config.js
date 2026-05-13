/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'Nunito', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'Inter', 'sans-serif'],
      },
      colors: {
        eco: {
          deep:    '#0d4a2f',
          dark:    '#166534',
          mid:     '#16a34a',
          bright:  '#22c55e',
          mint:    '#6ee7b7',
          light:   '#d1fae5',
          pale:    '#ecfdf5',
          teal:    '#0d9488',
          cyan:    '#06b6d4',
        },
      },
      backgroundImage: {
        'nature-gradient': 'linear-gradient(170deg, #c8edd8 0%, #d4f1e4 20%, #b8e8d0 45%, #a8d8c0 65%, #8ecfb0 85%, #76c4a0 100%)',
        'glass-white':     'rgba(255,255,255,0.52)',
      },
      backdropBlur: {
        xs: '4px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'fade-in':     'fadeIn 0.35s ease forwards',
        'fade-in-up':  'fadeInUp 0.45s cubic-bezier(0.4,0,0.2,1) forwards',
        'scale-in':    'scaleIn 0.30s cubic-bezier(0.4,0,0.2,1) forwards',
        'float':       'float 3.5s ease-in-out infinite',
        'leaf':        'leafSway 4s ease-in-out infinite',
        'slide-right': 'slideInRight 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
      },
      keyframes: {
        fadeIn:      { from:{opacity:'0'}, to:{opacity:'1'} },
        fadeInUp:    { from:{opacity:'0', transform:'translateY(16px)'}, to:{opacity:'1', transform:'translateY(0)'} },
        scaleIn:     { from:{opacity:'0', transform:'scale(0.94)'}, to:{opacity:'1', transform:'scale(1)'} },
        float:       { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-8px)'} },
        leafSway:    { '0%,100%':{transform:'rotate(-6deg) scale(1)'}, '50%':{transform:'rotate(6deg) scale(1.05)'} },
        slideInRight:{ from:{opacity:'0', transform:'translateX(20px)'}, to:{opacity:'1', transform:'translateX(0)'} },
      },
      boxShadow: {
        'glass':    '0 8px 32px rgba(16,105,60,0.10), inset 0 1px 0 rgba(255,255,255,0.80)',
        'glass-lg': '0 16px 48px rgba(16,105,60,0.14)',
        'eco':      '0 4px 16px rgba(22,163,74,0.30)',
        'eco-lg':   '0 8px 24px rgba(22,163,74,0.40)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
