/** @type {import('tailwindcss').Config} */
// Tokens de color del Design Brief (docs/DESIGN_BRIEF.md §2).
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E8E4F', // acciones principales, ahorro, éxito
          dark: '#0F5C30', // títulos de marca, texto sobre fondo claro
          tint: '#E6F4EC', // fondos suaves, tarjetas destacadas
        },
        accent: '#E8872E', // promociones, alertas
        ink: {
          DEFAULT: '#1A1A1A', // texto principal
          muted: '#6B7280', // texto secundario, metadatos
        },
        surface: '#FFFFFF',
        background: '#F7F8F7',
        border: '#E5E7EB',
        error: '#D64545',
      },
    },
  },
  plugins: [],
};
