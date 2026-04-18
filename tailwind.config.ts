import type { Config } from 'tailwindcss';

/*
 * Tailwind maps to CSS custom properties defined in globals.css.
 * This keeps theme-switching cheap: one `data-theme` attribute flip
 * instead of rebuilding utility classes.
 *
 * Legacy aliases (primary, surface, background, text, border) point
 * at the new semantic tokens so existing pages render during migration.
 */

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Semantic, token-driven
        canvas: 'var(--color-canvas)',
        panel: 'var(--color-panel)',
        raised: 'var(--color-raised)',
        overlay: 'var(--color-overlay)',

        fg: {
          DEFAULT: 'var(--color-fg)',
          muted: 'var(--color-fg-muted)',
          subtle: 'var(--color-fg-subtle)',
          disabled: 'var(--color-fg-disabled)',
        },

        accent: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
          bg: 'var(--color-accent-bg)',
          'bg-hover': 'var(--color-accent-bg-hover)',
          fg: 'var(--color-accent-fg)',
        },

        // Legacy aliases — remove after migration
        primary: {
          DEFAULT: 'var(--color-accent)',
          hover: 'var(--color-accent-hover)',
          light: 'var(--color-accent-bg)',
        },
        background: 'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-panel)',
          hover: 'var(--color-raised)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-muted)',
        },
        text: {
          DEFAULT: 'var(--color-fg)',
          muted: 'var(--color-fg-muted)',
        },

        // Semantic status
        danger: {
          DEFAULT: 'var(--color-danger)',
          bg: 'var(--color-danger-bg)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
        },
        pending: {
          DEFAULT: 'var(--color-pending)',
          bg: 'var(--color-pending-bg)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        xs: ['12px', { lineHeight: '16px' }],
        'sm-compact': ['13px', { lineHeight: '18px' }],
        sm: ['13.5px', { lineHeight: '20px' }],
        base: ['15px', { lineHeight: '22px' }],
        lg: ['17px', { lineHeight: '24px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
        '3xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      spacing: {
        '0.75': '3px',
        '1.25': '5px',
        '1.75': '7px',
        '2.25': '9px',
      },
      boxShadow: {
        'elev-1': 'var(--shadow-sm)',
        'elev-2': 'var(--shadow-md)',
        'elev-3': 'var(--shadow-lg)',
        'elev-4': 'var(--shadow-xl)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        spring: 'var(--ease-spring)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '260ms',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-out': { from: { opacity: '1' }, to: { opacity: '0' } },
        'scale-in': { from: { opacity: '0', transform: 'scale(0.96)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'scale-out': { from: { opacity: '1', transform: 'scale(1)' }, to: { opacity: '0', transform: 'scale(0.96)' } },
        'slide-in-right': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'slide-out-right': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(100%)' } },
        'slide-up': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        'fade-in': 'fade-in var(--dur-base) var(--ease-out)',
        'fade-out': 'fade-out var(--dur-fast) var(--ease-out)',
        'scale-in': 'scale-in var(--dur-base) var(--ease-out)',
        'scale-out': 'scale-out var(--dur-fast) var(--ease-out)',
        'slide-in-right': 'slide-in-right var(--dur-slow) var(--ease-out)',
        'slide-out-right': 'slide-out-right var(--dur-base) var(--ease-out)',
        'slide-up': 'slide-up var(--dur-base) var(--ease-out)',
        shimmer: 'shimmer 1.6s infinite linear',
      },
    },
  },
  plugins: [],
};

export default config;
