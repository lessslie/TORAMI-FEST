import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        torami: {
          red: '#D70000',
          dark: '#1a1a1a',
          light: '#f5f5f5',
          accent: '#E0B0FF',
        },
      },
      fontFamily: {
        display: ['"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        body: ['"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        script: ['"Billion Dreams"', '"Brush Script MT"', 'cursive'],
      },
      boxShadow: {
        manga: '4px 4px 0px 0px rgba(0,0,0,1)',
        'manga-hover': '6px 6px 0px 0px #D70000',
      },
      animation: {
        'bounce-slow': 'bounce 2.2s infinite',
      },
    },
  },
  plugins: [animate],
};

export default config;
