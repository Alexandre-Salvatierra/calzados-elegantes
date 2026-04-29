import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Orden, EstadoOrden, Empleado, ModeloCalzado } from '../../types'
import Badge, { estadoOrdenVariant } from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'

const ESTADOS: { v: EstadoOrden; l: string }[] = [
  { v: 'pendiente',  l: 'Pendiente'  },
  { v: 'en_proceso', l: 'En Proceso' },
  { v: 'terminada',  l: 'Terminada'  },
  { v: 'anulada',    l: 'Anulada'    },
]

const LABEL_TIPO: Record<string, string> = {
  oferta: 'Oferta',
  pedido_exclusivo: 'Pedido Exclusivo',
}

export default function OrdenesPage() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'Administrador'
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEstadoModal, setShowEstadoModal] = useState<Orden | null>(null)
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [modelos, setModelos] = useState<ModeloCalzado[]>([])

  // Form nueva orden
  const [form, setForm] = useState({ tipo: 'oferta', id_modelo: '', id_empleado: '', cantidad: '', talla: '', observaciones: '' })
  const [saving, setSaving] = useState(false)
  const [formErr, setFormErr] = useState('')

  // Form cambio estado
  const [nuevoEstado, setNuevoEstado] = useState<EstadoOrden>('pendiente')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    const [ord, emp, mod] = await Promise.all([
      api.get('/ordenes'),
      api.get('/ordenes/catalogos/empleados'),
      api.get('/ordenes/catalogos/modelos'),
    ])
    setOrdenes(ord.data)
    setEmpleados(emp.data)
    setModelos(mod.data)
    setLoading(false)
  }

  async function crearOrden() {
    if (!form.id_modelo || !form.id_empleado || !form.cantidad || !form.talla) {
      setFormErr('Complete todos los campos obligatorios'); return
    }
    setSaving(true); setFormErr('')
    try {
      await api.post('/ordenes', { ...form, cantidad: Number(form.cantidad) })
      setShowModal(false)
      setForm({ tipo: 'oferta', id_modelo: '', id_empleado: '', cantidad: '', talla: '', observaciones: '' })
      cargar()
    } catch (e: any) { setFormErr(e.response?.data?.error ?? 'Error al crear') }
    finally { setSaving(false) }
  }

  async function cambiarEstado() {
    if (!showEstadoModal) return
    await api.patch(`/ordenes/${showEstadoModal.id}/estado`, { estado: nuevoEstado })
    setShowEstadoModal(null)
    cargar()
  }

  const filtradas = ordenes.filter(o => {
    const q = busqueda.toLowerCase()
    const matchQ = !q || o.numero_orden.toLowerCase().includes(q) || o.empleados.nombre.toLowerCase().includes(q) || o.modelo_calzado.nombre.toLowerCase().includes(q)
    const matchE = !filtroEstado || o.estado === filtroEstado
    return matchQ && matchE
  })

  const inp = { border: '1px solid #DDE3EC', borderRadius: 6, padding: '7px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', width: '100%', color: '#1C2B3A' }
  const lbl = { display: 'block' as const, fontSize: 11, fontWeight: 700 as const, color: '#6B7A8D', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 4 }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1C2B3A', margin: 0 }}>Gestión de Órdenes</h1>
          <p style={{ color: '#6B7A8D', fontSize: 13, marginTop: 3 }}>RF-01 — {filtradas.length} orden(es)</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Nueva Orden
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="🔍 Buscar por número, empleado o modelo…"
          style={{ ...inp, width: 280 }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ ...inp, width: 160, cursor: 'pointer' }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
        </select>
        <button onClick={() => { setBusqueda(''); setFiltroEstado('') }}
          style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #DDE3EC', background: '#EDF1F7', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#6B7A8D' }}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: '#fff', border: '1px solid #DDE3EC', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#2E75B6' }}>
                {['N.° Orden','Tipo','Modelo','Empleado','Cant.','Talla','Estado','Fecha','Acciones'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 12, color: '#fff', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6B7A8D' }}>Cargando…</td></tr>
              ) : filtradas.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#6B7A8D' }}>No se encontraron órdenes</td></tr>
              ) : filtradas.map((o, idx) => (
                <tr key={o.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F6F9FC' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EBF3FB')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#F6F9FC')}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2E75B6' }}>{o.numero_orden}</td>
                  <td style={{ padding: '10px 14px' }}>{LABEL_TIPO[o.tipo]}</td>
                  <td style={{ padding: '10px 14px' }}>{o.modelo_calzado.nombre}</td>
                  <td style={{ padding: '10px 14px' }}>{o.empleados.nombre} {o.empleados.apellido}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>{o.cantidad}</td>
                  <td style={{ padding: '10px 14px' }}>{o.talla}</td>
                  <td style={{ padding: '10px 14px' }}><Badge variant={estadoOrdenVariant(o.estado)}>{ESTADOS.find(s => s.v === o.estado)?.l ?? o.estado}</Badge></td>
                  <td style={{ padding: '10px 14px', color: '#6B7A8D', fontSize: 12 }}>{new Date(o.fecha_creacion).toLocaleDateString('es-BO')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {isAdmin && o.estado !== 'terminada' && o.estado !== 'anulada' && (
                      <button onClick={() => { setShowEstadoModal(o); setNuevoEstado(o.estado) }}
                        style={{ padding: '4px 10px', borderRadius: 5, border: 'none', background: '#E8F2FB', color: '#2E75B6', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Cambiar estado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid #DDE3EC', fontSize: 12, color: '#6B7A8D' }}>
          Mostrando {filtradas.length} de {ordenes.length} registros
        </div>
      </div>

      {/* Modal nueva orden */}
      {showModal && (
        <Modal title="Nueva Orden de Trabajo" onClose={() => setShowModal(false)} width={600}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Tipo */}
            <div style={{ gridColumn: '1/-1' }}>
              <span style={lbl}>Tipo de orden</span>
              <div style={{ display: 'flex', gap: 12 }}>
                {[{ v: 'oferta', l: 'Oferta' }, { v: 'pedido_exclusivo', l: 'Pedido Exclusivo' }].map(t => (
                  <label key={t.v} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                    <input type="radio" name="tipo" value={t.v} checked={form.tipo === t.v} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
                    {t.l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Modelo de calzado *</label>
              <select value={form.id_modelo} onChange={e => setForm(f => ({ ...f, id_modelo: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Seleccionar…</option>
                {modelos.map(m => <option key={m.id} value={m.id}>{m.codigo} — {m.nombre}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Empleado asignado *</label>
              <select value={form.id_empleado} onChange={e => setForm(f => ({ ...f, id_empleado: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Seleccionar…</option>
                {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Cantidad *</label>
              <input type="number" min={1} value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Talla *</label>
              <input type="text" placeholder="ej. 38, 39, 40…" value={form.talla} onChange={e => setForm(f => ({ ...f, talla: e.target.value }))} style={inp} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Observaciones</label>
              <textarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} rows={3} style={{ ...inp, resize: 'vertical' }} />
            </div>
          </div>
          {formErr && <div style={{ background: '#FEE2E2', color: '#B91C1C', borderRadius: 6, padding: '8px 12px', fontSize: 13, marginTop: 12 }}>⚠ {formErr}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={() => setShowModal(false)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={crearOrden} disabled={saving} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Guardando…' : 'Registrar Orden'}</button>
          </div>
        </Modal>
      )}

      {/* Modal cambio de estado */}
      {showEstadoModal && (
        <Modal title={`Cambiar estado — ${showEstadoModal.numero_orden}`} onClose={() => setShowEstadoModal(null)} width={420}>
          <p style={{ fontSize: 13, color: '#6B7A8D', marginBottom: 14 }}>Estado actual: <Badge variant={estadoOrdenVariant(showEstadoModal.estado)}>{ESTADOS.find(s => s.v === showEstadoModal.estado)?.l}</Badge></p>
          <label style={lbl}>Nuevo estado</label>
          <select value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value as EstadoOrden)} style={{ ...inp, cursor: 'pointer', marginBottom: 20 }}>
            {ESTADOS.filter(s => s.v !== showEstadoModal.estado).map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowEstadoModal(null)} style={{ padding: '9px 20px', borderRadius: 7, border: '1px solid #DDE3EC', background: '#fff', color: '#6B7A8D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
            <button onClick={cambiarEstado} style={{ padding: '9px 20px', borderRadius: 7, border: 'none', background: '#2E75B6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Confirmar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
