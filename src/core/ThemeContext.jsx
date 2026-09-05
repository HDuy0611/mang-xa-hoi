import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [theme, setThemeState] = useState(() => localStorage.getItem('nova_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!isAuthenticated) return
    axios.get('/api/settings')
      .then(res => {
        const serverTheme = res.data.settings?.theme
        if (serverTheme && serverTheme !== theme) {
          setThemeState(serverTheme)
          localStorage.setItem('nova_theme', serverTheme)
        }
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  function setTheme(next) {
    setThemeState(next)
    localStorage.setItem('nova_theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
