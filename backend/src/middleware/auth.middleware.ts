import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  id: number
  username: string
  rol: string
  nombre: string
  id_empleado: number | null
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token requerido' })
    return
  }
  const token = header.slice(7)
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.rol !== 'Administrador') {
    res.status(403).json({ error: 'Se requiere rol Administrador' })
    return
  }
  next()
}
