import { createContext, useContext, useState, useEffect } from 'react'
import { theme as darkTheme, themeLight } from '../theme'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'trust-sense-theme'

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored !== 'light'
    } catch {
      return true
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch (_) {}
  }, [isDark])

  const toggleTheme = () => setIsDark((v) => !v)
  const currentTheme = isDark ? darkTheme : themeLight

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme: currentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) return { isDark: true, toggleTheme: () => {}, theme: darkTheme }
  return ctx
}
