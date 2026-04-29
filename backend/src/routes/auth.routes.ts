import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { supabase } from '../db/supabase'
import { requireAuth } from '../middleware/auth.middleware'

const router = Router()

async function registrarBitacora(idUsuario: number | null, username: string, accion: string, modulo: string, ip: string) {
  await supabase.from('bitacora').insert({ id_usuario: idUsuario, username, accion, modulo, ip })
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body
  const ip = req.ip ?? 'desconocida'

  if (!username || !password) {
    res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    return
  }

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*, roles(nombre)')
    .eq('username', username)
    .single()

  if (error || !user) {
    res.status(401).json({ error: 'Credenciales incorrectas' })
    return
  }

  if (user.bloqueado) {
    res.status(403).json({ error: 'Cuenta bloqueada. Contacte al administrador.' })
    return
  }

  if (!user.activo) {
    res.status(403).json({ error: 'Cuenta inactiva' })
    return
  }

  const valid = await bcrypt.compare(password, user.password_hash)

  if (!valid) {
    const intentos = user.intentos_fallidos + 1
    const bloqueado = intentos >= 3
    await supabase.from('usuarios').update({ intentos_fallidos: intentos, bloqueado }).eq('id', user.id)
    await registrarBitacora(user.id, username, 'Login fallido', 'Seguridad', ip)
    const restantes = Math.max(0, 3 - intentos)
    res.status(401).json({
      error: bloqueado
        ? 'Cuenta bloqueada por demasiados intentos fallidos'
        : `Credenciales incorrectas. Intentos restantes: ${restantes}`,
      bloqueado,
    })
    return
  }

  // Reset intentos
  await supabase.from('usuarios').update({ intentos_fallidos: 0 }).eq('id', user.id)
  await registrarBitacora(user.id, username, 'Inicio de sesión', 'Seguridad', ip)

  const payload = { id: user.id, username: user.username, rol: user.roles.nombre, nombre: user.nombre, id_empleado: user.id_empleado ?? null }
  // Cast necesario: @types/jsonwebtoken v9 exige StringValue, no string genérico
  const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN ?? '8h') as any })

  res.json({ token, user: payload })
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  const ip = req.ip ?? 'desconocida'
  await registrarBitacora(req.user!.id, req.user!.username, 'Cierre de sesión', 'Seguridad', ip)
  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json(req.user)
})

// POST /api/auth/cambiar-password
router.post('/cambiar-password', requireAuth, async (req: Request, res: Response) => {
  const { password_actual, password_nuevo } = req.body
  if (!password_actual || !password_nuevo) {
    res.status(400).json({ error: 'Campos requeridos' })
    return
  }

  const { data: user } = await supabase.from('usuarios').select('password_hash').eq('id', req.user!.id).single()
  if (!user) { res.status(404).json({ error: 'Usuario no encontrado' }); return }

  const valid = await bcrypt.compare(password_actual, user.password_hash)
  if (!valid) { res.status(400).json({ error: 'Contraseña actual incorrecta' }); return }

  const hash = await bcrypt.hash(password_nuevo, 10)
  await supabase.from('usuarios').update({ password_hash: hash }).eq('id', req.user!.id)
  await registrarBitacora(req.user!.id, req.user!.username, 'Cambio de contraseña', 'Seguridad', req.ip ?? '')

  res.json({ ok: true })
})

export default router
