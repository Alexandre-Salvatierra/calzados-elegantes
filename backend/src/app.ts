import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes       from './routes/auth.routes'
import seguridadRoutes  from './routes/seguridad.routes'
import ordenesRoutes    from './routes/ordenes.routes'
import maquinariaRoutes from './routes/maquinaria.routes'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  // Electron carga archivos locales con este origen
  'file://',
  // Variable de entorno para origen en producción (si se despliega frontend)
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]
app.use(cors({
  origin: (origin, callback) => {
    // Permitir peticiones sin origin (Electron con archivos locales, Postman, etc.)
    if (!origin) return callback(null, true)
    if (allowedOrigins.some(o => origin.startsWith(o))) return callback(null, true)
    callback(new Error(`CORS bloqueado: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())

app.use('/api/auth',       authRoutes)
app.use('/api/seguridad',  seguridadRoutes)
app.use('/api/ordenes',    ordenesRoutes)
app.use('/api/maquinaria', maquinariaRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true, sistema: 'Calzados Elegantes' }))

const PORT = process.env.PORT ?? 3000
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`))

export default app
