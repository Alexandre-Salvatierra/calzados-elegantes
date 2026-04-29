import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { supabase } from '../db/supabase'
import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

const router = Router()
router.use(requireAuth, requireAdmin)

// GET /api/seguridad/usuarios
router.get('/usuarios', async (_req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, username, activo, bloqueado, intentos_fallidos, fecha_creacion, id_empleado, roles(nombre), empleados(nombre, apellido, ci)')
    .order('id')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /api/seguridad/usuarios
// Si el rol es Empleado, requiere datos del empleado (apellido, ci) y crea su registro en empleados
router.post('/usuarios', async (req: Request, res: Response) => {
  const { nombre, username, password, id_rol, apellido, ci, telefono } = req.body
  if (!nombre || !username || !password || !id_rol) {
    res.status(400).json({ error: 'Campos requeridos: nombre, username, password, id_rol' })
    return
  }

  // Determinar si el rol es Empleado
  const { data: rol } = await supabase.from('roles').select('nombre').eq('id', id_rol).single()
  const esRolEmpleado = rol?.nombre === 'Empleado'

  if (esRolEmpleado && (!apellido || !ci)) {
    res.status(400).json({ error: 'Para usuarios con rol Empleado se requiere: apellido y CI' })
    return
  }

  const hash = await bcrypt.hash(password, 10)

  let id_empleado: number | null = null

  if (esRolEmpleado) {
    // Crear registro en empleados primero
    const { data: emp, error: empErr } = await supabase
      .from('empleados')
      .insert({ nombre, apellido, ci, telefono: telefono ?? null, activo: true })
      .select()
      .single()
    if (empErr) { res.status(400).json({ error: `Error al crear empleado: ${empErr.message}` }); return }
    id_empleado = emp.id
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert({ nombre, username, password_hash: hash, id_rol, id_empleado })
    .select('id, nombre, username, activo, bloqueado, id_empleado, roles(nombre)')
    .single()

  if (error) {
    // Si falló la creación del usuario, limpiar el empleado creado
    if (id_empleado) await supabase.from('empleados').delete().eq('id', id_empleado)
    res.status(400).json({ error: error.message }); return
  }
  res.status(201).json(data)
})

// PATCH /api/seguridad/usuarios/:id
router.patch('/usuarios/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { nombre, activo, bloqueado, id_rol } = req.body
  const updates: Record<string, unknown> = {}
  if (nombre !== undefined) updates.nombre = nombre
  if (activo !== undefined) updates.activo = activo
  if (id_rol !== undefined) updates.id_rol = id_rol
  if (bloqueado !== undefined) { updates.bloqueado = bloqueado; updates.intentos_fallidos = 0 }

  const { data, error } = await supabase.from('usuarios').update(updates).eq('id', id).select().single()
  if (error) { res.status(400).json({ error: error.message }); return }
  res.json(data)
})

// GET /api/seguridad/bitacora
router.get('/bitacora', async (req: Request, res: Response) => {
  const { modulo, desde, hasta } = req.query
  let query = supabase.from('bitacora').select('*').order('fecha', { ascending: false }).limit(200)
  if (modulo) query = query.eq('modulo', modulo)
  if (desde) query = query.gte('fecha', desde as string)
  if (hasta) query = query.lte('fecha', hasta as string)
  const { data, error } = await query
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// GET /api/seguridad/roles
router.get('/roles', async (_req: Request, res: Response) => {
  const { data } = await supabase.from('roles').select('*').order('id')
  res.json(data ?? [])
})

export default router
