import React, { createContext, useContext } from 'react';
import { DarkColors, ThemeColors } from '@/constants/theme';

// Single brand theme — FoodWise uses navy/teal exclusively
type ThemeContextType = {
  theme: 'dark';
  colors: ThemeColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: DarkColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme: 'dark', colors: DarkColors, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => useContext(ThemeContext).colors;
