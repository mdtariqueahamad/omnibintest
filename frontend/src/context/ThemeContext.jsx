import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

// Always light — eco glassmorphism theme only
export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    // Always remove dark mode for the new light eco design
    document.documentElement.classList.remove('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
