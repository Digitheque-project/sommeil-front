/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/(app)/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#006A8C',
        'primary-dark': '#004A66',
        accent: '#0A7EA4',
        success: '#059669',
        warning: '#FFA726',
        danger: '#E11D48',
        info: '#42A5F5',
        background: '#F8F9FB',
        surface: '#F7F9FA',
        border: '#E2E8F0',
        'text-primary': '#0F172A',
        'text-secondary': '#64748B',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#004A66',
        secondary: '#006A8C',
        'secondary-fixed': '#F0F7FF',
        'tertiary-fixed': '#F8F9FB',
        error: '#E11D48',
        'error-container': '#FFE4E6',
        'on-background': '#0F172A',
        'on-secondary': '#FFFFFF',
        'on-surface': '#0F172A',
        'on-surface-variant': '#64748B',
        'surface-bright': '#FFFFFF',
        'surface-container': '#F1F5F9',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#F8FAFC',
        'surface-container-high': '#E2E8F0',
        'secondary-container': '#CFE9EF',
        'on-secondary-container': '#004A66',
        'outline-variant': '#E2E8F0',
        // Plusieurs écrans utilisent encore les classes Tailwind blue-* par
        // défaut : retintées en teal pour suivre la charte CHU.
        blue: {
          50: '#eaf6f9', 100: '#d6eef3', 200: '#aedce6', 300: '#7fc3d3',
          400: '#4aa8be', 500: '#0a7ea4', 600: '#006a8c', 700: '#004a66',
          800: '#003847', 900: '#012430',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['var(--font-sans)', 'Manrope', 'sans-serif'],
      },
      // Échelle typographique commune (modèle Consultation externe).
      fontSize: {
        'display-lg': ['28px', { lineHeight: '1.2', fontWeight: '800' }],
        'headline-md': ['20px', { lineHeight: '1.3', fontWeight: '800' }],
        'headline-sm': ['18px', { lineHeight: '1.3', fontWeight: '800' }],
        'label-md': ['13px', { lineHeight: '1.4', fontWeight: '600' }],
        'label-sm': ['11px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '1.5' }],
        'body-sm': ['13px', { lineHeight: '1.5' }],
      },
      spacing: {
        'container-padding': '24px',
        'section-gap': '32px',
        gutter: '24px',
        unit: '8px',
      }
    }
  },
  plugins: []
};
