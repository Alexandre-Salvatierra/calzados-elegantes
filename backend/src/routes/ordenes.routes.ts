import { Router, Request, Response } from 'express'
import { supabase } from '../db/supabase'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'
import { log } from '../db/bitacora'

const router = Router()
router.use(requireAuth)

// GET /api/ordenes
router.get('/', async (req: Request, res: Response) => {
  const { estado, empleado, tipo } = req.query
  let query = supabase
    .from('ordenes')
    .select(`
      *,
      modelo_calzado(id, codigo, nombre),
      empleados(id, nombre, apellido)
    `)
    .order('fecha_creacion', { ascending: false })

  if (estado) query = query.eq('estado', estado)
  if (empleado) query = query.eq('id_empleado', empleado)
  if (tipo) query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /api/ordenes/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('ordenes')
    .select(`*, modelo_calzado(*), empleados(*), historial_estado_orden(*)`)
    .eq('id', req.params.id)
    .single()
  if (error) { res.status(404).json({ error: 'Orden no encontrada' }); return }
  res.json(data)
})

// POST /api/ordenes
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  const { tipo, id_modelo, id_empleado, cantidad, talla, observaciones } = req.body
  if (!tipo || !id_modelo || !id_empleado || !cantidad || !talla) {
    res.status(400).json({ error: 'Campos requeridos: tipo, id_modelo, id_empleado, cantidad, talla' })
    return
  }

  const { data, error } = await supabase
    .from('ordenes')
    .insert({ tipo, id_modelo, id_empleado, cantidad, talla, observaciones, id_usuario_crea: req.user!.id })
    .select(`*, modelo_calzado(codigo, nombre), empleados(nombre, apellido)`)
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  await log(req.user!.id, req.user!.username, `Orden creada: ${data.numero_orden} — ${data.modelo_calzado.nombre} (${data.empleados.nombre} ${data.empleados.apellido})`, 'Órdenes', req.ip ?? '')
  res.status(201).json(data)
})

// PATCH /api/ordenes/:id/estado
router.patch('/:id/estado', requireAdmin, async (req: Request, res: Response) => {
  const { estado, observaciones } = req.body
  const estadosValidos = ['pendiente', 'en_proceso', 'terminada', 'anulada']
  if (!estadosValidos.includes(estado)) {
    res.status(400).json({ error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` })
    return
  }

  const { data, error } = await supabase
    .from('ordenes')
    .update({ estado, observaciones })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }
  await log(req.user!.id, req.user!.username, `Estado orden ${data.numero_orden} → ${estado}`, 'Órdenes', req.ip ?? '')
  res.json(data)
})

// PATCH /api/ordenes/:id/reasignar  (RF-10)
router.patch('/:id/reasignar', requireAdmin, async (req: Request, res: Response) => {
  const { id_empleado } = req.body
  if (!id_empleado) {
    res.status(400).json({ error: 'id_empleado requerido' }); return
  }

  const { data: orden } = await supabase
    .from('ordenes')
    .select('numero_orden, empleados(nombre, apellido)')
    .eq('id', req.params.id)
    .single()

  if (!orden) { res.status(404).json({ error: 'Orden no encontrada' }); return }

  const { data: nuevoEmp } = await supabase
    .from('empleados').select('nombre, apellido').eq('id', id_empleado).single()

  const { data, error } = await supabase
    .from('ordenes')
    .update({ id_empleado })
    .eq('id', req.params.id)
    .select(`*, modelo_calzado(id, codigo, nombre), empleados(id, nombre, apellido)`)
    .single()

  if (error) { res.status(400).json({ error: error.message }); return }

  const empAnterior = (orden.empleados as any)
  await log(
    req.user!.id, req.user!.username,
    `Orden ${orden.numero_orden} reasignada de ${empAnterior.nombre} ${empAnterior.apellido} → ${nuevoEmp?.nombre} ${nuevoEmp?.apellido}`,
    'Órdenes', req.ip ?? ''
  )
  res.json(data)
})

// GET /api/ordenes/catalogos/empleados
router.get('/catalogos/empleados', async (_req: Request, res: Response) => {
  const { data } = await supabase.from('empleados').select('id, nombre, apellido').eq('activo', true).order('nombre')
  res.json(data ?? [])
})

// GET /api/ordenes/catalogos/modelos
router.get('/catalogos/modelos', async (_req: Request, res: Response) => {
  const { data } = await supabase.from('modelo_calzado').select('id, codigo, nombre').eq('activo', true).order('nombre')
  res.json(data ?? [])
})

export default router
