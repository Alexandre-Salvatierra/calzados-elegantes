import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import { AuthUser } from '../types'

interface AuthCtx {
  user: AuthUser | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const Ctx = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('ce_token')
    const u = localStorage.getItem('ce_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  async function login(username: string, password: string) {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('ce_token', data.token)
    localStorage.setItem('ce_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    localStorage.removeItem('ce_token')
    localStorage.removeItem('ce_user')
    setToken(null)
    setUser(null)
  }

  return <Ctx.Provider value={{ user, token, login, logout, loading }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
