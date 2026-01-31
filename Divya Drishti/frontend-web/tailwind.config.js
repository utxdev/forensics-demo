/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'cyber-black': '#050505',
                'cyber-dark': '#0a0a0a',
                'cyber-panel': '#111111',
                'neon-cyan': '#00f3ff',
                'neon-gold': '#ffd700',
                'holo-red': '#ff2a2a',
            },
            fontFamily: {
                'rajdhani': ['Rajdhani', 'sans-serif'],
                'mono': ['Space Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
