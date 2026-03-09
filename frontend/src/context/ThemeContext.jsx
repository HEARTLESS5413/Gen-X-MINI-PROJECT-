import React, { createContext, useContext, useState, useEffect } from 'react';
import { theme as themeStore } from '../lib/store';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [themeMode, setThemeMode] = useState('dark');

    useEffect(() => {
        themeStore.init();
        setThemeMode(themeStore.get());
    }, []);

    const toggleTheme = () => {
        const next = themeStore.toggle();
        setThemeMode(next);
    };

    const setTheme = (mode) => {
        themeStore.set(mode);
        setThemeMode(mode);
    };

    return (
        <ThemeContext.Provider value={{ themeMode, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}
