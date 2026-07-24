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
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
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
        app: '#f0f4f8',
        surface: '#ffffff',
        'app-dark': '#0a1929',
        'surface-dark': '#0d2137',
        // Industrial Skeuomorphism Tokens
        industrial: {
          bg: '#e0e5ec',            // Chassis Level 0 (mid-tone cool grey)
          panel: '#f0f2f5',         // Raised panel surface
          muted: '#d1d9e6',         // Sunken recessed areas
          accent: '#183757',        // Relm Navy Blue
          'accent-hover': '#15314e',
          text: '#2d3436',          // Dark charcoal ink
          'text-muted': '#4a5568',    // Darker slate grey for labels
          border: '#babecc',        // Neumorphic shadow half
          highlight: '#ffffff',     // Neumorphic light half
          'border-dark': '#a3b1c6',
        },
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #0d2137 0%, #1a3a5c 100%)',
        'auth-gradient': 'linear-gradient(135deg, #0d2137 0%, #183757 100%)',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'neumorphic-card': '8px 8px 16px #babecc, -8px -8px 16px #ffffff',
        'neumorphic-floating': '12px 12px 24px #babecc, -12px -12px 24px #ffffff, inset 1px 1px 0 rgba(255,255,255,0.5)',
        'neumorphic-recessed': 'inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff',
        'neumorphic-pressed': 'inset 6px 6px 12px #babecc, inset -6px -6px 12px #ffffff',
        'led-glow': '0 0 10px 2px rgba(24, 55, 87, 0.6)',
        'led-glow-green': '0 0 10px 2px rgba(34, 197, 94, 0.8)',
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

