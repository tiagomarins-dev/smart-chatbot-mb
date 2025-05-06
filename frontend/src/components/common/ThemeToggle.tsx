import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme} 
      aria-label={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
    >
      {isDarkMode ? (
        <i className="bi bi-sun-fill"></i>
      ) : (
        <i className="bi bi-moon-fill"></i>
      )}
    </button>
  );
};

export default ThemeToggle;