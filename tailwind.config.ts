// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0f',
          surface: '#111118',
          elevated: '#1a1a28',
          hover: '#222234',
        },
        accent: {
          purple: '#a855f7',
        },
      },
      animation: {
        'node-pulse': 'node-pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
