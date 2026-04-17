import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        ink: {
          50: '#f8f7f4',
          100: '#efece4',
          200: '#dcd6c6',
          300: '#bdb39b',
          400: '#8f846a',
          500: '#5e5740',
          600: '#3f3a2b',
          700: '#2a2620',
          800: '#1c1a16',
          900: '#100f0d',
        },
        accent: {
          DEFAULT: '#7a5cff',
          dark: '#5b3edb',
        },
      },
    },
  },
  plugins: [],
};

export default config;
