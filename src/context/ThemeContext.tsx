import React, { createContext } from 'react';
import { ThemeContextType } from '../types';

const defaultTheme: ThemeContextType = {
  colors: {
    primary: '#c75c3e',
    background: '#FDEEE0',
    card: '#FFFFFF',
    text: '#333333',
    textLight: '#666666',
    border: '#E8E8E8',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FFC107',
    info: '#2196F3',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 28, fontWeight: '700' },
    h2: { fontSize: 24, fontWeight: '700' },
    h3: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    small: { fontSize: 14, fontWeight: '400' },
    caption: { fontSize: 12, fontWeight: '400' },
  },
  borderRadius: {
    pill: 25,
    card: 12,
    button: 25,
    input: 25,
  },
};

export const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
};
