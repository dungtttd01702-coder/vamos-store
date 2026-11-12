/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.pug",
    "./src/public/**/*.js"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ═══ STITCH DESIGN TOKENS (MATERIAL 3 / ANTIGRAVITY ENGINE) ═══
        "primary": "#b70013",
        "primary-container": "#e11b22",
        "primary-fixed": "#ffdad6",
        "primary-fixed-dim": "#ffb4ab",
        "on-primary": "#ffffff",
        "on-primary-container": "#fff7f6",
        "on-primary-fixed": "#410002",
        "on-primary-fixed-variant": "#93000d",
        "inverse-primary": "#ffb4ab",

        "secondary": "#3c5ba9",
        "secondary-container": "#8eabff",
        "secondary-fixed": "#dae2ff",
        "secondary-fixed-dim": "#b2c5ff",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#193d8a",
        "on-secondary-fixed": "#001849",
        "on-secondary-fixed-variant": "#20428f",

        "surface": "#f8f9ff",
        "surface-bright": "#f8f9ff",
        "surface-dim": "#cbdbf5",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "surface-container-high": "#dce9ff",
        "surface-container-highest": "#d3e4fe",
        "surface-variant": "#d3e4fe",
        "surface-tint": "#c00014",
        "on-surface": "#0b1c30",
        "on-surface-variant": "#5d3f3c",
        "inverse-surface": "#213145",
        "inverse-on-surface": "#eaf1ff",
        "on-background": "#0b1c30",

        "outline": "#926e6b",
        "outline-variant": "#e7bdb8",

        "tertiary": "#964000",
        "tertiary-container": "#bd5200",
        "tertiary-fixed": "#ffdbca",
        "tertiary-fixed-dim": "#ffb690",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#fff7f4",
        "on-tertiary-fixed": "#341100",
        "on-tertiary-fixed-variant": "#783200",

        "error": "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",

        // ═══ LEGACY VAMOS BRAND TOKENS (BACKWARD COMPATIBILITY) ═══
        vamos: {
          primary: '#E11B22',      // 10% Kinetic Red
          hover: '#C01319',        // Đỏ đậm khi hover
          dark: '#111111',         // 30% Dark Carbon - Header, Footer, Sidebar
          slate: '#1E293B',        // Text chính
          muted: '#64748B',        // Text phụ
          surface: '#F8FAFC',      // 60% Nền website off-white
          border: '#E2E8F0',       // Đường kẻ chia cắt
          red: '#E11B22',
          'red-dark': '#C8141A',
          orange: '#FF5722',
          lime: '#AEEA00',
          charcoal: '#1A1A1A',
          'bg-light': '#F8F9FA',
          'bg-subtle': '#EFF2F6',
        }
      },
      fontFamily: {
        headline: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        label: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        "headline-xl": ['"Space Grotesk"', 'sans-serif'],
        "headline-lg": ['"Space Grotesk"', 'sans-serif'],
        "headline-md": ['"Space Grotesk"', 'sans-serif'],
        "headline-sm": ['"Space Grotesk"', 'sans-serif'],
        "display-hero": ['"Space Grotesk"', 'sans-serif'],
        "price-lg": ['"Space Grotesk"', 'sans-serif'],
        "price-md": ['"Space Grotesk"', 'sans-serif'],
        "label-badge": ['"Space Grotesk"', 'sans-serif'],
        "body-lg": ['"Be Vietnam Pro"', 'sans-serif'],
        "body-md": ['"Be Vietnam Pro"', 'sans-serif'],
        "body-sm": ['"Be Vietnam Pro"', 'sans-serif'],
        "label-lg": ['"Be Vietnam Pro"', 'sans-serif'],
        "label-md": ['"Be Vietnam Pro"', 'sans-serif'],
      },
      fontSize: {
        "display-hero": ["56px", { lineHeight: "64px", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-hero-mobile": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-xl": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-xl-mobile": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.015em", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "24px", letterSpacing: "0em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-badge": ["11px", { lineHeight: "14px", letterSpacing: "0.05em", fontWeight: "700" }],
        "price-lg": ["20px", { lineHeight: "24px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "price-md": ["16px", { lineHeight: "20px", letterSpacing: "-0.01em", fontWeight: "700" }],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
        'vamos-sm': '6px',
        'vamos-md': '8px',
        'vamos-lg': '12px',
        'vamos-xl': '16px',
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
