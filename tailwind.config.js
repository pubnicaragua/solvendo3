/** @type {import('tailwindcss').Config} */  
export default {  
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],  
  theme: {  
    extend: {  
      fontFamily: {  
        sans: ['Montserrat', 'Inter', 'ui-sans-serif', 'system-ui'],  
        'pos': ['Montserrat', 'sans-serif'],  
      },  
      colors: {  
        // Colores personalizados del POS  
        'pos-bg': '#f9f9f9',  
        'pos-panel': '#ffffff',  
        'pos-primary': '#2979ff',  
          
        // Actualizar colores primarios existentes  
        primary: {  
          DEFAULT: '#2979ff', // Tu color primario  
          dark: '#1565c0',  
          light: '#42a5f5',  
        },  
        accent: {  
          DEFAULT: '#101014', // negro del logo (mantener)  
        },  
        gray: {  
          50: '#fafafa',  
          100: '#f4f4f5',  
          200: '#e4e4e7',  
          300: '#d4d4d8',  
          400: '#a1a1aa',  
          500: '#71717a',  
          600: '#52525b',  
          700: '#3f3f46',  
          800: '#27272a',  
          900: '#18181b',  
        },  
        white: '#fff',  
        black: '#101014',  
        blue: {  
          50: '#eff6ff',  
          100: '#dbeafe',  
          200: '#bfdbfe',  
          300: '#93c5fd',  
          400: '#60a5fa',  
          500: '#3b82f6',  
          600: '#2979ff', // Actualizado con tu color  
          700: '#1565c0',  
          800: '#1e40af',  
          900: '#1e3a8a',  
        },  
      },  
      borderRadius: {  
        lg: '16px',  
        xl: '24px',  
      },  
      boxShadow: {  
        card: '0 2px 16px 0 rgba(16,16,20,0.08)',  
        modal: '0 4px 32px 0 rgba(16,16,20,0.16)',  
      },  
      // Agregar espaciado personalizado para el POS  
      spacing: {  
        '18': '4.5rem',  
        '88': '22rem',  
      },  
    },  
  },  
  plugins: [  
    // Plugin personalizado para agregar las clases CSS del POS  
    function({ addComponents, theme }) {  
      addComponents({  
        '.pos-container': {  
          display: 'flex',  
          height: '100vh',  
          backgroundColor: '#f9f9f9',  
        },  
        '.pos-left, .pos-right': {  
          backgroundColor: '#ffffff',  
          padding: '1.5rem',  
          overflowY: 'auto',  
        },  
        '.pos-left': {  
          flex: '2',  
        },  
        '.pos-right': {  
          flex: '1',  
          borderLeft: '1px solid #ddd',  
        },  
        '.btn': {  
          display: 'inline-flex',  
          alignItems: 'center',  
          justifyContent: 'center',  
          padding: '0.75rem 1.5rem',  
          borderRadius: '0.5rem',  
          fontFamily: theme('fontFamily.pos'),  
          fontWeight: '600',  
          transition: 'all 0.2s ease-in-out',  
        },  
        '.btn-primary': {  
          backgroundColor: '#2979ff',  
          color: 'white',  
          '&:hover': {  
            backgroundColor: '#1565c0',  
          },  
        },  
        '.btn-secondary': {  
          backgroundColor: '#f0f0f0',  
          color: '#333',  
          '&:hover': {  
            backgroundColor: '#e0e0e0',  
          },  
        },  
      })  
    }  
  ],  
};