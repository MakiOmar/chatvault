/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        whatsapp: {
          primary: '#00a884',
          secondary: '#008069',
          light: '#d1f4cc',
          dark: '#0b141a',
          gray: '#8696a0',
          bubble: {
            sent: '#d9fdd3',
            received: '#ffffff',
            'sent-dark': '#005c4b',
            'received-dark': '#202c33'
          },
          bg: {
            light: '#f0f2f5',
            dark: '#0b141a',
            chat: '#efeae2',
            'chat-dark': '#0b141a'
          }
        }
      },
      fontFamily: {
        'whatsapp': ['Segoe UI', 'Helvetica Neue', 'Helvetica', 'Lucida Grande', 'Arial', 'Ubuntu', 'Cantarell', 'Fira Sans', 'sans-serif']
      },
      borderColor: {
        DEFAULT: '#e5e7eb',
        'dark': '#374151'
      }
    },
  },
  plugins: [],
}
