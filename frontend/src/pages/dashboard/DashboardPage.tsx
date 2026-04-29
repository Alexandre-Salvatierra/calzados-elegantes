import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

interface Stats { pendiente: number; en_proceso: number; terminada: number }
interface MaqResumen { disponible: number; prestada: number; fuera_de_servicio: number }

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [ordStats, setOrdStats] = useState<Stats>({ pendiente: 0, en_proceso: 0, terminada: 0 })
  const [maqStats, setMaqStats] = useState<MaqResumen>({ disponible: 0, prestada: 0, fuera_de_servicio: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/ordenes').then(r => {
        const data = r.data as { estado: string }[]
        const s = { pendiente: 0, en_proceso: 0, terminada: 0 }
        data.forEach(o => { if (o.estado in s) s[o.estado as keyof typeof s]++ })
        setOrdStats(s)
      }),
      api.get('/maquinaria/resumen').then(r => setMaqStats(r.data)),
    ]).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Órdenes pendientes',   value: ordStats.pendiente,   bg: '#E8F2FB', fg: '#2E75B6', icon: '📋', to: '/ordenes' },
    { label: 'Órdenes en proceso',   value: ordStats.en_proceso,  bg: '#FEF9C3', fg: '#A16207', icon: '🔄', to: '/ordenes' },
    { label: 'Órdenes terminadas',   value: ordStats.terminada,   bg: '#DCFCE7', fg: '#15803D', icon: '✅', to: '/ordenes' },
    { label: 'Máquinas disponibles', value: maqStats.disponible,  bg: '#DCFCE7', fg: '#15803D', icon: '⚙️', to: '/maquinaria' },
    { label: 'Máquinas prestadas',   value: maqStats.prestada,    bg: '#FEF9C3', fg: '#A16207', icon: '🔧', to: '/maquinaria' },
    { label: 'Fuera de servicio',    value: maqStats.fuera_de_servicio, bg: '#FEE2E2', fg: '#B91C1C', icon: '🚫', to: '/maquinaria' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C2B3A', margin: 0 }}>
          Bienvenido, {user?.nombre}
        </h1>
        <p style={{ color: '#6B7A8D', marginTop: 4, fontSize: 14 }}>Resumen del sistema — {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {loading ? (
        <div style={{ color: '#6B7A8D', fontSize: 14 }}>Cargando…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {cards.map(c => (
            <div key={c.label} onClick={() => navigate(c.to)}
              style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #DDE3EC', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(46,117,182,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: c.fg }}>{c.value}</div>
              <div style={{ fontSize: 12, color: '#6B7A8D', fontWeight: 500, marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <div style={{ background: '#fff', borderRadius: 10, padding: '18px 20px', border: '1px solid #DDE3EC' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1C2B3A', marginBottom: 14 }}>Accesos rápidos</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Nueva orden',        to: '/ordenes',    icon: '➕' },
            { label: 'Solicitar préstamo', to: '/maquinaria', icon: '🔧' },
            { label: 'Ver bitácora',       to: '/seguridad',  icon: '📜', adminOnly: true },
          ].filter(a => !a.adminOnly || user?.rol === 'Administrador').map(a => (
            <button key={a.label} onClick={() => navigate(a.to)}
              style={{ padding: '9px 18px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#EDF1F7', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#1C2B3A', display: 'flex', alignItems: 'center', gap: 6 }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
