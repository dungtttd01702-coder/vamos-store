/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.pug",
    "./src/public/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        vamos: {
          red:     '#E11B22',
          'red-dark': '#C8141A',
          orange:  '#FF5722',
          lime:    '#AEEA00',
          dark:    '#111111',
          charcoal:'#1A1A1A',
          slate:   '#2D3748',
          muted:   '#6B7280',
          border:  '#E5E7EB',
          'bg-light': '#F8F9FA',
          'bg-subtle': '#EFF2F6',
        }
      },
      fontFamily: {
        sans:    ['"Space Grotesk"', '"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'vamos-sm': '6px',
        'vamos-md': '8px',
        'vamos-lg': '12px',
        'vamos-xl': '16px',
      },
      boxShadow: {
        'vamos-card':  '0 4px 20px -2px rgba(17,17,17,0.05)',
        'vamos-hover': '0 10px 25px -5px rgba(225,27,34,0.12)',
        'vamos-cta':   '0 6px 18px 0 rgba(225,27,34,0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      }
    },
  },
  plugins: [],
}

