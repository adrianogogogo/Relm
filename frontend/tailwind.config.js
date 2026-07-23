/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        title: ['"Plus Jakarta Sans"', 'sans-serif'],
        kinetic: ['"Space Grotesk"', 'sans-serif'],
      },
      colors: {
        // Cor de marca (azul corporativo do design system) — ancorada em #1565C0
        primary: {
          DEFAULT: '#183757',
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#183757',
          600: '#15314e',
          700: '#11283f',
          800: '#0e1f32',
          900: '#091522',
        },
        // Slate escuro (secundário do design system)
        secondary: {
          DEFAULT: '#2d3a4a',
          50: '#eceff2',
          100: '#cdd5dd',
          200: '#a9b6c2',
          300: '#7e8fa0',
          400: '#5b6c7e',
          500: '#2d3a4a',
          600: '#283440',
          700: '#1f2935',
          800: '#1a252f',
          900: '#121a22',
        },
        // Tokens semânticos de status — permitem bg-success/20, text-success, etc.
        success: {
          DEFAULT: '#4CAF50',
          50: '#e8f5e9',
          100: '#c8e6c9',
          500: '#4CAF50',
          600: '#43a047',
          700: '#388e3c',
        },
        warning: {
          DEFAULT: '#FF9800',
          50: '#fff3e0',
          100: '#ffe0b2',
          500: '#FF9800',
          600: '#fb8c00',
          700: '#f57c00',
        },
        error: {
          DEFAULT: '#F44336',
          50: '#ffebee',
          100: '#ffcdd2',
          500: '#F44336',
          600: '#e53935',
          700: '#d32f2f',
        },
        info: {
          DEFAULT: '#2196F3',
          50: '#e3f2fd',
          100: '#bbdefb',
          500: '#2196F3',
          600: '#1e88e5',
          700: '#1976d2',
        },
        // Superfícies / fundos
        app: '#f0f4f8',          // fundo claro da aplicação
        surface: '#ffffff',      // fundo de cards/superfícies (claro)
        'app-dark': '#0a1929',   // fundo escuro da aplicação
        'surface-dark': '#0d2137', // superfície escura (mesmo tom do topo da sidebar)
        // Kinetic Typography tokens
        kinetic: {
          bg: '#f8fafc',           // fundo claro das seções kinetic
          'bg-dark': '#09090B',    // fundo escuro (rich black)
          accent: '#42a5f5',       // accent cinético light (primary-400)
          'accent-dark': '#64b5f6',// accent cinético dark (primary-300)
          muted: '#e2e8f0',        // elementos decorativos light
          'muted-dark': '#27272A', // elementos decorativos dark (zinc-800)
          border: '#cbd5e1',       // bordas light (slate-300)
          'border-dark': '#3F3F46',// bordas dark (zinc-700)
          fg: '#0f172a',           // foreground light (slate-900)
          'fg-dark': '#FAFAFA',    // foreground dark (off-white)
          'fg-muted': '#64748b',   // texto secundário light (slate-500)
          'fg-muted-dark': '#A1A1AA', // texto secundário dark (zinc-400)
        },
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0d2137 0%, #1a3a5c 100%)',
        'auth-gradient': 'linear-gradient(135deg, #0d2137 0%, #183757 100%)',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'marquee-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'marquee-scroll': 'marquee-scroll 20s linear infinite',
      },
    },
  },
  plugins: [],
}

