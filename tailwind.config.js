/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                'primary': '#06a8f9',
                'background-light': '#f5f7f8',
                'background-dark': '#0f1c23',
                'brand-blue': '#06a8f9',
                'brand-blue-light': '#e6f7ff',
                'brand-gray': {
                    100: '#F5F5F7',
                    200: '#EAEAEB',
                    300: '#D1D1D6',
                    400: '#AEAEB2',
                    500: '#8E8E93',
                    600: '#636366',
                    700: '#48484A',
                    800: '#2C2C2E',
                    900: '#1C1C1E',
                }
            },
            fontFamily: {
                'display': ['Inter', 'sans-serif'],
            },
            borderRadius: {
                'DEFAULT': '0.5rem',
                'lg': '1rem',
                'xl': '1.5rem',
                'full': '9999px'
            },
            keyframes: {
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.3s ease-out forwards',
            },
        },
    },
    plugins: [],
}
