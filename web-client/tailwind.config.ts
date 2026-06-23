import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: { colors: { ink: '#171713', canvas: '#f7f7f3', line: '#e8e8e1', lime: '#dfff4f', muted: '#74746d' }, boxShadow: { soft: '0 18px 50px rgba(23,23,19,.08)' } } },
  plugins: [],
} satisfies Config;
