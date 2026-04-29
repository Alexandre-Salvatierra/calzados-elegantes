import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Usuario, BitacoraEntry } from '../../types'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'

export default function SeguridadPage() {
  const [tab, setTab] = useState<'usuarios' | 'bitacora'>('usuarios')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>([])
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', username: '', password: '', id_rol: '', apellido: '', ci: '', telefono: '' })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => { cargar() }, [tab])

  async function cargar() {
    setLoading(true)
    if (tab === 'usuarios') {
      const [u, r] = await Promise.all([api.get('/seguridad/usuarios'), api.get('/seguridad/roles')])
      setUsuarios(u.data); setRoles(r.data)
    } else {
      const b = await api.get('/seguridad/bitacora')
      setBitacora(b.data)
    }
    setLoading(false)
  }

  // Determinar si el rol seleccionado es Empleado
  const rolSeleccionado = roles.find(r => r.id === Number(form.id_rol))
  const esRolEmpleado = rolSeleccionado?.nombre === 'Empleado'

  async function toggleBloqueo(u: Usuario) {
    await api.patch(`/seguridad/usuarios/${u.id}`, { bloqueado: !u.bloqueado })
    cargar()
  }

  async function toggleActivo(u: Usuario) {
    await api.patch(`/seguridad/usuarios/${u.id}`, { activo: !u.activo })
    cargar()
  }

  async function crearUsuario() {
    if (!form.nombre || !form.username || !form.password || !form.id_rol) { setErr('Complete todos los campos'); return }
    if (esRolEmpleado && (!form.apellido || !form.ci)) { setErr('Para rol Empleado se requiere apellido y CI'); return }
    setSaving(true); setErr('')
    try {
      await api.post('/seguridad/usuarios', {
        nombre: form.nombre,
        username: form.username,
        password: form.password,
        id_rol: Number(form.id_rol),
        ...(esRolEmpleado && { apellido: form.apellido, ci: form.ci, telefono: form.telefono }),
      })
      setShowModal(false)
      setForm({ nombre: '', username: '', password: '', id_rol: '', apellido: '', ci: '', telefono: '' })
      cargar()
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Error') }
    finally { setSaving(false) }
  }

  const inp = { border: '1px solid #DDE3EC', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', color: '#1C2B3A' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#6B7A8D', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B3A', margin: 0 }}>Gestión de Seguridad</h1>
          <p style={{ color: '#6B7A8D', fontSize: 13, marginTop: 3 }}>RF-08 — Control de acceso y auditoría</p>
        </div>
        {tab === 'usuarios' && (
          <button onClick={() => { setShowModal(true); setErr('') }}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {(['usuarios', 'bitacora'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: '7px 7px 0 0', border: 'none', background: tab === t ? '#fff' : '#DDE3EC', color: tab === t ? '#2E75B6' : '#6B7A8D', fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t === 'usuarios' ? '👥 Usuarios' : '📜 Bitácora'}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: '#6B7A8D', padding: 24 }}>Cargando…</div> : (
        <div style={{ background: '#fff', border: '1px solid #DDE3EC', borderRadius: '0 10px 10px 10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {tab === 'usuarios' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ background: '#2E75B6' }}>
                  {['Nombre','Usuario','Rol','Empleado vinculado','Estado','Bloqueado','Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#fff' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {usuarios.map((u, i) => (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? '#fff' : '#F6F9FC' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{u.nombre}</td>
                      <td style={{ padding: '10px 14px', color: '#2E75B6', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '10px 14px' }}><Badge variant="info">{u.roles.nombre}</Badge></td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7A8D' }}>
                        {(u as any).empleados ? `${(u as any).empleados.nombre} ${(u as any).empleados.apellido}` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}><Badge variant={u.activo ? 'ok' : 'err'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                      <td style={{ padding: '10px 14px' }}><Badge variant={u.bloqueado ? 'err' : 'ok'}>{u.bloqueado ? 'Bloqueado' : 'Libre'}</Badge></td>
                      <td style={{ padding: '10px 14px', display: 'flex', gap: 6 }}>
                        <button onClick={() => toggleActivo(u)}
                          style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: u.activo ? '#FEE2E2' : '#DCFCE7', color: u.activo ? '#B91C1C' : '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        {u.bloqueado && (
                          <button onClick={() => toggleBloqueo(u)}
                            style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Desbloquear
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ background: '#2E75B6' }}>
                  {['Fecha','Usuario','Módulo','Acción','IP'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#fff' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {bitacora.map((b, i) => (
                    <tr key={b.id} style={{ background: i % 2 === 0 ? '#fff' : '#F6F9FC' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7A8D', whiteSpace: 'nowrap' }}>{new Date(b.fecha).toLocaleString('es-BO')}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{b.username ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}><Badge variant="info">{b.modulo}</Badge></td>
                      <td style={{ padding: '10px 14px' }}>{b.accion}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#6B7A8D' }}>{b.ip ?? '—'}</td>
                    </tr>
                  ))}
                  {bitacora.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#6B7A8D' }}>Sin registros</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Nuevo Usuario" onClose={() => setShowModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Rol *</label>
              <select value={form.id_rol} onChange={e => setForm(f => ({ ...f, id_rol: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Seleccionar…</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            {/* Nombre varía según rol: Admin usa nombre completo, Empleado tiene nombre + apellido separados */}
            {esRolEmpleado ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={lbl}>Nombre *</label><input type="text" placeholder="Ej. Carlos" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Apellido *</label><input type="text" placeholder="Ej. Mendoza" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>CI *</label><input type="text" placeholder="Ej. 7654321" value={form.ci} onChange={e => setForm(f => ({ ...f, ci: e.target.value }))} style={inp} /></div>
                <div><label style={lbl}>Teléfono</label><input type="text" placeholder="Ej. 70012345" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inp} /></div>
              </div>
            ) : (
              <div><label style={lbl}>Nombre completo *</label><input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inp} /></div>
            )}

            <div><label style={lbl}>Nombre de usuario *</label><input type="text" placeholder="Ej. cmendoza" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} style={inp} /></div>
            <div><label style={lbl}>Contraseña *</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} style={inp} /></div>

            {esRolEmpleado && (
              <div style={{ background: '#E8F2FB', borderRadius: 7, padding: '10px 14px', fontSize: 12, color: '#2E75B6' }}>
                ℹ Al crear este usuario se registrará automáticamente como empleado de producción vinculado a su cuenta.
              </div>
            )}
          </div>
          {err && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>⚠ {err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={crearUsuario} disabled={saving} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando…' : 'Crear Usuario'}</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
