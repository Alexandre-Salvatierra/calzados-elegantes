/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:      '#2E75B6',
        'primary-dark': '#1A5C9A',
        'primary-light': '#E8F2FB',
        sidebar:      '#0F1F35',
        'sidebar-hover': 'rgba(255,255,255,0.07)',
        surface:      '#FFFFFF',
        'app-bg':     '#EDF1F7',
        border:       '#DDE3EC',
        'text-main':  '#1C2B3A',
        muted:        '#6B7A8D',
        'row-alt':    '#F6F9FC',
        'row-hover':  '#EBF3FB',
        ok:           '#15803D',
        'ok-bg':      '#DCFCE7',
        warn:         '#A16207',
        'warn-bg':    '#FEF9C3',
        err:          '#B91C1C',
        'err-bg':     '#FEE2E2',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
