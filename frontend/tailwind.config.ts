// frontend/tailwind.config.ts
// The design tokens map to the CSS custom properties defined in globals.css, so a
// single source of truth drives both Tailwind utilities and any raw CSS.
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          pressed: 'var(--color-primary-pressed)',
          tint: 'var(--color-primary-tint)',
          subtle: 'var(--color-primary-tint)',
        },
        // Full ramp for building new tints/shades. 100/500/600/700 are byte-identical
        // to primary/tint/hover/pressed above - use those semantic names in product
        // code; reach for `green-*` only when you genuinely need a shade with no
        // existing semantic name (e.g. green-50 wash, green-300 disabled state).
        green: {
          50: 'var(--green-50)',
          100: 'var(--green-100)',
          200: 'var(--green-200)',
          300: 'var(--green-300)',
          400: 'var(--green-400)',
          500: 'var(--green-500)',
          600: 'var(--green-600)',
          700: 'var(--green-700)',
          800: 'var(--green-800)',
          900: 'var(--green-900)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        surface: {
          DEFAULT: 'var(--color-card)',
          elevated: 'var(--color-card)',
        },
        sidebar: {
          DEFAULT: 'var(--color-sidebar-bg)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-primary)', // solid pill fill, not a tint - see StudentSidebar.tsx
          border: 'var(--color-sidebar-border)',
          text: 'var(--color-sidebar-text)',
          'text-active': 'var(--color-sidebar-text-active)',
        },
        'hover-surface': 'var(--color-hover-surface)',
        'selected-surface': 'var(--color-selected-surface)',
        'accent-blue': { DEFAULT: 'var(--accent-blue)', bg: 'var(--accent-blue-bg)' },
        'accent-purple': { DEFAULT: 'var(--accent-purple)', bg: 'var(--accent-purple-bg)' },
        'accent-teal': { DEFAULT: 'var(--accent-teal)', bg: 'var(--accent-teal-bg)' },
        'accent-orange': { DEFAULT: 'var(--accent-orange)', bg: 'var(--accent-orange-bg)' },
        'accent-pink': { DEFAULT: 'var(--accent-pink)', bg: 'var(--accent-pink-bg)' },
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        // NOTE: unlike text-primary/secondary/muted/disabled above (which are
        // deliberately double-prefixed - `text-primary` is the color KEY, used as
        // `text-text-primary` - an established convention from Checkpoint A with
        // too many call sites to rename), these two are new and used directly as
        // `text-inverse`/`text-link` at their call sites, so the key itself must
        // NOT include the `text-` prefix or Tailwind generates `text-text-inverse`
        // instead of `text-inverse`.
        inverse: 'var(--color-text-inverse)',
        link: 'var(--color-primary)',
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
          focus: 'var(--color-primary)',
        },
        success: { DEFAULT: 'var(--color-success)', bg: 'var(--color-success-bg)', text: 'var(--color-success-text)', border: 'var(--color-success-border)' },
        warning: { DEFAULT: 'var(--color-warning)', bg: 'var(--color-warning-bg)', text: 'var(--color-warning-text)', border: 'var(--color-warning-border)' },
        error: { DEFAULT: 'var(--color-error)', hover: 'var(--color-error-hover)', bg: 'var(--color-error-bg)', text: 'var(--color-error-text)', border: 'var(--color-error-border)' },
        info: { DEFAULT: 'var(--color-info)', bg: 'var(--color-info-bg)', text: 'var(--color-info-text)', border: 'var(--color-info-border)' },
      },
      borderRadius: {
        card: '6px',
        control: '4px',
      },
      fontFamily: {
        sans: ['Candara', 'Segoe UI', 'Optima', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Constantia', 'Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
      },
      fontSize: {
        display: ['2.25rem', { lineHeight: '2.75rem', fontWeight: '500' }],
        'page-title': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }],
        'section-heading': ['1.125rem', { lineHeight: '1.5rem', fontWeight: '500' }],
        'card-heading': ['0.9375rem', { lineHeight: '1.25rem', fontWeight: '500' }],
        body: ['0.875rem', { lineHeight: '1.375rem', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1rem', fontWeight: '400' }],
        kpi: ['1.875rem', { lineHeight: '2.25rem', fontWeight: '500', letterSpacing: '-0.01em' }],
        table: ['0.8125rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(45, 55, 72, 0.04), 0 1px 3px 0 rgba(45, 55, 72, 0.03)',
        md: '0 4px 12px -2px rgba(45, 55, 72, 0.08), 0 2px 6px -2px rgba(45, 55, 72, 0.05)',
        lg: '0 12px 32px -8px rgba(45, 55, 72, 0.12)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(6px)' },
          '40%': { transform: 'translateX(-6px)' },
          '60%': { transform: 'translateX(3px)' },
          '80%': { transform: 'translateX(-3px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        shake: 'shake 0.25s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
