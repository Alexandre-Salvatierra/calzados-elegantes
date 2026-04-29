import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Maquina, ReservaMaquina, Empleado } from '../../types'
import Badge, { estadoMaquinaVariant } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'

const LABEL_ESTADO: Record<string, string> = {
  disponible: 'Disponible', prestada: 'Prestada', fuera_de_servicio: 'Fuera de servicio', stand_by: 'Stand By',
}

export default function MaquinariaPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'Administrador'
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [reservas, setReservas] = useState<ReservaMaquina[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'maquinas' | 'reservas'>('maquinas')
  const [showPrestamoModal, setShowPrestamoModal] = useState(false)
  const [showDevModal, setShowDevModal] = useState<ReservaMaquina | null>(null)
  const [showEstadoMaqModal, setShowEstadoMaqModal] = useState<Maquina | null>(null)
  const [nuevoEstadoMaq, setNuevoEstadoMaq] = useState('')

  const [prestForm, setPrestForm] = useState({ id_maquina: '', id_empleado: '', fecha_inicio: '', fecha_fin_estimada: '', observaciones: '' })
  const [fechaDev, setFechaDev] = useState('')
  const [devConDanio, setDevConDanio] = useState(false)
  const [devDescDanio, setDevDescDanio] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // Nueva máquina (UC-13)
  const [showNuevaMaqModal, setShowNuevaMaqModal] = useState(false)
  const [formMaq, setFormMaq] = useState({ codigo: '', nombre: '', descripcion: '', valor: '' })
  const [savingMaq, setSavingMaq] = useState(false)
  const [errMaq, setErrMaq] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [maq, res, emp] = await Promise.all([
      api.get('/maquinaria'),
      api.get('/maquinaria/reservas'),
      api.get('/ordenes/catalogos/empleados'),
    ])
    setMaquinas(maq.data)
    setReservas(res.data)
    setEmpleados(emp.data)
    setLoading(false)
  }

  async function registrarPrestamo() {
    if (!prestForm.id_maquina || !prestForm.fecha_inicio || !prestForm.fecha_fin_estimada) {
      setErr('Complete todos los campos obligatorios'); return
    }
    if (isAdmin && !prestForm.id_empleado) {
      setErr('Seleccione el empleado para el préstamo'); return
    }
    setSaving(true); setErr('')
    try {
      const body: Record<string, unknown> = {
        id_maquina: Number(prestForm.id_maquina),
        fecha_inicio: prestForm.fecha_inicio,
        fecha_fin_estimada: prestForm.fecha_fin_estimada,
        observaciones: prestForm.observaciones,
      }
      // Solo Admin envía id_empleado; Empleado usa el suyo propio en el backend
      if (isAdmin) body.id_empleado = Number(prestForm.id_empleado)

      await api.post('/maquinaria/reservas', body)
      setShowPrestamoModal(false)
      setPrestForm({ id_maquina: '', id_empleado: '', fecha_inicio: '', fecha_fin_estimada: '', observaciones: '' })
      cargar()
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Error') }
    finally { setSaving(false) }
  }

  async function cambiarEstadoMaquina() {
    if (!showEstadoMaqModal || !nuevoEstadoMaq) return
    setSaving(true); setErr('')
    try {
      await api.patch(`/maquinaria/${showEstadoMaqModal.id}/estado`, { estado: nuevoEstadoMaq })
      setShowEstadoMaqModal(null); cargar()
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Error') }
    finally { setSaving(false) }
  }

  async function registrarDevolucion() {
    if (!showDevModal || !fechaDev) { setErr('Ingrese la fecha de devolución'); return }
    if (devConDanio && !devDescDanio.trim()) { setErr('Describa el daño observado'); return }
    setSaving(true); setErr('')
    try {
      await api.patch(`/maquinaria/reservas/${showDevModal.id}/devolucion`, {
        fecha_devolucion: fechaDev,
        con_danio: devConDanio,
        descripcion_danio: devDescDanio,
      })
      setShowDevModal(null); setFechaDev(''); setDevConDanio(false); setDevDescDanio(''); cargar()
    } catch (e: any) { setErr(e.response?.data?.error ?? 'Error') }
    finally { setSaving(false) }
  }

  async function registrarNuevaMaquina() {
    if (!formMaq.codigo.trim() || !formMaq.nombre.trim() || !formMaq.valor) {
      setErrMaq('Complete los campos obligatorios'); return
    }
    setSavingMaq(true); setErrMaq('')
    try {
      await api.post('/maquinaria', {
        codigo: formMaq.codigo.trim(),
        nombre: formMaq.nombre.trim(),
        descripcion: formMaq.descripcion.trim() || null,
        valor: Number(formMaq.valor),
      })
      setShowNuevaMaqModal(false)
      setFormMaq({ codigo: '', nombre: '', descripcion: '', valor: '' })
      cargar()
    } catch (e: any) { setErrMaq(e.response?.data?.error ?? 'Error al registrar') }
    finally { setSavingMaq(false) }
  }

  const resumen = {
    disponible: maquinas.filter(m => m.estado === 'disponible').length,
    prestada: maquinas.filter(m => m.estado === 'prestada').length,
    fuera: maquinas.filter(m => m.estado === 'fuera_de_servicio').length,
    standby: maquinas.filter(m => m.estado === 'stand_by').length,
  }

  const inp = { border: '1px solid #DDE3EC', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', color: '#1C2B3A' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#6B7A8D', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B3A', margin: 0 }}>Gestión de Maquinaria</h1>
          <p style={{ color: '#6B7A8D', fontSize: 13, marginTop: 3 }}>RF-03 — Préstamos, devoluciones y multa 2%</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && tab === 'maquinas' && (
            <button onClick={() => { setShowNuevaMaqModal(true); setErrMaq('') }}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #2E75B6', background: '#fff', color: '#2E75B6', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Nueva Máquina
            </button>
          )}
          <button onClick={() => { setShowPrestamoModal(true); setErr('') }}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Solicitar Préstamo
          </button>
        </div>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Disponibles',      value: resumen.disponible, bg: '#DCFCE7', fg: '#15803D' },
          { label: 'Prestadas',        value: resumen.prestada,   bg: '#FEF9C3', fg: '#A16207' },
          { label: 'Fuera de servicio',value: resumen.fuera,      bg: '#FEE2E2', fg: '#B91C1C' },
          { label: 'Stand By',         value: resumen.standby,    bg: '#E8F2FB', fg: '#2E75B6' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.fg }}>{c.value}</div>
            <div style={{ fontSize: 12, color: c.fg, fontWeight: 600 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {(['maquinas', 'reservas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: '7px 7px 0 0', border: 'none', background: tab === t ? '#fff' : '#DDE3EC', color: tab === t ? '#2E75B6' : '#6B7A8D', fontSize: 13, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t === 'maquinas' ? '⚙️ Inventario' : '📋 Reservas y Multas'}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: '#6B7A8D' }}>Cargando…</div> : (
        <div style={{ background: '#fff', border: '1px solid #DDE3EC', borderRadius: '0 10px 10px 10px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {tab === 'maquinas' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ background: '#2E75B6' }}>
                  {['Código','Nombre','Descripción','Valor (BOB)','Estado', ...(isAdmin ? ['Acciones'] : [])].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#fff' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {maquinas.map((m, i) => (
                    <tr key={m.id} style={{ background: m.estado === 'fuera_de_servicio' ? '#FFF5F5' : i % 2 === 0 ? '#fff' : '#F6F9FC' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2E75B6' }}>{m.codigo}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{m.nombre}</td>
                      <td style={{ padding: '10px 14px', color: '#6B7A8D' }}>{m.descripcion ?? '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        {Number(m.valor).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                        <span style={{ fontSize: 10, color: '#6B7A8D', marginLeft: 4 }}>BOB</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}><Badge variant={estadoMaquinaVariant(m.estado)}>{LABEL_ESTADO[m.estado]}</Badge></td>
                      {isAdmin && (
                        <td style={{ padding: '10px 14px' }}>
                          {m.estado !== 'prestada' && (
                            <button onClick={() => { setShowEstadoMaqModal(m); setNuevoEstadoMaq(m.estado === 'fuera_de_servicio' ? 'disponible' : 'fuera_de_servicio'); setErr('') }}
                              style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: m.estado === 'fuera_de_servicio' ? '#DCFCE7' : '#FEE2E2', color: m.estado === 'fuera_de_servicio' ? '#15803D' : '#B91C1C', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              {m.estado === 'fuera_de_servicio' ? '✓ Volver a disponible' : '✕ Fuera de servicio'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <>
              {(() => {
                const conRetrasos = reservas.filter(r => r.dias_retraso > 0)
                const porEmpleado = conRetrasos.reduce((acc, r) => {
                  const nombre = `${r.empleados.nombre} ${r.empleados.apellido}`
                  acc[nombre] = (acc[nombre] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
                const entries = Object.entries(porEmpleado)
                if (entries.length === 0) return null
                return (
                  <div style={{ margin: '0 0 16px 0', background: '#FFF5F5', border: '1px solid #FCA5A5', borderRadius: 8, padding: '12px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', marginBottom: 10 }}>⚠ Empleados con retrasos registrados</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {entries.map(([nombre, count]) => (
                        <span key={nombre} style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                          {nombre} — {count} retraso{count > 1 ? 's' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })()}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead><tr style={{ background: '#2E75B6' }}>
                  {['Máquina / Daño','Empleado','F. Inicio','F. Estimada','F. Devolución','Días Retraso','Multa (BOB)','Estado','Acciones'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#fff', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {reservas.map((r, i) => {
                    const multa = r.multa_reserva?.[0]
                    const hayRetraso = r.dias_retraso > 0
                    const hayDanio = r.observaciones?.startsWith('[DAÑO REPORTADO]')
                    const descDanio = hayDanio ? r.observaciones!.replace('[DAÑO REPORTADO]: ', '') : null
                    return (
                      <tr key={r.id} style={{ background: hayDanio ? '#FFF5F5' : hayRetraso ? '#FFFBEB' : i % 2 === 0 ? '#fff' : '#F6F9FC' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 500 }}>
                          {r.maquinas.nombre}
                          {hayDanio && (
                            <div style={{ fontSize: 11, color: '#B91C1C', fontWeight: 600, marginTop: 3, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                              <span>🔧</span>
                              <span style={{ fontStyle: 'italic' }}>{descDanio}</span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>{r.empleados.nombre} {r.empleados.apellido}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.fecha_inicio}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.fecha_fin_estimada}</td>
                        <td style={{ padding: '10px 14px', fontSize: 12 }}>{r.fecha_devolucion ?? '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: hayRetraso ? '#B91C1C' : '#15803D', fontWeight: 700 }}>{r.dias_retraso}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: multa ? '#B91C1C' : '#6B7A8D', fontWeight: multa ? 700 : 400 }}>
                          {multa ? Number(multa.monto_multa).toLocaleString('es-BO', { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <Badge variant={r.estado === 'finalizada' ? (hayDanio ? 'err' : 'ok') : r.dias_retraso > 0 ? 'err' : 'warn'}>
                            {r.estado === 'finalizada' ? (hayDanio ? 'Devuelta c/daño' : 'Devuelta') : r.dias_retraso > 0 ? 'Con retraso' : 'Activa'}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {r.estado !== 'finalizada' && (
                            <button onClick={() => { setShowDevModal(r); setFechaDev(''); setDevConDanio(false); setDevDescDanio(''); setErr('') }}
                              style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: '#E8F2FB', color: '#2E75B6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                              Registrar devolución
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  {reservas.length === 0 && <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6B7A8D' }}>Sin reservas registradas</td></tr>}
                </tbody>
              </table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal nueva máquina (UC-13) */}
      {showNuevaMaqModal && (
        <Modal title="Registrar Nueva Máquina" onClose={() => setShowNuevaMaqModal(false)} width={480}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Código *</label>
              <input type="text" placeholder="ej. MAQ-006" value={formMaq.codigo}
                onChange={e => setFormMaq(f => ({ ...f, codigo: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Nombre *</label>
              <input type="text" value={formMaq.nombre}
                onChange={e => setFormMaq(f => ({ ...f, nombre: e.target.value }))} style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Descripción</label>
              <textarea value={formMaq.descripcion} onChange={e => setFormMaq(f => ({ ...f, descripcion: e.target.value }))}
                rows={2} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Valor BOB *</label>
              <input type="number" min={0} placeholder="ej. 1500" value={formMaq.valor}
                onChange={e => setFormMaq(f => ({ ...f, valor: e.target.value }))} style={inp} />
            </div>
          </div>
          {errMaq && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>⚠ {errMaq}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setShowNuevaMaqModal(false)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={registrarNuevaMaquina} disabled={savingMaq} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{savingMaq ? 'Registrando…' : 'Registrar Máquina'}</button>
          </div>
        </Modal>
      )}

      {/* Modal préstamo */}
      {showPrestamoModal && (
        <Modal title="Solicitar Préstamo de Maquinaria" onClose={() => setShowPrestamoModal(false)} width={520}>
          <div style={{ background: '#FEF9C3', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: '#A16207', marginBottom: 16 }}>
            ⚠ Las devoluciones tardías generan una multa del 2% del valor de la máquina por cada día de retraso.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Máquina *</label>
              <select value={prestForm.id_maquina} onChange={e => setPrestForm(f => ({ ...f, id_maquina: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Seleccionar…</option>
                {maquinas.filter(m => m.estado === 'disponible').map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nombre} (BOB {Number(m.valor).toLocaleString('es-BO')})</option>)}
              </select>
              {maquinas.filter(m => m.estado === 'disponible').length === 0 && (
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#92400E', marginTop: 6 }}>
                  ⚠ No hay máquinas disponibles. La solicitud queda en espera hasta que el administrador libere una máquina.
                </div>
              )}
            </div>
            {/* Selector de empleado: solo Admin puede elegir; Empleado ve su propio nombre */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Empleado *</label>
              {isAdmin ? (
                <select value={prestForm.id_empleado} onChange={e => setPrestForm(f => ({ ...f, id_empleado: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">Seleccionar…</option>
                  {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
                </select>
              ) : (
                <div style={{ ...inp, background: '#F6F9FC', color: '#6B7A8D' }}>
                  {user?.nombre} <span style={{ fontSize: 11, marginLeft: 6 }}>(tu cuenta)</span>
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Fecha inicio *</label>
              <input type="date" value={prestForm.fecha_inicio} min={new Date().toISOString().split('T')[0]} onChange={e => setPrestForm(f => ({ ...f, fecha_inicio: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Fecha estimada devolución *</label>
              <input type="date" value={prestForm.fecha_fin_estimada} min={prestForm.fecha_inicio || new Date().toISOString().split('T')[0]} onChange={e => setPrestForm(f => ({ ...f, fecha_fin_estimada: e.target.value }))} style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Observaciones</label>
              <textarea value={prestForm.observaciones} onChange={e => setPrestForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} />
            </div>
          </div>
          {err && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>⚠ {err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setShowPrestamoModal(false)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={registrarPrestamo} disabled={saving} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Registrando…' : 'Confirmar Préstamo'}</button>
          </div>
        </Modal>
      )}

      {/* Modal devolución */}
      {showDevModal && (
        <Modal title={`Registrar Devolución — ${showDevModal.maquinas.nombre}`} onClose={() => setShowDevModal(null)} width={420}>
          <p style={{ fontSize: 13, color: '#6B7A8D', marginBottom: 16 }}>
            Fecha estimada: <strong>{showDevModal.fecha_fin_estimada}</strong><br />
            Las devoluciones tardías generarán automáticamente la multa del 2%.
          </p>
          <label style={lbl}>Fecha de devolución *</label>
          <input type="date" value={fechaDev} min={new Date().toISOString().split('T')[0]} onChange={e => setFechaDev(e.target.value)} style={{ ...inp, marginBottom: 6 }} />
          <p style={{ fontSize: 11, color: '#6B7A8D', marginTop: 0, marginBottom: 14 }}>
            Solo se permite registrar la fecha de hoy o posterior (no se pueden hacer devoluciones con fecha pasada).
          </p>
          <div style={{ marginTop: 14 }}>
            <label style={lbl}>¿La máquina presenta daños?</label>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              {[{ v: false, l: 'No' }, { v: true, l: 'Sí — registrar daño' }].map(opt => (
                <label key={String(opt.v)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" name="conDanio" checked={devConDanio === opt.v}
                    onChange={() => setDevConDanio(opt.v)} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>
          {devConDanio && (
            <div style={{ marginTop: 10 }}>
              <label style={lbl}>Descripción del daño *</label>
              <textarea value={devDescDanio} onChange={e => setDevDescDanio(e.target.value)}
                rows={2} style={{ ...inp, resize: 'vertical', width: '100%' }}
                placeholder="Describa el daño observado…" />
            </div>
          )}
          {err && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12, marginTop: 12 }}>⚠ {err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowDevModal(null)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={registrarDevolucion} disabled={saving} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Registrando…' : 'Confirmar Devolución'}</button>
          </div>
        </Modal>
      )}

      {/* Modal cambio de estado de máquina */}
      {showEstadoMaqModal && (
        <Modal title="Cambiar Estado de Máquina" onClose={() => setShowEstadoMaqModal(null)} width={420}>
          <p style={{ fontSize: 13, color: '#6B7A8D', marginBottom: 6 }}>
            Máquina: <strong>{showEstadoMaqModal.codigo} — {showEstadoMaqModal.nombre}</strong>
          </p>
          <p style={{ fontSize: 13, color: '#6B7A8D', marginBottom: 16 }}>
            Estado actual: <strong>{LABEL_ESTADO[showEstadoMaqModal.estado]}</strong>
          </p>
          <label style={lbl}>Nuevo estado *</label>
          <select value={nuevoEstadoMaq} onChange={e => setNuevoEstadoMaq(e.target.value)} style={{ ...inp, cursor: 'pointer', marginBottom: 16 }}>
            <option value="disponible">Disponible</option>
            <option value="fuera_de_servicio">Fuera de servicio</option>
            <option value="stand_by">Stand By</option>
          </select>
          {err && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginBottom: 12 }}>⚠ {err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowEstadoMaqModal(null)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={cambiarEstadoMaquina} disabled={saving} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: nuevoEstadoMaq === 'fuera_de_servicio' ? '#B91C1C' : '#15803D', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando…' : `Confirmar → ${LABEL_ESTADO[nuevoEstadoMaq] ?? nuevoEstadoMaq}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
