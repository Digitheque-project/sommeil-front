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
        success: '#4CAF50',
        warning: '#FFA726',
        danger: '#EF5350',
        info: '#42A5F5',
        background: '#FFFFFF',
        surface: '#F7F9FA',
        border: '#E0E4E8',
        'text-primary': '#3A3F44',
        'text-secondary': '#6C7680',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#004A66',
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
        'outline-variant': '#E0E4E8',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        headline: ['Manrope', 'sans-serif'],
      },
      spacing: {
        'container-padding': '24px',
        'section-gap': '32px',
      }
    }
  },
  plugins: []
};
