import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F1F35', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '40px 36px', width: '100%', maxWidth: 400, boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: '#2E75B6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 12 }}>👟</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: '#1C2B3A' }}>Calzados Elegantes</div>
          <div style={{ color: '#6B7A8D', fontSize: 13, marginTop: 4 }}>Sistema de Gestión</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Usuario</label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Ingrese su usuario" autoFocus required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDE3EC', borderRadius: 7, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#1C2B3A' }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7A8D', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Contraseña</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDE3EC', borderRadius: 7, fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#1C2B3A' }}
            />
          </div>

          {error && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 7, padding: '10px 14px', fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
              ⚠ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: loading ? '#93BEDF' : '#2E75B6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
            {loading ? 'Ingresando…' : 'Ingresar al sistema'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#6B7A8D', marginTop: 20 }}>UTEPSA · Ingeniería de Software 2026</p>
      </div>
    </div>
  )
}
