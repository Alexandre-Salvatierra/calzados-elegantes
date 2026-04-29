import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import OrdenesPage from './pages/ordenes/OrdenesPage'
import MaquinariaPage from './pages/maquinaria/MaquinariaPage'
import SeguridadPage from './pages/seguridad/SeguridadPage'

function PrivateRoute({ children, adminOnly = false }: { children: JSX.Element; adminOnly?: boolean }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B7A8D' }}>Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.rol !== 'Administrador') return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/"           element={<DashboardPage />} />
        <Route path="/ordenes"    element={<OrdenesPage />} />
        <Route path="/maquinaria" element={<MaquinariaPage />} />
        <Route path="/seguridad"  element={<PrivateRoute adminOnly><SeguridadPage /></PrivateRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
