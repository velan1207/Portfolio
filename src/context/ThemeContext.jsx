import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('site:theme')
        if (saved) return saved

        // Then check system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark'
        }
        return 'default'
    })

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement
        root.setAttribute('data-theme', theme === 'default' ? '' : theme)
        localStorage.setItem('site:theme', theme)
    }, [theme])

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e) => {
            const saved = localStorage.getItem('site:theme')
            // Only auto-switch if user hasn't manually selected a theme
            if (!saved || saved === 'default') {
                setTheme(e.matches ? 'dark' : 'default')
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const toggleTheme = () => {
        setTheme(prev => {
            if (prev === 'default') return 'dark'
            if (prev === 'dark') return 'warm'
            return 'default'
        })
    }

    const value = {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export default ThemeContext
