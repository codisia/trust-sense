/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.html',
    './src/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        trust: {
          'dark-bg': '#060910',
          'surface-1': '#0d1117',
          'surface-2': '#111827',
          'cyan': '#00d4ff',
          'cyan-light': '#00e6ff',
          'purple': '#7c3aed',
          'purple-dark': '#6d28d9',
          'success': '#10b981',
          'warning': '#f59e0b',
          'danger': '#ef4444',
        }
      },
      fontFamily: {
        'mono': ['Space Mono', 'monospace'],
        'display': ['Syne', 'sans-serif'],
        'sans': ['Space Mono', 'monospace'],
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(10px)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(124, 58, 237, 0.2)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-in',
        slideIn: 'slideIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
