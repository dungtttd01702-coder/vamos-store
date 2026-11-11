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
          primary: '#E11B22',      // 10% Kinetic Red - Điểm nhấn chuyển đổi cao
          hover: '#C01319',        // Đỏ đậm khi hover
          dark: '#111111',         // 30% Dark Carbon - Cấu trúc, Header, Footer
          slate: '#1E293B',        // Text chính
          muted: '#64748B',        // Text phụ
          surface: '#F8FAFC',      // 60% Nền website off-white
          border: '#E2E8F0',       // Đường kẻ chia cắt thanh lịch
          // Tương thích ngược với các class hiện có trong template
          red:     '#E11B22',
          'red-dark': '#C8141A',
          orange:  '#FF5722',
          lime:    '#AEEA00',
          charcoal:'#1A1A1A',
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
        'vamos-md': '8px',   // Nút bấm, badge, ô input
        'vamos-lg': '12px',  // Card sản phẩm, dialog, dropdown
        'vamos-xl': '16px',  // Banner, Drawer giỏ hàng
      },
      boxShadow: {
        'vamos-card': '0 2px 10px -2px rgba(0, 0, 0, 0.05), 0 1px 4px -1px rgba(0, 0, 0, 0.03)',
        'vamos-hover': '0 12px 25px -4px rgba(225, 27, 34, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.04)',
        'vamos-cta': '0 6px 18px -2px rgba(225, 27, 34, 0.35)',
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

