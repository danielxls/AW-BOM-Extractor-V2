import React from 'react';
import { useTheme } from '../hooks/useTheme';
import Icon from './common/Icon';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-brand-gray-500 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-brand-gray-900"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'light' ? (
                <span className="material-symbols-outlined text-xl">dark_mode</span>
            ) : (
                <span className="material-symbols-outlined text-xl">light_mode</span>
            )}
        </button>
    );
};

export default ThemeToggle;
