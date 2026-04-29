export interface Usuario {
  id: number
  nombre: string
  username: string
  activo: boolean
  bloqueado: boolean
  intentos_fallidos: number
  fecha_creacion: string
  roles: { nombre: string }
}

export interface AuthUser {
  id: number
  username: string
  rol: string
  nombre: string
  id_empleado: number | null
}

export type EstadoOrden = 'pendiente' | 'en_proceso' | 'terminada' | 'anulada'
export type TipoOrden   = 'oferta' | 'pedido_exclusivo'

export interface Orden {
  id: number
  numero_orden: string
  tipo: TipoOrden
  cantidad: number
  talla: string
  estado: EstadoOrden
  observaciones?: string
  fecha_creacion: string
  fecha_actualizacion: string
  modelo_calzado: { id: number; codigo: string; nombre: string }
  empleados: { id: number; nombre: string; apellido: string }
}

export type EstadoMaquina = 'disponible' | 'prestada' | 'fuera_de_servicio' | 'stand_by'

export interface Maquina {
  id: number
  codigo: string
  nombre: string
  descripcion?: string
  valor: number
  estado: EstadoMaquina
  fecha_registro: string
}

export interface ReservaMaquina {
  id: number
  id_maquina: number
  id_empleado: number
  fecha_inicio: string
  fecha_fin_estimada: string
  fecha_devolucion?: string
  dias_retraso: number
  estado: string
  observaciones?: string
  fecha_creacion: string
  maquinas: { id: number; codigo: string; nombre: string; valor: number }
  empleados: { nombre: string; apellido: string }
  multa_reserva?: MultaReserva[]
}

export interface MultaReserva {
  id: number
  dias_retraso: number
  valor_maquina: number
  monto_multa: number
  pagada: boolean
  fecha_calculo: string
}

export interface BitacoraEntry {
  id: number
  id_usuario?: number
  username?: string
  accion: string
  modulo: string
  ip?: string
  fecha: string
}

export interface Empleado {
  id: number
  nombre: string
  apellido: string
}

export interface ModeloCalzado {
  id: number
  codigo: string
  nombre: string
}
