import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#10B981', hover: '#059669', light: 'rgba(16,185,129,0.12)' },
        background: '#0F1117',
        surface: { DEFAULT: '#1A1D27', hover: '#22252F' },
        border: '#2A2D37',
        'border-light': 'rgba(42,45,55,0.5)',
        text: { DEFAULT: '#E5E7EB', muted: '#6B7280' },
        danger: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6',
        pending: '#8B5CF6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
