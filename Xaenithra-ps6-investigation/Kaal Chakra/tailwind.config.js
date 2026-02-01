/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep Space Black Palette
        'space-black': '#050505',
        'deep-void': '#0a0a12',
        'cosmic-blue': '#1a1a2e',

        // Holographic Gold (Vedic)
        'vedic-gold': '#FFD700',
        'vedic-gold-dim': '#C5A000',
        'vedic-gold-glow': '#FFE55C',

        // Cyber Accents
        'neon-cyan': '#00F0FF',
        'neon-magenta': '#FF003C',
        'holo-glass': 'rgba(255, 255, 255, 0.05)',
      },
      fontFamily: {
        'orbitron': ['"Orbitron"', 'sans-serif'],
        'cinzel': ['"Cinzel"', 'serif'],
        'inter': ['"Inter"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid': "linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px)",
        'radial-space': "radial-gradient(circle at 50% 50%, #1a1a2e 0%, #000000 100%)",
      },
      boxShadow: {
        'neon-glow': '0 0 10px rgba(0, 240, 255, 0.5)',
        'gold-glow': '0 0 15px rgba(255, 215, 0, 0.3)',
      }
    },
  },
  plugins: [],
}
