import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
  isDarkMode: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');
  
  // Initialize theme from localStorage or system preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.body.classList.add('dark-mode');
        document.body.setAttribute('data-theme', 'dark');
      } else if (savedTheme === 'light') {
        setTheme('light');
        document.body.classList.remove('dark-mode');
        document.body.removeAttribute('data-theme');
      } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (prefersDark) {
          setTheme('dark');
          document.body.classList.add('dark-mode');
          document.body.setAttribute('data-theme', 'dark');
        } else {
          setTheme('light');
        }
      }
    }
  }, []);
  
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Update localStorage
      localStorage.setItem('theme', newTheme);
      
      // Update body class
      if (newTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.setAttribute('data-theme', 'dark');
      } else {
        document.body.classList.remove('dark-mode');
        document.body.removeAttribute('data-theme');
      }
      
      return newTheme;
    });
  };
  
  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      isDarkMode: theme === 'dark'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;