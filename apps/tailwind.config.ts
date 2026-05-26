import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: { DEFAULT: '#1D9E75' },
        mint: '#A8F0D8',
        navy: { deep: '#0A1628', mid: '#0F2040', dark: '#060E1A' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'teal-glow': 'radial-gradient(ellipse at 50% 0%, rgba(29,158,117,0.12), transparent 70%)',
        'teal-glow-center': 'radial-gradient(ellipse at center, rgba(29,158,117,0.2) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
}

export default config
