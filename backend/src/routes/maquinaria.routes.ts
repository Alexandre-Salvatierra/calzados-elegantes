import { Router, Request, Response } from 'express'
import { supabase } from '../db/supabase'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { log } from '../db/bitacora'

const router = Router()
router.use(requireAuth)

// GET /api/maquinaria
router.get('/', async (_req: Request, res: Response) => {
  const { data, error } = await supabase.from('maquinas').select('*').order('codigo')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /api/maquinaria/resumen
router.get('/resumen', async (_req: Request, res: Response) => {
  const { data } = await supabase.from('maquinas').select('estado')
  const resumen = { disponible: 0, prestada: 0, fuera_de_servicio: 0, stand_by: 0 }
  data?.forEach(m => { if (m.estado in resumen) resumen[m.estado as keyof typeof resumen]++ })
  res.json(resumen)
})

// POST /api/maquinaria
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { codigo, nombre, descripcion, valor } = req.body
  if (!codigo || !nombre || valor === undefined) {
    res.status(400).json({ error: 'Campos requeridos: codigo, nombre, valor' })
    return
  }
  const { data, error } = await supabase.from('maquinas').insert({ codigo, nombre, descripcion, valor }).select().single()
  if (error) { res.status(400).json({ error: error.message }); return }
  await log(req.user!.id, req.user!.username, `Máquina registrada: ${data.codigo} — ${data.nombre}`, 'Maquinaria', req.ip ?? '')
  res.status(201).json(data)
})

// PATCH /api/maquinaria/:id/estado  (fuera de servicio, stand_by, disponible)
router.patch('/:id/estado', requireAdmin, async (req: Request, res: Response) => {
  const { estado } = req.body
  const estadosValidos = ['disponible', 'fuera_de_servicio', 'stand_by']
  if (!estadosValidos.includes(estado)) {
    res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` })
    return
  }
  const { data, error } = await supabase.from('maquinas').update({ estado }).eq('id', req.params.id).select().single()
  if (error) { res.status(400).json({ error: error.message }); return }
  await log(req.user!.id, req.user!.username, `Estado máquina ${data.codigo} → ${estado}`, 'Maquinaria', req.ip ?? '')
  res.json(data)
})

// GET /api/maquinaria/reservas
router.get('/reservas', async (req: Request, res: Response) => {
  const esAdmin = req.user!.rol === 'Administrador'
  let query = supabase
    .from('reserva_maquina')
    .select(`*, maquinas(codigo, nombre, valor), empleados(nombre, apellido), multa_reserva(*)`)
    .order('fecha_creacion', { ascending: false })

  // Empleado solo ve sus propias reservas
  if (!esAdmin && req.user!.id_empleado) {
    query = query.eq('id_empleado', req.user!.id_empleado)
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /api/maquinaria/reservas
router.post('/reservas', async (req: Request, res: Response) => {
  const { id_maquina, fecha_inicio, fecha_fin_estimada, observaciones } = req.body
  const esAdmin = req.user!.rol === 'Administrador'

  // Determinar el empleado: Admin elige, Empleado usa el propio
  let id_empleado: number | null
  if (esAdmin) {
    id_empleado = req.body.id_empleado ? Number(req.body.id_empleado) : null
    if (!id_empleado) {
      res.status(400).json({ error: 'Debe indicar el empleado para el préstamo' })
      return
    }
  } else {
    id_empleado = req.user!.id_empleado
    if (!id_empleado) {
      res.status(400).json({ error: 'Su cuenta no está vinculada a un empleado. Contacte al administrador.' })
      return
    }
  }

  if (!id_maquina || !fecha_inicio || !fecha_fin_estimada) {
    res.status(400).json({ error: 'Campos requeridos: id_maquina, fecha_inicio, fecha_fin_estimada' })
    return
  }

  const { data: maq } = await supabase.from('maquinas').select('estado, nombre, codigo').eq('id', id_maquina).single()
  if (maq?.estado !== 'disponible') {
    res.status(400).json({ error: 'La máquina no está disponible para préstamo' })
    return
  }

  const { data, error } = await supabase
    .from('reserva_maquina')
    .insert({ id_maquina, id_empleado, fecha_inicio, fecha_fin_estimada, observaciones, id_usuario_crea: req.user!.id })
    .select(`*, maquinas(codigo, nombre), empleados(nombre, apellido)`)
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  await log(req.user!.id, req.user!.username, `Préstamo registrado: ${data.maquinas.codigo} → ${data.empleados.nombre} ${data.empleados.apellido} (hasta ${fecha_fin_estimada})`, 'Maquinaria', req.ip ?? '')
  res.status(201).json(data)
})

// PATCH /api/maquinaria/reservas/:id/devolucion
router.patch('/reservas/:id/devolucion', async (req: Request, res: Response) => {
  const { fecha_devolucion, observaciones } = req.body
  if (!fecha_devolucion) {
    res.status(400).json({ error: 'fecha_devolucion requerida' })
    return
  }

  // Validar que la fecha de devolución no sea anterior a hoy (evitar backdating)
  const hoy = new Date().toISOString().split('T')[0]
  if (fecha_devolucion < hoy) {
    res.status(400).json({ error: `La fecha de devolución no puede ser anterior a hoy (${hoy})` })
    return
  }

  // Si es Empleado, verificar que la reserva le pertenece
  const esAdmin = req.user!.rol === 'Administrador'
  if (!esAdmin) {
    const { data: reserva } = await supabase
      .from('reserva_maquina')
      .select('id_empleado')
      .eq('id', req.params.id)
      .single()
    if (reserva?.id_empleado !== req.user!.id_empleado) {
      res.status(403).json({ error: 'Solo puede registrar devoluciones de sus propios préstamos' })
      return
    }
  }

  const { data, error } = await supabase
    .from('reserva_maquina')
    .update({ fecha_devolucion, observaciones })
    .eq('id', req.params.id)
    .select(`*, maquinas(codigo, nombre, valor), empleados(nombre, apellido), multa_reserva(*)`)
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }

  const multa = data.multa_reserva?.[0]
  const accion = multa
    ? `Devolución ${data.maquinas.codigo} — MULTA generada: BOB ${Number(multa.monto_multa).toFixed(2)} (${multa.dias_retraso} días retraso)`
    : `Devolución ${data.maquinas.codigo} — a tiempo`
  await log(req.user!.id, req.user!.username, accion, 'Maquinaria', req.ip ?? '')
  res.json(data)
})

// GET /api/maquinaria/multas
router.get('/multas', requireAdmin, async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('multa_reserva')
    .select(`*, reserva_maquina(*, maquinas(nombre), empleados(nombre, apellido))`)
    .order('fecha_calculo', { ascending: false })
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

export default router
