/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    black: '#0a0a0f',
                    dark: '#12121a',
                    panel: '#1a1a24',
                    primary: '#00f0ff', // Cyan
                    secondary: '#7000ff', // Purple
                    accent: '#ff003c', // Red
                    text: '#e0e0e0',
                    dim: '#8a8a9b'
                }
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'monospace'],
                sans: ['Inter', 'sans-serif']
            },
            backgroundImage: {
                'grid-pattern': "linear-gradient(to right, #1a1a24 1px, transparent 1px), linear-gradient(to bottom, #1a1a24 1px, transparent 1px)",
            }
        },
    },
    plugins: [],
}
