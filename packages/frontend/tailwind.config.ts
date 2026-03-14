import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // =====================================================
        // PRIMARY - Κύριο χρώμα της εφαρμογής
        // Χρησιμοποιείται σε: κουμπιά, links, toggle switches,
        // progress indicators, focus rings, hover states
        // =====================================================
        primary: {
          50: '#f0f9ff',   // Background πολύ ανοιχτό
          100: '#e0f2fe',  // Background ανοιχτό
          200: '#bae6fd',  // Hover background (light mode)
          300: '#7dd3fc',  // Borders ανοιχτά
          400: '#38bdf8',  // Text/icons σε dark mode
          500: '#0ea5e9',  // ΚΥΡΙΟ ΧΡΩΜΑ - κουμπιά, toggles
          600: '#0284c7',  // Hover state κουμπιών
          700: '#0369a1',  // Active/pressed state
          800: '#075985',  // Text σκούρο
          900: '#0c4a6e',  // Text πολύ σκούρο
          950: '#082f49',  // Background σκούρο
        },
        // =====================================================
        // SECONDARY - Δευτερεύον χρώμα (Amber/Κίτρινο)
        // Χρησιμοποιείται σε: δευτερεύοντα κουμπιά,
        // highlights, badges, το dropoff location dot
        // =====================================================
        secondary: {
          50: '#fffbeb',   // Background πολύ ανοιχτό
          100: '#fef3c7',  // Background ανοιχτό
          200: '#fde68a',  // Hover background
          300: '#fcd34d',  // Borders
          400: '#fbbf24',  // Icons, highlights
          500: '#f59e0b',  // ΚΥΡΙΟ - dropoff dot, secondary buttons
          600: '#d97706',  // Hover state
          700: '#b45309',  // Active state
          800: '#92400e',  // Text σκούρο
          900: '#78350f',  // Text πολύ σκούρο
          950: '#451a03',  // Background σκούρο
        },
        // =====================================================
        // ACCENT - Χρώμα επιτυχίας/ολοκλήρωσης (Πράσινο)
        // Χρησιμοποιείται σε: checkmarks ✓, completed steps,
        // success messages, τα πράσινα bubbles στο progress
        // =====================================================
        accent: {
          50: '#ecfdf5',   // Success background ανοιχτό
          100: '#d1fae5',  // Success background
          200: '#a7f3d0',  // Success border
          300: '#6ee7b7',  // Success icons light
          400: '#34d399',  // Success icons
          500: '#10b981',  // ΚΥΡΙΟ - completed steps, checkmarks
          600: '#059669',  // Hover
          700: '#047857',  // Active
          800: '#065f46',  // Text σκούρο
          900: '#064e3b',  // Text πολύ σκούρο
          950: '#022c22',  // Background σκούρο
        },
        // =====================================================
        // SEMANTIC - Χρώματα με συγκεκριμένη σημασία
        // =====================================================
        success: '#10b981', // Επιτυχία (ίδιο με accent-500)
        warning: '#f59e0b', // Προειδοποίηση (ίδιο με secondary-500)
        error: '#ef4444',   // Σφάλμα, ακύρωση, διαγραφή (Κόκκινο)
        info: '#0ea5e9',    // Πληροφορία (ίδιο με primary-500)
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover':
          '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        spin: 'spin 1s linear infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        spin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
