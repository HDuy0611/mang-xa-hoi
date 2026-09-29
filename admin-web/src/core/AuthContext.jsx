import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('nova_token')
    if (saved) axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`
    return saved
  })
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('nova_user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    axios.get('/api/users/me')
      .then(res => updateUser(res.data.user))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401 && localStorage.getItem('nova_token')) {
          localStorage.removeItem('nova_token')
          localStorage.removeItem('nova_user')
          delete axios.defaults.headers.common['Authorization']
          setToken(null)
          setUser(null)
          if (window.location.pathname !== '/') {
            window.location.href = '/'
          }
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(interceptorId)
  }, [])

  function login(newToken, newUser) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
    localStorage.setItem('nova_token', newToken)
    localStorage.setItem('nova_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('nova_token')
    localStorage.removeItem('nova_user')
    setToken(null)
    setUser(null)
  }

  function updateUser(patch) {
    setUser(u => {
      const merged = { ...u, ...patch }
      localStorage.setItem('nova_user', JSON.stringify(merged))
      return merged
    })
  }

  const value = { token, user, isAuthenticated: !!token, login, logout, updateUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
