import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/',            label: 'Inicio',     icon: '📊' },
  { to: '/ordenes',     label: 'Órdenes',    icon: '📋' },
  { to: '/maquinaria',  label: 'Maquinaria', icon: '⚙️' },
  { to: '/seguridad',   label: 'Seguridad',  icon: '🔒', adminOnly: true },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const isAdmin = user?.rol === 'Administrador'

  return (
    <aside style={{ width: 220, minWidth: 220, background: '#0F1F35', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}>
      {/* Logo */}
      <div style={{ padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#2E75B6', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👟</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>Calzados</div>
          <div style={{ color: '#2E75B6', fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>Elegantes</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {NAV.filter(n => !n.adminOnly || isAdmin).map(n => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', margin: '1px 8px', borderRadius: 7,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
              background: isActive ? '#2E75B6' : 'transparent',
              textDecoration: 'none', fontSize: 13.5, fontWeight: isActive ? 700 : 500,
              transition: 'all 0.15s',
            })}>
            <span style={{ fontSize: 16 }}>{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user?.nombre}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 10 }}>{user?.rol}</div>
        <button onClick={logout}
          style={{ width: '100%', padding: '7px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
