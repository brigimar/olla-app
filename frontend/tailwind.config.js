/** @type {import('tailwindcss').Config} */
module.exports = {
  // App Router bajo src/, cubrimos app/, components/ y pages/ si los usás
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        DEFAULT: '100%',
        sm: '100%',
        md: '100%',
        lg: '100%',
        xl: '100%',
        '2xl': '100%',
      },
    },
    extend: {
      // Paleta combinada: “OllaApp” + brand + tokens CSS variables
      colors: {
        // OllaApp (calidez y artesanía)
        tomato: '#FF5533',
        'tomato-light': '#FF7755',
        'warm-cream': '#FFF4E9',
        'olive-soft': '#6E7F4F',
        'olive-light': '#8A9B68',
        'dark-graphite': '#1A1A1C',
        'gold-accent': '#F2B544',
        'cream-light': '#FFF9F2',
        card: '#FFFFFF',
        border: '#E6E6E6',
        muted: '#7B7B7B',

        // Brand existente
        brand: {
          DEFAULT: '#2563eb',
          light: '#3b82f6',
          dark: '#1e40af',
        },
        neutral: {
          DEFAULT: '#111111',
          light: '#666666',
          dark: '#000000',
        },

        // Tokens mapeados a variables CSS (si las definís en :root de globals.css)
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        'muted-fg': 'var(--muted-fg)',
        accent: 'var(--accent)',
        accent2: 'var(--accent-2)',
        accent3: 'var(--accent-3)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        // Mantener card/border también como tokens si los usás vía variables
        'card-var': 'var(--card)',
        'border-var': 'var(--border)',
      },

      // Tipografías
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },

      // Spacing extra
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },

      // Radios combinados (valores fijos + token global)
      borderRadius: {
        sm: '12px',
        md: '20px',
        lg: '28px', // fijo (coherente con tu diseño)
        xl: '36px',
        // token global desde :root (cuando quieras vincular a variable)
        'lg-var': 'var(--radius)',
      },

      // Sombras combinadas
      boxShadow: {
        'sm-custom': '0 4px 12px rgba(0,0,0,0.08)',
        'md-custom': '0 8px 24px rgba(0,0,0,0.12)',
        'lg-custom': '0 16px 40px rgba(0,0,0,0.15)',
        card: '0 8px 24px rgba(0,0,0,0.06)',
      },

      // Easing (opcional; Tailwind ya usa ese por defecto)
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    // Nota: desde Tailwind v3.3, line-clamp viene incluido; si no te aporta, podés quitarlo.
    // require('@tailwindcss/line-clamp'),
  ],
};
