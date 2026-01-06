import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Morphysm Palette - Verde/Blanco
        morph: {
          bg: '#FFFFFF', // Fondo principal blanco
          surface: '#F5F5F5', // Superficie elevada
          border: '#E0E0E0', // Bordes suaves
          
          // Verde principal (Five branding)
          primary: {
            50: '#E8F5E9',
            100: '#C8E6C9',
            200: '#A5D6A7',
            300: '#81C784',
            400: '#66BB6A',
            500: '#4CAF50', // Verde principal
            600: '#43A047',
            700: '#388E3C',
            800: '#2E7D32',
            900: '#1B5E20',
          },
          
          // Grises para texto y elementos
          gray: {
            50: '#FAFAFA',
            100: '#F5F5F5',
            200: '#EEEEEE',
            300: '#E0E0E0',
            400: '#BDBDBD',
            500: '#9E9E9E',
            600: '#757575',
            700: '#616161',
            800: '#424242',
            900: '#212121',
          },
          
          // Estados
          success: '#4CAF50',
          warning: '#FFC107',
          error: '#F44336',
          info: '#2196F3',
        },
        
        // Colores de estado para pedidos
        status: {
          draft: '#9E9E9E',
          confirmed: '#2196F3',
          processing: '#FFC107',
          delivered: '#4CAF50',
          cancelled: '#F44336',
        },
      },
      
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-raleway)', 'Raleway', 'system-ui', 'sans-serif'],
      },
      
      boxShadow: {
        // Morphism shadows
        'morph-sm': '4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'morph': '6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.9)',
        'morph-lg': '10px 10px 20px rgba(0, 0, 0, 0.2), -10px -10px 20px rgba(255, 255, 255, 0.9)',
        'morph-inset': 'inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.9)',
        'morph-inset-deep': 'inset 6px 6px 12px rgba(0, 0, 0, 0.15), inset -6px -6px 12px rgba(255, 255, 255, 0.9)',
      },
      
      borderRadius: {
        'morph': '16px',
        'morph-lg': '24px',
        'morph-xl': '32px',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
