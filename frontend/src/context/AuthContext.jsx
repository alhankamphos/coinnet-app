import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('coinnet_token')
    const savedUser = localStorage.getItem('coinnet_user')
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('coinnet_token')
        localStorage.removeItem('coinnet_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('coinnet_token', access_token)
    localStorage.setItem('coinnet_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData)
    const { access_token, user: userData } = res.data
    localStorage.setItem('coinnet_token', access_token)
    localStorage.setItem('coinnet_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    localStorage.removeItem('coinnet_token')
    localStorage.removeItem('coinnet_user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me')
      const updated = { ...user, ...res.data }
      localStorage.setItem('coinnet_user', JSON.stringify(updated))
      setUser(updated)
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
