import { useColorScheme } from 'react-native';

/**
 * 🔵 PREMIUM BLUE THEME PALETTE 🔵
 * Optimized for a state-of-the-art education experience.
 */
export const COLORS = {
  light: {
    primary: '#0066FF',   // Royal Blue
    background: '#F1F7FF', // Softest Sky Blue
    surface: '#FFFFFF',
    border: 'rgba(0, 102, 255, 0.12)', // Increased visibility
    text: '#111827',      // Near black
    gray: '#4B5563',
    card: '#FFFFFF',
    iconBg: '#F3F4F6',
    glow: 'rgba(0, 102, 255, 0.15)',
  },
  dark: {
    primary: '#3B82F6',   // Brighter Ocean Blue
    background: '#040712', // Deep Space Navy
    surface: '#0B1120',    // Distinct Slate Navy
    border: '#1E293B',     // High-Visibility Solid Border (VITAL)
    text: '#F8FAFC',      // Crisp white-blue text
    gray: '#94A3B8',
    card: '#0F172A',       // Stronger Card Navy
    iconBg: '#1E293B',     // Highlighted Icon backdrop
    glow: 'rgba(59, 130, 246, 0.25)',
  }
};

export const useAppTheme = () => {
  const scheme = useColorScheme();
  return COLORS[scheme === 'dark' ? 'dark' : 'light'];
};
