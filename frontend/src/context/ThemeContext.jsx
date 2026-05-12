import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage or default to dark
    const savedTheme = localStorage.getItem('omnibin_theme');
    if (savedTheme) {
      return savedTheme;
    }
    return 'dark'; // default to dark since app was previously dark-heavy
  });

  useEffect(() => {
    // Update local storage
    localStorage.setItem('omnibin_theme', theme);
    // Add/remove dark class on root html element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
